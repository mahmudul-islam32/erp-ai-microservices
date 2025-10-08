#!/usr/bin/env python3
"""
Script to fix the admin user password in the database
This script will delete and recreate the admin user with the correct password hash
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime

# MongoDB connection
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "erp_auth_db"

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Admin user credentials
ADMIN_EMAIL = "admin@erp.com"
ADMIN_PASSWORD = "admin123"


def get_password_hash(password: str) -> str:
    """Hash a password with bcrypt 72-byte limit"""
    # Truncate password to 72 bytes if needed (bcrypt limitation)
    if isinstance(password, str):
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)


async def fix_admin_user():
    """Delete and recreate admin user with correct password"""
    print("🔧 Fixing admin user password...")
    print(f"Connecting to MongoDB at {MONGODB_URL}...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users_collection = db.users
    
    try:
        # Delete existing admin user
        print(f"\n1. Checking for existing user: {ADMIN_EMAIL}")
        existing_user = await users_collection.find_one({"email": ADMIN_EMAIL})
        
        if existing_user:
            print(f"   ✅ Found existing user")
            print(f"   🗑️  Deleting existing user...")
            result = await users_collection.delete_one({"email": ADMIN_EMAIL})
            print(f"   ✅ Deleted {result.deleted_count} user(s)")
        else:
            print(f"   ℹ️  No existing user found")
        
        # Create new admin user with correct password hash
        print(f"\n2. Creating new admin user...")
        hashed_password = get_password_hash(ADMIN_PASSWORD)
        print(f"   ✅ Password hashed successfully")
        
        admin_user = {
            "email": ADMIN_EMAIL,
            "hashed_password": hashed_password,
            "first_name": "Admin",
            "last_name": "User",
            "role": "SUPER_ADMIN",
            "department": "IT",
            "phone": "",
            "permissions": [
                "USER_CREATE", "USER_READ", "USER_UPDATE", "USER_DELETE",
                "INVENTORY_CREATE", "INVENTORY_READ", "INVENTORY_UPDATE", "INVENTORY_DELETE",
                "SALES_CREATE", "SALES_READ", "SALES_UPDATE", "SALES_DELETE",
                "FINANCE_CREATE", "FINANCE_READ", "FINANCE_UPDATE", "FINANCE_DELETE",
                "HR_CREATE", "HR_READ", "HR_UPDATE", "HR_DELETE",
                "SYSTEM_ADMIN", "AI_ACCESS"
            ],
            "status": "ACTIVE",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "failed_login_attempts": 0,
            "locked_until": None,
            "last_login": None
        }
        
        result = await users_collection.insert_one(admin_user)
        print(f"   ✅ Admin user created with ID: {result.inserted_id}")
        
        # Verify the user
        print(f"\n3. Verifying admin user...")
        created_user = await users_collection.find_one({"email": ADMIN_EMAIL})
        
        if created_user:
            print(f"   ✅ User verified in database")
            print(f"   📧 Email: {created_user['email']}")
            print(f"   👤 Name: {created_user['first_name']} {created_user['last_name']}")
            print(f"   🔑 Role: {created_user['role']}")
            print(f"   ✅ Status: {created_user['status']}")
            
            # Test password verification
            print(f"\n4. Testing password verification...")
            if pwd_context.verify(ADMIN_PASSWORD, created_user['hashed_password']):
                print(f"   ✅ Password verification SUCCESSFUL")
            else:
                print(f"   ❌ Password verification FAILED")
        else:
            print(f"   ❌ User NOT found in database")
        
        print(f"\n" + "="*60)
        print(f"✅ Admin user fixed successfully!")
        print(f"="*60)
        print(f"\n📝 Login Credentials:")
        print(f"   Email:    {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print(f"\n🎯 You can now login at: http://localhost:8080/login")
        print(f"")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()


if __name__ == "__main__":
    print("="*60)
    print("🔐 ERP Admin User Password Fix Script")
    print("="*60)
    asyncio.run(fix_admin_user())

