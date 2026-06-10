"""
Script to create a test user in the database
"""
from auth import register_user

try:
    # Create admin user
    print("Creating admin user...")
    result = register_user("admin@gmail.com", "admin123")
    print("✓ Admin user created successfully!")
    print("  Email: admin@gmail.com")
    print("  Password: admin123")
    print(f"  Role: {result['user']['role']}")
    print(f"  ID: {result['user']['id']}")
except Exception as e:
    print(f"✗ Error creating admin: {e}")

try:
    # Create test user
    print("\nCreating test user...")
    result = register_user("test@gmail.com", "test123")
    print("✓ Test user created successfully!")
    print("  Email: test@gmail.com")
    print("  Password: test123")
    print(f"  Role: {result['user']['role']}")
    print(f"  ID: {result['user']['id']}")
except Exception as e:
    print(f"✗ Error creating test user: {e}")

print("\n" + "="*50)
print("You can now login with:")
print("  admin@gmail.com / admin123")
print("  test@gmail.com / test123")
print("="*50)
