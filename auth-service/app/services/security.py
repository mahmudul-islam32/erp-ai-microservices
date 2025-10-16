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
        """Truncate password to 72 bytes for bcrypt"""
        # bcrypt has a 72 byte limit
        # Truncate at byte level, then find the last valid UTF-8 boundary
        password_bytes = password.encode('utf-8')
        if len(password_bytes) <= 72:
            return password
        
        # Truncate to 72 bytes
        truncated = password_bytes[:72]
        
        # Find the last valid UTF-8 character boundary
        # UTF-8 continuation bytes start with 10xxxxxx (0x80-0xBF)
        while len(truncated) > 0 and (truncated[-1] & 0xC0) == 0x80:
            truncated = truncated[:-1]
        
        try:
            return truncated.decode('utf-8')
        except UnicodeDecodeError:
            # If still invalid, just use the first 72 bytes as-is
            return password[:72]
    
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
                Permission.AI_ACCESS
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
