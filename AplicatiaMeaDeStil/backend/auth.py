"""
Authentication module - handles user registration, login, and JWT tokens
"""
import bcrypt
import jwt
import os
import secrets
import string
from functools import wraps
from flask import request, jsonify
from datetime import datetime, timedelta
from dotenv import load_dotenv
from database import execute_query, execute_query_one

load_dotenv()

JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
# 30 days = 720 hours - token valid pentru 30 zile
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 720))


def token_required(f):
    """
    Decorator to protect routes with JWT token auth
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
            else:
                token = auth_header

        if not token:
            return jsonify({'message': 'Token is missing!', 'status': 'error'}), 401

        try:
            payload = verify_jwt_token(token)
            request.current_user = payload 
        except Exception as e:
            return jsonify({'message': f'Token is invalid: {str(e)}', 'status': 'error'}), 401

        return f(*args, **kwargs)

    return decorated


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_jwt_token(user_id: int, email: str, role: str = 'user') -> str:
    """Create a JWT token for authenticated user"""
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def verify_jwt_token(token: str) -> dict:
    """
    Verify and decode a JWT token
    
    Returns:
        dict: Decoded token payload with user_id and email
    Raises:
        jwt.ExpiredSignatureError: Token has expired
        jwt.InvalidTokenError: Invalid token
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")


def register_user(email: str, password: str) -> dict:
    """
    Register a new user
    
    Args:
        email (str): User email
        password (str): Plain text password
        
    Returns:
        dict: Success message with user info and token
        
    Raises:
        Exception: If email already exists or registration fails
    """
    # Check if email already exists
    query = "SELECT id FROM users WHERE email = ?"
    existing_user = execute_query_one(query, (email,))
    
    if existing_user:
        raise Exception("Email already registered")
    
    # Hash password
    password_hash = hash_password(password)
    
    # Check if this is the first user (becomes admin)
    count_query = "SELECT COUNT(*) FROM users"
    user_count_result = execute_query_one(count_query)
    user_count = user_count_result[0] if user_count_result else 0
    
    # First user becomes admin, others are regular users
    if user_count_result and len(user_count_result) > 0 and user_count_result[0] > 0:
        role = 'user'
    else:
        role = 'admin'
    
    db_type = os.getenv('DB_TYPE', 'mssql').lower()
    
    if db_type == 'sqlite':
        # SQLite Query - No OUTPUT clause
        insert_query = """
            INSERT INTO users (email, password_hash, role)
            VALUES (?, ?, ?)
        """
        try:
            execute_query_one(insert_query, (email, password_hash, role))
            
            # Fetch the newly created user
            select_query = "SELECT id, email, role, created_at FROM users WHERE email = ?"
            result = execute_query_one(select_query, (email,))
            
            user_id = result[0]
            user_email = result[1]
            user_role = result[2]
            created_at = result[3]
            
            token = create_jwt_token(user_id, user_email, user_role)
            
            return {
                'status': 'success',
                'message': 'User registered successfully',
                'user': {
                    'id': user_id,
                    'email': user_email,
                    'role': user_role,
                    'created_at': str(created_at)
                },
                'token': token
            }
        except Exception as e:
            raise Exception(f"Registration failed: {str(e)}")
            
    else:
        # SQL Server Query - Use OUTPUT clause
        insert_query = """
            INSERT INTO users (email, password_hash, role)
            OUTPUT INSERTED.id, INSERTED.email, INSERTED.role, INSERTED.created_at
            VALUES (?, ?, ?)
        """
        
        try:
            result = execute_query_one(insert_query, (email, password_hash, role))
            user_id = result[0]
            user_email = result[1]
            user_role = result[2]
            created_at = result[3]
            
            # Create JWT token with role
            token = create_jwt_token(user_id, user_email, user_role)
            
            return {
                'status': 'success',
                'message': 'User registered successfully',
                'user': {
                    'id': user_id,
                    'email': user_email,
                    'role': user_role,
                    'created_at': str(created_at)
                },
                'token': token
            }
        except Exception as e:
            raise Exception(f"Registration failed: {str(e)}")

