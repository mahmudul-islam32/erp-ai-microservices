import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.config import settings
from app.models import TokenData, UserRole, Permission
from typing import Optional, List
import secrets


class SecurityService:
    # Class variable to store custom role permissions (in-memory for now)
    _custom_role_permissions: dict = {}
    
    @staticmethod
    def _truncate_password(password: str) -> str:
        """Truncate a password to bcrypt's 72-byte limit without splitting a character."""
        encoded = password.encode('utf-8')
        if len(encoded) <= 72:
            return password
        # errors='ignore' drops a trailing partial character rather than raising.
        return encoded[:72].decode('utf-8', errors='ignore')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            # Truncate password to 72 bytes (bcrypt limitation)
            password_bytes = plain_password.encode('utf-8')[:72]
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(password_bytes, hashed_bytes)
        except Exception as e:
            print(f"Password verification error: {e}")
            return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        # Truncate password to 72 bytes (bcrypt limitation)
        password_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt

    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Optional[TokenData]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            
            # Check token type
            if payload.get("type") != token_type:
                return None
            
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            role: str = payload.get("role")
            permissions: List[str] = payload.get("permissions", [])
            
            if user_id is None or email is None:
                return None
            
            token_data = TokenData(
                user_id=user_id,
                email=email,
                role=UserRole(role) if role else None,
                permissions=[Permission(p) for p in permissions if p in Permission.__members__.values()]
            )
            return token_data
        except JWTError:
            return None

    @staticmethod
    def generate_reset_token() -> str:
        """Generate a secure random token for password reset"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def set_role_permissions(role: UserRole, permissions: List[Permission]) -> None:
        """Set custom permissions for a role (Super Admin only)"""
        SecurityService._custom_role_permissions[role.value] = permissions
    
    @staticmethod
    def get_role_permissions(role: UserRole) -> List[Permission]:
        """Get permissions for a role (returns custom if set, otherwise default)"""
        # Check if custom permissions are set
        if role.value in SecurityService._custom_role_permissions:
            return SecurityService._custom_role_permissions[role.value]
        
        # Otherwise return default permissions
        role_permissions = {
            UserRole.SUPER_ADMIN: [p for p in Permission],  # All permissions
            UserRole.ADMIN: [
                Permission.USER_CREATE, Permission.USER_READ, Permission.USER_UPDATE,
                Permission.INVENTORY_CREATE, Permission.INVENTORY_READ, Permission.INVENTORY_UPDATE,
                Permission.SALES_CREATE, Permission.SALES_READ, Permission.SALES_UPDATE,
                Permission.FINANCE_CREATE, Permission.FINANCE_READ, Permission.FINANCE_UPDATE,
                Permission.HR_CREATE, Permission.HR_READ, Permission.HR_UPDATE,
                Permission.AI_ACCESS,
                Permission.SETTINGS_READ, Permission.SETTINGS_UPDATE
            ],
            UserRole.MANAGER: [
                Permission.USER_READ,
                Permission.INVENTORY_READ, Permission.INVENTORY_UPDATE,
                Permission.SALES_CREATE, Permission.SALES_READ, Permission.SALES_UPDATE,
                Permission.FINANCE_READ, Permission.FINANCE_UPDATE,
                Permission.HR_READ, Permission.HR_UPDATE,
                Permission.AI_ACCESS
            ],
            UserRole.EMPLOYEE: [
                Permission.USER_READ,
                Permission.INVENTORY_READ,
                Permission.SALES_READ, Permission.SALES_CREATE,
                Permission.FINANCE_READ,
                Permission.HR_READ
            ],
            UserRole.CUSTOMER: [
                Permission.SALES_READ
            ],
            UserRole.VENDOR: [
                Permission.INVENTORY_READ,
                Permission.SALES_READ
            ]
        }
        return role_permissions.get(role, [])

    @staticmethod
    def check_permission(user_permissions: List[Permission], required_permission: Permission) -> bool:
        """Check if user has required permission"""
        return required_permission in user_permissions

    @staticmethod
    def check_any_permission(user_permissions: List[Permission], required_permissions: List[Permission]) -> bool:
        """Check if user has any of the required permissions"""
        return any(perm in user_permissions for perm in required_permissions)

    @staticmethod
    def check_all_permissions(user_permissions: List[Permission], required_permissions: List[Permission]) -> bool:
        """Check if user has all required permissions"""
        return all(perm in user_permissions for perm in required_permissions)

    @staticmethod
    def validate_password(password: str, security_settings: Optional[dict] = None) -> tuple:
        """
        Validate password against security settings.
        Returns (is_valid, error_message)
        """
        # If no settings provided, use strict defaults
        if not security_settings:
            security_settings = {
                "password_min_length": 8,
                "password_require_uppercase": True,
                "password_require_lowercase": True,
                "password_require_numbers": True,
                "password_require_special_chars": False
            }

        # Get settings - ensure boolean values are properly handled
        min_length = security_settings.get("password_min_length", 8)
        # Explicitly check for True/False, not just truthy/falsy
        require_uppercase = security_settings.get("password_require_uppercase") is True
        require_lowercase = security_settings.get("password_require_lowercase") is True
        require_numbers = security_settings.get("password_require_numbers") is True
        require_special_chars = security_settings.get("password_require_special_chars") is True

        # Check minimum length
        if len(password) < min_length:
            return False, f"Password must be at least {min_length} characters long"

        # Check for uppercase
        if require_uppercase and not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"

        # Check for lowercase
        if require_lowercase and not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"

        # Check for numbers
        if require_numbers and not any(c.isdigit() for c in password):
            return False, "Password must contain at least one number"

        # Check for special characters
        if require_special_chars:
            special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
            if not any(c in special_chars for c in password):
                return False, "Password must contain at least one special character (!@#$%^&*)"

        return True, None
