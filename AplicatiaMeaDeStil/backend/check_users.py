"""
Quick script to check users in database and fix user_id issue
"""
from database import execute_query

def check_users():
    """Check all users in the database"""
    try:
        query = "SELECT id, email, role, created_at FROM users ORDER BY id"
        results = execute_query(query, fetch=True)
        
        print("\n=== Current Users in Database ===")
        if not results:
            print("No users found in database!")
            return
        
        for row in results:
            user_id, email, role, created_at = row
            print(f"ID: {user_id} | Email: {email} | Role: {role} | Created: {created_at}")
        
        print(f"\nTotal users: {len(results)}")
        
    except Exception as e:
        print(f"Error checking users: {e}")

if __name__ == "__main__":
    check_users()
