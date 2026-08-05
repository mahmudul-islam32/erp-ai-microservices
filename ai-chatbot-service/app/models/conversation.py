from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class ConversationBase(BaseModel):
    title: Optional[str] = None
    context: Optional[dict] = {}  # Additional context for the conversation


class ConversationCreate(ConversationBase):
    pass


class ConversationInDB(ConversationBase):
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class Conversation(ConversationInDB):
    pass


class ConversationResponse(BaseModel):
    id: str
    title: Optional[str]
    user_id: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    last_message_at: Optional[datetime]
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

