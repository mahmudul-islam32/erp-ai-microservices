from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from app.models import (
    UserLogin, UserCreate, UserUpdate, UserResponse, Token, 
    RefreshTokenRequest, ChangePasswordRequest,
    ResetPasswordRequest, ResetPasswordConfirm
)
from app.models.settings import SettingsCategory
from app.services import user_service, SecurityService
from app.services.session_service import SessionService
from app.services.audit_log_service import AuditLogService
from app.services.settings_service import settings_service
from app.api.dependencies import get_current_active_user
from datetime import timedelta, datetime
from app.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
security_service = SecurityService()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await user_service.create_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/login")
async def login(user_credentials: UserLogin, response: Response, request: Request):
    """Login user and return access tokens"""
    session_service = SessionService()
    audit_log_service = AuditLogService()
    
    # Get client IP and user agent
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # Check if account is locked before authentication
        user_check = await user_service.get_user_by_email(user_credentials.email)
        if user_check:
            # Check if account is locked
            if user_check.locked_until and user_check.locked_until > datetime.utcnow():
                lockout_remaining = (user_check.locked_until - datetime.utcnow()).total_seconds() / 60
                minutes = int(lockout_remaining)
                seconds = int((lockout_remaining - minutes) * 60)
                
                await audit_log_service.create_audit_log(
                    user_id=str(user_check.id) if user_check.id else "unknown",
                    user_email=user_credentials.email,
                    action="login_failed",
                    resource="auth",
                    ip_address=client_ip,
                    user_agent=user_agent,
                    status="failure",
                    details={"reason": "Account locked", "locked_until": user_check.locked_until.isoformat()}
                )
                
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail=f"Account is locked due to too many failed login attempts. Please try again in {minutes} minute(s) and {seconds} second(s).",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        # Authenticate user
        user = await user_service.authenticate_user(
            user_credentials.email, 
            user_credentials.password
        )
        
        if not user:
            # Check if account was just locked
            user_check = await user_service.get_user_by_email(user_credentials.email)
            if user_check and user_check.locked_until and user_check.locked_until > datetime.utcnow():
                lockout_remaining = (user_check.locked_until - datetime.utcnow()).total_seconds() / 60
                minutes = int(lockout_remaining)
                seconds = int((lockout_remaining - minutes) * 60)
                
                await audit_log_service.create_audit_log(
                    user_id=str(user_check.id) if user_check.id else "unknown",
                    user_email=user_credentials.email,
                    action="login_failed",
                    resource="auth",
                    ip_address=client_ip,
                    user_agent=user_agent,
                    status="failure",
                    details={"reason": "Account locked after max attempts", "locked_until": user_check.locked_until.isoformat()}
                )
                
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail=f"Account has been locked due to too many failed login attempts. Please try again in {minutes} minute(s) and {seconds} second(s).",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Log failed login attempt
            await audit_log_service.create_audit_log(
                user_id=str(user_check.id) if user_check and user_check.id else "unknown",
                user_email=user_credentials.email,
                action="login_failed",
                resource="auth",
                ip_address=client_ip,
                user_agent=user_agent,
                status="failure",
                details={"reason": "Invalid credentials"}
            )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if 2FA is required
        requires_2fa = False
        try:
            security_setting = await settings_service.get_settings_by_category(SettingsCategory.SECURITY)
            if security_setting and security_setting.security:
                security_dict = security_setting.security
                # Handle both dict and Pydantic model
                if isinstance(security_dict, dict):
                    requires_2fa = security_dict.get("require_two_factor_auth", False)
                else:
                    # It's a Pydantic model
                    requires_2fa = getattr(security_dict, "require_two_factor_auth", False)
        except Exception as e:
            logger.warning(f"Error checking 2FA requirement: {e}")
        
        # Log for debugging
        logger.info(f"User {user.email} - 2FA enabled: {user.two_factor_enabled}, System requires 2FA: {requires_2fa}")

        # Only require 2FA if user has actually enabled it
        # If system requires 2FA but user hasn't set it up yet, allow login but flag it
        if user.two_factor_enabled:
            # User has 2FA enabled, require code
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "requires_2fa": True,
                    "message": "Two-factor authentication required",
                    "email": user.email
                }
            )
        elif requires_2fa and not user.two_factor_enabled:
            # System requires 2FA but user hasn't set it up yet
            # Allow login but flag that 2FA setup is recommended
            logger.info(f"User {user.email} - System requires 2FA but user hasn't set it up yet. Allowing login but flagging for setup.")
            # Continue with normal login - we'll add a flag in the response

        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = security_service.create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
                "permissions": [p.value for p in user.permissions]
            },
            expires_delta=access_token_expires
        )

        # Create refresh token
        refresh_token = security_service.create_refresh_token(
            data={
                "sub": str(user.id),
                "email": user.email
            }
        )
        
        # Create session - use session timeout from security settings for expiration
        # But we'll also track last_activity and enforce timeout based on inactivity
        session_expires_minutes = 30 * 24 * 60  # Default: 30 days (long expiration for session record)
        try:
            security_setting = await settings_service.get_settings_by_category(SettingsCategory.SECURITY)
            if security_setting and security_setting.security:
                security_dict = security_setting.security
                if isinstance(security_dict, dict):
                    # Use session timeout for tracking, but keep long expiration for session record
                    # The actual timeout enforcement happens in get_current_user based on last_activity
                    pass
        except Exception as e:
            logger.warning(f"Error getting session timeout from settings: {e}")
        
        await session_service.create_session(
            user_id=str(user.id),
            user_email=user.email,
            ip_address=client_ip,
            user_agent=user_agent,
            expires_in_minutes=session_expires_minutes
        )
        
        # Log successful login
        await audit_log_service.create_audit_log(
            user_id=str(user.id),
            user_email=user.email,
            action="login",
            resource="auth",
            ip_address=client_ip,
            user_agent=user_agent,
            status="success"
        )
        
        # Set HTTP-only secure cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False if settings.environment == "development" else True,  # Allow non-HTTPS in dev
            samesite="lax",
            max_age=settings.access_token_expire_minutes * 60,
            path="/"
        )
        
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False if settings.environment == "development" else True,  # Allow non-HTTPS in dev
            samesite="lax",
            max_age=7 * 24 * 60 * 60,  # 1 week
            path="/"
        )

        # Still return tokens in response (optional, can be removed for extra security)
        token_response = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60
        }
        
        # If system requires 2FA but user hasn't set it up, add a flag
        if requires_2fa and not user.two_factor_enabled:
            token_response["requires_2fa_setup"] = True
            token_response["message"] = "Two-factor authentication setup is required. Please set it up in your security settings."
        
        return token_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/login/oauth", response_model=Token)
