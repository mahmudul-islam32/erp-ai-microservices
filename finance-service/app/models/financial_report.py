from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime, date
from enum import Enum
from bson import ObjectId


class ReportType(str, Enum):
    PROFIT_LOSS = "profit_loss"
    BALANCE_SHEET = "balance_sheet"
    CASH_FLOW = "cash_flow"
    TRIAL_BALANCE = "trial_balance"
    GENERAL_LEDGER = "general_ledger"
    AGING_SUMMARY = "aging_summary"
    BUDGET_VS_ACTUAL = "budget_vs_actual"


class FinancialReportBase(BaseModel):
    report_type: ReportType
    period_start: date
    period_end: date
    report_data: Dict[str, Any]
    format: str = "json"  # json, pdf, excel
    filters: Optional[Dict[str, Any]] = None


class FinancialReportCreate(FinancialReportBase):
    pass


class FinancialReport(FinancialReportBase):
    id: str = Field(alias="_id")
    generated_by: str
    generated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

