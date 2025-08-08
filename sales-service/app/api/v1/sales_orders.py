from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from app.models import (
    SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse, OrderStatus, PaymentStatus
)
from app.models.pagination import PaginationResponse
from app.services import sales_order_service
from app.api.dependencies import (
    get_current_active_user, require_sales_access, require_sales_write, 
    get_token_from_request, require_sales_access_flexible
)
from typing import List, Optional
from datetime import date
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sales-orders", tags=["Sales Orders"])


@router.post("/", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_sales_order(
    order_data: SalesOrderCreate,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Create a new sales order"""
    try:
        # Validate input data
        if not order_data.customer_id or order_data.customer_id.strip() == "" or order_data.customer_id == "string":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer ID is required and cannot be 'string'. Use a valid customer email, customer code, or ObjectId."
            )
        
        if not order_data.line_items or len(order_data.line_items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one line item is required"
            )
        
        # Validate line items
        for i, item in enumerate(order_data.line_items):
            if not item.product_id or item.product_id.strip() == "" or item.product_id == "string":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product ID is required for line item {i + 1} and cannot be 'string'. Use a valid product SKU or ObjectId."
                )
            if item.quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Quantity must be greater than 0 for line item {i + 1}. Received: {item.quantity}"
                )
            if item.unit_price is not None and item.unit_price < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unit price cannot be negative for line item {i + 1}. Received: {item.unit_price}"
                )
        
        token = await get_token_from_request(request)
        # Get user ID, checking both possible keys
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            logger.error(f"No user ID found in current_user: {current_user}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not available"
            )
        
        order = await sales_order_service.create_order(order_data, user_id, token)
        return order
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Sales order creation error: {e}")
        logger.error(f"Current user data: {current_user}")
        logger.error(f"Order data: {order_data}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/", response_model=PaginationResponse[SalesOrderResponse])
async def get_sales_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[OrderStatus] = None,
    customer_id: Optional[str] = None,
    sales_rep_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    current_user=Depends(require_sales_access_flexible())
):
    """Get list of sales orders with pagination and filters"""
    try:
        logger.info(f"Getting sales orders for user: {current_user.get('email')}")
        
        # Get orders and total count
        orders = await sales_order_service.get_orders(
            skip=skip,
            limit=limit,
            status=status,
            customer_id=customer_id,
            sales_rep_id=sales_rep_id,
            start_date=start_date,
            end_date=end_date,
            search=search
        )
        
        # Get total count for pagination
        total_count = await sales_order_service.count_orders(
            status=status,
            customer_id=customer_id,
            sales_rep_id=sales_rep_id,
            start_date=start_date,
            end_date=end_date,
            search=search
        )
        
        page = (skip // limit) + 1
        total_pages = (total_count + limit - 1) // limit
        
        logger.info(f"Successfully retrieved {len(orders)} sales orders")
        
        return PaginationResponse(
            items=orders,
            total=total_count,
            page=page,
            limit=limit,
            pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Get sales orders error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(
    order_id: str,
    current_user=Depends(require_sales_access())
):
    """Get sales order by ID"""
    try:
        order = await sales_order_service.get_order_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found"
            )

        return SalesOrderResponse(**order.dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get sales order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{order_id}", response_model=SalesOrderResponse)
async def update_sales_order(
    order_id: str,
    order_update: SalesOrderUpdate,
    current_user=Depends(require_sales_write())
):
    """Update sales order"""
    try:
        # Get user ID, checking both possible keys
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            logger.error(f"No user ID found in current_user: {current_user}")
            raise ValueError("User ID not available")
        
        order = await sales_order_service.update_order(order_id, order_update, user_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found"
            )

        return order

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update sales order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{order_id}/confirm")
async def confirm_sales_order(
    order_id: str,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Confirm sales order and reserve stock"""
    try:
        token = await get_token_from_request(request)
        # Get user ID, checking both possible keys
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            logger.error(f"No user ID found in current_user: {current_user}")
            raise ValueError("User ID not available")
        
        success = await sales_order_service.confirm_order(order_id, user_id, token)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to confirm order. Check stock availability."
            )

        return {"message": "Order confirmed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Confirm sales order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{order_id}/cancel")
async def cancel_sales_order(
    order_id: str,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Cancel sales order and release reserved stock"""
    try:
        token = await get_token_from_request(request)
        # Get user ID, checking both possible keys
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            logger.error(f"No user ID found in current_user: {current_user}")
            raise ValueError("User ID not available")
        
        success = await sales_order_service.cancel_order(order_id, user_id, token)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to cancel order"
            )

        return {"message": "Order cancelled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cancel sales order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/{order_id}")
async def delete_sales_order(
    order_id: str,
    current_user=Depends(require_sales_write())
):
    """Delete sales order (soft delete)"""
    try:
        # Get user ID, checking both possible keys
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            logger.error(f"No user ID found in current_user: {current_user}")
            raise ValueError("User ID not available")
        
        success = await sales_order_service.delete_order(order_id, user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found or cannot be deleted"
            )

        return {"message": "Sales order deleted successfully"}

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete sales order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/number/{order_number}", response_model=SalesOrderResponse)
async def get_order_by_number(
    order_number: str,
    current_user=Depends(require_sales_access())
):
    """Get sales order by order number"""
    try:
        order = await sales_order_service.get_order_by_number(order_number)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found"
            )

        return SalesOrderResponse(**order.dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get order by number error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/customer/{customer_id}/orders", response_model=List[SalesOrderResponse])
async def get_customer_orders(
    customer_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(require_sales_access())
):
    """Get orders for a specific customer"""
    try:
        orders = await sales_order_service.get_orders(
            skip=skip,
            limit=limit,
            customer_id=customer_id
        )
        return orders
    except Exception as e:
        logger.error(f"Get customer orders error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{order_id}/duplicate", response_model=SalesOrderResponse)
async def duplicate_order(
    order_id: str,
    request: Request,
    current_user=Depends(require_sales_write())
):
    """Duplicate an existing sales order"""
    try:
        token = await get_token_from_request(request)
        # Get user ID, checking both possible keys
        user_id = current_user.get("id") or current_user.get("_id") or str(current_user.get("user_id", ""))
        if not user_id:
            logger.error(f"No user ID found in current_user: {current_user}")
            raise ValueError("User ID not available")
        
        order = await sales_order_service.duplicate_order(order_id, user_id, token)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found"
            )

        return order

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Duplicate order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{order_id}/payment-status")
async def update_order_payment_status(
    order_id: str,
    payment_status: str,
    paid_amount: float = 0,
    current_user=Depends(require_sales_write())
):
    """Update payment status for an order"""
    try:
        # Validate payment status
        valid_statuses = ["pending", "partial", "paid", "overdue", "refunded"]
        if payment_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid payment status. Must be one of: {valid_statuses}"
            )
        
        if paid_amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Paid amount cannot be negative"
            )
        
        success = await sales_order_service.update_payment_status(order_id, payment_status, paid_amount)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found or could not be updated"
            )

        return {"message": "Payment status updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update payment status error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