async def login_oauth(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible login endpoint"""
    try:
        # Authenticate user
        user = await user_service.authenticate_user(
            form_data.username,  # OAuth2 uses username field for email
            form_data.password
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = security_service.create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
                "permissions": [p.value for p in user.permissions]
            },
            expires_delta=access_token_expires
        )

        # Create refresh token
        refresh_token = security_service.create_refresh_token(
            data={
                "sub": str(user.id),
                "email": user.email
            }
        )

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(request: Request, response: Response, refresh_request: RefreshTokenRequest = None):
    """Refresh access token using refresh token from cookie or body"""
    try:
        # Try to get refresh token from cookies first
        refresh_token = request.cookies.get("refresh_token")
        
        # If no cookie, fallback to request body (for backward compatibility)
        if not refresh_token and refresh_request:
            refresh_token = refresh_request.refresh_token
            
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not provided",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Verify refresh token
        token_data = security_service.verify_token(refresh_token, "refresh")
        
        if not token_data:
            # Clear invalid cookies
            response.delete_cookie(key="refresh_token", path="/")
            response.delete_cookie(key="access_token", path="/")
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get user
        user = await user_service.get_user_by_id(token_data.user_id)
        if not user:
            # Clear cookies
            response.delete_cookie(key="refresh_token", path="/")
            response.delete_cookie(key="access_token", path="/")
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if user has any active sessions - if not, reject the refresh
        from app.services.session_service import SessionService
        session_service = SessionService()
        user_sessions = await session_service.get_user_sessions(str(user.id), active_only=True)
        
        if not user_sessions:
            # No active sessions - user has been logged out (sessions terminated)
            response.delete_cookie(key="access_token", path="/")
            response.delete_cookie(key="refresh_token", path="/")
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been terminated. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create new access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = security_service.create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
                "permissions": [p.value for p in user.permissions]
            },
            expires_delta=access_token_expires
        )

        # Create new refresh token
        new_refresh_token = security_service.create_refresh_token(
            data={
                "sub": str(user.id),
                "email": user.email
            }
        )
        
        # Update HTTP-only secure cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False if settings.environment == "development" else True,  # Allow non-HTTPS in dev
            samesite="lax",
            max_age=settings.access_token_expire_minutes * 60,
            path="/"
        )
        
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=False if settings.environment == "development" else True,  # Allow non-HTTPS in dev
            samesite="lax",
            max_age=7 * 24 * 60 * 60,  # 1 week
            path="/"
        )

        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user=Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        department=current_user.department,
        phone=current_user.phone,
        status=current_user.status,
        permissions=current_user.permissions,
        profile_image=getattr(current_user, 'profile_image', None),
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login=current_user.last_login,
        two_factor_enabled=getattr(current_user, 'two_factor_enabled', False)
    )


@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user=Depends(get_current_active_user)
):
    """Update current user's profile"""
    try:
        # Users can only update their own profile with limited fields
        # Restrict role and status updates
        if user_update.role is not None or user_update.status is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update role or status for own profile"
            )
        
        # Update user profile
        updated_user = await user_service.update_user(str(current_user.id), user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return updated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    request: Request,
    current_user=Depends(get_current_active_user)
):
    """Change user password"""
    audit_log_service = AuditLogService()
    
    # Get client IP and user agent
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        success, error_message = await user_service.change_password(
            str(current_user.id),
            password_data.current_password,
            password_data.new_password
        )
        
        if not success:
            # Log failed password change
            await audit_log_service.create_audit_log(
                user_id=str(current_user.id),
                user_email=current_user.email,
                action="password_change",
                resource="user",
                resource_id=str(current_user.id),
                ip_address=client_ip,
                user_agent=user_agent,
                status="failure",
                details={"reason": error_message or "Invalid current password"}
            )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message or "Invalid current password"
            )
        
        # Log successful password change
        await audit_log_service.create_audit_log(
            user_id=str(current_user.id),
            user_email=current_user.email,
            action="password_change",
            resource="user",
            resource_id=str(current_user.id),
            ip_address=client_ip,
            user_agent=user_agent,
            status="success"
        )
        
        return {"message": "Password changed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/forgot-password")
