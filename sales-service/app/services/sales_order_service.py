from app.database.connection import get_database
from app.models import (
    SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse, SalesOrderInDB,
    OrderLineItem, OrderLineItemCreate, OrderStatus, PaymentStatus
)
from app.services.customer_service import customer_service
from app.services.external_services import inventory_service, auth_service
from pymongo.errors import DuplicateKeyError
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from bson import ObjectId
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class SalesOrderService:
    def __init__(self):
        pass

    async def create_order(self, order_data: SalesOrderCreate, user_id: str, token: str) -> SalesOrderResponse:
        """Create a new sales order"""
        try:
            db = get_database()
            orders_collection = db.sales_orders

            # Validate customer - try different lookup methods
            customer = None
            
            # First try as ObjectId
            try:
                if len(order_data.customer_id) == 24:  # Looks like ObjectId
                    customer = await customer_service.get_customer_by_id(order_data.customer_id)
            except Exception:
                pass
            
            # If not found, try by email
            if not customer and "@" in order_data.customer_id:
                customer = await customer_service.get_customer_by_email(order_data.customer_id)
            
            # If still not found, try by customer code
            if not customer:
                customer = await customer_service.get_customer_by_code(order_data.customer_id)
            
            if not customer:
                raise ValueError(f"Customer not found with identifier: {order_data.customer_id}")

            # Get user info for sales rep
            user_info = None
            sales_rep_name = None
            if order_data.sales_rep_id:
                user_info = await auth_service.get_user_by_id(order_data.sales_rep_id, token)
                if user_info:
                    sales_rep_name = f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip()

            # Process line items
            processed_line_items = []
            subtotal = 0.0
            total_tax = 0.0

            for item in order_data.line_items:
                # Get product details from inventory service - try by ID first, then by SKU
                product = None
                
                # Try as ObjectId first
                try:
                    if len(item.product_id) == 24:  # Looks like ObjectId
                        product = await inventory_service.get_product_by_id(item.product_id, token)
                except Exception:
                    pass
                
                # If not found, try by SKU
                if not product:
                    product = await inventory_service.get_product_by_sku(item.product_id, token)
                
                if not product:
                    raise ValueError(f"Product not found with identifier: {item.product_id}")

                # Use provided price or product's default price
                unit_price = item.unit_price if item.unit_price is not None else product.get("price", 0.0)

                # Calculate line totals
                line_subtotal = unit_price * item.quantity
                discount_amount = item.discount_amount
                if item.discount_percent > 0:
                    discount_amount = line_subtotal * (item.discount_percent / 100)
                
                line_total_before_tax = line_subtotal - discount_amount
                
                # Calculate tax
                tax_rate = product.get("tax_rate") or settings.default_tax_rate
                tax_amount = line_total_before_tax * tax_rate
                line_total = line_total_before_tax + tax_amount

                # Create line item
                line_item = OrderLineItem(
                    product_id=item.product_id,
                    product_name=product.get("name", "Unknown Product"),
                    product_sku=product.get("sku", ""),
                    quantity=item.quantity,
                    unit_price=unit_price,
                    discount_percent=item.discount_percent,
                    discount_amount=discount_amount,
                    tax_rate=tax_rate,
                    tax_amount=tax_amount,
                    line_total=line_total,
                    notes=item.notes
                )

                processed_line_items.append(line_item)
                subtotal += line_subtotal
                total_tax += tax_amount

            # Calculate order totals
            order_subtotal = subtotal
            order_discount_amount = order_data.subtotal_discount_amount
            if order_data.subtotal_discount_percent > 0:
                order_discount_amount = order_subtotal * (order_data.subtotal_discount_percent / 100)

            order_total = order_subtotal - order_discount_amount + total_tax + order_data.shipping_cost

            # Generate order number
            order_number = await self._generate_order_number()

            # Determine shipping address
            shipping_address = order_data.shipping_address
            if not shipping_address:
                if customer.shipping_address:
                    shipping_address = customer.shipping_address.dict()
                else:
                    shipping_address = customer.billing_address.dict()

            # Create order document
            order_doc = SalesOrderInDB(
                order_number=order_number,
                customer_id=str(customer.id),  # Use string ID instead of the original input
                customer_name=f"{customer.first_name} {customer.last_name}".strip(),
                customer_email=customer.email,
                order_date=order_data.order_date.isoformat() if isinstance(order_data.order_date, date) else order_data.order_date,
                expected_delivery_date=order_data.expected_delivery_date.isoformat() if order_data.expected_delivery_date and isinstance(order_data.expected_delivery_date, date) else order_data.expected_delivery_date,
                shipping_method=order_data.shipping_method,
                shipping_address=shipping_address,
                priority=order_data.priority,
                sales_rep_id=order_data.sales_rep_id,
                sales_rep_name=sales_rep_name,
                line_items=processed_line_items,
                subtotal=order_subtotal,
                subtotal_discount_percent=order_data.subtotal_discount_percent,
                subtotal_discount_amount=order_discount_amount,
                tax_amount=total_tax,
                shipping_cost=order_data.shipping_cost,
                total_amount=order_total,
                payment_status=PaymentStatus.PENDING,
                payment_method=order_data.payment_method,
                paid_amount=0.0,
                balance_due=order_total,
                notes=order_data.notes,
                internal_notes=order_data.internal_notes,
                status=OrderStatus.DRAFT,
                created_by=user_id
            )

            # Insert order
            order_dict = order_doc.dict(by_alias=True, exclude={"id"})
            
            # Convert date objects to ISO format strings for MongoDB storage
            if 'order_date' in order_dict and isinstance(order_dict['order_date'], date):
                order_dict['order_date'] = order_dict['order_date'].isoformat()
            if 'expected_delivery_date' in order_dict and isinstance(order_dict['expected_delivery_date'], date):
                order_dict['expected_delivery_date'] = order_dict['expected_delivery_date'].isoformat()
            if 'actual_delivery_date' in order_dict and isinstance(order_dict['actual_delivery_date'], date):
                order_dict['actual_delivery_date'] = order_dict['actual_delivery_date'].isoformat()
            
            result = await orders_collection.insert_one(order_dict)
            
            # Fetch created order
            created_order = await orders_collection.find_one({"_id": result.inserted_id})
            if created_order:
                # Convert ObjectId to string for response
                if "_id" in created_order:
                    created_order["_id"] = str(created_order["_id"])
                return SalesOrderResponse(**created_order)
            
            return None

        except Exception as e:
            logger.error(f"Error creating sales order: {e}")
            raise

    async def get_order_by_id(self, order_id: str) -> Optional[SalesOrderInDB]:
        """Get order by ID"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            # Exclude deleted orders
            order = await orders_collection.find_one({
                "_id": ObjectId(order_id),
                "deleted": {"$ne": True}
            })
            if order:
                return SalesOrderInDB(**order)
            return None

        except Exception as e:
            logger.error(f"Error getting order by ID: {e}")
            return None

    async def get_order_by_number(self, order_number: str) -> Optional[SalesOrderInDB]:
        """Get order by order number"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            order = await orders_collection.find_one({"order_number": order_number})
            if order:
                return SalesOrderInDB(**order)
            return None

        except Exception as e:
            logger.error(f"Error getting order by number: {e}")
            return None

    async def update_order(self, order_id: str, order_update: SalesOrderUpdate, user_id: str) -> Optional[SalesOrderResponse]:
        """Update sales order"""
        try:
            db = get_database()
            orders_collection = db.sales_orders  # Fixed: was db.orders, should be db.sales_orders

            # Get existing order
            existing_order = await self.get_order_by_id(order_id)
            if not existing_order:
                return None

            # Prepare update data
            update_data = {k: v for k, v in order_update.dict(exclude_unset=True).items() if v is not None}
            update_data["updated_at"] = datetime.utcnow()
            update_data["updated_by"] = user_id

            # If line items are being updated, recalculate totals
            if "line_items" in update_data:
                # Process line items and recalculate totals
                # (Similar logic to create_order)
                pass

            # Update order
            result = await orders_collection.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                # Fetch updated order
                updated_order = await orders_collection.find_one({"_id": ObjectId(order_id)})
                if updated_order:
                    return SalesOrderResponse(**updated_order)
            
            return None

        except Exception as e:
            logger.error(f"Error updating order: {e}")
            return None

    async def update_order_status(self, order_id: str, new_status: str, user_id: str) -> bool:
        """Update order status only"""
        try:
            db = get_database()
            orders_collection = db.sales_orders

            # Validate status
            valid_statuses = ["draft", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]
            if new_status not in valid_statuses:
                raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")

            # Update order status
            update_data = {
                "status": new_status,
                "updated_at": datetime.utcnow(),
                "updated_by": user_id
            }

            # Update order
            result = await orders_collection.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                logger.info(f"Order {order_id} status updated to '{new_status}'")
                return True
            else:
                logger.warning(f"No order was modified for order_id: {order_id}")
                return False

        except Exception as e:
            logger.error(f"Error updating order status for order {order_id}: {e}")
            return False

    async def update_payment_status(self, order_id: str, payment_status: str, paid_amount: float = 0) -> bool:
        """Update payment status and paid amount for an order"""
        try:
            logger.info(f"🔄 update_payment_status called for order {order_id} with status '{payment_status}' and amount {paid_amount}")
            db = get_database()
            orders_collection = db.sales_orders

            # Get existing order to calculate balance
            existing_order = await self.get_order_by_id(order_id)
            if not existing_order:
                logger.error(f"❌ Order {order_id} not found for payment status update")
                return False
            
            logger.info(f"📋 Found existing order: total_amount={existing_order.total_amount}, current_payment_status={existing_order.payment_status}")

            # Update payment fields
            update_data = {
                "payment_status": payment_status,
                "paid_amount": paid_amount,
                "balance_due": existing_order.total_amount - paid_amount,
                "updated_at": datetime.utcnow()
            }

            # Update order
            logger.info(f"📝 Updating order with data: {update_data}")
            result = await orders_collection.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": update_data}
            )

            logger.info(f"📊 Update result: matched_count={result.matched_count}, modified_count={result.modified_count}")
            if result.modified_count > 0:
                logger.info(f"✅ Order {order_id} payment status updated to '{payment_status}' with amount {paid_amount}")
                return True
            else:
                logger.warning(f"⚠️ No order was modified for order_id: {order_id}")
                return False

        except Exception as e:
            logger.error(f"Error updating payment status for order {order_id}: {e}")
            return False

    async def get_orders(self, skip: int = 0, limit: int = 100,
                        status: Optional[OrderStatus] = None,
                        customer_id: Optional[str] = None,
                        sales_rep_id: Optional[str] = None,
                        start_date: Optional[date] = None,
                        end_date: Optional[date] = None,
                        search: Optional[str] = None) -> List[SalesOrderResponse]:
        """Get list of orders with pagination and filters"""
        try:
            db = get_database()
            orders_collection = db.sales_orders

            # Build filter
            filter_query = self._build_filter_query(status, customer_id, sales_rep_id, start_date, end_date, search)

            # Get orders
            cursor = orders_collection.find(filter_query).skip(skip).limit(limit).sort("order_date", -1)
            orders = await cursor.to_list(length=limit)

            # Convert ObjectId to string for response
            result = []
            for order in orders:
                if "_id" in order:
                    order["_id"] = str(order["_id"])
                result.append(SalesOrderResponse(**order))
            
            return result

        except Exception as e:
            logger.error(f"Error getting orders: {e}")
            return []

    async def count_orders(self, status: Optional[OrderStatus] = None,
                          customer_id: Optional[str] = None,
                          sales_rep_id: Optional[str] = None,
                          start_date: Optional[date] = None,
                          end_date: Optional[date] = None,
                          search: Optional[str] = None) -> int:
        """Get total count of orders with filters"""
        try:
            db = get_database()
            orders_collection = db.sales_orders

            # Build filter
            filter_query = self._build_filter_query(status, customer_id, sales_rep_id, start_date, end_date, search)

            # Get count
            count = await orders_collection.count_documents(filter_query)
            return count

        except Exception as e:
            logger.error(f"Error counting orders: {e}")
            return 0

    def _build_filter_query(self, status: Optional[OrderStatus] = None,
                           customer_id: Optional[str] = None,
                           sales_rep_id: Optional[str] = None,
                           start_date: Optional[date] = None,
                           end_date: Optional[date] = None,
                           search: Optional[str] = None) -> dict:
        """Build filter query for orders"""
        # Exclude deleted orders by default
        filter_query = {"deleted": {"$ne": True}}
        
        if status:
            filter_query["status"] = status
        if customer_id:
            filter_query["customer_id"] = customer_id
        if sales_rep_id:
            filter_query["sales_rep_id"] = sales_rep_id
        if start_date and end_date:
            filter_query["order_date"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            filter_query["order_date"] = {"$gte": start_date}
        elif end_date:
            filter_query["order_date"] = {"$lte": end_date}
        if search:
            filter_query["$or"] = [
                {"order_number": {"$regex": search, "$options": "i"}},
                {"customer_name": {"$regex": search, "$options": "i"}},
                {"customer_email": {"$regex": search, "$options": "i"}}
            ]
        return filter_query

    async def confirm_order(self, order_id: str, user_id: str, token: str) -> bool:
        """Confirm order and fulfill stock (reduce inventory immediately)"""
        try:
            db = get_database()
            orders_collection = db.sales_orders

            # Get order
            order = await self.get_order_by_id(order_id)
            if not order or order.status != OrderStatus.DRAFT:
                logger.warning(f"Order {order_id} cannot be confirmed - status: {order.status if order else 'not found'}")
                return False

            # Fulfill stock for each line item (actually reduce inventory)
            logger.info(f"🔄 Fulfilling stock for order {order_id} with {len(order.line_items)} items")
            stock_fulfilled_items = []
            
            for item in order.line_items:
                try:
                    logger.info(f"Fulfilling stock for product {item.product_id}, quantity {item.quantity}")
                    stock_fulfilled = await inventory_service.fulfill_stock(
                        item.product_id, 
                        item.quantity, 
                        order_id,
                        user_id,
                        token
                    )
                    if stock_fulfilled:
                        logger.info(f"✅ Stock fulfilled for product {item.product_id}")
                        stock_fulfilled_items.append(item.product_id)
                    else:
                        logger.warning(f"⚠️  Failed to fulfill stock for product {item.product_id} - continuing anyway")
                except Exception as e:
                    logger.warning(f"Stock fulfillment error for product {item.product_id}: {e} - continuing anyway")
                    import traceback
                    logger.warning(traceback.format_exc())

            # Update order status
            result = await orders_collection.update_one(
                {"_id": ObjectId(order_id)},
                {
                    "$set": {
                        "status": OrderStatus.CONFIRMED,
                        "updated_at": datetime.utcnow(),
                        "updated_by": user_id,
                        "stock_fulfilled_items": stock_fulfilled_items
                    }
                }
            )

            # Update customer stats
            if result.modified_count > 0:
                logger.info(f"✅ Order {order_id} confirmed successfully, {len(stock_fulfilled_items)} items stock fulfilled")
                await customer_service.update_customer_stats(order.customer_id, order.total_amount)

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error confirming order: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False

    async def cancel_order(self, order_id: str, user_id: str, token: str) -> bool:
        """Cancel order and release reserved stock"""
        try:
            db = get_database()
            orders_collection = db.sales_orders

            # Get order
            order = await self.get_order_by_id(order_id)
            if not order:
                return False

            # Try to release reserved stock if order was confirmed (optional for now)
            if order.status in [OrderStatus.CONFIRMED, OrderStatus.PROCESSING]:
                for item in order.line_items:
                    try:
                        await inventory_service.release_stock(
                            item.product_id, 
                            item.quantity, 
                            order_id, 
                            token
                        )
                    except Exception as e:
                        logger.warning(f"Stock release error for product {item.product_id}: {e} - continuing anyway")

            # Update order status
            result = await orders_collection.update_one(
                {"_id": ObjectId(order_id)},
                {
                    "$set": {
                        "status": OrderStatus.CANCELLED,
                        "updated_at": datetime.utcnow(),
                        "updated_by": user_id
                    }
                }
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error cancelling order: {e}")
            return False

    async def delete_order(self, order_id: str, user_id: str) -> bool:
        """Delete sales order (soft delete by setting status to cancelled)"""
        try:
            db = get_database()
            orders_collection = db.sales_orders

            # Check if order exists and can be deleted
            order = await orders_collection.find_one({"_id": ObjectId(order_id)})
            if not order:
                logger.warning(f"Order not found for deletion: {order_id}")
                return False

            # Allow deletion for any status (soft delete by marking as cancelled and deleted)
            # Previously only allowed draft/pending, but now allow all statuses
            logger.info(f"Deleting order {order_id} with status: {order.get('status')}")

            # Soft delete by setting status to cancelled and marking as deleted
            result = await orders_collection.update_one(
                {"_id": ObjectId(order_id)},
                {
                    "$set": {
                        "status": OrderStatus.CANCELLED,
                        "updated_at": datetime.utcnow(),
                        "updated_by": user_id,
                        "deleted": True,
                        "deleted_at": datetime.utcnow()
                    }
                }
            )

            if result.modified_count > 0:
                logger.info(f"Successfully deleted order {order_id}")
                return True
            else:
                logger.warning(f"Failed to delete order {order_id} - no changes made")
                return False

        except Exception as e:
            logger.error(f"Error deleting order {order_id}: {e}")
            return False

    async def _generate_order_number(self) -> str:
        """Generate unique order number"""
        try:
            db = get_database()
            orders_collection = db.sales_orders

            # Get count of existing orders and increment
            order_count = await orders_collection.count_documents({})
            new_number = order_count + 1
            
            # Ensure uniqueness by checking if the generated number exists
            while True:
                order_number = f"SO-{new_number:05d}"
                existing = await orders_collection.find_one({"order_number": order_number})
                if not existing:
                    return order_number
                new_number += 1

        except Exception as e:
            logger.error(f"Error generating order number: {e}")
            return f"SO-{datetime.now().timestamp():.0f}"


# Global instance
sales_order_service = SalesOrderService()
