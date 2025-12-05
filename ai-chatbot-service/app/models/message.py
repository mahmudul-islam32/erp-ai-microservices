from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
from bson import ObjectId


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageBase(BaseModel):
    content: str
    role: MessageRole
    metadata: Optional[Dict[str, Any]] = {}


class MessageCreate(MessageBase):
    conversation_id: Optional[str] = None  # Optional since it comes from URL path


class MessageSendRequest(BaseModel):
    """Request model for sending a message (conversation_id from URL path)"""
    content: str
    role: str = "user"  # Accept string, defaults to "user"


class MessageInDB(MessageBase):
    id: str = Field(alias="_id")
    conversation_id: str
    user_id: str
    created_at: datetime
    tokens_used: Optional[int] = None
    processing_time_ms: Optional[float] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class Message(MessageInDB):
    pass


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    content: str
    role: MessageRole
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = {}
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

