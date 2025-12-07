import httpx
from app.config import settings
from typing import Optional, Dict, Any
import logging
import os

logger = logging.getLogger(__name__)


class SalesServiceClient:
    """Client for interacting with Sales Service"""
    
    def __init__(self):
        self.sales_service_url = os.getenv("SALES_SERVICE_URL", "http://sales-service:8003")
        self.timeout = 10.0
    
    async def create_customer(
        self, 
        customer_data: Dict[str, Any], 
        token: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a customer in sales service"""
        try:
            headers = {"Content-Type": "application/json"}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            
            logger.info(f"Creating customer in sales service at {self.sales_service_url}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.sales_service_url}/api/v1/customers/",
                    headers=headers,
                    json=customer_data
                )
                
                logger.info(f"Sales service response status: {response.status_code}")
                
                if response.status_code == 201:
                    customer = response.json()
                    logger.info(f"Customer created successfully: {customer.get('email')}")
                    return customer
                elif response.status_code == 400:
                    # Customer might already exist
                    error_detail = response.text
                    logger.warning(f"Customer creation failed: {response.status_code} - {error_detail}")
                    return None
                else:
                    error_detail = response.text
                    logger.warning(f"Create customer failed: {response.status_code} - {error_detail}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Sales service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Sales service error: {e}")
            return None

    async def get_customer_by_email(
        self,
        email: str,
        token: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Get customer by email from sales service"""
        try:
            headers = {}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            
            logger.info(f"Getting customer by email from sales service: {email}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Use direct email endpoint for exact match
                import urllib.parse
                encoded_email = urllib.parse.quote(email)
                response = await client.get(
                    f"{self.sales_service_url}/api/v1/customers/email/{encoded_email}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    customer = response.json()
                    # Ensure id field exists (could be _id or id)
                    customer_id = customer.get("id") or customer.get("_id")
                    if customer_id:
                        # Normalize to id field
                        customer["id"] = str(customer_id)
                        logger.info(f"Customer found: {customer_id}")
                        return customer
                    else:
                        logger.warning(f"Customer found but missing ID field: {customer}")
                        return None
                elif response.status_code == 404:
                    logger.warning(f"Customer with email {email} not found")
                    return None
                else:
                    logger.warning(f"Get customer by email failed: {response.status_code} - {response.text}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Sales service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Sales service error: {e}")
            return None

    async def update_customer(
        self,
        customer_id: str,
        customer_data: Dict[str, Any],
        token: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Update customer in sales service"""
        try:
            headers = {"Content-Type": "application/json"}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            
            logger.info(f"Updating customer {customer_id} in sales service")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.put(
                    f"{self.sales_service_url}/api/v1/customers/{customer_id}",
                    headers=headers,
                    json=customer_data
                )
                
                logger.info(f"Sales service update response status: {response.status_code}")
                
                if response.status_code == 200:
                    customer = response.json()
                    logger.info(f"Customer updated successfully: {customer.get('email')}")
                    return customer
                else:
                    error_detail = response.text
                    logger.warning(f"Update customer failed: {response.status_code} - {error_detail}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Sales service request error: {e}")
            return None
        except Exception as e:
            logger.error(f"Sales service error: {e}")
            return None

    async def delete_customer(
        self,
        customer_id: str,
        token: Optional[str] = None
    ) -> bool:
        """Delete customer in sales service (soft delete)"""
        try:
            headers = {}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            
            logger.info(f"Deleting customer {customer_id} in sales service")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(
                    f"{self.sales_service_url}/api/v1/customers/{customer_id}",
                    headers=headers
                )
                
                logger.info(f"Sales service delete response status: {response.status_code}")
                
                if response.status_code == 200:
                    logger.info(f"Customer deleted successfully: {customer_id}")
                    return True
                else:
                    error_detail = response.text
                    logger.warning(f"Delete customer failed: {response.status_code} - {error_detail}")
                    return False
                    
        except httpx.RequestError as e:
            logger.error(f"Sales service request error: {e}")
            return False
        except Exception as e:
            logger.error(f"Sales service error: {e}")
            return False


# Global instance
sales_service_client = SalesServiceClient()

