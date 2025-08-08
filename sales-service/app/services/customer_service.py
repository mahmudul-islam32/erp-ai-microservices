from app.database import get_database
from app.models import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerInDB,
    CustomerStatus, CustomerType
)
from pymongo.errors import DuplicateKeyError
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class CustomerService:
    def __init__(self):
        pass

    async def create_customer(self, customer_data: CustomerCreate) -> CustomerResponse:
        """Create a new customer"""
        try:
            db = get_database()
            customers_collection = db.customers

            # Check if customer already exists
            existing_customer = await customers_collection.find_one({"email": customer_data.email})
            if existing_customer:
                raise ValueError("Customer with this email already exists")

            # Generate customer code
            customer_code = await self._generate_customer_code()

            # Use shipping address same as billing if not provided
            shipping_address = customer_data.shipping_address or customer_data.billing_address

            # Create customer document
            customer_doc = CustomerInDB(
                customer_code=customer_code,
                first_name=customer_data.first_name,
                last_name=customer_data.last_name,
                company_name=customer_data.company_name,
                customer_type=customer_data.customer_type,
                email=customer_data.email,
                phone=customer_data.phone,
                billing_address=customer_data.billing_address,
                shipping_address=shipping_address,
                payment_terms=customer_data.payment_terms,
                credit_limit=customer_data.credit_limit,
                tax_id=customer_data.tax_id,
                notes=customer_data.notes,
                status=CustomerStatus.ACTIVE
            )

            # Insert customer
            result = await customers_collection.insert_one(customer_doc.dict(by_alias=True, exclude={"id"}))
            
            # Fetch created customer
            created_customer = await customers_collection.find_one({"_id": result.inserted_id})
            if created_customer:
                return CustomerResponse(**created_customer)
            
            return None

        except DuplicateKeyError:
            raise ValueError("Customer with this email already exists")
        except Exception as e:
            logger.error(f"Error creating customer: {e}")
            raise

    async def get_customer_by_id(self, customer_id: str) -> Optional[CustomerInDB]:
        """Get customer by ID"""
        try:
            db = get_database()
            customers_collection = db.customers
            
            customer = await customers_collection.find_one({"_id": ObjectId(customer_id)})
            if customer:
                # Convert ObjectId to string
                if "_id" in customer:
                    customer["_id"] = str(customer["_id"])
                return CustomerInDB(**customer)
            return None

        except Exception as e:
            logger.error(f"Error getting customer by ID: {e}")
            return None

    async def get_customer_by_email(self, email: str) -> Optional[CustomerInDB]:
        """Get customer by email"""
        try:
            db = get_database()
            customers_collection = db.customers
            
            customer = await customers_collection.find_one({"email": email})
            if customer:
                # Convert ObjectId to string
                if "_id" in customer:
                    customer["_id"] = str(customer["_id"])
                return CustomerInDB(**customer)
            return None

        except Exception as e:
            logger.error(f"Error getting customer by email: {e}")
            return None

    async def get_customer_by_code(self, customer_code: str) -> Optional[CustomerInDB]:
        """Get customer by customer code"""
        try:
            db = get_database()
            customers_collection = db.customers
            
            customer = await customers_collection.find_one({"customer_code": customer_code})
            if customer:
                # Convert ObjectId to string
                if "_id" in customer:
                    customer["_id"] = str(customer["_id"])
                return CustomerInDB(**customer)
            return None

        except Exception as e:
            logger.error(f"Error getting customer by code: {e}")
            return None

    async def update_customer(self, customer_id: str, customer_update: CustomerUpdate) -> Optional[CustomerResponse]:
        """Update customer"""
        try:
            db = get_database()
            customers_collection = db.customers

            # Prepare update data
            update_data = {k: v for k, v in customer_update.dict(exclude_unset=True).items() if v is not None}
            update_data["updated_at"] = datetime.utcnow()

            # Update customer
            result = await customers_collection.update_one(
                {"_id": ObjectId(customer_id)},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                # Fetch updated customer
                updated_customer = await customers_collection.find_one({"_id": ObjectId(customer_id)})
                if updated_customer:
                    return CustomerResponse(**updated_customer)
            
            return None

        except Exception as e:
            logger.error(f"Error updating customer: {e}")
            return None

    async def delete_customer(self, customer_id: str) -> bool:
        """Delete customer (soft delete by setting status to inactive)"""
        try:
            db = get_database()
            customers_collection = db.customers

            result = await customers_collection.update_one(
                {"_id": ObjectId(customer_id)},
                {"$set": {"status": CustomerStatus.INACTIVE, "updated_at": datetime.utcnow()}}
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error deleting customer: {e}")
            return False

    async def get_customers(self, skip: int = 0, limit: int = 100, 
                          status: Optional[CustomerStatus] = None,
                          customer_type: Optional[CustomerType] = None,
                          search: Optional[str] = None) -> List[CustomerResponse]:
        """Get list of customers with pagination and filters"""
        try:
            db = get_database()
            customers_collection = db.customers

            # Build filter
            filter_query = {}
            if status:
                filter_query["status"] = status
            if customer_type:
                filter_query["customer_type"] = customer_type
            if search:
                filter_query["$or"] = [
                    {"first_name": {"$regex": search, "$options": "i"}},
                    {"last_name": {"$regex": search, "$options": "i"}},
                    {"company_name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}},
                    {"customer_code": {"$regex": search, "$options": "i"}}
                ]

            # Get customers
            cursor = customers_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
            customers = await cursor.to_list(length=limit)

            # Convert ObjectId to string for response
            result = []
            for customer in customers:
                if "_id" in customer:
                    customer["_id"] = str(customer["_id"])
                result.append(CustomerResponse(**customer))
            
            return result

        except Exception as e:
            logger.error(f"Error getting customers: {e}")
            return []

    async def get_customers_count(self, status: Optional[CustomerStatus] = None,
                                customer_type: Optional[CustomerType] = None,
                                search: Optional[str] = None) -> int:
        """Get total count of customers with filters"""
        try:
            db = get_database()
            customers_collection = db.customers

            # Build filter (same as get_customers)
            filter_query = {}
            if status:
                filter_query["status"] = status
            if customer_type:
                filter_query["customer_type"] = customer_type
            if search:
                filter_query["$or"] = [
                    {"first_name": {"$regex": search, "$options": "i"}},
                    {"last_name": {"$regex": search, "$options": "i"}},
                    {"company_name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}},
                    {"customer_code": {"$regex": search, "$options": "i"}}
                ]

            # Get count
            count = await customers_collection.count_documents(filter_query)
            return count

        except Exception as e:
            logger.error(f"Error getting customers count: {e}")
            return 0

    async def update_customer_stats(self, customer_id: str, order_total: float) -> bool:
        """Update customer statistics after an order"""
        try:
            db = get_database()
            customers_collection = db.customers

            result = await customers_collection.update_one(
                {"_id": ObjectId(customer_id)},
                {
                    "$inc": {
                        "total_orders": 1,
                        "total_spent": order_total
                    },
                    "$set": {
                        "last_order_date": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error updating customer stats: {e}")
            return False

    async def update_credit_used(self, customer_id: str, amount: float, increase: bool = True) -> bool:
        """Update customer credit used amount"""
        try:
            db = get_database()
            customers_collection = db.customers

            operation = "$inc" if increase else "$inc"
            credit_change = amount if increase else -amount

            result = await customers_collection.update_one(
                {"_id": ObjectId(customer_id)},
                {
                    operation: {"credit_used": credit_change},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error updating customer credit: {e}")
            return False

    async def _generate_customer_code(self) -> str:
        """Generate unique customer code"""
        try:
            db = get_database()
            customers_collection = db.customers

            # Get last customer number
            last_customer = await customers_collection.find_one(
                {}, 
                sort=[("customer_code", -1)]
            )

            if last_customer and last_customer.get("customer_code"):
                # Extract number from last code (e.g., "CUST-00001" -> 1)
                last_code = last_customer["customer_code"]
                if "-" in last_code:
                    last_number = int(last_code.split("-")[-1])
                    new_number = last_number + 1
                else:
                    new_number = 1
            else:
                new_number = 1

            return f"CUST-{new_number:05d}"

        except Exception as e:
            logger.error(f"Error generating customer code: {e}")
            return f"CUST-{datetime.now().timestamp():.0f}"


# Global instance
customer_service = CustomerService()
