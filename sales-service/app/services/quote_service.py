from app.database import get_database
from app.models import (
    QuoteCreate, QuoteUpdate, QuoteResponse, QuoteInDB, QuoteStatus,
    OrderLineItem, SalesOrderCreate
)
from app.services.customer_service import customer_service
from app.services.product_service import product_service
from app.services.external_services import auth_service
from pymongo.errors import DuplicateKeyError
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class QuoteService:
    def __init__(self):
        pass

    async def create_quote(self, quote_data: QuoteCreate, user_id: str, token: str) -> QuoteResponse:
        """Create a new quote"""
        try:
            db = get_database()
            quotes_collection = db.quotes

            # Validate customer
            customer = await customer_service.get_customer_by_id(quote_data.customer_id)
            if not customer:
                raise ValueError("Customer not found")

            # Get user info for sales rep
            user_info = None
            sales_rep_name = None
            if quote_data.sales_rep_id:
                user_info = await auth_service.get_user_by_id(quote_data.sales_rep_id, token)
                if user_info:
                    sales_rep_name = f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip()

            # Process line items
            processed_line_items = []
            subtotal = 0.0
            total_tax = 0.0

            for item in quote_data.line_items:
                # Get product details
                product = await product_service.get_product_by_id(item.product_id)
                if not product:
                    raise ValueError(f"Product not found: {item.product_id}")

                # Use provided price or product's default price
                unit_price = item.unit_price if item.unit_price is not None else product.unit_price

                # Calculate line totals
                line_subtotal = unit_price * item.quantity
                discount_amount = item.discount_amount
                if item.discount_percent > 0:
                    discount_amount = line_subtotal * (item.discount_percent / 100)
                
                line_total_before_tax = line_subtotal - discount_amount
                
                # Calculate tax
                tax_rate = product.tax_rate or settings.default_tax_rate
                tax_amount = line_total_before_tax * tax_rate
                line_total = line_total_before_tax + tax_amount

                # Create line item
                line_item = OrderLineItem(
                    product_id=item.product_id,
                    product_name=product.name,
                    product_sku=product.sku,
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

            # Calculate quote totals
            quote_subtotal = subtotal
            quote_discount_amount = quote_data.subtotal_discount_amount
            if quote_data.subtotal_discount_percent > 0:
                quote_discount_amount = quote_subtotal * (quote_data.subtotal_discount_percent / 100)

            quote_total = quote_subtotal - quote_discount_amount + total_tax

            # Generate quote number
            quote_number = await self._generate_quote_number()

            # Calculate expiry date
            expiry_date = quote_data.expiry_date
            if not expiry_date:
                expiry_date = (quote_data.quote_date or date.today()) + timedelta(days=30)

            # Create quote document
            quote_doc = QuoteInDB(
                quote_number=quote_number,
                customer_id=quote_data.customer_id,
                customer_name=f"{customer.first_name} {customer.last_name}".strip(),
                customer_email=customer.email,
                quote_date=quote_data.quote_date or date.today(),
                expiry_date=expiry_date,
                sales_rep_id=quote_data.sales_rep_id,
                sales_rep_name=sales_rep_name,
                line_items=processed_line_items,
                subtotal=quote_subtotal,
                subtotal_discount_percent=quote_data.subtotal_discount_percent,
                subtotal_discount_amount=quote_discount_amount,
                tax_amount=total_tax,
                total_amount=quote_total,
                notes=quote_data.notes,
                internal_notes=quote_data.internal_notes,
                status=QuoteStatus.DRAFT,
                created_by=user_id
            )

            # Insert quote
            result = await quotes_collection.insert_one(quote_doc.dict(by_alias=True, exclude={"id"}))
            
            # Fetch created quote
            created_quote = await quotes_collection.find_one({"_id": result.inserted_id})
            if created_quote:
                return QuoteResponse(**created_quote)
            
            return None

        except Exception as e:
            logger.error(f"Error creating quote: {e}")
            raise

    async def get_quote_by_id(self, quote_id: str) -> Optional[QuoteInDB]:
        """Get quote by ID"""
        try:
            db = get_database()
            quotes_collection = db.quotes
            
            quote = await quotes_collection.find_one({"_id": ObjectId(quote_id)})
            if quote:
                return QuoteInDB(**quote)
            return None

        except Exception as e:
            logger.error(f"Error getting quote by ID: {e}")
            return None

    async def get_quote_by_number(self, quote_number: str) -> Optional[QuoteInDB]:
        """Get quote by quote number"""
        try:
            db = get_database()
            quotes_collection = db.quotes
            
            quote = await quotes_collection.find_one({"quote_number": quote_number})
            if quote:
                return QuoteInDB(**quote)
            return None

        except Exception as e:
            logger.error(f"Error getting quote by number: {e}")
            return None

    async def update_quote(self, quote_id: str, quote_update: QuoteUpdate, user_id: str) -> Optional[QuoteResponse]:
        """Update quote"""
        try:
            db = get_database()
            quotes_collection = db.quotes

            # Get existing quote
            existing_quote = await self.get_quote_by_id(quote_id)
            if not existing_quote:
                return None

            # Prepare update data
            update_data = {k: v for k, v in quote_update.dict(exclude_unset=True).items() if v is not None}
            update_data["updated_at"] = datetime.utcnow()
            update_data["updated_by"] = user_id

            # If line items are being updated, recalculate totals
            if "line_items" in update_data:
                # Similar logic to create_quote for recalculating totals
                # Implementation would go here
                pass

            # Update quote
            result = await quotes_collection.update_one(
                {"_id": ObjectId(quote_id)},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                # Fetch updated quote
                updated_quote = await quotes_collection.find_one({"_id": ObjectId(quote_id)})
                if updated_quote:
                    return QuoteResponse(**updated_quote)
            
            return None

        except Exception as e:
            logger.error(f"Error updating quote: {e}")
            return None

    async def get_quotes(self, skip: int = 0, limit: int = 100,
                        status: Optional[QuoteStatus] = None,
                        customer_id: Optional[str] = None,
                        sales_rep_id: Optional[str] = None,
                        start_date: Optional[date] = None,
                        end_date: Optional[date] = None,
                        search: Optional[str] = None) -> List[QuoteResponse]:
        """Get list of quotes with pagination and filters"""
        try:
            db = get_database()
            quotes_collection = db.quotes

            # Build filter
            filter_query = {}
            if status:
                filter_query["status"] = status
            if customer_id:
                filter_query["customer_id"] = customer_id
            if sales_rep_id:
                filter_query["sales_rep_id"] = sales_rep_id
            if start_date and end_date:
                filter_query["quote_date"] = {"$gte": start_date, "$lte": end_date}
            elif start_date:
                filter_query["quote_date"] = {"$gte": start_date}
            elif end_date:
                filter_query["quote_date"] = {"$lte": end_date}
            if search:
                filter_query["$or"] = [
                    {"quote_number": {"$regex": search, "$options": "i"}},
                    {"customer_name": {"$regex": search, "$options": "i"}},
                    {"customer_email": {"$regex": search, "$options": "i"}}
                ]

            # Get quotes
            cursor = quotes_collection.find(filter_query).skip(skip).limit(limit).sort("quote_date", -1)
            quotes = await cursor.to_list(length=limit)

            return [QuoteResponse(**quote) for quote in quotes]

        except Exception as e:
            logger.error(f"Error getting quotes: {e}")
            return []

    async def send_quote(self, quote_id: str, user_id: str) -> bool:
        """Send quote to customer via email"""
        try:
            # Get quote
            quote = await self.get_quote_by_id(quote_id)
            if not quote:
                return False

            # Update status to sent
            db = get_database()
            quotes_collection = db.quotes
            
            result = await quotes_collection.update_one(
                {"_id": ObjectId(quote_id)},
                {
                    "$set": {
                        "status": QuoteStatus.SENT,
                        "sent_at": datetime.utcnow(),
                        "sent_by": user_id,
                        "updated_at": datetime.utcnow(),
                        "updated_by": user_id
                    }
                }
            )

            # Here you would implement email sending logic
            # For now, just return success
            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error sending quote: {e}")
            return False

    async def accept_quote(self, quote_id: str, user_id: str) -> Optional[str]:
        """Accept quote and convert to sales order"""
        try:
            # Get quote
            quote = await self.get_quote_by_id(quote_id)
            if not quote or quote.status != QuoteStatus.SENT:
                return None

            # Update quote status
            db = get_database()
            quotes_collection = db.quotes
            
            await quotes_collection.update_one(
                {"_id": ObjectId(quote_id)},
                {
                    "$set": {
                        "status": QuoteStatus.ACCEPTED,
                        "accepted_at": datetime.utcnow(),
                        "accepted_by": user_id,
                        "updated_at": datetime.utcnow(),
                        "updated_by": user_id
                    }
                }
            )

            # Convert to sales order
            from app.services.sales_order_service import sales_order_service
            
            order_data = SalesOrderCreate(
                customer_id=quote.customer_id,
                order_date=date.today(),
                sales_rep_id=quote.sales_rep_id,
                line_items=quote.line_items,
                subtotal_discount_percent=quote.subtotal_discount_percent,
                subtotal_discount_amount=quote.subtotal_discount_amount,
                shipping_cost=0.0,
                notes=quote.notes,
                internal_notes=f"Converted from quote: {quote.quote_number}. {quote.internal_notes or ''}"
            )

            # This would need the token - for now just return the quote ID
            # order = await sales_order_service.create_order(order_data, user_id, token)
            # return order.id if order else None
            
            return quote_id  # Placeholder

        except Exception as e:
            logger.error(f"Error accepting quote: {e}")
            return None

    async def reject_quote(self, quote_id: str, user_id: str, reason: Optional[str] = None) -> bool:
        """Reject quote"""
        try:
            db = get_database()
            quotes_collection = db.quotes

            update_data = {
                "status": QuoteStatus.REJECTED,
                "rejected_at": datetime.utcnow(),
                "rejected_by": user_id,
                "updated_at": datetime.utcnow(),
                "updated_by": user_id
            }

            if reason:
                update_data["rejection_reason"] = reason

            result = await quotes_collection.update_one(
                {"_id": ObjectId(quote_id)},
                {"$set": update_data}
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error rejecting quote: {e}")
            return False

    async def duplicate_quote(self, quote_id: str, user_id: str, token: str) -> Optional[QuoteResponse]:
        """Duplicate an existing quote"""
        try:
            # Get original quote
            original_quote = await self.get_quote_by_id(quote_id)
            if not original_quote:
                return None

            # Create new quote data
            quote_data = QuoteCreate(
                customer_id=original_quote.customer_id,
                quote_date=date.today(),
                sales_rep_id=original_quote.sales_rep_id,
                line_items=original_quote.line_items,
                subtotal_discount_percent=original_quote.subtotal_discount_percent,
                subtotal_discount_amount=original_quote.subtotal_discount_amount,
                notes=original_quote.notes,
                internal_notes=f"Duplicated from quote: {original_quote.quote_number}"
            )

            # Create new quote
            new_quote = await self.create_quote(quote_data, user_id, token)
            return new_quote

        except Exception as e:
            logger.error(f"Error duplicating quote: {e}")
            return None

    async def generate_quote_pdf(self, quote_id: str) -> Optional[bytes]:
        """Generate quote PDF"""
        try:
            # Get quote
            quote = await self.get_quote_by_id(quote_id)
            if not quote:
                return None

            # Here you would implement PDF generation logic
            # For now, return empty bytes as placeholder
            return b"PDF content would go here"

        except Exception as e:
            logger.error(f"Error generating quote PDF: {e}")
            return None

    async def _generate_quote_number(self) -> str:
        """Generate unique quote number"""
        try:
            db = get_database()
            quotes_collection = db.quotes

            # Get last quote number
            last_quote = await quotes_collection.find_one(
                {}, 
                sort=[("quote_number", -1)]
            )

            if last_quote and last_quote.get("quote_number"):
                # Extract number from last code (e.g., "QT-00001" -> 1)
                last_code = last_quote["quote_number"]
                if "-" in last_code:
                    last_number = int(last_code.split("-")[-1])
                    new_number = last_number + 1
                else:
                    new_number = 1
            else:
                new_number = 1

            return f"QT-{new_number:05d}"

        except Exception as e:
            logger.error(f"Error generating quote number: {e}")
            return f"QT-{datetime.now().timestamp():.0f}"


# Global instance
quote_service = QuoteService()
