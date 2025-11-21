from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AuditAction(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGE = "password_change"
    USER_CREATE = "user:create"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    PERMISSION_UPDATE = "permission:update"
    ROLE_UPDATE = "role:update"
    SESSION_TERMINATE = "session:terminate"


class AuditStatus(str, Enum):
    SUCCESS = "success"
    FAILURE = "failure"


class AuditLogCreate(BaseModel):
    user_id: str
    user_email: EmailStr
    action: AuditAction
    resource: str
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: str
    user_agent: str
    status: AuditStatus = AuditStatus.SUCCESS


class AuditLogResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    user_email: str
    action: str
    resource: str
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: str
    user_agent: str
    timestamp: datetime
    status: str

    class Config:
        populate_by_name = True


class AuditLogInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    user_email: EmailStr
    action: AuditAction
    resource: str
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: str
    user_agent: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: AuditStatus = AuditStatus.SUCCESS

    class Config:
        populate_by_name = True


class AuditLogFilters(BaseModel):
    user_id: Optional[str] = None
    action: Optional[str] = None
    resource: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    skip: int = 0
    limit: int = 100

