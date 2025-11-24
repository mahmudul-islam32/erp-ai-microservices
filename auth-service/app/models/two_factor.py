from pydantic import BaseModel, Field
from typing import Optional, List


class TwoFactorSetupRequest(BaseModel):
    """Request to start 2FA setup"""
    pass


class TwoFactorSetupResponse(BaseModel):
    """Response with QR code and secret for 2FA setup"""
    secret: str
    qr_code_url: str
    backup_codes: List[str]


class TwoFactorVerifyRequest(BaseModel):
    """Request to verify 2FA code during setup"""
    code: str = Field(..., min_length=6, max_length=6)


class TwoFactorVerifyResponse(BaseModel):
    """Response after verifying 2FA code"""
    verified: bool
    backup_codes: Optional[List[str]] = None


class TwoFactorLoginRequest(BaseModel):
    """Request to verify 2FA code during login"""
    email: str
    password: str
    code: Optional[str] = None  # 2FA code or backup code


class TwoFactorDisableRequest(BaseModel):
    """Request to disable 2FA"""
    password: str  # Require password confirmation
    code: Optional[str] = None  # 2FA code if enabled


class BackupCodesResponse(BaseModel):
    """Response with new backup codes"""
    backup_codes: List[str]

