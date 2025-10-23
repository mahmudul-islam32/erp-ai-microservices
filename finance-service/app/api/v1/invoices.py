from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.invoice import (
    VendorInvoice, VendorInvoiceCreate,
    CustomerInvoice, CustomerInvoiceCreate,
    InvoiceStatus
)
from app.services.invoice_service import InvoiceService
from app.api.dependencies import require_finance_access, require_finance_write
from typing import List, Optional
from datetime import date

router = APIRouter(prefix="/invoices", tags=["Invoices"])


# Vendor Invoices (AP)
@router.post("/vendor", response_model=VendorInvoice, status_code=201)
async def create_vendor_invoice(
    invoice_data: VendorInvoiceCreate,
    current_user=Depends(require_finance_write())
):
    """Create a vendor invoice (Accounts Payable)"""
    try:
        return await InvoiceService.create_vendor_invoice(invoice_data, current_user["id"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/vendor", response_model=List[VendorInvoice])
async def list_vendor_invoices(
    vendor_id: Optional[str] = None,
    status: Optional[InvoiceStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user=Depends(require_finance_access())
):
    """List vendor invoices"""
    return await InvoiceService.list_vendor_invoices(vendor_id, status, skip, limit)


@router.get("/vendor/{invoice_id}", response_model=VendorInvoice)
async def get_vendor_invoice(
    invoice_id: str,
    current_user=Depends(require_finance_access())
):
    """Get vendor invoice by ID"""
    invoice = await InvoiceService.get_vendor_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/vendor/{invoice_id}/pay", response_model=VendorInvoice)
async def pay_vendor_invoice(
    invoice_id: str,
    payment_amount: float,
    payment_date: date,
    payment_method: str,
    bank_account_id: Optional[str] = None,
    current_user=Depends(require_finance_write())
):
    """Record payment for vendor invoice"""
    try:
        return await InvoiceService.pay_vendor_invoice(
            invoice_id, payment_amount, payment_date, payment_method,
            current_user["id"], bank_account_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Customer Invoices (AR)
@router.post("/customer", response_model=CustomerInvoice, status_code=201)
async def create_customer_invoice(
    invoice_data: CustomerInvoiceCreate,
    current_user=Depends(require_finance_write())
):
    """Create a customer invoice (Accounts Receivable)"""
    try:
        return await InvoiceService.create_customer_invoice(invoice_data, current_user["id"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/customer", response_model=List[CustomerInvoice])
async def list_customer_invoices(
    customer_id: Optional[str] = None,
    status: Optional[InvoiceStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user=Depends(require_finance_access())
):
    """List customer invoices"""
    return await InvoiceService.list_customer_invoices(customer_id, status, skip, limit)


@router.get("/customer/{invoice_id}", response_model=CustomerInvoice)
async def get_customer_invoice(
    invoice_id: str,
    current_user=Depends(require_finance_access())
):
    """Get customer invoice by ID"""
    invoice = await InvoiceService.get_customer_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/customer/{invoice_id}/send", response_model=CustomerInvoice)
async def send_customer_invoice(
    invoice_id: str,
    current_user=Depends(require_finance_write())
):
    """Send customer invoice"""
    invoice = await InvoiceService.send_customer_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/customer/{invoice_id}/payment", response_model=CustomerInvoice)
async def record_customer_payment(
    invoice_id: str,
    payment_amount: float,
    payment_date: date,
    payment_method: str,
    current_user=Depends(require_finance_write())
):
    """Record payment from customer"""
    try:
        return await InvoiceService.record_customer_payment(
            invoice_id, payment_amount, payment_date, payment_method, current_user["id"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Aging Reports
@router.get("/aging/{report_type}")
async def get_aging_report(
    report_type: str,  # "customer" or "vendor"
    current_user=Depends(require_finance_access())
):
    """Get aging report for AP or AR"""
    if report_type not in ["customer", "vendor"]:
        raise HTTPException(status_code=400, detail="Invalid report type")
    return await InvoiceService.get_aging_report(report_type)

