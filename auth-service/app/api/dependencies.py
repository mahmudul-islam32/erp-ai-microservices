from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services import SecurityService, user_service
from app.models import TokenData, UserInDB, Permission, UserRole
from typing import Optional, List, Tuple
import logging

logger = logging.getLogger(__name__)


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
                
                # Check if user has active sessions after refresh
                from app.services.session_service import SessionService
                session_service = SessionService()
                user_sessions = await session_service.get_user_sessions(str(user.id), active_only=True)
                
                if not user_sessions:
                    # No active sessions - clear cookies and reject
                    response.delete_cookie(key="access_token", path="/")
                    response.delete_cookie(key="refresh_token", path="/")
                    
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Session has been terminated. Please log in again.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                return user
            else:
                raise credentials_exception
        
        user = await user_service.get_user_by_id(token_data.user_id)
        if user is None:
            raise credentials_exception
        
        # Check session timeout - get user's active session and check last activity
        from app.services.session_service import SessionService
        from app.models.settings import SettingsCategory
        from app.services.settings_service import settings_service
        from datetime import datetime, timedelta
        
        session_service = SessionService()
        
        # Get user's active sessions
        user_sessions = await session_service.get_user_sessions(str(user.id), active_only=True)
        
        # Check if user has any active sessions - if not, reject the request
        if not user_sessions:
            # No active sessions - user has been logged out (sessions terminated)
            response.delete_cookie(key="access_token", path="/")
            response.delete_cookie(key="refresh_token", path="/")
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been terminated. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get the most recent active session
        active_session = user_sessions[0] if user_sessions else None
        
        if active_session and active_session.last_activity:
            # Get session timeout from security settings
            session_timeout_minutes = None
            try:
                security_setting = await settings_service.get_settings_by_category(SettingsCategory.SECURITY)
                if security_setting and security_setting.security:
                    security_dict = security_setting.security
                    if isinstance(security_dict, dict):
                        session_timeout_minutes = security_dict.get("session_timeout_minutes")
                    else:
                        session_timeout_minutes = getattr(security_dict, "session_timeout_minutes", None)
            except Exception as e:
                logger.warning(f"Error getting session timeout from settings: {e}")
            
            # If session timeout is configured, check if session has expired due to inactivity
            if session_timeout_minutes:
                time_since_activity = datetime.utcnow() - active_session.last_activity
                timeout_delta = timedelta(minutes=session_timeout_minutes)
                
                if time_since_activity > timeout_delta:
                    # Session expired due to inactivity - terminate session and log out user
                    await session_service.terminate_session(str(active_session.id), str(user.id))
                    
                    # Clear cookies
                    response.delete_cookie(key="access_token", path="/")
                    response.delete_cookie(key="refresh_token", path="/")
                    
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=f"Session expired due to inactivity. Please log in again.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
            else:
                # Update last activity timestamp
                await session_service.update_last_activity(str(active_session.id))
        
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
        # Super admins have all permissions - bypass check
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user
        
        # Check if user has all required permissions
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
        # Super admins have all permissions - bypass check
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user
        
        # Check if user has any of the required permissions
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
