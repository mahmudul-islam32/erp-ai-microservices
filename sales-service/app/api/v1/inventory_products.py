from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import logging

from ..dependencies import get_current_user, get_inventory_service, require_sales_access_flexible
from ...services.external_services import InventoryService

router = APIRouter(prefix="/products", tags=["Products from Inventory"])
logger = logging.getLogger(__name__)


@router.get("/", summary="Get products from inventory service")
async def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term"),
    categoryId: Optional[str] = Query(None, description="Category ID"),
    isActive: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: dict = Depends(require_sales_access_flexible()),
    inventory_service: InventoryService = Depends(get_inventory_service)
):
    """Get products from inventory service for sales operations"""
    try:
        logger.info(f"Getting products for user: {current_user.get('email')}")
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Get user token for inventory service request
        token = current_user.get("access_token") if current_user else None
        
        products = await inventory_service.get_products(
            skip=skip,
            limit=limit,
            category=categoryId,
            search=search,
            token=token
        )
        
        if products is None:
            raise HTTPException(status_code=503, detail="Inventory service unavailable")
            
        logger.info(f"Successfully retrieved {len(products) if products else 0} products")
        
        return {
            "products": products,
            "page": page,
            "limit": limit,
            "message": "Products retrieved from inventory service"
        }
        
    except Exception as e:
        logger.error(f"Error fetching products from inventory: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products")


@router.get("/{product_id}", summary="Get product by ID from inventory service")
async def get_product_by_id(
    product_id: str,
    current_user: dict = Depends(require_sales_access_flexible()),
    inventory_service: InventoryService = Depends(get_inventory_service)
):
    """Get specific product details from inventory service"""
    try:
        logger.info(f"Getting product {product_id} for user: {current_user.get('email')}")
        
        # Get user token for inventory service request
        token = current_user.get("access_token") if current_user else None
        
        product = await inventory_service.get_product_by_id(product_id, token)
        
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
            
        return product
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id} from inventory: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch product")


@router.get("/sku/{sku}", summary="Get product by SKU from inventory service")
async def get_product_by_sku(
    sku: str,
    current_user: dict = Depends(get_current_user),
    inventory_service: InventoryService = Depends(get_inventory_service)
):
    """Get product by SKU from inventory service"""
    try:
        # Get user token for inventory service request
        token = current_user.get("access_token") if current_user else None
        
        # Use search to find product by SKU
        products = await inventory_service.search_products(sku, limit=1, token=token)
        
        if not products or len(products) == 0:
            raise HTTPException(status_code=404, detail="Product not found")
            
        # Return the first (exact) match
        product = products[0]
        if product.get("sku") != sku:
            raise HTTPException(status_code=404, detail="Product not found")
            
        return product
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product by SKU {sku} from inventory: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch product")


@router.get("/categories/list", summary="Get product categories from inventory service")
async def get_product_categories(
    current_user: dict = Depends(require_sales_access_flexible()),
    inventory_service: InventoryService = Depends(get_inventory_service)
):
    """Get list of product categories from inventory service"""
    try:
        logger.info(f"Getting product categories for user: {current_user.get('email')}")
        
        # Get user token for inventory service request
        token = current_user.get("access_token") if current_user else None
        
        categories = await inventory_service.get_product_categories(token)
        
        if categories is None:
            raise HTTPException(status_code=503, detail="Inventory service unavailable")
            
        return {"categories": categories}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching categories from inventory: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")


@router.get("/search", summary="Search products in inventory service")
async def search_products(
    q: str = Query(..., description="Search query"),
    limit: int = Query(50, ge=1, le=100, description="Maximum results"),
    current_user: dict = Depends(require_sales_access_flexible()),
    inventory_service: InventoryService = Depends(get_inventory_service)
):
    """Search products in inventory service"""
    try:
        logger.info(f"Searching products with query '{q}' for user: {current_user.get('email')}")
        
        # Get user token for inventory service request
        token = current_user.get("access_token") if current_user else None
        
        products = await inventory_service.search_products(q, limit=limit, token=token)
        
        if products is None:
            raise HTTPException(status_code=503, detail="Inventory service unavailable")
            
        return {
            "products": products,
            "query": q,
            "count": len(products) if products else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching products in inventory: {e}")
        raise HTTPException(status_code=500, detail="Failed to search products")
