from fastapi import Depends, HTTPException, status, Cookie, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


async def get_current_user_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token: Optional[str] = Cookie(None)
) -> Optional[str]:
    """Extract JWT token from header or cookie"""
    # Try Bearer token from header
    if credentials:
        return credentials.credentials
    
    # Try cookie
    if access_token:
        return access_token
    
    return None


async def get_current_user(token: Optional[str] = Depends(get_current_user_token)):
    """Verify JWT token and get current user"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.auth_service_url}/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "id": user_data.get("id") or user_data.get("_id"),
                    "email": user_data.get("email"),
                    "role": user_data.get("role"),
                    "token": token
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token"
                )
    except httpx.RequestError as e:
        logger.error(f"Error verifying token: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable"
        )

