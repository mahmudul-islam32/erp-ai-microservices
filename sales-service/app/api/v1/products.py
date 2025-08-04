from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models import (
    ProductCreate, ProductUpdate, ProductResponse, ProductStatus, ProductType
)
from app.services import product_service
from app.api.dependencies import get_current_active_user, require_sales_access, require_sales_write
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user=Depends(require_sales_write())
):
    """Create a new product"""
    try:
        product = await product_service.create_product(product_data)
        return product
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Product creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/", response_model=List[ProductResponse])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[ProductStatus] = None,
    product_type: Optional[ProductType] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user=Depends(require_sales_access())
):
    """Get list of products with pagination and filters"""
    try:
        products = await product_service.get_products(
            skip=skip,
            limit=limit,
            status=status,
            product_type=product_type,
            category=category,
            search=search
        )
        return products
    except Exception as e:
        logger.error(f"Get products error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    current_user=Depends(require_sales_access())
):
    """Get product by ID"""
    try:
        product = await product_service.get_product_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        return ProductResponse(**product.dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get product error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user=Depends(require_sales_write())
):
    """Update product"""
    try:
        product = await product_service.update_product(product_id, product_update)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        return product

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update product error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user=Depends(require_sales_write())
):
    """Delete product (soft delete)"""
    try:
        success = await product_service.delete_product(product_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        return {"message": "Product deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete product error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/search/{query}", response_model=List[ProductResponse])
async def search_products(
    query: str,
    limit: int = Query(10, ge=1, le=50),
    current_user=Depends(require_sales_access())
):
    """Search products for autocomplete"""
    try:
        products = await product_service.get_products(
            limit=limit,
            search=query
        )
        return products
    except Exception as e:
        logger.error(f"Search products error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/sku/{sku}", response_model=ProductResponse)
async def get_product_by_sku(
    sku: str,
    current_user=Depends(require_sales_access())
):
    """Get product by SKU"""
    try:
        product = await product_service.get_product_by_sku(sku)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        return ProductResponse(**product.dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get product by SKU error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{product_id}/price-history")
async def add_price_history(
    product_id: str,
    price: float,
    current_user=Depends(require_sales_write())
):
    """Add price history entry"""
    try:
        success = await product_service.add_price_history(product_id, price, current_user["id"])
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        return {"message": "Price history updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add price history error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/categories/list")
async def get_product_categories(
    current_user=Depends(require_sales_access())
):
    """Get list of all product categories"""
    try:
        categories = await product_service.get_product_categories()
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Get categories error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
