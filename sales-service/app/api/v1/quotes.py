from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from app.models import (
    QuoteCreate, QuoteUpdate, QuoteResponse, QuoteStatus
)
from app.services import quote_service
from app.api.dependencies import (
    get_current_active_user, require_sales_access, require_sales_write, get_token_from_request
)
from typing import List, Optional
from datetime import date
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quotes", tags=["Quotes"])


@router.post("/", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_quote(
    quote_data: QuoteCreate,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Create a new quote"""
    try:
        token = await get_token_from_request(request)
        quote = await quote_service.create_quote(quote_data, current_user["id"], token)
        return quote
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Quote creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/", response_model=List[QuoteResponse])
async def get_quotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[QuoteStatus] = None,
    customer_id: Optional[str] = None,
    sales_rep_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    current_user=Depends(require_sales_access())
):
    """Get list of quotes with pagination and filters"""
    try:
        quotes = await quote_service.get_quotes(
            skip=skip,
            limit=limit,
            status=status,
            customer_id=customer_id,
            sales_rep_id=sales_rep_id,
            start_date=start_date,
            end_date=end_date,
            search=search
        )
        return quotes
    except Exception as e:
        logger.error(f"Get quotes error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{quote_id}", response_model=QuoteResponse)
async def get_quote(
    quote_id: str,
    current_user=Depends(require_sales_access())
):
    """Get quote by ID"""
    try:
        quote = await quote_service.get_quote_by_id(quote_id)
        if not quote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quote not found"
            )

        return QuoteResponse(**quote.dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get quote error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{quote_id}", response_model=QuoteResponse)
async def update_quote(
    quote_id: str,
    quote_update: QuoteUpdate,
    current_user=Depends(require_sales_write())
):
    """Update quote"""
    try:
        quote = await quote_service.update_quote(quote_id, quote_update, current_user["id"])
        if not quote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quote not found"
            )

        return quote

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update quote error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{quote_id}/send")
async def send_quote(
    quote_id: str,
    current_user=Depends(require_sales_write())
):
    """Send quote to customer via email"""
    try:
        success = await quote_service.send_quote(quote_id, current_user["id"])
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to send quote"
            )

        return {"message": "Quote sent successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send quote error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{quote_id}/accept")
async def accept_quote(
    quote_id: str,
    current_user=Depends(require_sales_write())
):
    """Accept quote and convert to sales order"""
    try:
        order = await quote_service.accept_quote(quote_id, current_user["id"])
        if not order:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to accept quote"
            )

        return {"message": "Quote accepted and converted to sales order", "order_id": order.id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Accept quote error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{quote_id}/reject")
async def reject_quote(
    quote_id: str,
    reason: Optional[str] = None,
    current_user=Depends(require_sales_write())
):
    """Reject quote"""
    try:
        success = await quote_service.reject_quote(quote_id, current_user["id"], reason)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quote not found"
            )

        return {"message": "Quote rejected"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reject quote error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/number/{quote_number}", response_model=QuoteResponse)
async def get_quote_by_number(
    quote_number: str,
    current_user=Depends(require_sales_access())
):
    """Get quote by quote number"""
    try:
        quote = await quote_service.get_quote_by_number(quote_number)
        if not quote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quote not found"
            )

        return QuoteResponse(**quote.dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get quote by number error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{quote_id}/duplicate", response_model=QuoteResponse)
async def duplicate_quote(
    quote_id: str,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Duplicate an existing quote"""
    try:
        token = await get_token_from_request(request)
        quote = await quote_service.duplicate_quote(quote_id, current_user["id"], token)
        if not quote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quote not found"
            )

        return quote

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Duplicate quote error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{quote_id}/pdf")
async def download_quote_pdf(
    quote_id: str,
    current_user=Depends(require_sales_access())
):
    """Download quote as PDF"""
    try:
        pdf_data = await quote_service.generate_quote_pdf(quote_id)
        if not pdf_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quote not found"
            )

        from fastapi.responses import Response
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=quote-{quote_id}.pdf"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download quote PDF error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
