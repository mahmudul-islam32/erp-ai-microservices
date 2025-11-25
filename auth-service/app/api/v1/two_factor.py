from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from app.models.two_factor import (
    TwoFactorSetupRequest, TwoFactorSetupResponse,
    TwoFactorVerifyRequest, TwoFactorVerifyResponse,
    TwoFactorLoginRequest, TwoFactorDisableRequest,
    BackupCodesResponse
)
from app.models import Token
from app.services.two_factor_service import TwoFactorService
from app.services import user_service, SecurityService
from app.services.session_service import SessionService
from app.services.audit_log_service import AuditLogService
from app.api.dependencies import get_current_active_user
from app.models import UserInDB
from datetime import timedelta
from app.config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth/2fa", tags=["Two-Factor Authentication"])
security_service = SecurityService()
two_factor_service = TwoFactorService()


@router.post("/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    request: TwoFactorSetupRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Start 2FA setup - generates secret and QR code"""
    try:
        # Check if 2FA is already enabled
        if current_user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Two-factor authentication is already enabled"
            )
        
        # Generate new secret
        secret = two_factor_service.generate_secret()
        
        # Generate QR code
        qr_code_url = two_factor_service.generate_qr_code(
            secret=secret,
            email=current_user.email,
            issuer="ERP System"
        )
        
        # Generate backup codes
        backup_codes = two_factor_service.generate_backup_codes(count=10)
        
        # Store secret temporarily (not enabled yet - will be enabled after verification)
        # We'll store it in the user document but mark as not enabled
        await user_service.update_user_2fa_secret(
            user_id=str(current_user.id),
            secret=secret,
            backup_codes=backup_codes
        )
        
        return TwoFactorSetupResponse(
            secret=secret,
            qr_code_url=qr_code_url,
            backup_codes=backup_codes
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA setup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to setup two-factor authentication"
        )


@router.post("/verify", response_model=TwoFactorVerifyResponse)
async def verify_2fa_setup(
    request: TwoFactorVerifyRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Verify 2FA code during setup and enable 2FA"""
    try:
        # Get user with secret
        user = await user_service.get_user_by_id(str(current_user.id))
        if not user or not user.two_factor_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA setup not initiated. Please start setup first."
            )
        
        # Verify code
        is_valid = two_factor_service.verify_code(
            secret=user.two_factor_secret,
            code=request.code
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please try again."
            )
        
        # Enable 2FA
        await user_service.enable_2fa(
            user_id=str(current_user.id),
            secret=user.two_factor_secret,
            backup_codes=user.two_factor_backup_codes
        )
        
        return TwoFactorVerifyResponse(
            verified=True,
            backup_codes=user.two_factor_backup_codes
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify two-factor authentication"
        )


@router.post("/login", response_model=Token)
async def login_with_2fa(
    login_data: TwoFactorLoginRequest,
    response: Response,
    request: Request
):
    """Login with 2FA verification"""
    session_service = SessionService()
    audit_log_service = AuditLogService()
    
    # Get client IP and user agent
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    try:
        # First, authenticate user with email and password
        user = await user_service.authenticate_user(
            login_data.email,
            login_data.password
        )
        
        if not user:
            await audit_log_service.create_audit_log(
                user_id="unknown",
                user_email=login_data.email,
                action="login_failed",
                resource="auth",
                ip_address=client_ip,
                user_agent=user_agent,
                status="failure",
                details={"reason": "Invalid credentials"}
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Check if 2FA is enabled
        if not user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Two-factor authentication is not enabled for this account"
            )
        
        # Verify 2FA code
        if not login_data.code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA code is required"
            )
        
        # Try TOTP code first
        is_valid = two_factor_service.verify_code(
            secret=user.two_factor_secret,
            code=login_data.code
        )
        
        updated_backup_codes = user.two_factor_backup_codes
        
        # If TOTP failed, try backup code
        if not is_valid:
            is_valid, updated_backup_codes = two_factor_service.verify_backup_code(
                backup_codes=user.two_factor_backup_codes,
                code=login_data.code
            )
            
            # If backup code was used, update user
            if is_valid:
                await user_service.update_user_backup_codes(
                    user_id=str(user.id),
                    backup_codes=updated_backup_codes
                )
        
        if not is_valid:
            await audit_log_service.create_audit_log(
                user_id=str(user.id),
                user_email=user.email,
                action="login_failed",
                resource="auth",
                ip_address=client_ip,
                user_agent=user_agent,
                status="failure",
                details={"reason": "Invalid 2FA code"}
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA code"
            )
        
        # Create tokens
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
        
        refresh_token = security_service.create_refresh_token(
            data={
                "sub": str(user.id),
                "email": user.email
            }
        )
        
        # Create session
        session_expires_minutes = 7 * 24 * 60  # 7 days
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
        
        # Set cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False if settings.environment == "development" else True,
            samesite="lax",
            max_age=settings.access_token_expire_minutes * 60,
            path="/"
        )
        
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False if settings.environment == "development" else True,
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/"
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
        logger.error(f"2FA login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/disable")
async def disable_2fa(
    disable_data: TwoFactorDisableRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Disable 2FA for current user"""
    try:
        # Verify password
        user = await user_service.authenticate_user(
            current_user.email,
            disable_data.password
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
        
        # If 2FA is enabled, require code
        if user.two_factor_enabled and disable_data.code:
            is_valid = two_factor_service.verify_code(
                secret=user.two_factor_secret,
                code=disable_data.code
            )
            
            if not is_valid:
                # Try backup code
                is_valid, _ = two_factor_service.verify_backup_code(
                    backup_codes=user.two_factor_backup_codes,
                    code=disable_data.code
                )
            
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid 2FA code"
                )
        
        # Disable 2FA
        await user_service.disable_2fa(str(current_user.id))
        
        return {"message": "Two-factor authentication has been disabled"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Disable 2FA error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disable two-factor authentication"
        )


@router.post("/backup-codes", response_model=BackupCodesResponse)
async def regenerate_backup_codes(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Regenerate backup codes for 2FA"""
    try:
        if not current_user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Two-factor authentication is not enabled"
            )
        
        # Generate new backup codes
        new_backup_codes = two_factor_service.generate_backup_codes(count=10)
        
        # Update user
        await user_service.update_user_backup_codes(
            user_id=str(current_user.id),
            backup_codes=new_backup_codes
        )
        
        return BackupCodesResponse(backup_codes=new_backup_codes)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Regenerate backup codes error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to regenerate backup codes"
        )


@router.get("/status")
async def get_2fa_status(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get 2FA status for current user"""
    return {
        "enabled": current_user.two_factor_enabled,
        "has_backup_codes": len(current_user.two_factor_backup_codes) > 0
    }