async def forgot_password(request: ResetPasswordRequest):
    """Initiate password reset process"""
    try:
        # Look the user up but deliberately discard the result: the lookup keeps the
        # response time comparable whether or not the account exists.
        await user_service.get_user_by_email(request.email)

        # Always return success to prevent email enumeration
        # In production, send actual reset email here
        return {"message": "If the email exists, a password reset link has been sent"}

    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        # Still return success to prevent information disclosure
        return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordConfirm):
    """Reset password with token"""
    try:
        # In a real implementation, you would:
        # 1. Verify the reset token from database/cache
        # 2. Check if token is not expired
        # 3. Update user password
        # 4. Invalidate the reset token
        
        # For now, return a placeholder response
        return {"message": "Password reset functionality not fully implemented"}

    except Exception as e:
        logger.error(f"Reset password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/logout")
async def logout(response: Response, request: Request, current_user=Depends(get_current_active_user)):
    """Logout user (token invalidation would be handled by client or token blacklist)"""
    session_service = SessionService()
    audit_log_service = AuditLogService()
    
    # Get client IP and user agent
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # Terminate all active sessions for the user
        await session_service.terminate_all_user_sessions(str(current_user.id))
        
        # Log logout event
        await audit_log_service.create_audit_log(
            user_id=str(current_user.id),
            user_email=current_user.email,
            action="logout",
            resource="auth",
            ip_address=client_ip,
            user_agent=user_agent,
            status="success"
        )
        
        # Clear cookies
        response.delete_cookie(key="access_token", path="/")
        response.delete_cookie(key="refresh_token", path="/")
        
        return {"message": "Logged out successfully"}

    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
