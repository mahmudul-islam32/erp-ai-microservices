from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services import SecurityService, user_service
from app.models import TokenData, UserInDB, Permission
from typing import Optional, List, Tuple


def get_authorization_scheme_param(authorization_header: str) -> Tuple[str, str]:
    """Parse the Authorization header and return the scheme and parameter."""
    if not authorization_header:
        return "", ""
    parts = authorization_header.split()
    if len(parts) != 2:
        return "", ""
    return parts[0], parts[1]

security = HTTPBearer(auto_error=False)
security_service = SecurityService()


async def get_current_user(
    request: Request, 
    response: Response,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> UserInDB:
    """Get current authenticated user from cookies first, then header"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # First try to get token from cookies
        token = request.cookies.get("access_token")
        
        # If not in cookies, try from Authorization header
        if not token and credentials:
            token = credentials.credentials
        elif not token:
            # Try to get from authorization header directly
            authorization = request.headers.get("Authorization")
            if authorization:
                scheme, token = get_authorization_scheme_param(authorization)
                if scheme.lower() != "bearer":
                    raise credentials_exception
            else:
                raise credentials_exception
        
        # Verify the token
        token_data = security_service.verify_token(token)
        
        if token_data is None:
            # If token is invalid, try to refresh using refresh token
            refresh_token = request.cookies.get("refresh_token")
            if refresh_token:
                # Verify refresh token
                refresh_data = security_service.verify_token(refresh_token, token_type="refresh")
                if not refresh_data:
                    # Clear invalid cookies
                    response.delete_cookie(key="access_token", path="/")
                    response.delete_cookie(key="refresh_token", path="/")
                    raise credentials_exception
                    
                # Get user from refresh token
                user = await user_service.get_user_by_id(refresh_data.user_id)
                if not user:
                    response.delete_cookie(key="access_token", path="/")
                    response.delete_cookie(key="refresh_token", path="/")
                    raise credentials_exception
                    
                # Create new access token
                from datetime import timedelta
                from app.config import settings
                
                access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
                new_access_token = security_service.create_access_token(
                    data={
                        "sub": str(user.id),
                        "email": user.email,
                        "role": user.role,
                        "permissions": [p.value for p in user.permissions]
                    },
                    expires_delta=access_token_expires
                )
                
                # Update the cookie
                response.set_cookie(
                    key="access_token",
                    value=new_access_token,
                    httponly=True,
                    secure=False if settings.environment == "development" else True,  # Allow non-HTTPS in dev
                    samesite="lax",
                    max_age=settings.access_token_expire_minutes * 60,
                    path="/"
                )
                
                return user
            else:
                raise credentials_exception
        
        user = await user_service.get_user_by_id(token_data.user_id)
        if user is None:
            raise credentials_exception
        
        return user
    except HTTPException:
        raise
    except Exception:
        raise credentials_exception


async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    """Get current active user"""
    if current_user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_permissions(required_permissions: List[Permission]):
    """Dependency to check if user has required permissions"""
    def permission_checker(current_user: UserInDB = Depends(get_current_active_user)):
        if not security_service.check_all_permissions(current_user.permissions, required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return permission_checker


def require_any_permission(required_permissions: List[Permission]):
    """Dependency to check if user has any of the required permissions"""
    def permission_checker(current_user: UserInDB = Depends(get_current_active_user)):
        if not security_service.check_any_permission(current_user.permissions, required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return permission_checker


def require_role(required_roles: List[str]):
    """Dependency to check if user has required role"""
    def role_checker(current_user: UserInDB = Depends(get_current_active_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker
