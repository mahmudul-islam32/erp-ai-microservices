from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from app.models.payment import (
    PaymentCreate, PaymentUpdate, PaymentResponse, RefundCreate, RefundResponse,
    PaymentMethod, PaymentStatus, POSTransactionCreate, POSTransactionResponse
)
from app.models.pagination import PaginationResponse
from app.services.payment_service import payment_service
from app.api.dependencies import (
    get_current_active_user, require_sales_access, require_sales_write, 
    get_token_from_request, require_sales_access_flexible
)
from typing import List, Optional
from datetime import date
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: PaymentCreate,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Create a new payment"""
    try:
        # Validate payment data
        if payment_data.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount must be greater than 0"
            )
        
        # Get user ID
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            logger.error(f"No user ID found in current_user: {current_user}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not available"
            )
        
        payment = await payment_service.create_payment(payment_data, user_id)
        return payment
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Payment creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/cash", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_cash_payment(
    payment_data: PaymentCreate,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Create a cash payment (POS specific)"""
    try:
        # Ensure payment method is cash
        payment_data.payment_method = PaymentMethod.CASH
        
        # Validate cash payment requirements
        if not payment_data.cash_details:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cash details are required for cash payments"
            )
        
        if payment_data.cash_details.amount_tendered < payment_data.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount tendered cannot be less than payment amount"
            )
        
        # Get user ID
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not available"
            )
        
        payment = await payment_service.process_cash_payment(payment_data, user_id)
        return payment
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Cash payment creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/card", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_card_payment(
    payment_data: PaymentCreate,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Create a card payment (credit/debit)"""
    try:
        # Ensure payment method is card
        if payment_data.payment_method not in [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD]:
            payment_data.payment_method = PaymentMethod.CREDIT_CARD
        
        # Validate card payment requirements
        if not payment_data.card_details:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Card details are required for card payments"
            )
        
        # Get user ID
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not available"
            )
        
        payment = await payment_service.process_card_payment(payment_data, user_id)
        return payment
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Card payment creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/pos-transaction", response_model=POSTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_pos_transaction(
    transaction_data: POSTransactionCreate,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Create a complete POS transaction with order and payments"""
    try:
        # Validate transaction data
        if not transaction_data.line_items or len(transaction_data.line_items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one line item is required"
            )
        
        if not transaction_data.payments or len(transaction_data.payments) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one payment is required"
            )
        
        # Validate total payment amount matches transaction total
        total_payment_amount = sum(payment.amount for payment in transaction_data.payments)
        if total_payment_amount < transaction_data.total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Total payment amount ({total_payment_amount}) is less than transaction total ({transaction_data.total_amount})"
            )
        
        # Get user ID and token
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not available"
            )
        
        token = await get_token_from_request(request)
        
        transaction = await payment_service.process_pos_transaction(transaction_data, user_id, token)
        return transaction
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"POS transaction creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/", response_model=PaginationResponse[PaymentResponse])
async def get_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    payment_method: Optional[PaymentMethod] = None,
    status: Optional[PaymentStatus] = None,
    customer_id: Optional[str] = None,
    order_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    current_user=Depends(require_sales_access_flexible())
):
    """Get list of payments with pagination and filters"""
    try:
        logger.info(f"Getting payments for user: {current_user.get('email')}")
        
        # Get payments and total count
        payments = await payment_service.get_payments(
            skip=skip,
            limit=limit,
            payment_method=payment_method,
            status=status,
            customer_id=customer_id,
            order_id=order_id,
            start_date=start_date,
            end_date=end_date,
            search=search
        )
        
        # Get total count for pagination
        total_count = await payment_service.count_payments(
            payment_method=payment_method,
            status=status,
            customer_id=customer_id,
            order_id=order_id,
            start_date=start_date,
            end_date=end_date,
            search=search
        )
        
        page = (skip // limit) + 1
        total_pages = (total_count + limit - 1) // limit
        
        logger.info(f"Successfully retrieved {len(payments)} payments")
        
        return PaginationResponse(
            items=payments,
            total=total_count,
            page=page,
            limit=limit,
            pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Get payments error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    current_user=Depends(require_sales_access())
):
    """Get payment by ID"""
    try:
        payment = await payment_service.get_payment_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )

        return payment

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get payment error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{payment_id}/refund", response_model=RefundResponse, status_code=status.HTTP_201_CREATED)
async def create_refund(
    payment_id: str,
    refund_data: RefundCreate,
    current_user=Depends(require_sales_write())
):
    """Create a refund for a payment"""
    try:
        # Set payment_id from URL parameter
        refund_data.payment_id = payment_id
        
        # Validate refund data
        if refund_data.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refund amount must be greater than 0"
            )
        
        if not refund_data.reason or refund_data.reason.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refund reason is required"
            )
        
        # Get user ID
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not available"
            )
        
        refund = await payment_service.create_refund(refund_data, user_id)
        return refund
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Refund creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/order/{order_id}/payments", response_model=List[PaymentResponse])
async def get_payments_by_order(
    order_id: str,
    current_user=Depends(require_sales_access())
):
    """Get all payments for a specific order"""
    try:
        payments = await payment_service.get_payments(order_id=order_id)
        return payments
    except Exception as e:
        logger.error(f"Get payments by order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/customer/{customer_id}/payments", response_model=List[PaymentResponse])
async def get_payments_by_customer(
    customer_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user=Depends(require_sales_access())
):
    """Get payments for a specific customer"""
    try:
        payments = await payment_service.get_payments(
            skip=skip,
            limit=limit,
            customer_id=customer_id
        )
        return payments
    except Exception as e:
        logger.error(f"Get payments by customer error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/methods/summary")
async def get_payment_methods_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Get payment methods summary for reporting"""
    try:
        # This would be implemented to return payment method statistics
        # For now, return a simple structure
        return {
            "message": "Payment methods summary endpoint - to be implemented",
            "start_date": start_date,
            "end_date": end_date
        }
    except Exception as e:
        logger.error(f"Get payment methods summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/daily-summary")
async def get_daily_payments_summary(
    date_filter: Optional[date] = Query(None, description="Date for summary (defaults to today)"),
    current_user=Depends(require_sales_access())
):
    """Get daily payments summary for POS reporting"""
    try:
        target_date = date_filter or date.today()
        
        # Get all payments for the date
        payments = await payment_service.get_payments(
            start_date=target_date,
            end_date=target_date
        )
        
        # Calculate summary
        summary = {
            "date": target_date,
            "total_payments": len(payments),
            "total_amount": sum(p.amount for p in payments),
            "completed_payments": len([p for p in payments if p.status == PaymentStatus.COMPLETED]),
            "completed_amount": sum(p.amount for p in payments if p.status == PaymentStatus.COMPLETED),
            "by_method": {}
        }
        
        # Group by payment method
        for payment in payments:
            method = payment.payment_method
            if method not in summary["by_method"]:
                summary["by_method"][method] = {"count": 0, "amount": 0}
            summary["by_method"][method]["count"] += 1
            summary["by_method"][method]["amount"] += payment.amount
        
        return summary
    except Exception as e:
        logger.error(f"Get daily payments summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
