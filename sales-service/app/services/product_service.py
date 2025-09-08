from app.database import get_database
from app.models import (
    ProductCreate, ProductUpdate, ProductResponse, ProductInDB,
    ProductStatus, ProductType
)
from pymongo.errors import DuplicateKeyError
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class ProductService:
    def __init__(self):
        pass

    async def create_product(self, product_data: ProductCreate) -> ProductResponse:
        """Create a new product"""
        try:
            db = get_database()
            products_collection = db.products

            # Check if product already exists
            existing_product = await products_collection.find_one({"sku": product_data.sku})
            if existing_product:
                raise ValueError("Product with this SKU already exists")

            # Create product document
            product_doc = ProductInDB(
                name=product_data.name,
                description=product_data.description,
                sku=product_data.sku,
                category=product_data.category,
                product_type=product_data.product_type,
                unit_of_measure=product_data.unit_of_measure,
                unit_price=product_data.unit_price,
                cost_price=product_data.cost_price,
                weight=product_data.weight,
                dimensions=product_data.dimensions,
                tax_rate=product_data.tax_rate,
                min_stock_level=product_data.min_stock_level,
                max_stock_level=product_data.max_stock_level,
                reorder_point=product_data.reorder_point,
                warranty_period=product_data.warranty_period,
                manufacturer=product_data.manufacturer,
                brand=product_data.brand,
                model=product_data.model,
                tags=product_data.tags,
                images=product_data.images,
                specifications=product_data.specifications,
                status=ProductStatus.ACTIVE
            )

            # Insert product
            result = await products_collection.insert_one(product_doc.dict(by_alias=True, exclude={"id"}))
            
            # Fetch created product
            created_product = await products_collection.find_one({"_id": result.inserted_id})
            if created_product:
                return ProductResponse(**created_product)
            
            return None

        except DuplicateKeyError:
            raise ValueError("Product with this SKU already exists")
        except Exception as e:
            logger.error(f"Error creating product: {e}")
            raise

    async def get_product_by_id(self, product_id: str) -> Optional[ProductInDB]:
        """Get product by ID"""
        try:
            db = get_database()
            products_collection = db.products
            
            product = await products_collection.find_one({"_id": ObjectId(product_id)})
            if product:
                return ProductInDB(**product)
            return None

        except Exception as e:
            logger.error(f"Error getting product by ID: {e}")
            return None

    async def get_product_by_sku(self, sku: str) -> Optional[ProductInDB]:
        """Get product by SKU"""
        try:
            db = get_database()
            products_collection = db.products
            
            product = await products_collection.find_one({"sku": sku})
            if product:
                return ProductInDB(**product)
            return None

        except Exception as e:
            logger.error(f"Error getting product by SKU: {e}")
            return None

    async def update_product(self, product_id: str, product_update: ProductUpdate) -> Optional[ProductResponse]:
        """Update product"""
        try:
            db = get_database()
            products_collection = db.products

            # Prepare update data
            update_data = {k: v for k, v in product_update.dict(exclude_unset=True).items() if v is not None}
            update_data["updated_at"] = datetime.utcnow()

            # Update product
            result = await products_collection.update_one(
                {"_id": ObjectId(product_id)},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                # Fetch updated product
                updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
                if updated_product:
                    return ProductResponse(**updated_product)
            
            return None

        except Exception as e:
            logger.error(f"Error updating product: {e}")
            return None

    async def delete_product(self, product_id: str) -> bool:
        """Delete product (soft delete by setting status to inactive)"""
        try:
            db = get_database()
            products_collection = db.products

            result = await products_collection.update_one(
                {"_id": ObjectId(product_id)},
                {"$set": {"status": ProductStatus.INACTIVE, "updated_at": datetime.utcnow()}}
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error deleting product: {e}")
            return False

    async def get_products(self, skip: int = 0, limit: int = 100, 
                          status: Optional[ProductStatus] = None,
                          category: Optional[str] = None,
                          product_type: Optional[ProductType] = None,
                          search: Optional[str] = None) -> List[ProductResponse]:
        """Get list of products with pagination and filters"""
        try:
            db = get_database()
            products_collection = db.products

            # Build filter
            filter_query = {}
            if status:
                filter_query["status"] = status
            if category:
                filter_query["category"] = category
            if product_type:
                filter_query["product_type"] = product_type
            if search:
                filter_query["$or"] = [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"sku": {"$regex": search, "$options": "i"}},
                    {"brand": {"$regex": search, "$options": "i"}},
                    {"manufacturer": {"$regex": search, "$options": "i"}}
                ]

            # Get products
            cursor = products_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
            products = await cursor.to_list(length=limit)

            return [ProductResponse(**product) for product in products]

        except Exception as e:
            logger.error(f"Error getting products: {e}")
            return []

    async def update_product_stats(self, product_id: str, quantity_sold: int, revenue: float) -> bool:
        """Update product statistics after a sale"""
        try:
            db = get_database()
            products_collection = db.products

            result = await products_collection.update_one(
                {"_id": ObjectId(product_id)},
                {
                    "$inc": {
                        "total_sold": quantity_sold,
                        "total_revenue": revenue
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error updating product stats: {e}")
            return False

    async def get_products_by_ids(self, product_ids: List[str]) -> List[ProductInDB]:
        """Get multiple products by their IDs"""
        try:
            db = get_database()
            products_collection = db.products

            object_ids = [ObjectId(pid) for pid in product_ids]
            cursor = products_collection.find({"_id": {"$in": object_ids}})
            products = await cursor.to_list(length=len(product_ids))

            return [ProductInDB(**product) for product in products]

        except Exception as e:
            logger.error(f"Error getting products by IDs: {e}")
            return []

    async def search_products_by_name_or_sku(self, query: str, limit: int = 10) -> List[ProductResponse]:
        """Search products by name or SKU for autocomplete"""
        try:
            db = get_database()
            products_collection = db.products

            filter_query = {
                "$and": [
                    {"status": ProductStatus.ACTIVE},
                    {
                        "$or": [
                            {"name": {"$regex": query, "$options": "i"}},
                            {"sku": {"$regex": query, "$options": "i"}}
                        ]
                    }
                ]
            }

            cursor = products_collection.find(filter_query).limit(limit).sort("name", 1)
            products = await cursor.to_list(length=limit)

            return [ProductResponse(**product) for product in products]

        except Exception as e:
            logger.error(f"Error searching products: {e}")
            return []

    async def get_low_stock_products(self) -> List[ProductResponse]:
        """Get products with low stock levels"""
        try:
            db = get_database()
            products_collection = db.products

            # Products where current_stock <= reorder_point and reorder_point is set
            filter_query = {
                "$and": [
                    {"status": ProductStatus.ACTIVE},
                    {"reorder_point": {"$ne": None}},
                    {"$expr": {"$lte": ["$current_stock", "$reorder_point"]}}
                ]
            }

            cursor = products_collection.find(filter_query).sort("current_stock", 1)
            products = await cursor.to_list(length=None)

            return [ProductResponse(**product) for product in products]

        except Exception as e:
            logger.error(f"Error getting low stock products: {e}")
            return []


# Global instance
product_service = ProductService()
