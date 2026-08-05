from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from app.models.settings import (
    SettingsResponse, SettingsUpdate, SettingsCategory, SecuritySettings
)
from datetime import datetime
from bson import ObjectId
from app.services.settings_service import settings_service
from app.models.user import UserInDB, Permission
from app.api.dependencies import require_permissions
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/", response_model=List[SettingsResponse])
async def get_all_settings(
    category: Optional[SettingsCategory] = Query(None, description="Filter by category"),
    current_user: UserInDB = Depends(require_permissions([Permission.SETTINGS_READ]))
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
    current_user: UserInDB = Depends(require_permissions([Permission.SETTINGS_READ]))
):
    """Get settings for a specific category. Returns default settings if none exist."""
    try:
        settings = await settings_service.get_settings_by_category(category)
        if not settings:
            # Return default settings instead of 404
            # This provides better UX - frontend always gets valid settings
            user_id = str(current_user.id) if hasattr(current_user, 'id') else str(current_user._id)
            
            # Create default settings based on category
            default_data = {
                "id": str(ObjectId()),
                "category": category,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": user_id,
            }
            
            # Add category-specific defaults
            if category == SettingsCategory.SECURITY:
                security_defaults = SecuritySettings()
                try:
                    default_data["security"] = security_defaults.model_dump(exclude_unset=False)
                except AttributeError:
                    default_data["security"] = security_defaults.dict(exclude_unset=False)
            
            return SettingsResponse(**default_data)
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
    current_user: UserInDB = Depends(require_permissions([Permission.SETTINGS_UPDATE]))
):
    """Create or update settings for a category"""
    try:
        # Log the received data for debugging
        if category == SettingsCategory.SECURITY and settings_data.security:
            # CRITICAL: Get actual field values from the model, not defaults
            # Check if fields were explicitly set using __fields_set__ (Pydantic v2) or __dict__
            security_model = settings_data.security
            actual_values = {}
            
            # Try to get fields that were actually set
            if hasattr(security_model, '__fields_set__'):
                # Pydantic v2
                for field_name in security_model.__fields_set__:
                    actual_values[field_name] = getattr(security_model, field_name)
            elif hasattr(security_model, '__dict__'):
                # Fallback: get all fields from __dict__
                for key, value in security_model.__dict__.items():
                    if not key.startswith('_'):
                        actual_values[key] = value
            
            # Always include boolean fields - use model value if set, otherwise check if it was in the request
            # For security, we need to preserve False values
            logger.info(f"Security model field values: password_require_numbers={getattr(security_model, 'password_require_numbers', 'NOT_SET')}, password_require_special_chars={getattr(security_model, 'password_require_special_chars', 'NOT_SET')}")
            logger.info(f"Security model __dict__: {security_model.__dict__ if hasattr(security_model, '__dict__') else 'N/A'}")
            
            # Use model_dump with exclude_unset=False to get all values including False
            try:
                security_dict = security_model.model_dump(exclude_unset=False)
            except AttributeError:
                security_dict = security_model.dict(exclude_unset=False)
            
            logger.info(f"Security dict from model_dump: {security_dict}")
            logger.info(f"Received security settings update: password_require_numbers={security_dict.get('password_require_numbers')}, password_require_special_chars={security_dict.get('password_require_special_chars')}")
        
        user_id = str(current_user.id) if hasattr(current_user, 'id') else str(current_user._id)
        settings = await settings_service.create_or_update_settings(
            category, settings_data, user_id
        )
        
        # Log the saved data
        if category == SettingsCategory.SECURITY and settings.security:
            try:
                security_dict = settings.security.model_dump(exclude_unset=False) if hasattr(settings.security, 'model_dump') else settings.security.dict(exclude_unset=False)
                logger.info(f"Saved security settings (returning to frontend): {security_dict}")
                logger.info(f"password_require_uppercase={security_dict.get('password_require_uppercase')}, password_require_numbers={security_dict.get('password_require_numbers')}, password_require_special_chars={security_dict.get('password_require_special_chars')}")
            except Exception as e:
                logger.error(f"Error logging security settings: {e}")
        
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

