from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerStatus, CustomerType
)
from app.services import customer_service
from app.api.dependencies import get_current_active_user, require_sales_access, require_sales_write
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: CustomerCreate,
    current_user=Depends(require_sales_write())
):
    """Create a new customer"""
    try:
        customer = await customer_service.create_customer(customer_data)
        return customer
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Customer creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/", response_model=List[CustomerResponse])
async def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[CustomerStatus] = None,
    customer_type: Optional[CustomerType] = None,
    search: Optional[str] = None,
    current_user=Depends(require_sales_access())
):
    """Get list of customers with pagination and filters"""
    try:
        customers = await customer_service.get_customers(
            skip=skip,
            limit=limit,
            status=status,
            customer_type=customer_type,
            search=search
        )
        return customers
    except Exception as e:
        logger.error(f"Get customers error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    current_user=Depends(require_sales_access())
):
    """Get customer by ID"""
    try:
        customer = await customer_service.get_customer_by_id(customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )

        return CustomerResponse(**customer.dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get customer error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    customer_update: CustomerUpdate,
    current_user=Depends(require_sales_write())
):
    """Update customer"""
    try:
        customer = await customer_service.update_customer(customer_id, customer_update)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )

        return customer

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update customer error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: str,
    current_user=Depends(require_sales_write())
):
    """Delete customer (soft delete)"""
    try:
        success = await customer_service.delete_customer(customer_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )

        return {"message": "Customer deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete customer error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/search/{query}", response_model=List[CustomerResponse])
async def search_customers(
    query: str,
    limit: int = Query(10, ge=1, le=50),
    current_user=Depends(require_sales_access())
):
    """Search customers for autocomplete"""
    try:
        customers = await customer_service.get_customers(
            limit=limit,
            search=query
        )
        return customers
    except Exception as e:
        logger.error(f"Search customers error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