def login_user(email: str, password: str) -> dict:
    """
    Login a user
    
    Args:
        email (str): User email
        password (str): Plain text password
        
    Returns:
        dict: Success message with user info and token
        
    Raises:
        Exception: If credentials are invalid
    """
    # Get user from database (including role)
    print(f"[auth.login_user] Looking up user: {email}")
    query = "SELECT id, email, password_hash, role, created_at FROM users WHERE email = ?"
    user = execute_query_one(query, (email,))
    
    if not user:
        print(f"[auth.login_user] User not found: {email}")
        raise Exception("Invalid email or password")
    
    user_id, user_email, password_hash, user_role, created_at = user
    print(f"[auth.login_user] User found - ID: {user_id}, Role: {user_role}")
    
    # Verify password
    print("[auth.login_user] Verifying password...")
    if not verify_password(password, password_hash):
        print("[auth.login_user] Password verification failed")
        raise Exception("Invalid email or password")
    
    print("[auth.login_user] Password verified, creating token...")
    # Create JWT token with role
    token = create_jwt_token(user_id, user_email, user_role)
    
    print(f"[auth.login_user] Login successful for user {user_id}")
    return {
        'status': 'success',
        'message': 'Login successful',
        'user': {
            'id': user_id,
            'email': user_email,
            'role': user_role,
            'created_at': str(created_at) if created_at else None
        },
        'token': token
    }

def get_current_user(token: str) -> dict:
    """
    Get current user from JWT token
    
    Args:
        token (str): JWT token
        
    Returns:
        dict: User information
        
    Raises:
        Exception: If token is invalid or user not found
    """
    payload = verify_jwt_token(token)
    user_id = payload.get('user_id')
    
    query = "SELECT id, email, role, created_at FROM users WHERE id = ?"
    user = execute_query_one(query, (user_id,))
    
    if not user:
        raise Exception("User not found")
    
    return {
        'id': user[0],
        'email': user[1],
        'role': user[2],
        'created_at': user[3].isoformat() if user[3] else None
    }


def is_admin(token: str) -> bool:
    """
    Check if user is admin
    
    Args:
        token (str): JWT token
        
    Returns:
        bool: True if user is admin, False otherwise
    """
    try:
        payload = verify_jwt_token(token)
        return payload.get('role') == 'admin'
    except Exception:
        return False


def require_admin(token: str) -> dict:
    """
    Verify user is admin and return user info
    
    Args:
        token (str): JWT token
        
    Returns:
        dict: User information
        
    Raises:
        Exception: If user is not admin or token is invalid
    """
    if not is_admin(token):
        raise Exception("Admin access required")
    
    return get_current_user(token)


def generate_random_password(length: int = 10) -> str:
    """
    Generate a random password
    
    Args:
        length (int): Length of the password (default 10)
        
    Returns:
        str: Random password
    """
    alphabet = string.ascii_letters + string.digits
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


def reset_user_password(email: str) -> dict:
    """
    Reset user password and return new password
    
    Args:
        email (str): User email
        
    Returns:
        dict: Success message with new password
        
    Raises:
        Exception: If user not found or reset fails
    """
    print(f"[auth.reset_user_password] Resetting password for: {email}")
    
    # Check if user exists
    query = "SELECT id, email FROM users WHERE email = ?"
    user = execute_query_one(query, (email,))
    
    if not user:
        print(f"[auth.reset_user_password] User not found: {email}")
        raise Exception("User not found")
    
    user_id, user_email = user
    print(f"[auth.reset_user_password] User found - ID: {user_id}")
    
    # Generate new random password
    new_password = generate_random_password(10)
    password_hash = hash_password(new_password)
    
    # Update password in database
    update_query = "UPDATE users SET password_hash = ? WHERE id = ?"
    execute_query(update_query, (password_hash, user_id))
    
    print(f"[auth.reset_user_password] Password reset successful for user {user_id}")
    
    return {
        'status': 'success',
        'message': 'Password reset successfully',
        'new_password': new_password,
        'email': user_email
    }

