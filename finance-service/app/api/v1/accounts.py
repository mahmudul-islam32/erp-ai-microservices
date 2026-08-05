from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.account import Account, AccountCreate, AccountUpdate, AccountType
from app.services.account_service import AccountService
from app.api.dependencies import require_finance_access, require_finance_admin
from typing import List, Optional

router = APIRouter(prefix="/accounts", tags=["Chart of Accounts"])


@router.post("/", response_model=Account, status_code=201)
async def create_account(
    account_data: AccountCreate,
    current_user=Depends(require_finance_admin())
):
    """Create a new account"""
    try:
        return await AccountService.create_account(account_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[Account])
async def list_accounts(
    account_type: Optional[AccountType] = None,
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user=Depends(require_finance_access())
):
    """List accounts with filters"""
    return await AccountService.list_accounts(account_type, is_active, skip, limit)


@router.get("/hierarchy")
async def get_account_hierarchy(
    current_user=Depends(require_finance_access())
):
    """Get account hierarchy tree"""
    return await AccountService.get_account_hierarchy()


@router.get("/code/{account_code}", response_model=Account)
async def get_account_by_code(
    account_code: str,
    current_user=Depends(require_finance_access())
):
    """Get account by code"""
    account = await AccountService.get_account_by_code(account_code)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.get("/{account_id}", response_model=Account)
async def get_account(
    account_id: str,
    current_user=Depends(require_finance_access())
):
    """Get account by ID"""
    account = await AccountService.get_account(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=Account)
async def update_account(
    account_id: str,
    account_data: AccountUpdate,
    current_user=Depends(require_finance_admin())
):
    """Update account"""
    account = await AccountService.update_account(account_id, account_data)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.delete("/{account_id}")
async def delete_account(
    account_id: str,
    current_user=Depends(require_finance_admin())
):
    """Delete account (soft delete)"""
    try:
        success = await AccountService.delete_account(account_id)
        if not success:
            raise HTTPException(status_code=404, detail="Account not found")
        return {"message": "Account deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/seed-defaults")
async def seed_default_accounts(
    current_user=Depends(require_finance_admin())
):
    """Seed default chart of accounts"""
    await AccountService.seed_default_accounts()
    return {"message": "Default accounts seeded successfully"}

