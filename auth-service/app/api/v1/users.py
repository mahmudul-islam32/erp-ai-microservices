from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models import (
    UserCreate, UserUpdate, UserResponse, UserRole, UserStatus, Permission
)
from app.services import user_service
from app.api.dependencies import (
    get_current_active_user, require_permissions, require_any_permission
)
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["User Management"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user=Depends(require_permissions([Permission.USER_CREATE]))
):
    """Create a new user (Admin only)"""
    try:
        user = await user_service.create_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"User creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    current_user=Depends(require_permissions([Permission.USER_READ]))
):
    """Get list of users with pagination and filters"""
    try:
        users = await user_service.get_users(
            skip=skip,
            limit=limit,
            role=role,
            status=status
        )
        return users
    except Exception as e:
        logger.error(f"Get users error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user=Depends(require_any_permission([Permission.USER_READ, Permission.USER_UPDATE]))
):
    """Get user by ID"""
    try:
        # Users can read their own profile, or admins can read any profile
        if str(current_user.id) != user_id and Permission.USER_READ not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return UserResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            department=user.department,
            phone=user.phone,
            status=user.status,
            permissions=user.permissions,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login=user.last_login
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user=Depends(require_any_permission([Permission.USER_UPDATE]))
):
    """Update user"""
    try:
        # Users can update their own profile (limited fields), or admins can update any profile
        if str(current_user.id) != user_id and Permission.USER_UPDATE not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        # If user is updating themselves, restrict certain fields
        if str(current_user.id) == user_id and Permission.USER_UPDATE not in current_user.permissions:
            # Only allow updating personal information, not role or status
            if user_update.role is not None or user_update.status is not None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot update role or status for own profile"
                )

        updated_user = await user_service.update_user(user_id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return updated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update user error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user=Depends(require_permissions([Permission.USER_DELETE]))
):
    """Delete user (soft delete)"""
    try:
        # Prevent self-deletion
        if str(current_user.id) == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )

        success = await user_service.delete_user(user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete user error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{user_id}/permissions")
async def update_user_permissions(
    user_id: str,
    permissions: List[Permission],
    current_user=Depends(require_permissions([Permission.USER_UPDATE]))
):
    """Update user permissions (Super Admin only)"""
    try:
        # Only super admins can modify permissions
        if current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admins can modify permissions"
            )

        success = await user_service.update_user_permissions(user_id, permissions)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return {"message": "User permissions updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update permissions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/roles/permissions")
async def get_role_permissions(
    current_user=Depends(get_current_active_user)
):
    """Get permissions for all roles"""
    try:
        from app.services.security import SecurityService
        security_service = SecurityService()
        
        role_permissions = {}
        for role in UserRole:
            role_permissions[role.value] = [
                p.value for p in security_service.get_role_permissions(role)
            ]
        
        return role_permissions

    except Exception as e:
        logger.error(f"Get role permissions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
