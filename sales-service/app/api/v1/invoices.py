from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from app.models import (
    InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceStatus, PaymentStatus
)
from app.services import invoice_service
from app.api.dependencies import (
    get_current_active_user, require_sales_access, require_sales_write, get_token_from_request
)
from typing import List, Optional
from datetime import date
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.post("/", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_data: InvoiceCreate,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Create a new invoice"""
    try:
        token = await get_token_from_request(request)
        invoice = await invoice_service.create_invoice(invoice_data, current_user["id"], token)
        return invoice
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Invoice creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/", response_model=List[InvoiceResponse])
async def get_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[InvoiceStatus] = None,
    payment_status: Optional[PaymentStatus] = None,
    customer_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    overdue_only: bool = False,
    search: Optional[str] = None,
    current_user=Depends(require_sales_access())
):
    """Get list of invoices with pagination and filters"""
    try:
        invoices = await invoice_service.get_invoices(
            skip=skip,
            limit=limit,
            status=status,
            payment_status=payment_status,
            customer_id=customer_id,
            start_date=start_date,
            end_date=end_date,
            overdue_only=overdue_only,
            search=search
        )
        return invoices
    except Exception as e:
        logger.error(f"Get invoices error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    current_user=Depends(require_sales_access())
):
    """Get invoice by ID"""
    try:
        invoice = await invoice_service.get_invoice_by_id(invoice_id)
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )

        return InvoiceResponse(**invoice.dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get invoice error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: str,
    invoice_update: InvoiceUpdate,
    current_user=Depends(require_sales_write())
):
    """Update invoice"""
    try:
        invoice = await invoice_service.update_invoice(invoice_id, invoice_update, current_user["id"])
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )

        return invoice

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update invoice error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{invoice_id}/send")
async def send_invoice(
    invoice_id: str,
    current_user=Depends(require_sales_write())
):
    """Send invoice to customer via email"""
    try:
        success = await invoice_service.send_invoice(invoice_id, current_user["id"])
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to send invoice"
            )

        return {"message": "Invoice sent successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send invoice error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{invoice_id}/payments")
async def record_payment(
    invoice_id: str,
    amount: float,
    payment_method: str,
    reference: Optional[str] = None,
    notes: Optional[str] = None,
    current_user=Depends(require_sales_write())
):
    """Record a payment for an invoice"""
    try:
        success = await invoice_service.record_payment(
            invoice_id, amount, payment_method, reference, notes, current_user["id"]
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to record payment"
            )

        return {"message": "Payment recorded successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Record payment error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/number/{invoice_number}", response_model=InvoiceResponse)
async def get_invoice_by_number(
    invoice_number: str,
    current_user=Depends(require_sales_access())
):
    """Get invoice by invoice number"""
    try:
        invoice = await invoice_service.get_invoice_by_number(invoice_number)
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )

        return InvoiceResponse(**invoice.dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get invoice by number error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/from-order/{order_id}", response_model=InvoiceResponse)
async def create_invoice_from_order(
    order_id: str,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Create invoice from sales order"""
    try:
        token = await get_token_from_request(request)
        invoice = await invoice_service.create_invoice_from_order(order_id, current_user["id"], token)
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found"
            )

        return invoice

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create invoice from order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: str,
    current_user=Depends(require_sales_access())
):
    """Download invoice as PDF"""
    try:
        pdf_data = await invoice_service.generate_invoice_pdf(invoice_id)
        if not pdf_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )

        from fastapi.responses import Response
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice-{invoice_id}.pdf"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download invoice PDF error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/overdue/list", response_model=List[InvoiceResponse])
async def get_overdue_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user=Depends(require_sales_access())
):
    """Get list of overdue invoices"""
    try:
        invoices = await invoice_service.get_invoices(
            skip=skip,
            limit=limit,
            overdue_only=True
        )
        return invoices
    except Exception as e:
        logger.error(f"Get overdue invoices error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{invoice_id}/void")
async def void_invoice(
    invoice_id: str,
    reason: Optional[str] = None,
    current_user=Depends(require_sales_write())
):
    """Void an invoice"""
    try:
        success = await invoice_service.void_invoice(invoice_id, current_user["id"], reason)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found or cannot be voided"
            )

        return {"message": "Invoice voided successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Void invoice error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
