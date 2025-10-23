from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    """Message types"""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"


class MessageBase(BaseModel):
    """Base message schema"""
    content: str = Field(..., min_length=1, max_length=5000)
    message_type: MessageType = MessageType.TEXT
    metadata: Optional[Dict[str, Any]] = None


class MessageCreate(MessageBase):
    """Schema for creating a message"""
    conversation_id: str
    sender_id: Optional[str] = None  # Will be set automatically from JWT token
    

class MessageUpdate(BaseModel):
    """Schema for updating a message"""
    content: Optional[str] = None
    is_edited: Optional[bool] = None


class MessageInDB(MessageBase):
    """Schema for message in database"""
    id: str = Field(alias="_id")
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_email: str
    is_read: bool = False
    is_edited: bool = False
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime
    read_by: List[str] = []  # List of user IDs who have read the message
    
    class Config:
        populate_by_name = True


class MessageResponse(MessageInDB):
    """Schema for message response"""
    pass


class ConversationBase(BaseModel):
    """Base conversation schema"""
    name: Optional[str] = None
    is_group: bool = False
    metadata: Optional[Dict[str, Any]] = None


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation"""
    participant_ids: List[str] = Field(..., min_items=1)  # At least 1 other participant (creator is added automatically)


class ConversationInDB(ConversationBase):
    """Schema for conversation in database"""
    id: str = Field(alias="_id")
    participant_ids: List[str]
    participant_details: List[Dict[str, Any]] = []  # Cached participant info
    created_by: str
    created_at: datetime
    updated_at: datetime
    last_message: Optional[Dict[str, Any]] = None
    last_message_at: Optional[datetime] = None
    unread_count: Dict[str, int] = {}  # user_id -> count mapping
    
    class Config:
        populate_by_name = True


class ConversationResponse(ConversationInDB):
    """Schema for conversation response"""
    pass

