from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.journal_entry import JournalEntry, JournalEntryCreate, JournalEntryStatus
from app.services.journal_entry_service import JournalEntryService
from app.api.dependencies import require_finance_access, require_finance_write
from typing import List, Optional
from datetime import date

router = APIRouter(prefix="/journal-entries", tags=["Journal Entries"])


@router.post("/", response_model=JournalEntry, status_code=201)
async def create_journal_entry(
    entry_data: JournalEntryCreate,
    current_user=Depends(require_finance_write())
):
    """Create a new journal entry"""
    try:
        return await JournalEntryService.create_journal_entry(entry_data, current_user["id"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[JournalEntry])
async def list_journal_entries(
    status: Optional[JournalEntryStatus] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user=Depends(require_finance_access())
):
    """List journal entries with filters"""
    return await JournalEntryService.list_journal_entries(status, start_date, end_date, skip, limit)


@router.get("/{entry_id}", response_model=JournalEntry)
async def get_journal_entry(
    entry_id: str,
    current_user=Depends(require_finance_access())
):
    """Get journal entry by ID"""
    entry = await JournalEntryService.get_journal_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry


@router.post("/{entry_id}/post", response_model=JournalEntry)
async def post_journal_entry(
    entry_id: str,
    current_user=Depends(require_finance_write())
):
    """Post a journal entry"""
    try:
        return await JournalEntryService.post_journal_entry(entry_id, current_user["id"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{entry_id}/reverse", response_model=JournalEntry)
async def reverse_journal_entry(
    entry_id: str,
    reason: str,
    current_user=Depends(require_finance_write())
):
    """Reverse a posted journal entry"""
    try:
        return await JournalEntryService.reverse_journal_entry(entry_id, current_user["id"], reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/ledger/general")
async def get_general_ledger(
    account_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_finance_access())
):
    """Get general ledger report"""
    return await JournalEntryService.get_general_ledger(account_id, start_date, end_date)

