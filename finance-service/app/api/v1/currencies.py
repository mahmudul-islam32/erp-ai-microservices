from fastapi import APIRouter, HTTPException, Depends
from app.models.currency import Currency, CurrencyCreate, CurrencyRate, CurrencyRateCreate, CurrencyConversion
from app.services.currency_service import CurrencyService
from app.api.dependencies import require_finance_access, require_finance_admin
from typing import List, Optional
from datetime import date

router = APIRouter(prefix="/currencies", tags=["Multi-Currency"])


@router.post("/", response_model=Currency, status_code=201)
async def create_currency(
    currency_data: CurrencyCreate,
    current_user=Depends(require_finance_admin())
):
    """Create a new currency"""
    try:
        return await CurrencyService.create_currency(currency_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[Currency])
async def list_currencies(
    is_active: Optional[bool] = None,
    current_user=Depends(require_finance_access())
):
    """List currencies"""
    return await CurrencyService.list_currencies(is_active)


@router.post("/rates", response_model=CurrencyRate, status_code=201)
async def create_currency_rate(
    rate_data: CurrencyRateCreate,
    current_user=Depends(require_finance_admin())
):
    """Create or update currency exchange rate"""
    return await CurrencyService.create_currency_rate(rate_data)


@router.get("/convert")
async def convert_currency(
    amount: float,
    from_currency: str,
    to_currency: str,
    conversion_date: Optional[date] = None,
    current_user=Depends(require_finance_access())
):
    """Convert amount from one currency to another"""
    try:
        return await CurrencyService.convert_currency(amount, from_currency, to_currency, conversion_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/seed-defaults")
async def seed_default_currencies(
    current_user=Depends(require_finance_admin())
):
    """Seed default currencies"""
    await CurrencyService.seed_default_currencies()
    return {"message": "Default currencies seeded successfully"}

