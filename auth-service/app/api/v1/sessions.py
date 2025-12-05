from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from typing import List, Optional
from bson import ObjectId

from app.models.session import SessionResponse
from app.services.session_service import SessionService
from app.api.dependencies import get_current_user
from app.models.user import UserInDB

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("/", response_model=List[SessionResponse])
async def get_all_sessions(
    active_only: bool = Query(False, description="Filter active sessions only"),
    current_user: UserInDB = Depends(get_current_user)
):
    """Get all user sessions"""
    try:
        # Only admins can see all sessions
        if current_user.role.value not in ["super_admin", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can view all sessions"
            )
        
        service = SessionService()
        sessions = await service.get_all_sessions(active_only=active_only)
        return sessions
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sessions: {str(e)}"
        )


@router.get("/me", response_model=List[SessionResponse])
async def get_my_sessions(
    active_only: bool = Query(False, description="Filter active sessions only"),
    current_user: UserInDB = Depends(get_current_user)
):
    """Get current user's sessions"""
    try:
        service = SessionService()
        sessions = await service.get_user_sessions(str(current_user.id), active_only=active_only)
        return sessions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user sessions: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=List[SessionResponse])
async def get_user_sessions(
    user_id: str,
    active_only: bool = Query(False, description="Filter active sessions only"),
    current_user: UserInDB = Depends(get_current_user)
):
    """Get sessions for a specific user"""
    try:
        # Only admins can view other users' sessions, or users can view their own
        if current_user.role.value not in ["super_admin", "admin"] and str(current_user.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own sessions"
            )
        
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID"
            )
        
        service = SessionService()
        sessions = await service.get_user_sessions(user_id, active_only=active_only)
        return sessions
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user sessions: {str(e)}"
        )


@router.post("/{session_id}/terminate", status_code=status.HTTP_200_OK)
async def terminate_session(
    session_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user)
):
    """Terminate a specific session"""
    try:
        if not ObjectId.is_valid(session_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session ID"
            )
        
        service = SessionService()
        
        # Get the session to check ownership
        session = await service.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Check permissions: users can terminate their own sessions, admins can terminate any
        is_own_session = session.user_id == str(current_user.id)
        is_admin = current_user.role.value in ["super_admin", "admin"]
        
        if not is_own_session and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to terminate this session"
            )
        
        # Terminate the session
        success = await service.terminate_session(session_id, str(current_user.id))
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to terminate session"
            )
        
        return {"message": "Session terminated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to terminate session: {str(e)}"
        )


@router.post("/user/{user_id}/terminate-all", status_code=status.HTTP_200_OK)
async def terminate_all_user_sessions(
    user_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user)
):
    """Terminate all sessions for a user"""
    try:
        # Only admins can terminate other users' sessions, or users can terminate their own
        if current_user.role.value not in ["super_admin", "admin"] and str(current_user.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only terminate your own sessions"
            )
        
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID"
            )
        
        service = SessionService()
        count = await service.terminate_all_user_sessions(user_id)
        
        return {
            "message": f"Terminated {count} session(s) successfully",
            "count": count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to terminate sessions: {str(e)}"
        )

