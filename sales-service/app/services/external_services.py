import httpx
from app.config import settings
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self):
        self.auth_service_url = settings.auth_service_url
        self.timeout = 10.0

    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token with auth service"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            
            logger.info(f"Verifying token with auth service at {self.auth_service_url}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.auth_service_url}/api/v1/auth/me",
                    headers=headers
                )
                
                logger.info(f"Auth service response status: {response.status_code}")
                
                if response.status_code == 200:
                    user_data = response.json()
                    logger.info(f"Token verification successful for user: {user_data.get('email')}")
                    return user_data
                else:
                    logger.warning(f"Token verification failed: {response.status_code} - {response.text}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Auth service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Auth service error: {e}")
            return None

    async def get_user_by_id(self, user_id: str, token: str) -> Optional[Dict[str, Any]]:
        """Get user details by ID"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.auth_service_url}/api/v1/users/{user_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Get user failed: {response.status_code}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Auth service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Auth service error: {e}")
            return None


class InventoryService:
    def __init__(self):
        self.inventory_service_url = settings.inventory_service_url
        self.timeout = 10.0

    async def get_products(self, token: str, page: int = 1, limit: int = 100) -> Optional[Dict[str, Any]]:
        """Get products from inventory service"""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            
            params = {
                "page": page,
                "limit": limit
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.inventory_service_url}/products",
                    headers=headers,
                    params=params
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Get products failed: {response.status_code}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Inventory service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Inventory service error: {e}")
            return None

    async def get_product_by_id(self, product_id: str, token: str) -> Optional[Dict[str, Any]]:
        """Get product details by ID from inventory service"""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            
            logger.info(f"Getting product {product_id} from inventory service at {self.inventory_service_url}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.inventory_service_url}/products/{product_id}",
                    headers=headers
                )
                
                logger.info(f"Inventory service response status: {response.status_code}")
                
                if response.status_code == 200:
                    product_data = response.json()
                    logger.info(f"Product found: {product_data.get('name', 'Unknown')}")
                    return product_data
                else:
                    logger.warning(f"Get product by ID failed: {response.status_code} - {response.text}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Inventory service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Inventory service error: {e}")
            return None

    async def get_product_by_sku(self, sku: str, token: str) -> Optional[Dict[str, Any]]:
        """Get product details by SKU from inventory service"""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            
            logger.info(f"Getting product by SKU {sku} from inventory service at {self.inventory_service_url}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.inventory_service_url}/products/sku/{sku}",
                    headers=headers
                )
                
                logger.info(f"Inventory service response status: {response.status_code}")
                
                if response.status_code == 200:
                    product_data = response.json()
                    logger.info(f"Product found: {product_data.get('name', 'Unknown')}")
                    return product_data
                else:
                    logger.warning(f"Get product by SKU failed: {response.status_code} - {response.text}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Inventory service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Inventory service error: {e}")
            return None

    async def get_product_stock(self, product_id: str, token: str) -> Optional[Dict[str, Any]]:
        """Get current stock level for a product"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.inventory_service_url}/products/{product_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    product_data = response.json()
                    # Extract stock information from product data
                    return {
                        "product_id": product_id,
                        "available_quantity": product_data.get("quantityInStock", 0),
                        "reserved_quantity": product_data.get("reservedQuantity", 0),
                        "total_quantity": product_data.get("quantityInStock", 0) + product_data.get("reservedQuantity", 0)
                    }
                else:
                    logger.warning(f"Get product stock failed: {response.status_code}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Inventory service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Inventory service error: {e}")
            return None

    async def get_product_categories(self, token: str) -> Optional[List[str]]:
        """Get list of product categories from inventory service"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.inventory_service_url}/api/v1/products/categories",
                    headers=headers
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Get product categories failed: {response.status_code}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Inventory service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Inventory service error: {e}")
            return None

    async def search_products(self, query: str, limit: int = 50, token: str = None) -> Optional[List[Dict[str, Any]]]:
        """Search products in inventory service"""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            params = {"q": query, "limit": limit}
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.inventory_service_url}/api/v1/products/search",
                    headers=headers,
                    params=params
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Search products failed: {response.status_code}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Inventory service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Inventory service error: {e}")
            return None

    async def reserve_stock(self, product_id: str, quantity: int, order_id: str, token: str) -> bool:
        """Reserve stock for an order"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            payload = {
                "product_id": product_id,
                "quantity": quantity,
                "order_id": order_id,
                "reason": "sales_order"
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.inventory_service_url}/api/v1/stock/reserve",
                    headers=headers,
                    json=payload
                )
                
                return response.status_code == 200
                    
        except httpx.RequestError as e:
            logger.error(f"Inventory service request error: {e}")
            return False
        except Exception as e:
            logger.error(f"Inventory service error: {e}")
            return False

    async def release_stock(self, product_id: str, quantity: int, order_id: str, token: str) -> bool:
        """Release reserved stock"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            payload = {
                "product_id": product_id,
                "quantity": quantity,
                "order_id": order_id,
                "reason": "order_cancelled"
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.inventory_service_url}/api/v1/stock/release",
                    headers=headers,
                    json=payload
                )
                
                return response.status_code == 200
                    
        except httpx.RequestError as e:
            logger.error(f"Inventory service request error: {e}")
            return False
        except Exception as e:
            logger.error(f"Inventory service error: {e}")
            return False

    async def fulfill_stock(self, product_id: str, quantity: int, order_id: str, token: str) -> bool:
        """Fulfill stock (convert reservation to actual stock reduction)"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            payload = {
                "product_id": product_id,
                "quantity": quantity,
                "order_id": order_id,
                "reason": "order_fulfilled"
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.inventory_service_url}/api/v1/stock/fulfill",
                    headers=headers,
                    json=payload
                )
                
                return response.status_code == 200
                    
        except httpx.RequestError as e:
            logger.error(f"Inventory service request error: {e}")
            return False
        except Exception as e:
            logger.error(f"Inventory service error: {e}")
            return False


# Global instances
auth_service = AuthService()
inventory_service = InventoryService()
