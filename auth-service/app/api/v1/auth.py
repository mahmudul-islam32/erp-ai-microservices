from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.models import (
    UserLogin, UserCreate, UserResponse, Token, 
    RefreshTokenRequest, ChangePasswordRequest,
    ResetPasswordRequest, ResetPasswordConfirm
)
from app.services import user_service, SecurityService
from app.api.dependencies import get_current_active_user
from datetime import timedelta
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


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, response: Response):
    """Login user and return access tokens"""
    try:
        # Authenticate user
        user = await user_service.authenticate_user(
            user_credentials.email, 
            user_credentials.password
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
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60
        )

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
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login=current_user.last_login
    )


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user=Depends(get_current_active_user)
):
    """Change user password"""
    try:
        success = await user_service.change_password(
            str(current_user.id),
            password_data.current_password,
            password_data.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid current password"
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
        # Check if user exists
        user = await user_service.get_user_by_email(request.email)
        
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
async def logout(response: Response, current_user=Depends(get_current_active_user)):
    """Logout user (token invalidation would be handled by client or token blacklist)"""
    try:
        # In a real implementation, you might:
        # 1. Add token to blacklist
        # 2. Clear session data
        # 3. Update last activity
        
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
