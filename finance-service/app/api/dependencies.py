from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.config import settings
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify JWT token and return user data"""
    token = credentials.credentials
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        permissions = payload.get("permissions", [])
        
        logger.info(f"Auth successful for user: {email}, role: {role}, permissions: {permissions[:5]}...")
        
        if user_id is None or email is None:
            raise credentials_exception
        
        return {
            "id": user_id,
            "email": email,
            "role": role,
            "permissions": permissions
        }
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise credentials_exception


def require_finance_access():
    """Dependency to require finance read access"""
    async def check_access(current_user: Dict = Depends(get_current_user)):
        permissions = current_user.get("permissions", [])
        logger.info(f"Checking finance access. User permissions: {permissions}")
        logger.info("Required: finance:read, finance:admin, or admin")
        
        has_access = any(p in ["finance:read", "finance:admin", "admin"] for p in permissions)
        logger.info(f"Has access: {has_access}")
        
        if not has_access:
            logger.warning(f"Access denied for user {current_user.get('email')}. Permissions: {permissions}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions for finance access. You have: {permissions}"
            )
        return current_user
    return check_access


def require_finance_write():
    """Dependency to require finance write access"""
    async def check_access(current_user: Dict = Depends(get_current_user)):
        permissions = current_user.get("permissions", [])
        if not any(p in ["finance:create", "finance:update", "finance:admin", "admin"] for p in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for finance write access"
            )
        return current_user
    return check_access


def require_finance_admin():
    """Dependency to require finance admin access"""
    async def check_access(current_user: Dict = Depends(get_current_user)):
        permissions = current_user.get("permissions", [])
        if not any(p in ["finance:admin", "admin"] for p in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for finance admin access"
            )
        return current_user
    return check_access

