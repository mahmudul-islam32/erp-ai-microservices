from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.models import (
    SalesOrderCreate, SalesOrderResponse, InvoiceResponse, PaymentResponse,
    PaymentMethod, PaymentCreate, OrderStatus, InvoiceStatus, PaymentStatus
)
from app.models.pos import (
    POSTransactionCreate, POSTransactionResponse, POSReceiptResponse,
    POSSessionCreate, POSSessionResponse, POSSessionSummary,
    QuickSaleCreate, QuickSaleResponse
)
from app.services import (
    sales_order_service, invoice_service, payment_service,
    pos_service, customer_service
)
from app.api.dependencies import (
    get_current_active_user, require_sales_write, get_token_from_request
)
from typing import List, Optional
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pos", tags=["Point of Sale"])


@router.post("/transactions", response_model=POSTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_pos_transaction(
    transaction_data: POSTransactionCreate,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """
    Create a complete POS transaction (Order + Payment + Invoice)
    This is the main POS endpoint that handles the entire sale process
    """
    try:
        token = await get_token_from_request(request)
        
        # Create the complete POS transaction
        transaction = await pos_service.create_pos_transaction(
            transaction_data, 
            current_user["id"], 
            token
        )
        
        return transaction
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"POS transaction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/quick-sale", response_model=QuickSaleResponse, status_code=status.HTTP_201_CREATED)
async def quick_sale(
    sale_data: QuickSaleCreate,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """
    Process a quick sale for walk-in customers
    Automatically creates customer, order, processes payment, and generates receipt
    """
    try:
        token = await get_token_from_request(request)
        
        # Process the quick sale
        sale = await pos_service.process_quick_sale(
            sale_data,
            current_user["id"],
            token
        )
        
        return sale
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Quick sale error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/sessions", response_model=POSSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_pos_session(
    session_data: POSSessionCreate,
    current_user=Depends(require_sales_write())
):
    """Start a new POS session"""
    try:
        session = await pos_service.start_session(session_data, current_user["id"])
        return session
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Start POS session error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/sessions/{session_id}/close", response_model=POSSessionSummary)
async def close_pos_session(
    session_id: str,
    closing_cash_amount: float,
    current_user=Depends(require_sales_write())
):
    """Close a POS session and generate summary"""
    try:
        summary = await pos_service.close_session(
            session_id, 
            closing_cash_amount, 
            current_user["id"]
        )
        
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="POS session not found"
            )
            
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Close POS session error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/sessions/active", response_model=Optional[POSSessionResponse])
async def get_active_session(
    terminal_id: Optional[str] = None,
    current_user=Depends(require_sales_write())
):
    """Get active POS session for current user or terminal"""
    try:
        session = await pos_service.get_active_session(
            user_id=current_user["id"],
            terminal_id=terminal_id
        )
        return session
        
    except Exception as e:
        logger.error(f"Get active session error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/sessions/{session_id}/summary", response_model=POSSessionSummary)
async def get_session_summary(
    session_id: str,
    current_user=Depends(require_sales_write())
):
    """Get POS session summary"""
    try:
        summary = await pos_service.get_session_summary(session_id)
        
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="POS session not found"
            )
            
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get session summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/transactions/{transaction_id}/receipt", response_model=POSReceiptResponse)
async def get_transaction_receipt(
    transaction_id: str,
    current_user=Depends(require_sales_write())
):
    """Get printable receipt for a POS transaction"""
    try:
        receipt = await pos_service.generate_receipt(transaction_id)
        
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
            
        return receipt
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get receipt error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/transactions/{transaction_id}/refund")
async def process_refund(
    transaction_id: str,
    refund_amount: float,
    reason: str,
    refund_method: PaymentMethod,
    current_user=Depends(require_sales_write())
):
    """Process a refund for a POS transaction"""
    try:
        refund = await pos_service.process_refund(
            transaction_id,
            refund_amount,
            reason,
            refund_method,
            current_user["id"]
        )
        
        if not refund:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found or cannot be refunded"
            )
            
        return {"message": "Refund processed successfully", "refund": refund}
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Process refund error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/transactions/today", response_model=List[POSTransactionResponse])
async def get_today_transactions(
    current_user=Depends(require_sales_write())
):
    """Get all POS transactions for today"""
    try:
        today = date.today()
        transactions = await pos_service.get_transactions_by_date(
            start_date=today,
            end_date=today,
            cashier_id=current_user["id"]
        )
        
        return transactions
        
    except Exception as e:
        logger.error(f"Get today transactions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/daily-summary", response_model=dict)
async def get_daily_summary(
    target_date: Optional[date] = None,
    current_user=Depends(require_sales_write())
):
    """Get daily sales summary for POS"""
    try:
        summary_date = target_date or date.today()
        summary = await pos_service.get_daily_summary(
            summary_date,
            cashier_id=current_user["id"]
        )
        
        return summary
        
    except Exception as e:
        logger.error(f"Get daily summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/cash-drawer/open")
async def open_cash_drawer(
    reason: str,
    current_user=Depends(require_sales_write())
):
    """Open cash drawer (no sale)"""
    try:
        result = await pos_service.open_cash_drawer(
            reason=reason,
            user_id=current_user["id"]
        )
        
        return {"message": "Cash drawer opened", "timestamp": result}
        
    except Exception as e:
        logger.error(f"Open cash drawer error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/payment-methods", response_model=List[dict])
async def get_available_payment_methods():
    """Get available payment methods for POS"""
    try:
        methods = [
            {"value": PaymentMethod.CASH, "label": "Cash", "icon": "cash"},
            {"value": PaymentMethod.CREDIT_CARD, "label": "Credit Card", "icon": "credit-card"},
            {"value": PaymentMethod.DEBIT_CARD, "label": "Debit Card", "icon": "credit-card"},
            {"value": PaymentMethod.DIGITAL_WALLET, "label": "Digital Wallet", "icon": "mobile"},
            {"value": PaymentMethod.GIFT_CARD, "label": "Gift Card", "icon": "gift"},
            {"value": PaymentMethod.STORE_CREDIT, "label": "Store Credit", "icon": "store"}
        ]
        
        return methods
        
    except Exception as e:
        logger.error(f"Get payment methods error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/void-transaction/{transaction_id}")
async def void_transaction(
    transaction_id: str,
    reason: str,
    current_user=Depends(require_sales_write())
):
    """Void a POS transaction (must be same day)"""
    try:
        result = await pos_service.void_transaction(
            transaction_id,
            reason,
            current_user["id"]
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found or cannot be voided"
            )
            
        return {"message": "Transaction voided successfully"}
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Void transaction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
