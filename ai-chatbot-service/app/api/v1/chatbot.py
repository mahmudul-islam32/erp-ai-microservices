from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi import Request as FastAPIRequest
from typing import List, Optional
import logging

from app.models.message import MessageCreate, MessageInDB, MessageResponse, MessageSendRequest
from app.models.conversation import ConversationCreate, ConversationInDB, ConversationResponse
from app.services.chatbot_service import ChatbotService
from app.services.llm_provider_factory import LLMProviderFactory
from app.database import get_database
from app.api.dependencies import get_current_user
from app.config import settings
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-chatbot", tags=["AI Chatbot"])


def get_chatbot_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> ChatbotService:
    """Dependency to get chatbot service instance"""
    return ChatbotService(db)


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_data: Optional[ConversationCreate] = None,
    service: ChatbotService = Depends(get_chatbot_service),
    current_user: dict = Depends(get_current_user)
):
    """Create a new AI chatbot conversation"""
    try:
        conversation = await service.create_conversation(
            user_id=current_user["id"],
            conversation_data=conversation_data
        )
        
        return ConversationResponse(
            id=conversation.id,
            title=conversation.title,
            user_id=conversation.user_id,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=conversation.message_count,
            last_message_at=conversation.last_message_at
        )
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
    service: ChatbotService = Depends(get_chatbot_service),
    current_user: dict = Depends(get_current_user)
):
    """Get all AI chatbot conversations for current user"""
    try:
        conversations = await service.get_conversations(
            user_id=current_user["id"],
            limit=limit,
            skip=skip
        )
        
        return [
            ConversationResponse(
                id=conv.id,
                title=conv.title,
                user_id=conv.user_id,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=conv.message_count,
                last_message_at=conv.last_message_at
            )
            for conv in conversations
        ]
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversations"
        )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    service: ChatbotService = Depends(get_chatbot_service),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific conversation"""
    try:
        conversation = await service.get_conversation(
            conversation_id=conversation_id,
            user_id=current_user["id"]
        )
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return ConversationResponse(
            id=conversation.id,
            title=conversation.title,
            user_id=conversation.user_id,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=conversation.message_count,
            last_message_at=conversation.last_message_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversation"
        )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    service: ChatbotService = Depends(get_chatbot_service),
    current_user: dict = Depends(get_current_user)
):
    """Get messages for a conversation"""
    try:
        # Verify conversation belongs to user
        conversation = await service.get_conversation(
            conversation_id=conversation_id,
            user_id=current_user["id"]
        )
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        messages = await service.get_conversation_messages(
            conversation_id=conversation_id,
            limit=limit,
            skip=skip
        )
        
        return [
            MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                content=msg.content,
                role=msg.role,
                created_at=msg.created_at,
                metadata=msg.metadata
            )
            for msg in messages
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch messages"
        )


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: str,
    message_data: MessageSendRequest,
    request: FastAPIRequest,
    provider: Optional[str] = Query(None, description="LLM provider (openai, ollama, huggingface, fallback)"),
    model: Optional[str] = Query(None, description="Model name to use"),
    service: ChatbotService = Depends(get_chatbot_service),
    current_user: dict = Depends(get_current_user)
):
    """Send a message and get AI response"""
    try:
        # Extract token for ERP data access
        token = current_user.get("token")
        if not token:
            auth_header = request.headers.get("Authorization", "")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header[7:]
        
        # Process user message and generate AI response
        ai_message = await service.process_user_message(
            user_id=current_user["id"],
            conversation_id=conversation_id,
            message_content=message_data.content,
            token=token or "",
            provider=provider,
            model=model
        )
        
        return MessageResponse(
            id=ai_message.id,
            conversation_id=ai_message.conversation_id,
            content=ai_message.content,
            role=ai_message.role,
            created_at=ai_message.created_at,
            metadata=ai_message.metadata
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process message"
        )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    service: ChatbotService = Depends(get_chatbot_service),
    current_user: dict = Depends(get_current_user)
):
    """Delete a conversation"""
    try:
        success = await service.delete_conversation(
            conversation_id=conversation_id,
            user_id=current_user["id"]
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation"
        )


@router.post("/chat", response_model=MessageResponse)
async def quick_chat(
    message: str = Query(..., description="User message"),
    conversation_id: Optional[str] = Query(None, description="Optional conversation ID"),
    provider: Optional[str] = Query(None, description="LLM provider (openai, ollama, huggingface, fallback)"),
    model: Optional[str] = Query(None, description="Model name to use"),
    request: FastAPIRequest = None,
    service: ChatbotService = Depends(get_chatbot_service),
    current_user: dict = Depends(get_current_user)
):
    """Quick chat endpoint - creates conversation if needed and returns response"""
    try:
        # Extract token
        token = current_user.get("token")
        if not token and request:
            auth_header = request.headers.get("Authorization", "")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header[7:]
        
        # Get or create conversation
        if conversation_id:
            conv = await service.get_conversation(conversation_id, current_user["id"])
            if not conv:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
        else:
            conv = await service.create_conversation(current_user["id"])
            conversation_id = conv.id
        
        # Process message
        ai_message = await service.process_user_message(
            user_id=current_user["id"],
            conversation_id=conversation_id,
            message_content=message,
            token=token or "",
            provider=provider,
            model=model
        )
        
        return MessageResponse(
            id=ai_message.id,
            conversation_id=ai_message.conversation_id,
            content=ai_message.content,
            role=ai_message.role,
            created_at=ai_message.created_at,
            metadata=ai_message.metadata
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in quick chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat message"
        )


@router.get("/providers", response_model=dict)
async def get_available_providers(
    current_user: dict = Depends(get_current_user)
):
    """Get list of available LLM providers and models"""
    try:
        providers = LLMProviderFactory.get_available_providers()
        return {
            "providers": providers,
            "default_provider": settings.default_llm_provider
        }
    except Exception as e:
        logger.error(f"Error fetching providers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch providers"
        )

