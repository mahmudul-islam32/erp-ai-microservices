#!/usr/bin/env python3
"""
Complete Sales Data Creator - Enhanced Version
Creates 50+ records for all sales service endpoints
Includes proper pagination support and comprehensive testing
"""

import asyncio
import json
import random
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
import os
import sys
from faker import Faker

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

try:
    from app.database import get_database
    from app.models import (
        CustomerCreate, CustomerType, CustomerStatus, PaymentTerms,
        SalesOrderCreate, OrderLineItemCreate, OrderStatus, PaymentStatus,
        ShippingMethod, OrderPriority,
        QuoteCreate, QuoteStatus,
        InvoiceCreate, InvoiceStatus, PaymentMethod
    )
    from app.services import customer_service
except ImportError as e:
    print(f"Failed to import modules: {e}")
    print("Please run this script from the sales-service directory")
    sys.exit(1)

fake = Faker(['en_US', 'en_GB', 'en_CA'])

class EnhancedSalesDataCreator:
    def __init__(self):
        self.db = None
        self.customers = []
        self.products = []
        self.sales_orders = []
        self.quotes = []
        self.invoices = []

    async def initialize(self):
        """Initialize database connection"""
        self.db = get_database()
        print("✅ Database connection established")

    async def create_customers(self, count: int = 50) -> List[str]:
        """Create diverse customer records with proper validation"""
        print(f"\n👥 Creating {count} customers...")
        
        customer_ids = []
        success_count = 0
        
        for i in range(count):
            try:
                # Create diverse customer mix
                is_business = random.choice([True, True, False])  # 67% business
                
                if is_business:
                    company_name = fake.company()
                    first_name = fake.first_name()
                    last_name = fake.last_name()
                    customer_type = CustomerType.BUSINESS
                    credit_limit = round(random.uniform(5000, 100000), 2)
                    tax_id = fake.bothify(text='##-#######')
                else:
                    company_name = None
                    first_name = fake.first_name()
                    last_name = fake.last_name()
                    customer_type = CustomerType.INDIVIDUAL
                    credit_limit = round(random.uniform(500, 10000), 2)
                    tax_id = None

                # Generate addresses
                billing_address = {
                    "street": fake.street_address(),
                    "city": fake.city(),
                    "state": fake.state_abbr(),
                    "postal_code": fake.postcode(),
                    "country": "US"
                }

                # 60% same shipping address, 40% different
                if random.random() < 0.6:
                    shipping_address = billing_address.copy()
                else:
                    shipping_address = {
                        "street": fake.street_address(),
                        "city": fake.city(),
                        "state": fake.state_abbr(),
                        "postal_code": fake.postcode(),
                        "country": "US"
                    }

                customer_data = CustomerCreate(
                    first_name=first_name,
                    last_name=last_name,
                    company_name=company_name,
                    customer_type=customer_type,
                    email=fake.unique.email(),
                    phone=fake.phone_number()[:20],
                    billing_address=billing_address,
                    shipping_address=shipping_address,
                    payment_terms=random.choice(list(PaymentTerms)),
                    credit_limit=credit_limit,
                    tax_id=tax_id,
                    notes=fake.text(max_nb_chars=150) if random.random() < 0.3 else None
                )

                customer = await customer_service.create_customer(customer_data)
                if customer:
                    customer_ids.append(customer.id)
                    self.customers.append(customer)
                    success_count += 1
                    
                    if success_count % 10 == 0:
                        print(f"  ✅ Created {success_count} customers")
                        
            except Exception as e:
                print(f"  ⚠️ Error creating customer {i + 1}: {str(e)[:100]}")
                continue

        print(f"✅ Successfully created {success_count} customers")
        return customer_ids

    async def create_products(self, count: int = 25) -> List[str]:
        """Create diverse product catalog"""
        print(f"\n📦 Creating {count} products...")
        
        products_collection = self.db.products
        
        # Diverse product categories
        categories = [
            "Electronics", "Computers & Laptops", "Software & Licenses", 
            "Office Supplies", "Furniture", "Industrial Equipment", 
            "Tools & Hardware", "Automotive Parts", "Medical Equipment",
            "Educational Materials", "Books & Publications", "Clothing & Apparel",
            "Food & Beverage", "Sports & Recreation", "Home & Garden"
        ]
        
        product_templates = {
            "Electronics": ["Smartphone", "Tablet", "Headphones", "Smart Watch", "Camera"],
            "Computers & Laptops": ["Laptop", "Desktop Computer", "Monitor", "Keyboard", "Mouse"],
            "Software & Licenses": ["Antivirus Software", "Office Suite", "Design Software", "Database License"],
            "Office Supplies": ["Paper", "Pens", "Folders", "Stapler", "Calculator"],
            "Furniture": ["Office Chair", "Desk", "Filing Cabinet", "Conference Table", "Bookshelf"]
        }
        
        product_ids = []
        success_count = 0
        
        for i in range(count):
            try:
                category = random.choice(categories)
                
                # Get product name template or generate one
                if category in product_templates:
                    base_name = random.choice(product_templates[category])
                    product_name = f"{fake.company().split()[0]} {base_name}"
                else:
                    product_name = f"{fake.catch_phrase()} {category.split()[0]}"

                # Price tiers based on category
                if category in ["Electronics", "Computers & Laptops"]:
                    price_range = (100, 3000)
                elif category in ["Software & Licenses", "Medical Equipment"]:
                    price_range = (50, 5000)
                elif category in ["Industrial Equipment", "Furniture"]:
                    price_range = (200, 8000)
                else:
                    price_range = (5, 500)

                unit_price = round(random.uniform(*price_range), 2)
                cost_price = round(unit_price * random.uniform(0.3, 0.7), 2)

                product_doc = {
                    "name": product_name,
                    "description": fake.text(max_nb_chars=250),
                    "sku": f"SKU-{fake.bothify(text='####??##')}",
                    "category": category,
                    "unit_price": unit_price,
                    "cost_price": cost_price,
                    "tax_rate": round(random.choice([0.00, 0.05, 0.08, 0.10, 0.15]), 2),
                    "unit_of_measure": random.choice(["piece", "kg", "meter", "liter", "box", "set", "hour"]),
                    "min_stock_level": random.randint(5, 50),
                    "current_stock": random.randint(0, 200),
                    "status": "active",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                result = await products_collection.insert_one(product_doc)
                product_ids.append(str(result.inserted_id))
                self.products.append({**product_doc, "_id": str(result.inserted_id)})
                success_count += 1
                
                if success_count % 5 == 0:
                    print(f"  ✅ Created {success_count} products")
                    
            except Exception as e:
                print(f"  ⚠️ Error creating product {i + 1}: {str(e)[:100]}")
                continue

        print(f"✅ Successfully created {success_count} products")
        return product_ids

    async def create_sales_orders(self, customer_ids: List[str], product_ids: List[str], count: int = 75) -> List[str]:
        """Create realistic sales orders with proper relationships"""
        print(f"\n📋 Creating {count} sales orders...")
        
        if not customer_ids or not product_ids:
            print("❌ No customers or products available")
            return []

        orders_collection = self.db.sales_orders
        order_ids = []
        success_count = 0
        
        # Get next order number
        last_order = await orders_collection.find_one({}, sort=[("order_number", -1)])
        if last_order and last_order.get("order_number"):
            next_number = int(last_order["order_number"].split("-")[-1]) + 1
        else:
            next_number = 1

        for i in range(count):
            try:
                customer_id = random.choice(customer_ids)
                customer = next((c for c in self.customers if c.id == customer_id), None)
                
                if not customer:
                    continue

                # Create 1-6 line items
                num_items = random.randint(1, 6)
                line_items = []
                
                selected_products = random.sample(self.products, min(num_items, len(self.products)))
                
                for product in selected_products:
                    quantity = random.randint(1, 12)
                    # Add some price variation (discounts/markups)
                    unit_price = round(product["unit_price"] * random.uniform(0.85, 1.15), 2)
                    
                    line_item = {
                        "product_id": product["_id"],
                        "product_name": product["name"],
                        "product_sku": product["sku"],
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "tax_rate": product.get("tax_rate", 0.08),
                        "line_total": quantity * unit_price
                    }
                    line_items.append(line_item)

                # Calculate amounts
                subtotal = sum(item["line_total"] for item in line_items)
                discount_percent = round(random.uniform(0, 20), 2) if random.random() < 0.3 else 0
                discount_amount = round(subtotal * (discount_percent / 100), 2)
                discounted_subtotal = subtotal - discount_amount
                tax_amount = round(sum(item["quantity"] * item["unit_price"] * item["tax_rate"] for item in line_items), 2)
                shipping_cost = round(random.uniform(0, 150), 2) if random.random() < 0.7 else 0
                total_amount = discounted_subtotal + tax_amount + shipping_cost

                # Random dates within last 6 months
                order_date = fake.date_between(start_date='-6m', end_date='today')
                expected_delivery = order_date + timedelta(days=random.randint(3, 45))

                # Realistic status distribution
                status_weights = {
                    OrderStatus.DRAFT.value: 0.1,
                    OrderStatus.CONFIRMED.value: 0.2,
                    OrderStatus.PROCESSING.value: 0.15,
                    OrderStatus.SHIPPED.value: 0.25,
                    OrderStatus.DELIVERED.value: 0.25,
                    OrderStatus.CANCELLED.value: 0.05
                }
                status = random.choices(list(status_weights.keys()), weights=list(status_weights.values()))[0]

                # Payment status based on order status
                if status in [OrderStatus.DELIVERED.value]:
                    payment_status = random.choice([PaymentStatus.PAID.value, PaymentStatus.PARTIAL.value])
                elif status in [OrderStatus.CANCELLED.value]:
                    payment_status = PaymentStatus.PENDING.value
                else:
                    payment_status = random.choice([PaymentStatus.PENDING.value, PaymentStatus.PARTIAL.value])

                order_doc = {
                    "order_number": f"SO-{next_number:06d}",
                    "customer_id": customer_id,
                    "customer_name": f"{customer.first_name} {customer.last_name}",
                    "customer_email": customer.email,
                    "order_date": order_date,
                    "expected_delivery_date": expected_delivery,
                    "actual_delivery_date": expected_delivery if status == OrderStatus.DELIVERED.value else None,
                    "shipping_method": random.choice(list(ShippingMethod)).value,
                    "shipping_address": customer.shipping_address,
                    "priority": random.choice(list(OrderPriority)).value,
                    "line_items": line_items,
                    "subtotal": subtotal,
                    "subtotal_discount_percent": discount_percent,
                    "subtotal_discount_amount": discount_amount,
                    "tax_amount": tax_amount,
                    "shipping_cost": shipping_cost,
                    "total_amount": total_amount,
                    "payment_status": payment_status,
                    "paid_amount": total_amount if payment_status == PaymentStatus.PAID.value else 
                                  round(total_amount * random.uniform(0.2, 0.8), 2) if payment_status == PaymentStatus.PARTIAL.value else 0,
                    "balance_due": total_amount if payment_status == PaymentStatus.PENDING.value else 
                                  total_amount - (total_amount if payment_status == PaymentStatus.PAID.value else 
                                  round(total_amount * random.uniform(0.2, 0.8), 2)),
                    "status": status,
                    "notes": fake.sentence() if random.random() < 0.4 else None,
                    "internal_notes": fake.sentence() if random.random() < 0.2 else None,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "created_by": "comprehensive_data_script",
                    "updated_by": None
                }

                result = await orders_collection.insert_one(order_doc)
                order_ids.append(str(result.inserted_id))
                self.sales_orders.append({**order_doc, "_id": str(result.inserted_id)})
                success_count += 1
                next_number += 1
                
                if success_count % 15 == 0:
                    print(f"  ✅ Created {success_count} sales orders")
                    
            except Exception as e:
                print(f"  ⚠️ Error creating sales order {i + 1}: {str(e)[:100]}")
                continue

        print(f"✅ Successfully created {success_count} sales orders")
        return order_ids

    async def create_quotes(self, customer_ids: List[str], product_ids: List[str], count: int = 60) -> List[str]:
        """Create quote records with realistic data"""
        print(f"\n💬 Creating {count} quotes...")
        
        if not customer_ids or not product_ids:
            print("❌ No customers or products available")
            return []

        quotes_collection = self.db.quotes
        quote_ids = []
        success_count = 0
        
        # Get next quote number
        last_quote = await quotes_collection.find_one({}, sort=[("quote_number", -1)])
        if last_quote and last_quote.get("quote_number"):
            next_number = int(last_quote["quote_number"].split("-")[-1]) + 1
        else:
            next_number = 1

        for i in range(count):
            try:
                customer_id = random.choice(customer_ids)
                customer = next((c for c in self.customers if c.id == customer_id), None)
                
                if not customer:
                    continue

                # Create line items
                num_items = random.randint(1, 5)
                line_items = []
                
                selected_products = random.sample(self.products, min(num_items, len(self.products)))
                
                for product in selected_products:
                    quantity = random.randint(1, 10)
                    # Quotes often have negotiated prices
                    unit_price = round(product["unit_price"] * random.uniform(0.8, 1.2), 2)
                    
                    line_item = {
                        "product_id": product["_id"],
                        "product_name": product["name"],
                        "product_sku": product["sku"],
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "tax_rate": product.get("tax_rate", 0.08),
                        "line_total": quantity * unit_price
                    }
                    line_items.append(line_item)

                # Calculate amounts
                subtotal = sum(item["line_total"] for item in line_items)
                discount_percent = round(random.uniform(0, 25), 2) if random.random() < 0.4 else 0
                discount_amount = round(subtotal * (discount_percent / 100), 2)
                tax_amount = round(sum(item["quantity"] * item["unit_price"] * item["tax_rate"] for item in line_items), 2)
                total_amount = subtotal - discount_amount + tax_amount

                # Quote dates
                quote_date = fake.date_between(start_date='-4m', end_date='today')
                valid_until = quote_date + timedelta(days=random.randint(30, 120))

                # Status distribution
                status_weights = {
                    QuoteStatus.DRAFT.value: 0.15,
                    QuoteStatus.SENT.value: 0.40,
                    QuoteStatus.ACCEPTED.value: 0.25,
                    QuoteStatus.REJECTED.value: 0.15,
                    QuoteStatus.EXPIRED.value: 0.05
                }
                status = random.choices(list(status_weights.keys()), weights=list(status_weights.values()))[0]

                quote_doc = {
                    "quote_number": f"QUO-{next_number:06d}",
                    "customer_id": customer_id,
                    "customer_name": f"{customer.first_name} {customer.last_name}",
                    "customer_email": customer.email,
                    "quote_date": quote_date,
                    "valid_until": valid_until,
                    "line_items": line_items,
                    "subtotal": subtotal,
                    "subtotal_discount_percent": discount_percent,
                    "subtotal_discount_amount": discount_amount,
                    "tax_amount": tax_amount,
                    "total_amount": total_amount,
                    "status": status,
                    "notes": fake.sentence() if random.random() < 0.3 else None,
                    "internal_notes": fake.sentence() if random.random() < 0.2 else None,
                    "sent_at": quote_date + timedelta(days=1) if status != QuoteStatus.DRAFT.value else None,
                    "accepted_at": quote_date + timedelta(days=random.randint(2, 14)) if status == QuoteStatus.ACCEPTED.value else None,
                    "rejected_at": quote_date + timedelta(days=random.randint(2, 14)) if status == QuoteStatus.REJECTED.value else None,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "created_by": "comprehensive_data_script",
                    "updated_by": None
                }

                result = await quotes_collection.insert_one(quote_doc)
                quote_ids.append(str(result.inserted_id))
                self.quotes.append({**quote_doc, "_id": str(result.inserted_id)})
                success_count += 1
                next_number += 1
                
                if success_count % 12 == 0:
                    print(f"  ✅ Created {success_count} quotes")
                    
            except Exception as e:
                print(f"  ⚠️ Error creating quote {i + 1}: {str(e)[:100]}")
                continue

        print(f"✅ Successfully created {success_count} quotes")
        return quote_ids

    async def create_invoices(self, customer_ids: List[str], count: int = 85) -> List[str]:
        """Create invoice records with realistic payment patterns"""
        print(f"\n🧾 Creating {count} invoices...")
        
        if not customer_ids:
            print("❌ No customers available")
            return []

        invoices_collection = self.db.invoices
        invoice_ids = []
        success_count = 0
        
        # Get next invoice number
        last_invoice = await invoices_collection.find_one({}, sort=[("invoice_number", -1)])
        if last_invoice and last_invoice.get("invoice_number"):
            next_number = int(last_invoice["invoice_number"].split("-")[-1]) + 1
        else:
            next_number = 1

        for i in range(count):
            try:
                customer_id = random.choice(customer_ids)
                customer = next((c for c in self.customers if c.id == customer_id), None)
                
                if not customer:
                    continue

                # Invoice amounts with realistic distribution
                if random.random() < 0.3:  # 30% small invoices
                    amount_range = (50, 500)
                elif random.random() < 0.5:  # 50% medium invoices
                    amount_range = (500, 5000)
                else:  # 20% large invoices
                    amount_range = (5000, 25000)

                subtotal = round(random.uniform(*amount_range), 2)
                tax_rate = random.choice([0.00, 0.05, 0.08, 0.10])
                tax_amount = round(subtotal * tax_rate, 2)
                total_amount = subtotal + tax_amount

                # Invoice dates
                invoice_date = fake.date_between(start_date='-5m', end_date='today')
                due_date = invoice_date + timedelta(days=random.choice([15, 30, 45, 60]))

                # Payment status with realistic distribution
                days_since_invoice = (datetime.now().date() - invoice_date).days
                days_overdue = (datetime.now().date() - due_date).days
                
                if days_overdue > 30:
                    # Overdue invoices
                    payment_status = random.choices(
                        [PaymentStatus.OVERDUE.value, PaymentStatus.PAID.value, PaymentStatus.PARTIAL.value],
                        weights=[0.6, 0.3, 0.1]
                    )[0]
                elif days_overdue > 0:
                    # Recently overdue
                    payment_status = random.choices(
                        [PaymentStatus.OVERDUE.value, PaymentStatus.PAID.value, PaymentStatus.PARTIAL.value],
                        weights=[0.4, 0.5, 0.1]
                    )[0]
                else:
                    # Not yet due
                    payment_status = random.choices(
                        [PaymentStatus.PENDING.value, PaymentStatus.PAID.value, PaymentStatus.PARTIAL.value],
                        weights=[0.6, 0.35, 0.05]
                    )[0]

                # Calculate payment amounts
                if payment_status == PaymentStatus.PAID.value:
                    paid_amount = total_amount
                elif payment_status == PaymentStatus.PARTIAL.value:
                    paid_amount = round(total_amount * random.uniform(0.2, 0.8), 2)
                else:
                    paid_amount = 0

                balance_due = total_amount - paid_amount

                # Invoice status
                if payment_status == PaymentStatus.PAID.value:
                    status = InvoiceStatus.PAID.value
                elif days_overdue > 0 and payment_status != PaymentStatus.PAID.value:
                    status = InvoiceStatus.OVERDUE.value
                else:
                    status = random.choice([InvoiceStatus.DRAFT.value, InvoiceStatus.SENT.value])

                invoice_doc = {
                    "invoice_number": f"INV-{next_number:06d}",
                    "customer_id": customer_id,
                    "customer_name": f"{customer.first_name} {customer.last_name}",
                    "customer_email": customer.email,
                    "invoice_date": invoice_date,
                    "due_date": due_date,
                    "subtotal": subtotal,
                    "tax_rate": tax_rate,
                    "tax_amount": tax_amount,
                    "total_amount": total_amount,
                    "paid_amount": paid_amount,
                    "balance_due": balance_due,
                    "payment_status": payment_status,
                    "status": status,
                    "payment_method": random.choice(list(PaymentMethod)).value if paid_amount > 0 else None,
                    "payment_date": invoice_date + timedelta(days=random.randint(1, 45)) if paid_amount > 0 else None,
                    "notes": fake.sentence() if random.random() < 0.25 else None,
                    "terms": "Net 30" if due_date == invoice_date + timedelta(days=30) else f"Net {(due_date - invoice_date).days}",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "created_by": "comprehensive_data_script",
                    "updated_by": None
                }

                result = await invoices_collection.insert_one(invoice_doc)
                invoice_ids.append(str(result.inserted_id))
                self.invoices.append({**invoice_doc, "_id": str(result.inserted_id)})
                success_count += 1
                next_number += 1
                
                if success_count % 17 == 0:
                    print(f"  ✅ Created {success_count} invoices")
                    
            except Exception as e:
                print(f"  ⚠️ Error creating invoice {i + 1}: {str(e)[:100]}")
                continue

        print(f"✅ Successfully created {success_count} invoices")
        return invoice_ids

    async def create_all_comprehensive_data(self):
        """Create all sales data with comprehensive coverage"""
        print("🚀 Creating comprehensive sales data for all endpoints...")
        print("=" * 60)
        
        await self.initialize()
        
        # Create all data
        customer_ids = await self.create_customers(50)
        product_ids = await self.create_products(25)
        order_ids = await self.create_sales_orders(customer_ids, product_ids, 75)
        quote_ids = await self.create_quotes(customer_ids, product_ids, 60)
        invoice_ids = await self.create_invoices(customer_ids, 85)
        
        # Calculate totals
        total_records = len(customer_ids) + len(product_ids) + len(order_ids) + len(quote_ids) + len(invoice_ids)
        
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE DATA CREATION COMPLETE!")
        print("=" * 60)
        print(f"👥 Customers:     {len(customer_ids):3d} records")
        print(f"📦 Products:      {len(product_ids):3d} records")
        print(f"📋 Sales Orders:  {len(order_ids):3d} records")
        print(f"💬 Quotes:        {len(quote_ids):3d} records")
        print(f"🧾 Invoices:      {len(invoice_ids):3d} records")
        print(f"📈 TOTAL:         {total_records:3d} records")
        print("=" * 60)
        
        print("\n🔍 API Testing Commands:")
        print("For customers pagination:")
        print("  curl -X GET 'http://localhost:8003/api/v1/customers?skip=0&limit=10' -H 'Cookie: access_token=YOUR_TOKEN'")
        print("  curl -X GET 'http://localhost:8003/api/v1/customers?skip=10&limit=10' -H 'Cookie: access_token=YOUR_TOKEN'")
        print("\nFor sales orders pagination:")
        print("  curl -X GET 'http://localhost:8003/api/v1/sales-orders?skip=0&limit=10' -H 'Cookie: access_token=YOUR_TOKEN'")
        print("\nFor quotes pagination:")
        print("  curl -X GET 'http://localhost:8003/api/v1/quotes?skip=0&limit=10' -H 'Cookie: access_token=YOUR_TOKEN'")
        print("\nFor invoices pagination:")
        print("  curl -X GET 'http://localhost:8003/api/v1/invoices?skip=0&limit=10' -H 'Cookie: access_token=YOUR_TOKEN'")
        
        return {
            "customers": len(customer_ids),
            "products": len(product_ids),
            "sales_orders": len(order_ids),
            "quotes": len(quote_ids),
            "invoices": len(invoice_ids),
            "total": total_records
        }

async def main():
    """Main function"""
    try:
        creator = EnhancedSalesDataCreator()
        result = await creator.create_all_comprehensive_data()
        
        print(f"\n🎉 SUCCESS! Your sales service now has comprehensive test data:")
        print(f"   Total records created: {result['total']}")
        print(f"\n💡 Frontend should now display all data with proper pagination!")
        print(f"   The frontend can now paginate through 50+ customers, 75+ orders, etc.")
        
    except Exception as e:
        print(f"❌ Error in main execution: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
