from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class SessionCreate(BaseModel):
    user_id: str
    ip_address: str
    user_agent: str
    expires_at: datetime


class SessionResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    user_email: str
    ip_address: str
    user_agent: str
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    is_active: bool

    class Config:
        populate_by_name = True


class SessionInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    user_email: EmailStr
    ip_address: str
    user_agent: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    is_active: bool = True

    class Config:
        populate_by_name = True

