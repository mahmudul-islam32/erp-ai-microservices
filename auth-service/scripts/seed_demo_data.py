"""
Demo Data Seeder for Auth Service
Creates sample users, roles, sessions, and audit logs for testing/demo purposes
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import connect_to_mongo, get_database
from app.services.user_service import UserService
from app.models.user import UserCreate, UserRole, UserStatus
from datetime import datetime, timedelta
import random


# Demo users data
DEMO_USERS = [
    {
        "email": "admin@example.com",
        "password": "admin123",
        "first_name": "System",
        "last_name": "Administrator",
        "role": UserRole.SUPER_ADMIN,
        "department": "IT",
        "phone": "+1-555-0100",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "john.admin@example.com",
        "password": "admin123",
        "first_name": "John",
        "last_name": "Smith",
        "role": UserRole.ADMIN,
        "department": "IT",
        "phone": "+1-555-0101",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "sarah.admin@example.com",
        "password": "admin123",
        "first_name": "Sarah",
        "last_name": "Johnson",
        "role": UserRole.ADMIN,
        "department": "Operations",
        "phone": "+1-555-0102",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "manager@example.com",
        "password": "manager123",
        "first_name": "Michael",
        "last_name": "Brown",
        "role": UserRole.MANAGER,
        "department": "Sales",
        "phone": "+1-555-0201",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "emily.manager@example.com",
        "password": "manager123",
        "first_name": "Emily",
        "last_name": "Davis",
        "role": UserRole.MANAGER,
        "department": "Inventory",
        "phone": "+1-555-0202",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "robert.manager@example.com",
        "password": "manager123",
        "first_name": "Robert",
        "last_name": "Wilson",
        "role": UserRole.MANAGER,
        "department": "Finance",
        "phone": "+1-555-0203",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "employee@example.com",
        "password": "employee123",
        "first_name": "David",
        "last_name": "Martinez",
        "role": UserRole.EMPLOYEE,
        "department": "Sales",
        "phone": "+1-555-0301",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "jennifer.sales@example.com",
        "password": "employee123",
        "first_name": "Jennifer",
        "last_name": "Garcia",
        "role": UserRole.EMPLOYEE,
        "department": "Sales",
        "phone": "+1-555-0302",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "james.inventory@example.com",
        "password": "employee123",
        "first_name": "James",
        "last_name": "Rodriguez",
        "role": UserRole.EMPLOYEE,
        "department": "Inventory",
        "phone": "+1-555-0303",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "lisa.support@example.com",
        "password": "employee123",
        "first_name": "Lisa",
        "last_name": "Anderson",
        "role": UserRole.EMPLOYEE,
        "department": "Support",
        "phone": "+1-555-0304",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "customer1@example.com",
        "password": "customer123",
        "first_name": "Customer",
        "last_name": "One",
        "role": UserRole.CUSTOMER,
        "department": None,
        "phone": "+1-555-1001",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
    {
        "email": "customer2@example.com",
        "password": "customer123",
        "first_name": "Customer",
        "last_name": "Two",
        "role": UserRole.CUSTOMER,
        "department": None,
        "phone": "+1-555-1002",
        "is_active": True,
        "status": UserStatus.ACTIVE
    },
]


async def seed_demo_data():
    """Seed demo data into the database"""
    
    print("🌱 Seeding demo data for Auth Service...")
    print("=" * 50)
    
    # Connect to database
    await connect_to_mongo()
    
    # Get database connection
    db = get_database()
    
    # Initialize user service (no parameters needed)
    user_service = UserService()
    
    # Create users
    print("\n📝 Creating demo users...")
    created_users = []
    
    for user_data in DEMO_USERS:
        try:
            # Check if user already exists
            existing_user = await db.users.find_one({"email": user_data["email"]})
            
            if existing_user:
                print(f"   ⏭️  User {user_data['email']} already exists, skipping...")
                created_users.append(existing_user)
                continue
            
            # Create UserCreate object
            user_create = UserCreate(**user_data)
            
            # Create user
            user = await user_service.create_user(user_create)
            created_users.append(user.dict())
            
            print(f"   ✅ Created user: {user_data['email']} ({user_data['role']})")
            
        except Exception as e:
            print(f"   ❌ Failed to create user {user_data['email']}: {str(e)}")
    
    print(f"\n✅ Created {len(created_users)} users")
    
    # Create sample audit logs
    print("\n📊 Creating sample audit logs...")
    
    audit_logs = []
    actions = ["login", "logout", "create", "update", "delete", "view"]
    resources = ["user", "product", "order", "customer", "invoice"]
    
    for i in range(50):
        user = random.choice(created_users)
        
        # Handle both dict and UserResponse objects
        if isinstance(user, dict):
            user_id = str(user.get("_id", user.get("id", "")))
            user_email = user.get("email", "")
        else:
            # It's a UserResponse/dict object
            user_id = str(user.get("id", ""))
            user_email = user.get("email", "")
        
        action = random.choice(actions)
        resource = random.choice(resources)
        
        audit_log = {
            "user_id": user_id,
            "user_email": user_email,
            "action": action,
            "resource": resource,
            "resource_id": f"RES-{random.randint(1000, 9999)}",
            "ip_address": f"192.168.1.{random.randint(1, 255)}",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "timestamp": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            "status": random.choice(["success", "success", "success", "failure"]),
            "details": {
                "message": f"{action.capitalize()} {resource} operation",
                "duration_ms": random.randint(50, 500)
            }
        }
        
        audit_logs.append(audit_log)
    
    if audit_logs:
        await db.audit_logs.insert_many(audit_logs)
        print(f"   ✅ Created {len(audit_logs)} audit log entries")
    
    # Create sample sessions
    print("\n🔐 Creating sample active sessions...")
    
    sessions = []
    for i in range(10):
        user = random.choice(created_users[:7])  # Only for active employees
        
        # Handle both dict and UserResponse objects
        if isinstance(user, dict):
            user_id = str(user.get("_id", user.get("id", "")))
            user_email = user.get("email", "")
        else:
            user_id = str(user.get("id", ""))
            user_email = user.get("email", "")
        
        session = {
            "user_id": user_id,
            "user_email": user_email,
            "ip_address": f"192.168.1.{random.randint(1, 255)}",
            "user_agent": random.choice([
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0",
                "Mozilla/5.0 (X11; Linux x86_64) Firefox/120.0"
            ]),
            "created_at": datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
            "last_activity": datetime.utcnow() - timedelta(minutes=random.randint(1, 60)),
            "expires_at": datetime.utcnow() + timedelta(days=7),
            "is_active": True
        }
        
        sessions.append(session)
    
    if sessions:
        await db.sessions.insert_many(sessions)
        print(f"   ✅ Created {len(sessions)} active sessions")
    
    print("\n" + "=" * 50)
    print("✅ Demo data seeding complete!")
    print("\n📋 Summary:")
    print(f"   Created {len(created_users)} users")
    print(f"   Created {len(audit_logs)} audit logs")
    print(f"   Created {len(sessions)} sessions")
    
    print("\n🔐 Test Credentials:")
    print("   Super Admin: admin@example.com / admin123")
    print("   Manager: manager@example.com / manager123")
    print("   Employee: employee@example.com / employee123")
    
    print("\n⚠️  Remember to change these passwords in production!")
    print("=" * 50)
    print("\nSUCCESS")


async def clear_demo_data():
    """Clear all demo data from the database"""
    
    print("🧹 Clearing demo data...")
    
    db = await get_database()
    
    # Delete demo users (by email pattern)
    result = await db.users.delete_many({
        "email": {"$regex": "@example.com$"}
    })
    print(f"   Deleted {result.deleted_count} users")
    
    # Clear audit logs
    result = await db.audit_logs.delete_many({})
    print(f"   Deleted {result.deleted_count} audit logs")
    
    # Clear sessions
    result = await db.sessions.delete_many({})
    print(f"   Deleted {result.deleted_count} sessions")
    
    print("✅ Demo data cleared")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        asyncio.run(clear_demo_data())
    else:
        asyncio.run(seed_demo_data())

