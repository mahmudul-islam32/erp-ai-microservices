from app.database import get_database
from app.models import UserInDB, UserCreate, UserUpdate, UserResponse, UserRole, UserStatus, Permission
from app.models.settings import SettingsCategory
from app.services.security import SecurityService
from app.services.settings_service import settings_service
from app.services.notification_client import NotificationClient
from app.services.notification_helper import send_user_management_notification
from app.services.sales_service_client import sales_service_client
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
                
                # If user role is Customer, create customer record in sales service
                if user_data.role == UserRole.CUSTOMER and auth_token:
                    try:
                        # Prepare customer data with minimal required fields
                        # Create a default address
                        default_address = {
                            "street": "Not provided",
                            "city": "Not provided",
                            "state": "Not provided",
                            "postal_code": "00000",
                            "zip_code": "00000",
                            "country": "USA"
                        }
                        
                        customer_data = {
                            "first_name": user_data.first_name,
                            "last_name": user_data.last_name,
                            "email": user_data.email,
                            "phone": user_data.phone or "Not provided",
                            "billing_address": default_address,
                            "customer_type": "individual",
                            "payment_terms": "net_30"
                        }
                        
                        # Add company name if department is set
                        if user_data.department:
                            customer_data["company_name"] = user_data.department
                        
                        # Create customer in sales service
                        customer_response = await sales_service_client.create_customer(
                            customer_data, 
                            token=auth_token
                        )
                        
                        if customer_response:
                            logger.info(f"Customer record created successfully for user {user_data.email}")
                        else:
                            logger.warning(f"Failed to create customer record for user {user_data.email}. User account was created but customer record creation failed or customer already exists.")
                    except Exception as customer_error:
                        # Log error but don't fail user creation
                        logger.error(f"Error creating customer record for user {user_data.email}: {customer_error}")
                        logger.warning(f"User account was created but customer record creation failed. Customer record can be created manually later.")
                
                # Ensure 2FA field exists
                if "two_factor_enabled" not in created_user:
                    created_user["two_factor_enabled"] = False
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
                # Ensure 2FA fields exist with defaults
                if "two_factor_enabled" not in user:
                    user["two_factor_enabled"] = False
                if "two_factor_secret" not in user:
                    user["two_factor_secret"] = None
                if "two_factor_backup_codes" not in user:
                    user["two_factor_backup_codes"] = []
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
                # Ensure 2FA fields exist with defaults
                if "two_factor_enabled" not in user:
                    user["two_factor_enabled"] = False
                if "two_factor_secret" not in user:
                    user["two_factor_secret"] = None
                if "two_factor_backup_codes" not in user:
                    user["two_factor_backup_codes"] = []
                return UserInDB(**user)
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None

    async def update_user(self, user_id: str, user_update: UserUpdate, auth_token: Optional[str] = None) -> Optional[UserResponse]:
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
                    # Ensure 2FA field exists
                    if "two_factor_enabled" not in user:
                        user["two_factor_enabled"] = False
                    return UserResponse(**user)
                return None

            # Add updated timestamp
            update_data["updated_at"] = datetime.utcnow()

            # Get original user to check if they were a customer
            original_user = await users_collection.find_one({"_id": ObjectId(user_id)})
            original_role = original_user.get("role") if original_user else None
            original_email = original_user.get("email") if original_user else None

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
                
                # If user role is Customer, sync updates to customer record in sales service
                updated_role = updated_user.get("role")
                # Check if user is/was a customer (supports both enum and string formats)
                is_customer_after = (updated_role == UserRole.CUSTOMER.value or str(updated_role).lower() == "customer")
                is_customer_before = (original_role == UserRole.CUSTOMER.value or (original_role and str(original_role).lower() == "customer"))
                
                # Sync if user is currently a customer OR was a customer before (to handle email updates)
                if (is_customer_after or is_customer_before) and auth_token:
                    try:
                        # Use original email to find customer record (before potential email update)
                        # If email is being updated, we need to find customer by old email, then update to new email
                        search_email = original_email if original_email else updated_user.get("email")
                        if search_email:
                            # Get customer by email (using original email in case email is being changed)
                            customer = await sales_service_client.get_customer_by_email(search_email, token=auth_token)
                            if customer:
                                customer_id = customer.get("id") or customer.get("_id")
                                if not customer_id:
                                    logger.warning(f"Customer record found but missing ID for user {search_email}. User update completed but customer sync skipped.")
                                else:
                                    # Prepare customer update data from user update
                                    customer_update_data = {}
                                    if "first_name" in update_data:
                                        customer_update_data["first_name"] = update_data["first_name"]
                                    if "last_name" in update_data:
                                        customer_update_data["last_name"] = update_data["last_name"]
                                    if "phone" in update_data:
                                        customer_update_data["phone"] = update_data["phone"]
                                    if "department" in update_data:
                                        customer_update_data["company_name"] = update_data["department"]
                                    # Handle email update - if email is being updated, update customer email too
                                    if "email" in update_data:
                                        customer_update_data["email"] = update_data["email"]
                                    # Handle status update - sync user status to customer status
                                    if "status" in update_data:
                                        user_status = update_data["status"]
                                        # Map user status to customer status
                                        # UserStatus: ACTIVE, INACTIVE, SUSPENDED, PENDING
                                        # CustomerStatus: ACTIVE, INACTIVE, SUSPENDED, PROSPECT
                                        if user_status == "inactive":
                                            customer_update_data["status"] = "inactive"
                                        elif user_status == "active":
                                            customer_update_data["status"] = "active"
                                        elif user_status == "suspended":
                                            customer_update_data["status"] = "suspended"
                                        # PENDING in user status doesn't map directly, but we'll use INACTIVE
                                        elif user_status == "pending":
                                            customer_update_data["status"] = "inactive"
                                    
                                    # Only update if there are relevant fields to sync
                                    if customer_update_data:
                                        customer_response = await sales_service_client.update_customer(
                                            str(customer_id),
                                            customer_update_data,
                                            token=auth_token
                                        )
                                        if customer_response:
                                            logger.info(f"Customer record synced successfully for user {search_email}")
                                        else:
                                            logger.warning(f"Failed to sync customer record for user {search_email}")
                                    else:
                                        logger.info(f"No customer fields to sync for user {search_email}")
                            else:
                                logger.warning(f"Customer record not found for user {search_email}. User update completed but customer sync skipped.")
                    except Exception as customer_sync_error:
                        # Log error but don't fail user update
                        logger.error(f"Error syncing customer record for user update: {customer_sync_error}")
                        logger.warning(f"User update completed but customer record sync failed. Customer record can be updated manually.")
                
                # Ensure 2FA field exists
                if "two_factor_enabled" not in updated_user:
                    updated_user["two_factor_enabled"] = False
                return UserResponse(**updated_user)
            
            return None

        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise

    async def delete_user(self, user_id: str, auth_token: Optional[str] = None) -> bool:
        """Delete user (soft delete by setting status to inactive) and sync to sales service"""
        try:
            db = get_database()
            users_collection = db.users

            # Get user info before deletion to check role and email
            user_before_delete = await users_collection.find_one({"_id": ObjectId(user_id)})
            user_email = None
            user_role = None
            if user_before_delete:
                user_email = user_before_delete.get("email")
                user_role = user_before_delete.get("role")

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
                    if deactivated_user:
                        user_name = f"{deactivated_user.first_name} {deactivated_user.last_name}".strip()
                        if not user_email:
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
                        subject_user_email=user_email or "",
                        details="User account has been deactivated",
                        priority="high",
                        auth_token=auth_token
                    )
                except Exception as e:
                    logger.warning(f"Failed to send notification for user deletion: {e}")

                # If user role is Customer, sync deletion to customer record in sales service
                if user_role and (user_role == UserRole.CUSTOMER.value or str(user_role).lower() == "customer") and auth_token and user_email:
                    try:
                        # Get customer by email
                        customer = await sales_service_client.get_customer_by_email(user_email, token=auth_token)
                        if customer:
                            customer_id = customer.get("id") or customer.get("_id")
                            if customer_id:
                                # Delete customer (soft delete)
                                delete_success = await sales_service_client.delete_customer(str(customer_id), token=auth_token)
                                if delete_success:
                                    logger.info(f"Customer record deleted successfully for user {user_email}")
                                else:
                                    logger.warning(f"Failed to delete customer record for user {user_email}")
                            else:
                                logger.warning(f"Customer record found but missing ID for user {user_email}. User deletion completed but customer sync skipped.")
                        else:
                            logger.warning(f"Customer record not found for user {user_email}. User deletion completed but customer sync skipped.")
                    except Exception as customer_sync_error:
                        # Log error but don't fail user deletion
                        logger.error(f"Error syncing customer deletion for user: {customer_sync_error}")
                        logger.warning(f"User deletion completed but customer record deletion sync failed. Customer record can be deleted manually.")

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
                # Ensure 2FA field exists
                if "two_factor_enabled" not in user:
                    user["two_factor_enabled"] = False
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

            # Check if account is locked (and clear if lockout expired)
            if user.locked_until:
                if user.locked_until > datetime.utcnow():
                    # Account is still locked
                    return None
                else:
                    # Lockout expired, clear it
                    await self._reset_failed_login_attempts(user.id)
                    # Reload user to get updated lockout status
                    user = await self.get_user_by_email(email)

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

    async def update_user_2fa_secret(self, user_id: str, secret: str, backup_codes: List[str]) -> bool:
        """Update user 2FA secret (during setup, before enabling)"""
        try:
            db = get_database()
            users_collection = db.users
            
            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "two_factor_secret": secret,
                        "two_factor_backup_codes": backup_codes,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating 2FA secret: {e}")
            return False
    
    async def enable_2fa(self, user_id: str, secret: str, backup_codes: List[str]) -> bool:
        """Enable 2FA for user"""
        try:
            db = get_database()
            users_collection = db.users
            
            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "two_factor_enabled": True,
                        "two_factor_secret": secret,
                        "two_factor_backup_codes": backup_codes,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error enabling 2FA: {e}")
            return False
    
    async def disable_2fa(self, user_id: str) -> bool:
        """Disable 2FA for user"""
        try:
            db = get_database()
            users_collection = db.users
            
            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "two_factor_enabled": False,
                        "two_factor_secret": None,
                        "two_factor_backup_codes": [],
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error disabling 2FA: {e}")
            return False
    
    async def update_user_backup_codes(self, user_id: str, backup_codes: List[str]) -> bool:
        """Update user backup codes"""
        try:
            db = get_database()
            users_collection = db.users
            
            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "two_factor_backup_codes": backup_codes,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating backup codes: {e}")
            return False

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
            from app.services.settings_service import settings_service
            from app.models.settings import SettingsCategory
            
            db = get_database()
            users_collection = db.users

            user = await users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return

            # Get security settings
            max_attempts = 5
            lockout_duration_minutes = 30
            try:
                security_setting = await settings_service.get_settings_by_category(SettingsCategory.SECURITY)
                if security_setting and security_setting.security:
                    security_dict = security_setting.security
                    if isinstance(security_dict, dict):
                        max_attempts = security_dict.get("max_login_attempts", 5)
                        lockout_duration_minutes = security_dict.get("account_lockout_duration_minutes", 30)
                    else:
                        max_attempts = getattr(security_dict, "max_login_attempts", 5)
                        lockout_duration_minutes = getattr(security_dict, "account_lockout_duration_minutes", 30)
            except Exception as e:
                logger.warning(f"Error getting security settings for lockout: {e}")

            failed_attempts = user.get("failed_login_attempts", 0) + 1
            update_data = {
                "failed_login_attempts": failed_attempts,
                "updated_at": datetime.utcnow()
            }

            # Lock account if max attempts reached
            if failed_attempts >= max_attempts:
                lockout_until = datetime.utcnow() + timedelta(minutes=lockout_duration_minutes)
                update_data["locked_until"] = lockout_until
                logger.warning(f"Account locked for user {user_id} until {lockout_until} after {failed_attempts} failed attempts")

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
