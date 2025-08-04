from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from app.models import (
    SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse, OrderStatus, PaymentStatus
)
from app.services import sales_order_service
from app.api.dependencies import (
    get_current_active_user, require_sales_access, require_sales_write, get_token_from_request
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
        token = await get_token_from_request(request)
        order = await sales_order_service.create_order(order_data, current_user["id"], token)
        return order
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Sales order creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/", response_model=List[SalesOrderResponse])
async def get_sales_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[OrderStatus] = None,
    customer_id: Optional[str] = None,
    sales_rep_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    current_user=Depends(require_sales_access())
):
    """Get list of sales orders with pagination and filters"""
    try:
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
        return orders
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
        order = await sales_order_service.update_order(order_id, order_update, current_user["id"])
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
        success = await sales_order_service.confirm_order(order_id, current_user["id"], token)
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
        success = await sales_order_service.cancel_order(order_id, current_user["id"], token)
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
        order = await sales_order_service.duplicate_order(order_id, current_user["id"], token)
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
