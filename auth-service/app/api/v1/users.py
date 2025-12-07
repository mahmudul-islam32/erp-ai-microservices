from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
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
    request: Request,
    current_user=Depends(require_permissions([Permission.USER_CREATE]))
):
    """Create a new user (Admin only)"""
    try:
        # Extract token from request
        token = request.cookies.get("access_token")
        if not token:
            authorization = request.headers.get("Authorization")
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ", 1)[1]
        
        user = await user_service.create_user(user_data, auth_token=token)
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


@router.get("/chat-eligible", response_model=List[UserResponse])
async def get_chat_eligible_users(
    user_ids: Optional[str] = Query(None, description="Comma-separated list of user IDs to include"),
    current_user=Depends(get_current_active_user)
):
    """Get users eligible for chat. For customers: returns customer support users + specified user IDs"""
    try:
        current_user_role = current_user.role.value.lower() if current_user and current_user.role else ""
        current_user_id = str(current_user.id) if current_user else ""
        
        # For customers, return customer support roles + any specified user IDs
        if current_user_role == "customer":
            # Customer support roles that customers can always message
            customer_support_roles = [
                UserRole.SUPER_ADMIN,
                UserRole.ADMIN,
                UserRole.MANAGER,
                UserRole.EMPLOYEE
            ]
            
            # Get customer support users
            all_users = []
            for role in customer_support_roles:
                role_users = await user_service.get_users(
                    skip=0,
                    limit=1000,
                    role=role,
                    status=UserStatus.ACTIVE
                )
                all_users.extend(role_users)
            
            # Add any specified user IDs (users who created orders)
            if user_ids:
                user_id_list = [uid.strip() for uid in user_ids.split(",") if uid.strip()]
                for user_id in user_id_list:
                    user_in_db = await user_service.get_user_by_id(user_id)
                    if user_in_db and user_in_db.status == UserStatus.ACTIVE:
                        # Check if not already in list (compare by ID)
                        user_id_str = str(user_in_db.id)
                        if not any(str(u.id) == user_id_str for u in all_users):
                            # Convert UserInDB to UserResponse
                            all_users.append(UserResponse(
                                id=str(user_in_db.id),
                                email=user_in_db.email,
                                first_name=user_in_db.first_name,
                                last_name=user_in_db.last_name,
                                role=user_in_db.role,
                                department=user_in_db.department,
                                phone=user_in_db.phone,
                                status=user_in_db.status,
                                permissions=user_in_db.permissions,
                                profile_image=getattr(user_in_db, 'profile_image', None),
                                created_at=user_in_db.created_at,
                                updated_at=user_in_db.updated_at,
                                last_login=user_in_db.last_login
                            ))
            
            # Remove current user and return (all_users already contains UserResponse objects)
            return [user for user in all_users if str(user.id) != current_user_id]
        
        else:
            # For non-customers, return all active users
            users = await user_service.get_users(
                skip=0,
                limit=1000,
                status=UserStatus.ACTIVE
            )
            # Filter out current user
            return [UserResponse(**user.dict()) for user in users if str(user.id) != current_user_id]
            
    except Exception as e:
        logger.error(f"Get chat-eligible users error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
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
            profile_image=getattr(user, 'profile_image', None),
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
    request: Request,
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

        # Extract token from request for syncing customer updates
        token = request.cookies.get("access_token")
        if not token:
            authorization = request.headers.get("Authorization")
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ", 1)[1]

        updated_user = await user_service.update_user(user_id, user_update, auth_token=token)
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
    request: Request,
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

        # Extract auth token from request to pass to user service for customer sync
        token = request.cookies.get("access_token")
        if not token:
            authorization = request.headers.get("Authorization")
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ", 1)[1]

        success = await user_service.delete_user(user_id, auth_token=token)
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
