from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime, date
from enum import Enum
from bson import ObjectId


class JournalEntryStatus(str, Enum):
    DRAFT = "draft"
    POSTED = "posted"
    REVERSED = "reversed"


class JournalLineItem(BaseModel):
    account_id: str = Field(..., description="Account ID")
    account_code: str
    account_name: str
    debit_amount: float = 0.0
    credit_amount: float = 0.0
    description: Optional[str] = None
    cost_center: Optional[str] = None


class JournalEntryBase(BaseModel):
    entry_date: date
    reference: Optional[str] = None
    description: str
    line_items: List[JournalLineItem]

    @field_validator('line_items')
    @classmethod
    def validate_balanced_entry(cls, v):
        total_debit = sum(item.debit_amount for item in v)
        total_credit = sum(item.credit_amount for item in v)
        
        if abs(total_debit - total_credit) > 0.01:
            raise ValueError(f"Journal entry must be balanced. Debit: {total_debit}, Credit: {total_credit}")
        
        if len(v) < 2:
            raise ValueError("Journal entry must have at least 2 line items")
        
        return v


class JournalEntryCreate(JournalEntryBase):
    pass


class JournalEntry(JournalEntryBase):
    id: str = Field(alias="_id")
    entry_number: str = Field(..., description="Auto-generated entry number (JE-2024-001)")
    total_debit: float
    total_credit: float
    status: JournalEntryStatus = JournalEntryStatus.DRAFT
    created_by: str
    created_at: datetime
    updated_at: datetime
    posted_at: Optional[datetime] = None
    posted_by: Optional[str] = None
    reversed_entry_id: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

