"""
Fix script - Insert user with ID 5 if missing
"""
from database import execute_query, execute_query_one
import bcrypt

def fix_user_5():
    """Insert or verify user with ID 5 exists"""
    try:
        # Check if user 5 exists
        check_query = "SELECT id, email FROM users WHERE id = 5"
        user = execute_query_one(check_query)
        
        if user:
            print(f"✓ User ID 5 already exists: {user[1]}")
            return
        
        # Check if email client@gmail.com exists with different ID
        check_email_query = "SELECT id, email FROM users WHERE email = 'client@gmail.com'"
        existing_user = execute_query_one(check_email_query)
        
        if existing_user:
            print(f"! User 'client@gmail.com' exists with ID {existing_user[0]}")
            print("Please logout and login again to get a new valid token.")
            return
        
        # Insert user with ID 5
        password = "password123"  # Default password
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        insert_query = """
            SET IDENTITY_INSERT users ON;
            INSERT INTO users (id, email, password, role, created_at)
            VALUES (5, 'client@gmail.com', ?, 'client', GETDATE());
            SET IDENTITY_INSERT users OFF;
        """
        
        execute_query(insert_query, (hashed.decode('utf-8'),))
        print("✓ Successfully inserted user ID 5 (client@gmail.com)")
        print("Default password: password123")
        print("\nYou can now:")
        print("1. Logout from the app")
        print("2. Login with: client@gmail.com / password123")
        print("3. Try saving outfits again")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        print("\nAlternative solution:")
        print("1. Logout from the app")
        print("2. Register a new account")
        print("3. Login with the new account")

if __name__ == "__main__":
    fix_user_5()
