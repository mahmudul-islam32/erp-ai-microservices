from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from app.models.payment import (
    PaymentCreate, PaymentUpdate, PaymentResponse, RefundCreate, RefundResponse,
    PaymentMethod, PaymentStatus, CashPaymentCreate,
    StripePaymentIntentCreate, StripePaymentConfirm
)
from app.models.pagination import PaginationResponse
from app.services.payment_service import payment_service
from app.services.stripe_service import stripe_service
from app.services.external_services import inventory_service
from app.api.dependencies import (
    get_current_active_user, require_sales_access, require_sales_write, 
    get_token_from_request, require_sales_access_flexible
)
from typing import List, Optional, Union
from datetime import date
import logging
import stripe

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
    payment_data: Union[CashPaymentCreate, PaymentCreate],
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Create a simplified cash payment - automatically updates order status"""
    try:
        logger.info(f"🔄 Cash payment request received: {payment_data.dict()}")
        
        # Convert old PaymentCreate structure to CashPaymentCreate if needed
        if hasattr(payment_data, 'payment_method') and hasattr(payment_data, 'cash_details'):
            # This is the old PaymentCreate structure
            logger.info("🔄 Converting old PaymentCreate structure to CashPaymentCreate")
            cash_payment_data = CashPaymentCreate(
                order_id=payment_data.order_id,
                customer_id=payment_data.customer_id,
                amount=payment_data.amount,
                amount_tendered=payment_data.cash_details.amount_tendered,
                currency=payment_data.currency or "USD",
                notes=payment_data.notes,
                cash_drawer_id=payment_data.cash_details.cash_drawer_id,
                cashier_id=payment_data.cash_details.cashier_id
            )
        else:
            # This is already the new CashPaymentCreate structure
            cash_payment_data = payment_data
        
        # Get user ID
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not available"
            )
        
        # Get token for inventory service calls
        token = await get_token_from_request(request)
        
        # Process the simplified cash payment
        payment = await payment_service.process_simple_cash_payment(cash_payment_data, user_id, token)
        return payment
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Cash payment validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Cash payment creation error: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
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


# ==================== STRIPE PAYMENT ENDPOINTS ====================

@router.get("/stripe/config")
async def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    try:
        return {
            "publishable_key": stripe_service.get_publishable_key()
        }
    except Exception as e:
        logger.error(f"Get Stripe config error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/stripe/create-intent")
async def create_stripe_payment_intent(
    intent_data: StripePaymentIntentCreate,
    current_user=Depends(require_sales_write())
):
    """Create a Stripe payment intent"""
    try:
        logger.info(f"🔄 Creating Stripe payment intent for order: {intent_data.order_id}")
        
        # Verify order exists
        from app.services.sales_order_service import sales_order_service
        order = await sales_order_service.get_order_by_id(intent_data.order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Prepare metadata
        # Convert order to dict if it's a Pydantic model
        order_dict = order if isinstance(order, dict) else order.dict() if hasattr(order, 'dict') else {}
        order_number = order_dict.get("order_number", intent_data.order_id)
        
        metadata = {
            "order_id": intent_data.order_id,
            "order_number": order_number,
            "erp_customer_id": intent_data.customer_id or "",
        }
        
        if intent_data.metadata:
            metadata.update(intent_data.metadata)
        
        # Create payment intent
        result = await stripe_service.create_payment_intent(
            amount=intent_data.amount,
            currency=intent_data.currency,
            metadata=metadata,
            description=intent_data.description or f"Payment for Order {order_number}",
            receipt_email=intent_data.receipt_email
        )
        
        logger.info(f"✅ Payment intent created: {result['payment_intent_id']}")
        
        return {
            "client_secret": result["client_secret"],
            "payment_intent_id": result["payment_intent_id"],
            "publishable_key": stripe_service.get_publishable_key(),
            "amount": result["amount"],
            "currency": result["currency"]
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Error creating payment intent: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment intent: {str(e)}"
        )


@router.post("/stripe/confirm", response_model=PaymentResponse)
async def confirm_stripe_payment(
    confirm_data: StripePaymentConfirm,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Confirm a Stripe payment and create payment record"""
    try:
        logger.info(f"🔄 Confirming Stripe payment: {confirm_data.payment_intent_id}")
        
        # Get user ID
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not available"
            )
        
        # Get token for inventory service calls
        token = await get_token_from_request(request)
        
        # Retrieve payment intent from Stripe
        payment_intent_data = await stripe_service.retrieve_payment_intent(confirm_data.payment_intent_id)
        
        # Check payment status
        if payment_intent_data["status"] not in ["succeeded", "processing"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment not successful. Status: {payment_intent_data['status']}"
            )
        
        # Get order details
        from app.services.sales_order_service import sales_order_service
        order = await sales_order_service.get_order_by_id(confirm_data.order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Create payment record
        from app.models.payment import PaymentGatewayDetails
        
        # Convert order to dict if it's a Pydantic model
        order_dict = order if isinstance(order, dict) else order.dict() if hasattr(order, 'dict') else {}
        customer_id = order_dict.get("customer_id")
        
        gateway_details = PaymentGatewayDetails(
            gateway_name="stripe",
            transaction_id=confirm_data.payment_intent_id,
            stripe_payment_intent_id=confirm_data.payment_intent_id,
            stripe_charge_id=payment_intent_data["charges"][0]["charge_id"] if payment_intent_data.get("charges") else None,
            gateway_response=payment_intent_data,
            processing_fee=None  # Can calculate based on Stripe fees if needed
        )
        
        # Determine payment status based on Stripe payment intent status
        payment_status = PaymentStatus.COMPLETED if payment_intent_data["status"] == "succeeded" else PaymentStatus.PENDING
        
        payment_data = PaymentCreate(
            order_id=confirm_data.order_id,
            customer_id=customer_id,
            payment_method=PaymentMethod.STRIPE,
            amount=payment_intent_data["amount"],
            currency=payment_intent_data["currency"],
            status=payment_status,  # Set status based on Stripe result
            gateway_details=gateway_details,
            reference_number=confirm_data.payment_intent_id,
            notes="Payment processed via Stripe"
        )
        
        # Create payment with correct status
        payment = await payment_service.create_payment(payment_data, user_id)
        
        # Update order status if payment succeeded
        if payment_status == PaymentStatus.COMPLETED:
            from app.services.sales_order_service import sales_order_service
            from app.models.sales_order import OrderStatus
            
            # Update order payment status and order status
            order = await sales_order_service.get_order_by_id(confirm_data.order_id)
            if order:
                # Convert to dict if it's a Pydantic model
                order_dict = order.dict() if hasattr(order, 'dict') else order
                current_status = order_dict.get("status") if isinstance(order_dict, dict) else getattr(order, "status", "draft")
                
                # Update payment status to paid
                await sales_order_service.update_payment_status(
                    confirm_data.order_id,
                    "paid",
                    payment_intent_data["amount"]
                )
                
                # Update order status from draft to confirmed when payment is completed
                if current_status == "draft":
                    await sales_order_service.update_order_status(
                        confirm_data.order_id,
                        "confirmed",
                        user_id
                    )
                    logger.info(f"✅ Order {confirm_data.order_id} updated: payment_status=paid, status={current_status}→confirmed")
                    
                    # Fulfill stock after successful payment
                    if token:
                        try:
                            if order.line_items:
                                logger.info(f"🔄 Fulfilling stock for order {confirm_data.order_id} with {len(order.line_items)} items")
                                fulfilled_count = 0
                                for item in order.line_items:
                                    try:
                                        logger.info(f"Fulfilling stock for product {item.product_id}, quantity {item.quantity}")
                                        fulfilled = await inventory_service.fulfill_stock(
                                            item.product_id,
                                            item.quantity,
                                            confirm_data.order_id,
                                            user_id,
                                            token
                                        )
                                        if fulfilled:
                                            fulfilled_count += 1
                                            logger.info(f"✅ Stock fulfilled for product {item.product_id}")
                                        else:
                                            logger.warning(f"⚠️ Failed to fulfill stock for product {item.product_id}")
                                    except Exception as item_error:
                                        logger.error(f"Failed to fulfill stock for item {item.product_id}: {item_error}")
                                
                                logger.info(f"✅ Stock fulfillment complete: {fulfilled_count}/{len(order.line_items)} items fulfilled")
                        except Exception as stock_error:
                            logger.error(f"Stock fulfillment error: {stock_error}")
                            # Continue anyway - payment is successful
                    else:
                        logger.warning("⚠️ No token available for stock fulfillment - skipping inventory update")
                else:
                    logger.info(f"✅ Order {confirm_data.order_id} payment updated: payment_status=paid, status={current_status} (unchanged)")
        
        logger.info(f"✅ Stripe payment confirmed and recorded: {payment.payment_number}")
        
        return payment
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Error confirming payment: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/stripe/refund/{payment_id}", response_model=RefundResponse)
async def create_stripe_refund(
    payment_id: str,
    refund_data: RefundCreate,
    current_user=Depends(require_sales_write())
):
    """Create a Stripe refund"""
    try:
        logger.info(f"🔄 Creating Stripe refund for payment: {payment_id}")
        
        # Get payment record
        payment = await payment_service.get_payment_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        # Verify it's a Stripe payment
        if payment.payment_method != PaymentMethod.STRIPE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This endpoint only handles Stripe refunds"
            )
        
        # Get Stripe payment intent ID
        if not payment.gateway_details or not payment.gateway_details.stripe_payment_intent_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stripe payment intent ID not found"
            )
        
        # Create refund in Stripe
        stripe_refund = await stripe_service.create_refund(
            payment_intent_id=payment.gateway_details.stripe_payment_intent_id,
            amount=refund_data.amount,
            reason=refund_data.reason,
            metadata={"payment_id": payment_id, "refund_reason": refund_data.reason}
        )
        
        # Create refund record in database
        refund_data.payment_id = payment_id
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        
        refund = await payment_service.create_refund(refund_data, user_id)
        
        logger.info(f"✅ Stripe refund created: {refund.refund_number}")
        
        return refund
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Error creating refund: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events (no authentication required)"""
    try:
        # Get raw body and signature
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        if not sig_header:
            logger.error("❌ Missing Stripe signature header")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature header"
            )
        
        # Verify webhook signature
        try:
            event = stripe_service.verify_webhook_signature(payload, sig_header)
        except ValueError as e:
            logger.error(f"❌ Webhook verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        
        # Handle the event
        result = await stripe_service.handle_webhook_event(event)
        
        # Update payment status based on event
        if result.get("payment_intent_id"):
            try:
                # Find payment by payment_intent_id
                from app.database.connection import get_database
                db = await get_database()
                payment = await db.payments.find_one({
                    "gateway_details.stripe_payment_intent_id": result["payment_intent_id"]
                })
                
                if payment and result.get("status"):
                    # Update payment status
                    payment_id = str(payment["_id"])
                    
                    if result["status"] == "completed":
                        await payment_service.update_payment_status(
                            payment_id, PaymentStatus.COMPLETED, "stripe_webhook"
                        )
                    elif result["status"] == "failed":
                        await payment_service.update_payment_status(
                            payment_id, PaymentStatus.FAILED, "stripe_webhook"
                        )
                    elif result["status"] == "refunded":
                        await payment_service.update_payment_status(
                            payment_id, PaymentStatus.REFUNDED, "stripe_webhook"
                        )
                    elif result["status"] == "cancelled":
                        await payment_service.update_payment_status(
                            payment_id, PaymentStatus.CANCELLED, "stripe_webhook"
                        )
                    
                    logger.info(f"✅ Payment status updated via webhook: {payment_id}")
            except Exception as e:
                logger.error(f"⚠️ Error updating payment from webhook: {e}")
                # Don't raise exception - webhook was processed successfully
        
        logger.info(f"✅ Webhook processed: {result['event_type']}")
        
        return {"received": True, "event_type": result["event_type"]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Webhook processing error: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )


# ==================== END STRIPE ENDPOINTS ====================

@router.get("/daily-summary")
async def get_daily_payments_summary(
    date_filter: Optional[date] = Query(None, description="Date for summary (defaults to today)"),
    current_user=Depends(require_sales_access())
):
    """Get daily payments summary for reporting"""
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
