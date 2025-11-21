from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.models.audit_log import AuditLogResponse, AuditLogFilters
from app.services.audit_log_service import AuditLogService
from app.api.dependencies import get_current_user
from app.models.user import UserInDB

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    resource: Optional[str] = Query(None, description="Filter by resource"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: UserInDB = Depends(get_current_user)
):
    """Get audit logs with filters"""
    try:
        # Only admins can view audit logs
        if current_user.role.value not in ["super_admin", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can view audit logs"
            )
        
        # Parse dates if provided
        start_dt = None
        end_dt = None
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use ISO format."
                )
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use ISO format."
                )
        
        filters = AuditLogFilters(
            user_id=user_id,
            action=action,
            resource=resource,
            status=status_filter,
            start_date=start_dt,
            end_date=end_dt,
            skip=skip,
            limit=limit
        )
        
        service = AuditLogService()
        logs = await service.get_audit_logs(filters)
        return logs
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get audit logs: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=List[AuditLogResponse])
async def get_user_audit_logs(
    user_id: str,
    limit: int = Query(100, ge=1, le=1000),
    current_user: UserInDB = Depends(get_current_user)
):
    """Get audit logs for a specific user"""
    try:
        # Only admins can view other users' audit logs, or users can view their own
        if current_user.role.value not in ["super_admin", "admin"] and str(current_user.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own audit logs"
            )
        
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID"
            )
        
        service = AuditLogService()
        logs = await service.get_user_audit_logs(user_id, limit=limit)
        return logs
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user audit logs: {str(e)}"
        )


@router.get("/me", response_model=List[AuditLogResponse])
async def get_my_audit_logs(
    limit: int = Query(100, ge=1, le=1000),
    current_user: UserInDB = Depends(get_current_user)
):
    """Get current user's audit logs"""
    try:
        service = AuditLogService()
        logs = await service.get_user_audit_logs(str(current_user.id), limit=limit)
        return logs
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user audit logs: {str(e)}"
        )

