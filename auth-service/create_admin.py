#!/usr/bin/env python3
"""
Script to create the default admin user for ERP Auth Service
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, '/app')

from app.database import connect_to_mongo, get_database
from app.models import UserInDB, UserRole, UserStatus, Permission
from app.services.security import SecurityService
from datetime import datetime


async def create_default_admin():
    """Create default admin user"""
    try:
        # Connect to database
        await connect_to_mongo()
        db = get_database()
        users_collection = db.users
        
        # Check if admin already exists
        existing_admin = await users_collection.find_one({"email": "admin@erp.com"})
        if existing_admin:
            print("✅ Admin user already exists")
            return
        
        # Create security service for password hashing
        security_service = SecurityService()
        
        # Hash password
        hashed_password = security_service.get_password_hash("admin123")
        
        # Get all permissions for super admin
        permissions = [p for p in Permission]
        
        # Create admin user document
        admin_user = {
            "email": "admin@erp.com",
            "hashed_password": hashed_password,
            "first_name": "System",
            "last_name": "Administrator", 
            "role": UserRole.SUPER_ADMIN,
            "department": "IT",
            "phone": "+1234567890",
            "status": UserStatus.ACTIVE,
            "permissions": permissions,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None,
            "failed_login_attempts": 0,
            "locked_until": None
        }
        
        # Insert admin user
        result = await users_collection.insert_one(admin_user)
        
        if result.inserted_id:
            print("✅ Default admin user created successfully!")
            print("📧 Email: admin@erp.com")
            print("🔑 Password: admin123")
            print("👤 Role: super_admin")
        else:
            print("❌ Failed to create admin user")
            
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(create_default_admin())
