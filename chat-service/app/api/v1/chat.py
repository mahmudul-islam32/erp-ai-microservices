from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect, Request
from fastapi import Request as FastAPIRequest
from typing import List, Optional
import logging

from app.models.message import (
    MessageCreate,
    MessageInDB,
    MessageResponse,
    ConversationCreate,
    ConversationInDB,
    ConversationResponse
)
from app.services.chat_service import ChatService
from app.services.websocket_manager import ws_manager
from app.api.dependencies import (
    get_current_user,
    get_current_user_ws,
    get_chat_service
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_data: ConversationCreate,
    request: Request,
    service: ChatService = Depends(get_chat_service),
    current_user: dict = Depends(get_current_user)
):
    """Create a new conversation"""
    try:
        # Ensure creator is in participants
        if current_user["user_id"] not in conversation_data.participant_ids:
            conversation_data.participant_ids.append(current_user["user_id"])
        
        # Extract token from request
        token = ""
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix
        
        conversation = await service.create_conversation(
            conversation_data,
            current_user["user_id"],
            token
        )
        
        return conversation
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation"
        )


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    request: FastAPIRequest = None,
    service: ChatService = Depends(get_chat_service),
    current_user: dict = Depends(get_current_user)
):
    """Get all conversations for current user"""
    try:
        # Extract token from request for refreshing participant details
        token = ""
        if request:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]  # Remove "Bearer " prefix
        
        conversations = await service.get_user_conversations(
            user_id=current_user["user_id"],
            skip=skip,
            limit=limit,
            token=token
        )
        return conversations
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversations"
        )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    service: ChatService = Depends(get_chat_service),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific conversation"""
    try:
        conversation = await service.get_conversation(conversation_id)
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Verify user is a participant
        if current_user["user_id"] not in conversation.participant_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this conversation"
            )
        
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversation"
        )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    service: ChatService = Depends(get_chat_service),
    current_user: dict = Depends(get_current_user)
):
    """Get messages in a conversation"""
    try:
        # Verify user has access to conversation
        conversation = await service.get_conversation(conversation_id)
        if not conversation or current_user["user_id"] not in conversation.participant_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this conversation"
            )
        
        messages = await service.get_conversation_messages(
            conversation_id=conversation_id,
            skip=skip,
            limit=limit
        )
        
        # Mark messages as read
        await service.mark_messages_as_read(conversation_id, current_user["user_id"])
        
        return messages
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch messages"
        )


@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate,
    request: Request,
    service: ChatService = Depends(get_chat_service),
    current_user: dict = Depends(get_current_user)
):
    """Send a message in a conversation"""
    try:
        # Ensure sender ID matches current user
        message_data.sender_id = current_user["user_id"]
        
        # Verify user is participant in conversation
        conversation = await service.get_conversation(message_data.conversation_id)
        if not conversation or current_user["user_id"] not in conversation.participant_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to send message in this conversation"
            )
        
        # Extract token from request
        token = ""
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix
        
        # Create message
        message = await service.send_message(message_data, token)
        
        # Broadcast to all participants via WebSocket
        await ws_manager.broadcast_to_conversation(
            conversation.participant_ids,
            {
                "type": "message",
                "action": "created",
                "data": message.model_dump(mode='json'),
                "conversation_id": message_data.conversation_id
            }
        )
        
        return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    service: ChatService = Depends(get_chat_service),
    current_user: dict = Depends(get_current_user)
):
    """Delete a message (soft delete)"""
    try:
        success = await service.delete_message(message_id, current_user["user_id"])
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found or unauthorized"
            )
        
        return {"message": "Message deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete message"
        )


@router.get("/unread-count")
async def get_unread_count(
    service: ChatService = Depends(get_chat_service),
    current_user: dict = Depends(get_current_user)
):
    """Get total unread message count for current user"""
    try:
        count = await service.get_unread_count(current_user["user_id"])
        return {"unread_count": count}
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get unread count"
        )


@router.post("/conversations/{conversation_id}/mark-read")
async def mark_conversation_as_read(
    conversation_id: str,
    service: ChatService = Depends(get_chat_service),
    current_user: dict = Depends(get_current_user)
):
    """Mark all messages in a conversation as read for current user"""
    try:
        # Verify user has access to conversation
        conversation = await service.get_conversation(conversation_id)
        if not conversation or current_user["user_id"] not in conversation.participant_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this conversation"
            )
        
        # Mark messages as read
        await service.mark_messages_as_read(conversation_id, current_user["user_id"])
        
        return {"message": "Messages marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking messages as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark messages as read"
        )


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """WebSocket endpoint for real-time chat"""
    user = None
    user_id = None
    
    try:
        # Validate token
        user = await get_current_user_ws(token)
        user_id = user["user_id"]
        
        # Connect WebSocket
        await ws_manager.connect(websocket, user_id)
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to chat service",
            "user_id": user_id
        })
        
        # Listen for messages
        while True:
            try:
                data = await websocket.receive_text()
                
                # Handle ping/pong for keepalive
                if data == "ping":
                    await websocket.send_text("pong")
                    continue
                
                # Handle other messages if needed
                logger.debug(f"Received WebSocket message from {user_id}: {data}")
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for user: {user_id}")
                break
            except Exception as e:
                logger.error(f"Error in WebSocket loop: {e}")
                break
                
    except HTTPException as e:
        logger.error(f"WebSocket authentication failed: {e.detail}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if user_id:
            ws_manager.disconnect(websocket, user_id)

