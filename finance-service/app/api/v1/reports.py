from fastapi import APIRouter, HTTPException, Depends
from app.services.financial_report_service import FinancialReportService
from app.api.dependencies import require_finance_access
from datetime import date

router = APIRouter(prefix="/reports", tags=["Financial Reports"])


@router.get("/profit-loss")
async def generate_profit_loss(
    period_start: date,
    period_end: date,
    current_user=Depends(require_finance_access())
):
    """Generate Profit & Loss statement"""
    return await FinancialReportService.generate_profit_loss(
        period_start, period_end, current_user["id"]
    )


@router.get("/balance-sheet")
async def generate_balance_sheet(
    as_of_date: date,
    current_user=Depends(require_finance_access())
):
    """Generate Balance Sheet"""
    return await FinancialReportService.generate_balance_sheet(
        as_of_date, current_user["id"]
    )


@router.get("/trial-balance")
async def generate_trial_balance(
    as_of_date: date,
    current_user=Depends(require_finance_access())
):
    """Generate Trial Balance"""
    return await FinancialReportService.generate_trial_balance(
        as_of_date, current_user["id"]
    )

