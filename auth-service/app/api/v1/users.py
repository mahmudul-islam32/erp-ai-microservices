from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models import (
    UserCreate, UserUpdate, UserResponse, UserRole, UserStatus, Permission
)
from app.services import user_service
from app.database import get_database
from app.api.dependencies import (
    get_current_active_user, require_permissions, require_any_permission
)
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
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


@router.put("/roles/{role}/permissions")
async def update_role_permissions(
    role: UserRole,
    permissions: List[Permission],
    current_user=Depends(require_permissions([Permission.USER_UPDATE]))
):
    """Update permissions for a specific role (Super Admin only)"""
    try:
        # current_user is a UserInDB object, not a dict
        user_role = getattr(current_user, 'role', None)
        user_email = getattr(current_user, 'email', 'unknown')
        
        # Verify current user is super admin
        if user_role != UserRole.SUPER_ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Super Admin can update role permissions"
            )
        
        from app.services.security import SecurityService
        security_service = SecurityService()
        
        # Update role permissions in security service
        security_service.set_role_permissions(role, permissions)
        
        return {
            "role": role.value,
            "permissions": [p.value for p in permissions],
            "updated_by": user_email,
            "updated_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update role permissions error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


# ==================== Access Control Endpoints ====================

@router.get("/access-control/")
async def get_access_control_entries(
    current_user=Depends(require_permissions([Permission.USER_READ]))
):
    """Get all access control entries"""
    try:
        db = get_database()
        entries = await db.access_control.find().to_list(length=1000)
        
        # Convert ObjectId to string
        for entry in entries:
            entry['id'] = str(entry.pop('_id'))
        
        return entries
    except Exception as e:
        logger.error(f"Get access control error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


from pydantic import BaseModel

class GrantAccessRequest(BaseModel):
    user_id: str
    resource: str
    permissions: List[str]
    expires_at: Optional[str] = None
    notes: Optional[str] = None

@router.post("/access-control/")
async def grant_access(
    request: GrantAccessRequest,
    current_user=Depends(require_permissions([Permission.USER_UPDATE]))
):
    """Grant resource access to a user"""
    try:
        db = get_database()
        
        # Get user email
        from app.services.user_service import UserService
        user_service = UserService()
        target_user = await user_service.get_user_by_id(request.user_id)
        
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create access control entry
        entry = {
            "user_id": request.user_id,
            "user_email": target_user.email,
            "resource": request.resource,
            "permissions": request.permissions,
            "granted_by": str(getattr(current_user, 'id', '')),
            "granted_by_email": getattr(current_user, 'email', 'unknown'),
            "granted_at": datetime.utcnow(),
            "expires_at": datetime.fromisoformat(request.expires_at.replace('Z', '+00:00')) if request.expires_at else None,
            "notes": request.notes,
            "is_active": True
        }
        
        result = await db.access_control.insert_one(entry)
        entry['id'] = str(result.inserted_id)
        entry.pop('_id', None)
        
        return entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Grant access error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.delete("/access-control/{entry_id}")
async def revoke_access(
    entry_id: str,
    current_user=Depends(require_permissions([Permission.USER_UPDATE]))
):
    """Revoke access control entry"""
    try:
        db = get_database()
        from bson import ObjectId
        
        result = await db.access_control.delete_one({"_id": ObjectId(entry_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Access entry not found"
            )
        
        return {"message": "Access revoked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Revoke access error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
