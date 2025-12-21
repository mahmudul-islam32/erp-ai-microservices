from fastapi import Request, HTTPException, status
from typing import Optional
import httpx
from app.config import settings
import logging

logger = logging.getLogger(__name__)


async def get_token_from_request(request: Request) -> Optional[str]:
    """Extract JWT token from request headers"""
    authorization = request.headers.get("Authorization")
    if not authorization:
        return None
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
        return token
    except ValueError:
        return None


async def verify_token(token: str) -> dict:
    """Verify JWT token with auth service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.auth_service_url}/api/v1/auth/verify",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Token verification failed: {response.status_code}")
                return {}
                
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        return {}


async def get_current_user(request: Request) -> dict:
    """Get current authenticated user"""
    token = await get_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    user_data = await verify_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user_data

