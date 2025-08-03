from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"
    CUSTOMER = "customer"
    VENDOR = "vendor"


class Permission(str, Enum):
    # User Management
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    
    # Inventory Management
    INVENTORY_CREATE = "inventory:create"
    INVENTORY_READ = "inventory:read"
    INVENTORY_UPDATE = "inventory:update"
    INVENTORY_DELETE = "inventory:delete"
    
    # Sales Management
    SALES_CREATE = "sales:create"
    SALES_READ = "sales:read"
    SALES_UPDATE = "sales:update"
    SALES_DELETE = "sales:delete"
    
    # Finance Management
    FINANCE_CREATE = "finance:create"
    FINANCE_READ = "finance:read"
    FINANCE_UPDATE = "finance:update"
    FINANCE_DELETE = "finance:delete"
    
    # HR Management
    HR_CREATE = "hr:create"
    HR_READ = "hr:read"
    HR_UPDATE = "hr:update"
    HR_DELETE = "hr:delete"
    
    # AI Features
    AI_ACCESS = "ai:access"
    AI_ADMIN = "ai:admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


# Pydantic Models for API
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    role: UserRole = UserRole.EMPLOYEE
    department: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    role: Optional[UserRole] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[UserStatus] = None


class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    department: Optional[str] = None
    phone: Optional[str] = None
    status: UserStatus
    permissions: List[Permission]
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        populate_by_name = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    permissions: List[Permission] = []


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


# Database Models
class UserInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    hashed_password: str
    first_name: str
    last_name: str
    role: UserRole
    department: Optional[str] = None
    phone: Optional[str] = None
    status: UserStatus = UserStatus.ACTIVE
    permissions: List[Permission] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None

    class Config:
        populate_by_name = True
