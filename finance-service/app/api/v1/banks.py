from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.bank import BankAccount, BankAccountCreate, BankTransaction, BankTransactionCreate
from app.services.bank_service import BankService
from app.api.dependencies import require_finance_access, require_finance_write
from typing import List, Optional

router = APIRouter(prefix="/banks", tags=["Bank Management"])


@router.post("/accounts", response_model=BankAccount, status_code=201)
async def create_bank_account(
    account_data: BankAccountCreate,
    current_user=Depends(require_finance_write())
):
    """Create a new bank account"""
    return await BankService.create_bank_account(account_data)


@router.get("/accounts", response_model=List[BankAccount])
async def list_bank_accounts(
    is_active: Optional[bool] = None,
    current_user=Depends(require_finance_access())
):
    """List bank accounts"""
    return await BankService.list_bank_accounts(is_active)


@router.get("/accounts/{account_id}", response_model=BankAccount)
async def get_bank_account(
    account_id: str,
    current_user=Depends(require_finance_access())
):
    """Get bank account by ID"""
    account = await BankService.get_bank_account(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return account


@router.post("/transactions", response_model=BankTransaction, status_code=201)
async def create_bank_transaction(
    transaction_data: BankTransactionCreate,
    current_user=Depends(require_finance_write())
):
    """Create a bank transaction"""
    try:
        return await BankService.create_bank_transaction(transaction_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions", response_model=List[BankTransaction])
async def list_bank_transactions(
    bank_account_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user=Depends(require_finance_access())
):
    """List bank transactions"""
    return await BankService.list_bank_transactions(bank_account_id, skip, limit)

