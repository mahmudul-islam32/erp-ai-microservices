from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.external_services import auth_service
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        user_data = await auth_service.verify_token(token)
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Get current active user"""
    if current_user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_permissions(required_permissions: list):
    """Dependency to require specific permissions"""
    def permission_checker(current_user: Dict[str, Any] = Depends(get_current_active_user)):
        user_permissions = current_user.get("permissions", [])
        
        # Check if user has any of the required permissions
        if not any(perm in user_permissions for perm in required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        return current_user
    
    return permission_checker


def require_any_permission(required_permissions: list):
    """Dependency to require any of the specified permissions"""
    def permission_checker(current_user: Dict[str, Any] = Depends(get_current_active_user)):
        user_permissions = current_user.get("permissions", [])
        
        # Check if user has any of the required permissions
        if not any(perm in user_permissions for perm in required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        return current_user
    
    return permission_checker


def require_sales_access():
    """Require sales access permissions"""
    return require_any_permission([
        "sales:read", "sales:create", "sales:update", "sales:delete"
    ])


def require_sales_write():
    """Require sales write permissions"""
    return require_any_permission([
        "sales:create", "sales:update", "sales:delete"
    ])


async def get_token_from_request(request: Request) -> Optional[str]:
    """Extract token from request headers"""
    authorization: str = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ", 1)[1]
    return None
