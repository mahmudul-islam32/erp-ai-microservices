from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.config import settings
from app.models import TokenData, UserRole, Permission
from typing import Optional, List
import secrets

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)

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
    def get_role_permissions(role: UserRole) -> List[Permission]:
        """Get default permissions for a role"""
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
