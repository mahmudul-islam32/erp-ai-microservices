import pyotp
import qrcode
import io
import base64
import secrets
from typing import Optional, Tuple, List
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class TwoFactorService:
    """Service for handling Two-Factor Authentication using TOTP"""
    
    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()
    
    @staticmethod
    def generate_qr_code(secret: str, email: str, issuer: str = "ERP System") -> str:
        """
        Generate QR code as base64 data URL for 2FA setup
        
        Args:
            secret: TOTP secret
            email: User email
            issuer: Service name
            
        Returns:
            Base64 encoded data URL of QR code
        """
        try:
            # Create TOTP URI
            totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                name=email,
                issuer_name=issuer
            )
            
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(totp_uri)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
        except Exception as e:
            logger.error(f"Error generating QR code: {e}")
            raise
    
    @staticmethod
    def verify_code(secret: str, code: str, window: int = 1) -> bool:
        """
        Verify a TOTP code
        
        Args:
            secret: TOTP secret
            code: 6-digit code to verify
            window: Time window (default 1 = 30 seconds)
            
        Returns:
            True if code is valid, False otherwise
        """
        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(code, valid_window=window)
        except Exception as e:
            logger.error(f"Error verifying 2FA code: {e}")
            return False
    
    @staticmethod
    def generate_backup_codes(count: int = 10) -> List[str]:
        """
        Generate backup codes for 2FA
        
        Args:
            count: Number of backup codes to generate
            
        Returns:
            List of backup codes (8 characters each)
        """
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = secrets.token_urlsafe(6).upper()[:8]
            codes.append(code)
        return codes
    
    @staticmethod
    def verify_backup_code(backup_codes: List[str], code: str) -> Tuple[bool, List[str]]:
        """
        Verify a backup code and remove it from the list
        
        Args:
            backup_codes: List of available backup codes
            code: Backup code to verify
            
        Returns:
            Tuple of (is_valid, updated_backup_codes)
        """
        if code.upper() in backup_codes:
            # Remove used backup code
            updated_codes = [c for c in backup_codes if c.upper() != code.upper()]
            return True, updated_codes
        return False, backup_codes
    
    @staticmethod
    def get_current_code(secret: str) -> str:
        """
        Get the current TOTP code (for testing/debugging)
        
        Args:
            secret: TOTP secret
            
        Returns:
            Current 6-digit code
        """
        totp = pyotp.TOTP(secret)
        return totp.now()

