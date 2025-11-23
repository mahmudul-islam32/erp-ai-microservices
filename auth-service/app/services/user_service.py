from app.database import get_database
from app.models import UserInDB, UserCreate, UserUpdate, UserResponse, UserRole, UserStatus, Permission
from app.models.settings import SettingsCategory
from app.services.security import SecurityService
from app.services.settings_service import settings_service
from app.services.notification_client import NotificationClient
from app.services.notification_helper import send_user_management_notification
from pymongo.errors import DuplicateKeyError
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
import logging
import os

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self):
        self.security_service = SecurityService()
        # Initialize notification client if service URL is available
        notification_url = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8004")
        self.notification_client = NotificationClient(notification_url)
        self.current_performer_id = None  # Set by API endpoints
        self.current_performer_name = None

    async def create_user(self, user_data: UserCreate, auth_token: str = None) -> UserResponse:
        """Create a new user"""
        try:
            db = get_database()
            users_collection = db.users

            # Check if user already exists
            existing_user = await users_collection.find_one({"email": user_data.email})
            if existing_user:
                raise ValueError("User with this email already exists")

            # Get security settings - MUST exist for password validation
            security_settings = None
            try:
                security_setting = await settings_service.get_settings_by_category(SettingsCategory.SECURITY)
                if security_setting and security_setting.security:
                    # Convert Pydantic model to dict, ensuring boolean values are preserved
                    security_settings = security_setting.security.dict()
                    logger.info(f"Using security settings for user creation:")
                    logger.info(f"  - min_length: {security_settings.get('password_min_length')}")
                    logger.info(f"  - require_uppercase: {security_settings.get('password_require_uppercase')}")
                    logger.info(f"  - require_lowercase: {security_settings.get('password_require_lowercase')}")
                    logger.info(f"  - require_numbers: {security_settings.get('password_require_numbers')}")
                    logger.info(f"  - require_special_chars: {security_settings.get('password_require_special_chars')}")
                else:
                    logger.warning("Security settings not found in database. Using strict defaults.")
                    # Use strict defaults if no settings found
                    security_settings = {
                        "password_min_length": 8,
                        "password_require_uppercase": True,
                        "password_require_lowercase": True,
                        "password_require_numbers": True,
                        "password_require_special_chars": False
                    }
            except Exception as e:
                logger.error(f"Error fetching security settings: {e}")
                # Use strict defaults on error
                security_settings = {
                    "password_min_length": 8,
                    "password_require_uppercase": True,
                    "password_require_lowercase": True,
                    "password_require_numbers": True,
                    "password_require_special_chars": False
                }
                logger.warning("Using default security settings due to error")

            # Validate password against security settings
            is_valid, error_message = self.security_service.validate_password(user_data.password, security_settings)
            if not is_valid:
                logger.warning(f"Password validation failed for user creation: {error_message}")
                raise ValueError(error_message or "Password does not meet security requirements")

            # Hash password
            hashed_password = self.security_service.get_password_hash(user_data.password)

            # Get role permissions
            permissions = self.security_service.get_role_permissions(user_data.role)

            # Create user document
            user_doc = UserInDB(
                email=user_data.email,
                hashed_password=hashed_password,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                role=user_data.role,
                department=user_data.department,
                phone=user_data.phone,
                permissions=permissions,
                status=UserStatus.ACTIVE
            )

            # Insert user
            result = await users_collection.insert_one(user_doc.dict(by_alias=True, exclude={"id"}))
            
            # Fetch created user
            created_user = await users_collection.find_one({"_id": result.inserted_id})
            if created_user:
                created_user["id"] = str(created_user["_id"])
                user_id = created_user["id"]
                del created_user["_id"]  # Remove the original _id field
                
                # Send notification to admins (NOT the new user)
                try:
                    # Get performer info (admin who created the user)
                    performer_name = "An administrator"
                    if self.current_performer_name:
                        performer_name = self.current_performer_name
                    elif self.current_performer_id:
                        performer_info = await self.get_user_by_id(self.current_performer_id)
                        if performer_info:
                            performer_name = f"{performer_info.first_name} {performer_info.last_name}".strip()
                    
                    # Notify all other admins about new user creation
                    new_user_name = f"{user_data.first_name} {user_data.last_name}".strip()
                    await send_user_management_notification(
                        notification_client=self.notification_client,
                        performer_id=self.current_performer_id or "system",
                        performer_name=performer_name,
                        action="created",
                        subject_user_name=new_user_name,
                        subject_user_email=user_data.email,
                        details=f"Role: {user_data.role.value}, Department: {user_data.department or 'N/A'}",
                        priority="medium",
                        auth_token=auth_token  # ✅ FIXED: Pass the authentication token!
                    )
                except Exception as e:
                    logger.warning(f"Failed to send notification for new user: {e}")
                
                return UserResponse(**created_user)
            
            return None

        except DuplicateKeyError:
            raise ValueError("User with this email already exists")
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        """Get user by ID"""
        try:
            db = get_database()
            users_collection = db.users
            
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user["id"] = str(user["_id"])
                del user["_id"]  # Remove the original _id field
                return UserInDB(**user)
            return None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None

    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """Get user by email"""
        try:
            db = get_database()
            users_collection = db.users
            
            user = await users_collection.find_one({"email": email})
            if user:
                user["id"] = str(user["_id"])
                del user["_id"]  # Remove the original _id field
                return UserInDB(**user)
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None

    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[UserResponse]:
        """Update user"""
        try:
            db = get_database()
            users_collection = db.users

            # Prepare update data
            update_data = {}
            for field, value in user_update.dict(exclude_unset=True).items():
                if value is not None:
                    update_data[field] = value

            if not update_data:
                # Get current user if no updates
                user = await users_collection.find_one({"_id": ObjectId(user_id)})
                if user:
                    user["id"] = str(user["_id"])
                    del user["_id"]  # Remove the original _id field
                    return UserResponse(**user)
                return None

            # Add updated timestamp
            update_data["updated_at"] = datetime.utcnow()

            # If role is being updated, update permissions
            if "role" in update_data:
                permissions = self.security_service.get_role_permissions(UserRole(update_data["role"]))
                update_data["permissions"] = permissions

            # Update user
            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )

            if result.matched_count == 0:
                return None

            # Fetch updated user
            updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
            if updated_user:
                updated_user["id"] = str(updated_user["_id"])
                del updated_user["_id"]  # Remove the original _id field
                
                # Send notification to admins about user update
                try:
                    # Get performer info
                    performer_name = "An administrator"
                    if self.current_performer_name:
                        performer_name = self.current_performer_name
                    elif self.current_performer_id:
                        performer_info = await self.get_user_by_id(self.current_performer_id)
                        if performer_info:
                            performer_name = f"{performer_info.first_name} {performer_info.last_name}".strip()
                    
                    # Build change details
                    changes = []
                    if "role" in update_data:
                        changes.append(f"role changed to {update_data['role']}")
                    if "status" in update_data:
                        changes.append(f"status changed to {update_data['status']}")
                    if "department" in update_data:
                        changes.append(f"department changed to {update_data['department']}")
                    
                    changes_text = ", ".join(changes) if changes else "profile information updated"
                    
                    # Get updated user name
                    updated_user_name = f"{updated_user.get('first_name', '')} {updated_user.get('last_name', '')}".strip()
                    updated_user_email = updated_user.get('email', '')
                    
                    # Notify admins (not the performer or the subject user)
                    await send_user_management_notification(
                        notification_client=self.notification_client,
                        performer_id=self.current_performer_id or "system",
                        performer_name=performer_name,
                        action="updated",
                        subject_user_name=updated_user_name,
                        subject_user_email=updated_user_email,
                        details=changes_text,
                        priority="medium",
                        auth_token=None  # ✅ TODO: Need to pass auth_token through update_user method
                    )
                except Exception as e:
                    logger.warning(f"Failed to send notification for user update: {e}")
                
                return UserResponse(**updated_user)
            
            return None

        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise

    async def delete_user(self, user_id: str) -> bool:
        """Delete user (soft delete by setting status to inactive)"""
        try:
            db = get_database()
            users_collection = db.users

            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "status": UserStatus.INACTIVE,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            if result.matched_count > 0:
                # Send notification to admins about user deactivation
                try:
                    # Get the deactivated user's info
                    deactivated_user = await self.get_user_by_id(user_id)
                    user_name = "Unknown user"
                    user_email = ""
                    if deactivated_user:
                        user_name = f"{deactivated_user.first_name} {deactivated_user.last_name}".strip()
                        user_email = deactivated_user.email
                    
                    # Get performer info
                    performer_name = "An administrator"
                    if self.current_performer_name:
                        performer_name = self.current_performer_name
                    elif self.current_performer_id:
                        performer_info = await self.get_user_by_id(self.current_performer_id)
                        if performer_info:
                            performer_name = f"{performer_info.first_name} {performer_info.last_name}".strip()
                    
                    # Notify admins
                    await send_user_management_notification(
                        notification_client=self.notification_client,
                        performer_id=self.current_performer_id or "system",
                        performer_name=performer_name,
                        action="deactivated",
                        subject_user_name=user_name,
                        subject_user_email=user_email,
                        details="User account has been deactivated",
                        priority="high",
                        auth_token=None  # ✅ TODO: Need to pass auth_token through delete_user method
                    )
                except Exception as e:
                    logger.warning(f"Failed to send notification for user deletion: {e}")

            return result.matched_count > 0

        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False

    async def get_users(self, skip: int = 0, limit: int = 100, role: Optional[UserRole] = None, 
                       status: Optional[UserStatus] = None) -> List[UserResponse]:
        """Get list of users with pagination and filters"""
        try:
            db = get_database()
            users_collection = db.users

            # Build query filter
            query_filter = {}
            if role:
                query_filter["role"] = role
            if status:
                query_filter["status"] = status

            # Fetch users
            cursor = users_collection.find(query_filter).skip(skip).limit(limit).sort("created_at", -1)
            users = await cursor.to_list(length=limit)

            # Convert to UserResponse
            user_responses = []
            for user in users:
                user["id"] = str(user["_id"])
                del user["_id"]  # Remove the original _id field
                user_responses.append(UserResponse(**user))

            return user_responses

        except Exception as e:
            logger.error(f"Error getting users: {e}")
            return []

    async def authenticate_user(self, email: str, password: str) -> Optional[UserInDB]:
        """Authenticate user credentials"""
        try:
            user = await self.get_user_by_email(email)
            if not user:
                return None

            # Check if user is active
            if user.status != UserStatus.ACTIVE:
                return None

            # Check if account is locked
            if user.locked_until and user.locked_until > datetime.utcnow():
                return None

            # Verify password
            if not self.security_service.verify_password(password, user.hashed_password):
                # Increment failed login attempts
                await self._increment_failed_login_attempts(user.id)
                return None

            # Reset failed login attempts on successful login
            await self._reset_failed_login_attempts(user.id)
            
            # Update last login
            await self._update_last_login(user.id)

            return user

        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> tuple:
        """
        Change user password.
        Returns (success, error_message)
        """
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return False, "User not found"

            # Verify current password
            if not self.security_service.verify_password(current_password, user.hashed_password):
                return False, "Invalid current password"

            # Get security settings - MUST exist for password validation
            security_settings = None
            try:
                security_setting = await settings_service.get_settings_by_category(SettingsCategory.SECURITY)
                if security_setting and security_setting.security:
                    # Convert Pydantic model to dict, ensuring boolean values are preserved
                    security_settings = security_setting.security.dict()
                    logger.info(f"Using security settings for password validation:")
                    logger.info(f"  - min_length: {security_settings.get('password_min_length')}")
                    logger.info(f"  - require_uppercase: {security_settings.get('password_require_uppercase')}")
                    logger.info(f"  - require_lowercase: {security_settings.get('password_require_lowercase')}")
                    logger.info(f"  - require_numbers: {security_settings.get('password_require_numbers')}")
                    logger.info(f"  - require_special_chars: {security_settings.get('password_require_special_chars')}")
                else:
                    logger.warning("Security settings not found in database. Using strict defaults.")
                    # Use strict defaults if no settings found
                    security_settings = {
                        "password_min_length": 8,
                        "password_require_uppercase": True,
                        "password_require_lowercase": True,
                        "password_require_numbers": True,
                        "password_require_special_chars": False
                    }
            except Exception as e:
                logger.error(f"Error fetching security settings: {e}")
                # Use strict defaults on error
                security_settings = {
                    "password_min_length": 8,
                    "password_require_uppercase": True,
                    "password_require_lowercase": True,
                    "password_require_numbers": True,
                    "password_require_special_chars": False
                }
                logger.warning("Using default security settings due to error")

            # Validate new password against security settings
            is_valid, error_message = self.security_service.validate_password(new_password, security_settings)
            if not is_valid:
                logger.warning(f"Password validation failed for user {user_id}: {error_message}")
                return False, error_message

            # Hash new password
            new_hashed_password = self.security_service.get_password_hash(new_password)

            # Update password
            db = get_database()
            users_collection = db.users

            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "hashed_password": new_hashed_password,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            return result.matched_count > 0, None

        except Exception as e:
            logger.error(f"Error changing password: {e}")
            return False, "Internal server error"

    async def update_user_permissions(self, user_id: str, permissions: List[Permission]) -> bool:
        """Update user permissions"""
        try:
            db = get_database()
            users_collection = db.users

            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "permissions": permissions,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            return result.matched_count > 0

        except Exception as e:
            logger.error(f"Error updating user permissions: {e}")
            return False

    async def _increment_failed_login_attempts(self, user_id: str):
        """Increment failed login attempts and lock account if necessary"""
        try:
            db = get_database()
            users_collection = db.users

            user = await users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return

            failed_attempts = user.get("failed_login_attempts", 0) + 1
            update_data = {
                "failed_login_attempts": failed_attempts,
                "updated_at": datetime.utcnow()
            }

            # Lock account after 5 failed attempts for 30 minutes
            if failed_attempts >= 5:
                update_data["locked_until"] = datetime.utcnow() + timedelta(minutes=30)

            await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )

        except Exception as e:
            logger.error(f"Error incrementing failed login attempts: {e}")

    async def _reset_failed_login_attempts(self, user_id: str):
        """Reset failed login attempts"""
        try:
            db = get_database()
            users_collection = db.users

            await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "failed_login_attempts": 0,
                        "locked_until": None,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

        except Exception as e:
            logger.error(f"Error resetting failed login attempts: {e}")

    async def _update_last_login(self, user_id: str):
        """Update last login timestamp"""
        try:
            db = get_database()
            users_collection = db.users

            await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "last_login": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )

        except Exception as e:
            logger.error(f"Error updating last login: {e}")


# Global instance
user_service = UserService()
