from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.external_services import auth_service, InventoryService
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)  # Make it optional to support cookies
security_optional = HTTPBearer(auto_error=False)


def get_inventory_service() -> InventoryService:
    """Get inventory service instance"""
    return InventoryService()


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """Get current authenticated user from cookies first, then header"""
    try:
        token = None
        
        # First try to get token from cookies (for frontend)
        token = request.cookies.get("access_token")
        
        # If not in cookies, try from Authorization header (for API clients)
        if not token and credentials:
            token = credentials.credentials
        elif not token:
            # Try to get from authorization header directly
            authorization = request.headers.get("Authorization")
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ", 1)[1]
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No authentication token provided",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
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
        user_role = current_user.get("role", "")
        
        # Allow admin access to everything
        if user_role == "admin":
            return current_user
        
        # Check if user has any of the required permissions
        if not any(perm in user_permissions for perm in required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required one of: {required_permissions}"
            )
        
        return current_user
    
    return permission_checker


def require_sales_access():
    """Require sales access permissions - more lenient for reading"""
    def permission_checker(current_user: Dict[str, Any] = Depends(get_current_active_user)):
        user_permissions = current_user.get("permissions", [])
        user_role = current_user.get("role", "")
        
        # Allow admin access
        if user_role == "admin":
            return current_user
            
        # Check for any sales-related permission or general read access
        sales_permissions = [
            "sales:read", "sales:create", "sales:update", "sales:delete",
            "read", "all"  # More general permissions
        ]
        
        if not any(perm in user_permissions for perm in sales_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions for sales access. User permissions: {user_permissions}"
            )
        
        return current_user
    
    return permission_checker


def require_sales_write():
    """Require sales write permissions"""
    def permission_checker(current_user: Dict[str, Any] = Depends(get_current_active_user)):
        user_permissions = current_user.get("permissions", [])
        user_role = current_user.get("role", "")
        
        # Allow admin access
        if user_role == "admin":
            return current_user
            
        # Check for write permissions
        write_permissions = [
            "sales:create", "sales:update", "sales:delete",
            "write", "all"  # More general permissions
        ]
        
        if not any(perm in user_permissions for perm in write_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient write permissions for sales. User permissions: {user_permissions}"
            )
        
        return current_user
    
    return permission_checker


async def get_token_from_request(request: Request) -> Optional[str]:
    """Extract token from request headers or cookies"""
    # First try cookies
    token = request.cookies.get("access_token")
    if token:
        return token
    
    # Then try Authorization header
    authorization: str = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ", 1)[1]
    
    return None


async def get_optional_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[Dict[str, Any]]:
    """Get current user but don't raise error if not authenticated"""
    try:
        token = None
        
        # First try cookies
        token = request.cookies.get("access_token")
        
        # Then try Authorization header
        if not token and credentials:
            token = credentials.credentials
        elif not token:
            authorization = request.headers.get("Authorization")
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ", 1)[1]
        
        if not token:
            return None
            
        user_data = await auth_service.verify_token(token)
        return user_data
    except Exception as e:
        logger.warning(f"Optional authentication failed: {e}")
        return None


def require_sales_access_flexible():
    """More flexible sales access that allows debugging"""
    def permission_checker(current_user: Dict[str, Any] = Depends(get_current_active_user)):
        user_permissions = current_user.get("permissions", [])
        user_role = current_user.get("role", "")
        
        logger.info(f"User permissions check - Role: {user_role}, Permissions: {user_permissions}")
        
        # Allow admin access
        if user_role in ["admin", "super_admin"]:
            return current_user
            
        # Check for any sales-related permission or general access
        sales_permissions = [
            "sales:read", "sales:create", "sales:update", "sales:delete",
            "read", "write", "all", "*"  # More general permissions
        ]
        
        if any(perm in user_permissions for perm in sales_permissions):
            return current_user
            
        # If no specific permissions, but user is authenticated, log and allow (for debugging)
        if current_user.get("id"):
            logger.warning(f"User {current_user.get('email')} has no sales permissions but allowing access for debugging")
            return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions for sales access. User role: {user_role}, permissions: {user_permissions}"
        )
    
    return permission_checker
