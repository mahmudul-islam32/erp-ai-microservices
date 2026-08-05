from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi import Request as FastAPIRequest
from typing import List, Optional
import logging

from app.models.message import MessageResponse, MessageSendRequest
from app.models.conversation import ConversationCreate, ConversationResponse
from app.models.knowledge_base import DocumentIngestRequest, DocumentIngestResponse, KnowledgeChunkResponse
from app.services.chatbot_service import ChatbotService
from app.services.rag_service import RAGService
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


def get_rag_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> RAGService:
    """Dependency to get RAG service instance"""
    if not settings.enable_rag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RAG is not enabled"
        )
    return RAGService(db)


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


# Knowledge Base (RAG) Endpoints
@router.post("/knowledge-base/ingest", response_model=DocumentIngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_document(
    document: DocumentIngestRequest,
    rag_service: RAGService = Depends(get_rag_service),
    current_user: dict = Depends(get_current_user)
):
    """Ingest a document into the knowledge base"""
    try:
        document_id, chunks_created = await rag_service.ingest_document(
            content=document.content,
            source=document.source,
            source_id=document.source_id,
            metadata=document.metadata,
            tags=document.tags,
            user_id=current_user["id"],
            chunk_size=document.chunk_size,
            chunk_overlap=document.chunk_overlap
        )
        
        return DocumentIngestResponse(
            document_id=document_id,
            chunks_created=chunks_created,
            message=f"Document ingested successfully. Created {chunks_created} chunks."
        )
    except Exception as e:
        logger.error(f"Error ingesting document: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest document: {str(e)}"
        )


@router.get("/knowledge-base/search", response_model=List[KnowledgeChunkResponse])
async def search_knowledge_base(
    query: str = Query(..., description="Search query"),
    limit: int = Query(5, ge=1, le=20, description="Maximum number of results"),
    threshold: float = Query(0.7, ge=0.0, le=1.0, description="Minimum similarity score"),
    source: Optional[str] = Query(None, description="Filter by source"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    rag_service: RAGService = Depends(get_rag_service),
    current_user: dict = Depends(get_current_user)
):
    """Search the knowledge base for similar chunks"""
    try:
        tags_filter = [tag.strip() for tag in tags.split(",")] if tags else None
        
        chunks = await rag_service.search_similar_chunks(
            query=query,
            limit=limit,
            threshold=threshold,
            source_filter=source,
            tags_filter=tags_filter,
            user_id=current_user["id"]
        )
        
        return chunks
    except Exception as e:
        logger.error(f"Error searching knowledge base: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search knowledge base"
        )


@router.get("/knowledge-base/document/{source_id}", response_model=List[KnowledgeChunkResponse])
async def get_document_chunks(
    source_id: str,
    rag_service: RAGService = Depends(get_rag_service),
    current_user: dict = Depends(get_current_user)
):
    """Get all chunks for a specific document"""
    try:
        chunks = await rag_service.get_document_chunks(
            source_id=source_id,
            user_id=current_user["id"]
        )
        
        return chunks
    except Exception as e:
        logger.error(f"Error getting document chunks: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get document chunks"
        )


@router.delete("/knowledge-base/document/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    source_id: str,
    rag_service: RAGService = Depends(get_rag_service),
    current_user: dict = Depends(get_current_user)
):
    """Delete a document and all its chunks from the knowledge base"""
    try:
        deleted_count = await rag_service.delete_document(
            source_id=source_id,
            user_id=current_user["id"]
        )
        
        if deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document"
        )


@router.get("/knowledge-base/stats", response_model=dict)
async def get_knowledge_base_stats(
    rag_service: RAGService = Depends(get_rag_service),
    current_user: dict = Depends(get_current_user)
):
    """Get statistics about the knowledge base"""
    try:
        stats = await rag_service.get_knowledge_base_stats(user_id=current_user["id"])
        return stats
    except Exception as e:
        logger.error(f"Error getting knowledge base stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get knowledge base stats"
        )

