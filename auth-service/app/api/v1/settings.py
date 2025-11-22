from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from app.models.settings import (
    SettingsResponse, SettingsUpdate, SettingsCategory
)
from app.services.settings_service import settings_service
from app.api.dependencies import get_current_active_user
from app.models.user import UserInDB, Permission
from app.api.dependencies import require_permissions
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/", response_model=List[SettingsResponse])
async def get_all_settings(
    category: Optional[SettingsCategory] = Query(None, description="Filter by category"),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get all settings or settings by category"""
    try:
        settings = await settings_service.get_settings(category)
        return settings
    except Exception as e:
        logger.error(f"Error getting settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{category}", response_model=SettingsResponse)
async def get_settings_by_category(
    category: SettingsCategory,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get settings for a specific category"""
    try:
        settings = await settings_service.get_settings_by_category(category)
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Settings for category {category.value} not found"
            )
        return settings
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting settings by category: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{category}", response_model=SettingsResponse)
async def update_settings(
    category: SettingsCategory,
    settings_data: SettingsUpdate,
    current_user: UserInDB = Depends(require_permissions([Permission.USER_UPDATE]))
):
    """Create or update settings for a category"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else str(current_user._id)
        settings = await settings_service.create_or_update_settings(
            category, settings_data, user_id
        )
        return settings
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/{category}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_settings(
    category: SettingsCategory,
    current_user: UserInDB = Depends(require_permissions([Permission.USER_DELETE]))
):
    """Delete settings for a category"""
    try:
        success = await settings_service.delete_settings(category)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Settings for category {category.value} not found"
            )
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

