from fastapi import APIRouter, HTTPException, status, Request, Header
from fastapi.responses import JSONResponse
from typing import Optional
import logging
import httpx

from app.models.payment import (
    PaymentIntentCreate,
    PaymentIntentResponse,
    PaymentStatusResponse
)
from app.services.stripe_service import stripe_service
from app.api.dependencies import get_current_user, get_token_from_request
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/create-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    intent_data: PaymentIntentCreate,
    request: Request
):
    """
    Create a Stripe payment intent
    
    This endpoint creates a payment intent in Stripe and returns the client secret
    needed to complete the payment on the frontend.
    """
    try:
        # Optional: Verify authentication
        # current_user = await get_current_user(request)
        
        logger.info(f"🔄 Creating Stripe payment intent: amount=${intent_data.amount}")
        
        # Prepare metadata
        metadata = {
            "order_id": intent_data.order_id or "",
            "customer_id": intent_data.customer_id or "",
        }
        
        if intent_data.metadata:
            metadata.update(intent_data.metadata)
        
        # Create payment intent
        result = await stripe_service.create_payment_intent(
            amount=intent_data.amount,
            currency=intent_data.currency,
            metadata=metadata,
            description=intent_data.description or f"Payment for Order {intent_data.order_id or 'N/A'}",
            receipt_email=intent_data.receipt_email
        )
        
        logger.info(f"✅ Payment intent created: {result['payment_intent_id']}")
        
        return PaymentIntentResponse(
            payment_intent_id=result["payment_intent_id"],
            client_secret=result["client_secret"],
            amount=result["amount"],
            amount_cents=result["amount_cents"],
            currency=result["currency"],
            status=result["status"],
            publishable_key=stripe_service.get_publishable_key(),
            requires_action=result.get("requires_action", False),
            next_action=result.get("next_action")
        )
        
    except ValueError as e:
        logger.error(f"❌ Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Error creating payment intent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment intent: {str(e)}"
        )


@router.get("/status/{payment_intent_id}", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_intent_id: str,
    request: Request
):
    """
    Get payment status for a payment intent
    
    This endpoint retrieves the current status of a payment intent from Stripe.
    """
    try:
        # Optional: Verify authentication
        # current_user = await get_current_user(request)
        
        logger.info(f"🔄 Retrieving payment status: {payment_intent_id}")
        
        # Retrieve payment status
        result = await stripe_service.get_payment_status(payment_intent_id)
        
        logger.info(f"✅ Payment status retrieved: {payment_intent_id} - {result['status']}")
        
        return PaymentStatusResponse(
            payment_intent_id=result["payment_intent_id"],
            status=result["status"],
            amount=result["amount"],
            amount_cents=result["amount_cents"],
            currency=result["currency"],
            customer_id=result.get("customer"),
            charges=result.get("charges", []),
            metadata=result.get("metadata", {}),
            created=result.get("created"),
            requires_action=result.get("requires_action", False)
        )
        
    except ValueError as e:
        logger.error(f"❌ Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Error retrieving payment status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve payment status: {str(e)}"
        )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature")
):
    """
    Handle Stripe webhook events
    
    This endpoint receives webhook events from Stripe and processes them.
    The webhook signature is verified before processing.
    """
    try:
        if not stripe_signature:
            logger.error("❌ Missing Stripe signature header")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe signature"
            )
        
        # Get raw request body
        payload = await request.body()
        
        logger.info(f"🔄 Processing Stripe webhook event")
        
        # Verify webhook signature
        try:
            event = stripe_service.verify_webhook_signature(
                payload=payload,
                signature=stripe_signature
            )
        except ValueError as e:
            logger.error(f"❌ Webhook signature verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature"
            )
        
        # Handle webhook event
        result = await stripe_service.handle_webhook_event(event)
        
        logger.info(f"✅ Webhook event processed: {result['event_type']}")
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "received": True,
                "event_id": result["event_id"],
                "event_type": result["event_type"],
                "processed": result["processed"]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process webhook: {str(e)}"
        )


@router.post("/confirm")
async def confirm_payment(
    confirm_data: dict,
    request: Request
):
    """
    Confirm a Stripe payment and update order status
    
    This endpoint:
    1. Verifies the payment intent status with Stripe
    2. Creates a payment record in the sales service
    3. Updates the order payment status and order status
    """
    try:
        payment_intent_id = confirm_data.get("payment_intent_id")
        order_id = confirm_data.get("order_id")
        
        if not payment_intent_id or not order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="payment_intent_id and order_id are required"
            )
        
        logger.info(f"🔄 Confirming payment: {payment_intent_id} for order: {order_id}")
        
        # Get payment status from Stripe
        payment_status = await stripe_service.get_payment_status(payment_intent_id)
        
        if payment_status["status"] != "succeeded":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment not successful. Status: {payment_status['status']}"
            )
        
        # Get token for sales service calls
        token = await get_token_from_request(request)
        
        # Call sales service to create payment record and update order
        async with httpx.AsyncClient() as client:
            sales_response = await client.post(
                f"{settings.sales_service_url}/api/v1/payments/stripe/confirm",
                json={
                    "payment_intent_id": payment_intent_id,
                    "order_id": order_id
                },
                headers={"Authorization": f"Bearer {token}"} if token else {},
                timeout=30.0
            )
            
            if sales_response.status_code != 200:
                logger.error(f"❌ Sales service error: {sales_response.status_code} - {sales_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update order payment status"
                )
        
        logger.info(f"✅ Payment confirmed and order updated: {order_id}")
        
        return {
            "success": True,
            "payment_intent_id": payment_intent_id,
            "order_id": order_id,
            "status": payment_status["status"],
            "amount": payment_status["amount"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error confirming payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to confirm payment: {str(e)}"
        )


@router.get("/config")
async def get_stripe_config():
    """
    Get Stripe configuration for frontend
    
    Returns the publishable key needed for Stripe.js initialization.
    """
    try:
        return {
            "publishable_key": stripe_service.get_publishable_key(),
            "currency": stripe_service.default_currency
        }
    except Exception as e:
        logger.error(f"❌ Error getting Stripe config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get Stripe configuration"
        )

