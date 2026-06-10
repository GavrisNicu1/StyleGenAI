"""
Password Reset Module - Secure token-based password reset functionality
"""
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from database import execute_query, execute_query_one
from auth import hash_password, verify_password
from email_service import send_password_reset_email, send_password_changed_notification, is_email_configured

# Token expiration time in hours
RESET_TOKEN_EXPIRATION_HOURS = 1


def generate_reset_token() -> str:
    """
    Generate a cryptographically secure reset token
    
    Returns:
        str: A secure random token (64 characters)
    """
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """
    Hash the reset token for secure storage
    We store hashed tokens in DB, but send unhashed to user
    
    Args:
        token: The plain reset token
        
    Returns:
        str: SHA-256 hash of the token
    """
    return hashlib.sha256(token.encode()).hexdigest()


def create_password_reset_request(email: str) -> dict:
    """
    Create a password reset request and send email
    
    Args:
        email: User's email address
        
    Returns:
        dict: Status of the request
        
    Note: Always returns success message even if email doesn't exist
          to prevent email enumeration attacks
    """
    print(f"[PASSWORD_RESET] Request received for: {email}")
    
    # Check if email service is configured
    if not is_email_configured():
        print("[PASSWORD_RESET] Email service not configured")
        return {
            'status': 'error',
            'message': 'Serviciul de email nu este configurat. Contactează administratorul.'
        }
    
    # Find user by email
    query = "SELECT id, email FROM users WHERE email = ?"
    user = execute_query_one(query, (email,))
    
    if not user:
        print(f"[PASSWORD_RESET] User not found: {email}")
        # Return success anyway to prevent email enumeration
        return {
            'status': 'success',
            'message': 'Dacă adresa de email există în sistem, vei primi un link de resetare.'
        }
    
    user_id, user_email = user
    print(f"[PASSWORD_RESET] User found - ID: {user_id}")
    
    # Invalidate any existing reset tokens for this user
    invalidate_query = "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0"
    execute_query(invalidate_query, (user_id,))
    print(f"[PASSWORD_RESET] Invalidated previous tokens for user {user_id}")
    
    # Generate new token
    plain_token = generate_reset_token()
    hashed_token = hash_token(plain_token)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRATION_HOURS)
    
    # Store hashed token in database
    insert_query = """
        INSERT INTO password_reset_tokens (user_id, token, expires_at, used)
        VALUES (?, ?, ?, 0)
    """
    execute_query(insert_query, (user_id, hashed_token, expires_at))
    print(f"[PASSWORD_RESET] Token created, expires at: {expires_at}")
    
    # Send email with plain token (user clicks link with this token)
    email_sent = send_password_reset_email(user_email, plain_token)
    
    if email_sent:
        print(f"[PASSWORD_RESET] Email sent successfully to {user_email}")
        return {
            'status': 'success',
            'message': 'Dacă adresa de email există în sistem, vei primi un link de resetare.'
        }
    else:
        print(f"[PASSWORD_RESET] Failed to send email to {user_email}")
        return {
            'status': 'error',
            'message': 'Nu am putut trimite emailul. Te rugăm să încerci din nou.'
        }


def validate_reset_token(token: str) -> dict:
    """
    Validate a password reset token
    
    Args:
        token: The plain reset token from the URL
        
    Returns:
        dict: Validation result with user_id if valid
    """
    print("[PASSWORD_RESET] Validating token...")
    
    hashed_token = hash_token(token)
    
    # Find token in database
    query = """
        SELECT prt.id, prt.user_id, prt.expires_at, prt.used, u.email
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        WHERE prt.token = ?
    """
    result = execute_query_one(query, (hashed_token,))
    
    if not result:
        print("[PASSWORD_RESET] Token not found")
        return {
            'valid': False,
            'error': 'Link-ul de resetare este invalid.'
        }
    
    token_id, user_id, expires_at, used, user_email = result
    
    # Check if already used
    if used:
        print("[PASSWORD_RESET] Token already used")
        return {
            'valid': False,
            'error': 'Acest link de resetare a fost deja folosit.'
        }
    
    # Check if expired
    if getattr(expires_at, 'tzinfo', None) is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        print(f"[PASSWORD_RESET] Token expired at {expires_at}")
        return {
            'valid': False,
            'error': 'Link-ul de resetare a expirat. Te rugăm să soliciți unul nou.'
        }
    
    print(f"[PASSWORD_RESET] Token valid for user {user_id}")
    return {
        'valid': True,
        'token_id': token_id,
        'user_id': user_id,
        'email': user_email
    }


def reset_password_with_token(token: str, new_password: str) -> dict:
    """
    Reset password using a valid token
    
    Args:
        token: The plain reset token from the URL
        new_password: The new password to set
        
    Returns:
        dict: Status of the password reset
    """
    print("[PASSWORD_RESET] Attempting password reset with token...")
    
    # Validate token first
    validation = validate_reset_token(token)
    
    if not validation['valid']:
        return {
            'status': 'error',
            'message': validation['error']
        }
    
    user_id = validation['user_id']
    token_id = validation['token_id']
    user_email = validation['email']
    
    # Validate password strength
    if len(new_password) < 8:
        return {
            'status': 'error',
            'message': 'Parola trebuie să aibă cel puțin 8 caractere.'
        }
    
    # Hash new password
    password_hash = hash_password(new_password)
    
    # Update password in database
    update_password_query = "UPDATE users SET password_hash = ? WHERE id = ?"
    execute_query(update_password_query, (password_hash, user_id))
    print(f"[PASSWORD_RESET] Password updated for user {user_id}")
    
    # Mark token as used
    mark_used_query = "UPDATE password_reset_tokens SET used = 1 WHERE id = ?"
    execute_query(mark_used_query, (token_id,))
    print(f"[PASSWORD_RESET] Token {token_id} marked as used")
    
    # Send confirmation email
    send_password_changed_notification(user_email)
    
    return {
        'status': 'success',
        'message': 'Parola a fost resetată cu succes! Te poți autentifica cu noua parolă.'
    }


def cleanup_expired_tokens() -> int:
    """
    Clean up expired and used tokens from the database
    
    Returns:
        int: Number of tokens deleted
    """
    delete_query = """
        DELETE FROM password_reset_tokens 
        WHERE expires_at < GETDATE() OR used = 1
    """
    # For this we need a count - let's do it in two steps
    count_query = """
        SELECT COUNT(*) FROM password_reset_tokens 
        WHERE expires_at < GETDATE() OR used = 1
    """
    count_result = execute_query_one(count_query)
    count = count_result[0] if count_result else 0
    
    execute_query(delete_query)
    print(f"[PASSWORD_RESET] Cleaned up {count} expired/used tokens")
    
    return count
