#!/usr/bin/env python3
"""
Direct Database Sales Data Creator
Creates 50+ records for all sales entities using direct database operations
"""

import asyncio
import random
from datetime import datetime, date, timedelta
from typing import List
import motor.motor_asyncio
import os

# Faker for realistic data generation
class SimpleFaker:
    """Simple faker replacement for basic data generation"""
    
    companies = [
        "Tech Solutions Inc", "Global Industries", "Advanced Systems", "Digital Innovations",
        "Smart Technologies", "Future Enterprises", "Dynamic Solutions", "Precision Corp",
        "Elite Services", "Prime Solutions", "Apex Technologies", "Superior Systems",
        "Excellence Corp", "Quality Solutions", "Professional Services", "Expert Systems"
    ]
    
    first_names = [
        "John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa",
        "James", "Maria", "William", "Jennifer", "Richard", "Linda", "Thomas", "Patricia",
        "Charles", "Barbara", "Joseph", "Elizabeth", "Christopher", "Susan", "Daniel", "Jessica"
    ]
    
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
        "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
        "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White"
    ]
    
    cities = [
        "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
        "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
        "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle"
    ]
    
    states = [
        "CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI",
        "NJ", "VA", "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI"
    ]
    
    def company(self):
        return random.choice(self.companies)
    
    def first_name(self):
        return random.choice(self.first_names)
    
    def last_name(self):
        return random.choice(self.last_names)
    
    def email(self):
        domains = ["gmail.com", "yahoo.com", "outlook.com", "company.com", "business.org"]
        name = f"{self.first_name().lower()}.{self.last_name().lower()}"
        return f"{name}@{random.choice(domains)}"
    
    def phone_number(self):
        return f"+1-{random.randint(200,999)}-{random.randint(200,999)}-{random.randint(1000,9999)}"
    
    def street_address(self):
        numbers = random.randint(100, 9999)
        streets = ["Main St", "Oak Ave", "First St", "Second Ave", "Park Rd", "Elm St", "Market St"]
        return f"{numbers} {random.choice(streets)}"
    
    def city(self):
        return random.choice(self.cities)
    
    def state_abbr(self):
        return random.choice(self.states)
    
    def postcode(self):
        return f"{random.randint(10000, 99999)}"
    
    def sentence(self):
        subjects = ["The customer", "This order", "The product", "The service", "The company"]
        verbs = ["requires", "needs", "expects", "demands", "requests"]
        objects = ["immediate attention", "special handling", "careful review", "prompt delivery", "quality service"]
        return f"{random.choice(subjects)} {random.choice(verbs)} {random.choice(objects)}."
    
    def text(self, max_nb_chars=200):
        sentences = [self.sentence() for _ in range(random.randint(1, 3))]
        text = " ".join(sentences)
        return text[:max_nb_chars]
    
    def date_between(self, start_date, end_date):
        if isinstance(start_date, str):
            if start_date.startswith('-'):
                # Relative date like '-6m'
                days = int(start_date[1:-1]) * 30 if 'm' in start_date else int(start_date[1:])
                start_date = datetime.now().date() - timedelta(days=days)
            else:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        if end_date == 'today':
            end_date = datetime.now().date()
        elif isinstance(end_date, str):
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        time_between = end_date - start_date
        days_between = time_between.days
        random_number_of_days = random.randrange(days_between)
        return start_date + timedelta(days=random_number_of_days)

fake = SimpleFaker()

class DirectDatabaseSalesDataCreator:
    def __init__(self):
        self.client = None
        self.db = None
        self.customers = []
        self.products = []

    async def connect_db(self):
        """Connect to MongoDB"""
        mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
        self.db = self.client.erp_sales
        print("✅ Connected to MongoDB")

    async def create_customers(self, count: int = 50) -> List[str]:
        """Create customer records directly in database"""
        print(f"\n👥 Creating {count} customers...")
        
        customers_collection = self.db.customers
        customer_ids = []
        
        # Get existing customer count for customer_code generation
        existing_count = await customers_collection.count_documents({})
        
        for i in range(count):
            try:
                is_business = random.choice([True, True, False])  # 67% business
                
                if is_business:
                    company_name = fake.company()
                    first_name = fake.first_name()
                    last_name = fake.last_name()
                    customer_type = "business"
                    credit_limit = round(random.uniform(5000, 100000), 2)
                    tax_id = f"{random.randint(10,99)}-{random.randint(1000000,9999999)}"
                else:
                    company_name = None
                    first_name = fake.first_name()
                    last_name = fake.last_name()
                    customer_type = "individual"
                    credit_limit = round(random.uniform(500, 10000), 2)
                    tax_id = None

                billing_address = {
                    "street": fake.street_address(),
                    "city": fake.city(),
                    "state": fake.state_abbr(),
                    "postal_code": fake.postcode(),
                    "country": "US"
                }

                shipping_address = billing_address.copy() if random.random() < 0.6 else {
                    "street": fake.street_address(),
                    "city": fake.city(),
                    "state": fake.state_abbr(),
                    "postal_code": fake.postcode(),
                    "country": "US"
                }

                customer_doc = {
                    "customer_code": f"CUST-{existing_count + i + 1:05d}",
                    "first_name": first_name,
                    "last_name": last_name,
                    "company_name": company_name,
                    "customer_type": customer_type,
                    "email": fake.email(),
                    "phone": fake.phone_number(),
                    "billing_address": billing_address,
                    "shipping_address": shipping_address,
                    "payment_terms": random.choice(["net_15", "net_30", "net_45", "net_60", "cash_on_delivery", "prepaid"]),
                    "credit_limit": credit_limit,
                    "credit_used": round(random.uniform(0, credit_limit * 0.3), 2),
                    "tax_id": tax_id,
                    "notes": fake.text(150) if random.random() < 0.3 else None,
                    "status": "active",
                    "total_orders": 0,
                    "total_spent": 0.0,
                    "last_order_date": None,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }

                result = await customers_collection.insert_one(customer_doc)
                customer_ids.append(str(result.inserted_id))
                self.customers.append({**customer_doc, "_id": str(result.inserted_id)})
                
                if (i + 1) % 10 == 0:
                    print(f"  ✅ Created {i + 1} customers")
                    
            except Exception as e:
                print(f"  ⚠️ Error creating customer {i + 1}: {str(e)[:80]}")
                continue

        print(f"✅ Successfully created {len(customer_ids)} customers")
        return customer_ids

    async def create_products(self, count: int = 25) -> List[str]:
        """Create product records"""
        print(f"\n📦 Creating {count} products...")
        
        products_collection = self.db.products
        product_ids = []
        
        categories = [
            "Electronics", "Computers", "Software", "Office Supplies", 
            "Furniture", "Industrial Equipment", "Tools", "Automotive",
            "Medical Equipment", "Educational Materials"
        ]
        
        for i in range(count):
            try:
                category = random.choice(categories)
                product_name = f"{fake.company().split()[0]} {category} Device"
                
                unit_price = round(random.uniform(10, 5000), 2)
                cost_price = round(unit_price * random.uniform(0.4, 0.7), 2)

                product_doc = {
                    "name": product_name,
                    "description": fake.text(200),
                    "sku": f"SKU-{random.randint(1000,9999)}{random.choice(['A','B','C','D'])}{random.randint(10,99)}",
                    "category": category,
                    "unit_price": unit_price,
                    "cost_price": cost_price,
                    "tax_rate": round(random.choice([0.00, 0.05, 0.08, 0.10]), 2),
                    "unit_of_measure": random.choice(["piece", "kg", "meter", "liter", "box", "set"]),
                    "status": "active",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                result = await products_collection.insert_one(product_doc)
                product_ids.append(str(result.inserted_id))
                self.products.append({**product_doc, "_id": str(result.inserted_id)})
                
                if (i + 1) % 5 == 0:
                    print(f"  ✅ Created {i + 1} products")
                    
            except Exception as e:
                print(f"  ⚠️ Error creating product {i + 1}: {str(e)[:80]}")
                continue

        print(f"✅ Successfully created {len(product_ids)} products")
        return product_ids

    async def create_sales_orders(self, customer_ids: List[str], product_ids: List[str], count: int = 75) -> List[str]:
        """Create sales order records"""
        print(f"\n📋 Creating {count} sales orders...")
        
        if not customer_ids or not product_ids:
            print("❌ No customers or products available")
            return []

        orders_collection = self.db.sales_orders
        order_ids = []
        
        # Get next order number
        existing_count = await orders_collection.count_documents({})
        
        statuses = ["draft", "confirmed", "processing", "shipped", "delivered", "cancelled"]
        shipping_methods = ["standard", "express", "overnight", "pickup"]
        priorities = ["low", "normal", "high", "urgent"]
        payment_statuses = ["pending", "partial", "paid", "overdue"]
        
        for i in range(count):
            try:
                customer_id = random.choice(customer_ids)
                customer = next((c for c in self.customers if c["_id"] == customer_id), None)
                
                if not customer:
                    continue

                # Create line items
                num_items = random.randint(1, 5)
                line_items = []
                selected_products = random.sample(self.products, min(num_items, len(self.products)))
                
                for product in selected_products:
                    quantity = random.randint(1, 10)
                    unit_price = round(product["unit_price"] * random.uniform(0.9, 1.1), 2)
                    
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

                # Calculate totals
                subtotal = sum(item["line_total"] for item in line_items)
                discount_percent = round(random.uniform(0, 15), 2) if random.random() < 0.3 else 0
                discount_amount = round(subtotal * (discount_percent / 100), 2)
                tax_amount = round(sum(item["quantity"] * item["unit_price"] * item["tax_rate"] for item in line_items), 2)
                shipping_cost = round(random.uniform(0, 100), 2) if random.random() < 0.7 else 0
                total_amount = subtotal - discount_amount + tax_amount + shipping_cost

                order_date = fake.date_between('-6m', 'today')
                expected_delivery = order_date + timedelta(days=random.randint(3, 30))

                # Convert dates to datetime for MongoDB
                order_datetime = datetime.combine(order_date, datetime.min.time())
                expected_delivery_datetime = datetime.combine(expected_delivery, datetime.min.time())
                actual_delivery_datetime = expected_delivery_datetime if random.choice(statuses) == "delivered" else None

                order_doc = {
                    "order_number": f"SO-{existing_count + i + 1:06d}",
                    "customer_id": customer_id,
                    "customer_name": f"{customer['first_name']} {customer['last_name']}",
                    "customer_email": customer["email"],
                    "order_date": order_datetime,
                    "expected_delivery_date": expected_delivery_datetime,
                    "actual_delivery_date": actual_delivery_datetime,
                    "shipping_method": random.choice(shipping_methods),
                    "shipping_address": customer["shipping_address"],
                    "priority": random.choice(priorities),
                    "line_items": line_items,
                    "subtotal": subtotal,
                    "subtotal_discount_percent": discount_percent,
                    "subtotal_discount_amount": discount_amount,
                    "tax_amount": tax_amount,
                    "shipping_cost": shipping_cost,
                    "total_amount": total_amount,
                    "payment_status": random.choice(payment_statuses),
                    "paid_amount": total_amount if random.choice(payment_statuses) == "paid" else 0,
                    "balance_due": 0 if random.choice(payment_statuses) == "paid" else total_amount,
                    "status": random.choice(statuses),
                    "notes": fake.sentence() if random.random() < 0.4 else None,
                    "internal_notes": fake.sentence() if random.random() < 0.2 else None,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "created_by": "direct_data_script",
                    "updated_by": None
                }

                result = await orders_collection.insert_one(order_doc)
                order_ids.append(str(result.inserted_id))
                
                if (i + 1) % 15 == 0:
                    print(f"  ✅ Created {i + 1} sales orders")
                    
            except Exception as e:
                print(f"  ⚠️ Error creating sales order {i + 1}: {str(e)[:80]}")
                continue

        print(f"✅ Successfully created {len(order_ids)} sales orders")
        return order_ids

    async def create_quotes(self, customer_ids: List[str], product_ids: List[str], count: int = 60) -> List[str]:
        """Create quote records"""
        print(f"\n💬 Creating {count} quotes...")
        
        if not customer_ids or not product_ids:
            print("❌ No customers or products available")
            return []

        quotes_collection = self.db.quotes
        quote_ids = []
        
        existing_count = await quotes_collection.count_documents({})
        statuses = ["draft", "sent", "accepted", "rejected", "expired"]
        
        for i in range(count):
            try:
                customer_id = random.choice(customer_ids)
                customer = next((c for c in self.customers if c["_id"] == customer_id), None)
                
                if not customer:
                    continue

                # Create line items
                num_items = random.randint(1, 4)
                line_items = []
                selected_products = random.sample(self.products, min(num_items, len(self.products)))
                
                for product in selected_products:
                    quantity = random.randint(1, 8)
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

                # Calculate totals
                subtotal = sum(item["line_total"] for item in line_items)
                discount_percent = round(random.uniform(0, 20), 2) if random.random() < 0.4 else 0
                discount_amount = round(subtotal * (discount_percent / 100), 2)
                tax_amount = round(sum(item["quantity"] * item["unit_price"] * item["tax_rate"] for item in line_items), 2)
                total_amount = subtotal - discount_amount + tax_amount

                quote_date = fake.date_between('-3m', 'today')
                valid_until = quote_date + timedelta(days=random.randint(30, 90))

                # Convert dates to datetime for MongoDB
                quote_datetime = datetime.combine(quote_date, datetime.min.time())
                valid_until_datetime = datetime.combine(valid_until, datetime.min.time())

                quote_doc = {
                    "quote_number": f"QUO-{existing_count + i + 1:06d}",
                    "customer_id": customer_id,
                    "customer_name": f"{customer['first_name']} {customer['last_name']}",
                    "customer_email": customer["email"],
                    "quote_date": quote_datetime,
                    "valid_until": valid_until_datetime,
                    "line_items": line_items,
                    "subtotal": subtotal,
                    "subtotal_discount_percent": discount_percent,
                    "subtotal_discount_amount": discount_amount,
                    "tax_amount": tax_amount,
                    "total_amount": total_amount,
                    "status": random.choice(statuses),
                    "notes": fake.sentence() if random.random() < 0.3 else None,
                    "internal_notes": fake.sentence() if random.random() < 0.2 else None,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "created_by": "direct_data_script",
                    "updated_by": None
                }

                result = await quotes_collection.insert_one(quote_doc)
                quote_ids.append(str(result.inserted_id))
                
                if (i + 1) % 12 == 0:
                    print(f"  ✅ Created {i + 1} quotes")
                    
            except Exception as e:
                print(f"  ⚠️ Error creating quote {i + 1}: {str(e)[:80]}")
                continue

        print(f"✅ Successfully created {len(quote_ids)} quotes")
        return quote_ids

    async def create_invoices(self, customer_ids: List[str], count: int = 80) -> List[str]:
        """Create invoice records"""
        print(f"\n🧾 Creating {count} invoices...")
        
        if not customer_ids:
            print("❌ No customers available")
            return []

        invoices_collection = self.db.invoices
        invoice_ids = []
        
        existing_count = await invoices_collection.count_documents({})
        statuses = ["draft", "sent", "paid", "overdue", "void"]
        payment_statuses = ["pending", "partial", "paid", "overdue"]
        payment_methods = ["credit_card", "bank_transfer", "check", "cash", "ach"]
        
        for i in range(count):
            try:
                customer_id = random.choice(customer_ids)
                customer = next((c for c in self.customers if c["_id"] == customer_id), None)
                
                if not customer:
                    continue

                # Generate realistic amounts
                subtotal = round(random.uniform(100, 15000), 2)
                tax_rate = random.choice([0.00, 0.05, 0.08, 0.10])
                tax_amount = round(subtotal * tax_rate, 2)
                total_amount = subtotal + tax_amount

                invoice_date = fake.date_between('-4m', 'today')
                due_date = invoice_date + timedelta(days=random.choice([15, 30, 45, 60]))

                # Convert dates to datetime for MongoDB
                invoice_datetime = datetime.combine(invoice_date, datetime.min.time())
                due_datetime = datetime.combine(due_date, datetime.min.time())

                # Determine payment status based on due date
                days_overdue = (datetime.now().date() - due_date).days
                if days_overdue > 0:
                    payment_status = random.choice(["overdue", "paid", "partial"])
                else:
                    payment_status = random.choice(["pending", "paid", "partial"])

                if payment_status == "paid":
                    paid_amount = total_amount
                elif payment_status == "partial":
                    paid_amount = round(total_amount * random.uniform(0.3, 0.8), 2)
                else:
                    paid_amount = 0

                invoice_doc = {
                    "invoice_number": f"INV-{existing_count + i + 1:06d}",
                    "customer_id": customer_id,
                    "customer_name": f"{customer['first_name']} {customer['last_name']}",
                    "customer_email": customer["email"],
                    "invoice_date": invoice_datetime,
                    "due_date": due_datetime,
                    "subtotal": subtotal,
                    "tax_rate": tax_rate,
                    "tax_amount": tax_amount,
                    "total_amount": total_amount,
                    "paid_amount": paid_amount,
                    "balance_due": total_amount - paid_amount,
                    "payment_status": payment_status,
                    "status": "paid" if payment_status == "paid" else random.choice(statuses),
                    "payment_method": random.choice(payment_methods) if paid_amount > 0 else None,
                    "notes": fake.sentence() if random.random() < 0.25 else None,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "created_by": "direct_data_script",
                    "updated_by": None
                }

                result = await invoices_collection.insert_one(invoice_doc)
                invoice_ids.append(str(result.inserted_id))
                
                if (i + 1) % 16 == 0:
                    print(f"  ✅ Created {i + 1} invoices")
                    
            except Exception as e:
                print(f"  ⚠️ Error creating invoice {i + 1}: {str(e)[:80]}")
                continue

        print(f"✅ Successfully created {len(invoice_ids)} invoices")
        return invoice_ids

    async def create_all_data(self):
        """Create all comprehensive sales data"""
        print("🚀 Creating comprehensive sales data for all endpoints...")
        print("=" * 65)
        
        await self.connect_db()
        
        # Create all data types
        customer_ids = await self.create_customers(50)
        product_ids = await self.create_products(25)
        order_ids = await self.create_sales_orders(customer_ids, product_ids, 75)
        quote_ids = await self.create_quotes(customer_ids, product_ids, 60)
        invoice_ids = await self.create_invoices(customer_ids, 80)
        
        total_records = len(customer_ids) + len(product_ids) + len(order_ids) + len(quote_ids) + len(invoice_ids)
        
        print("\n" + "=" * 65)
        print("📊 COMPREHENSIVE DATA CREATION COMPLETE!")
        print("=" * 65)
        print(f"👥 Customers:     {len(customer_ids):3d} records")
        print(f"📦 Products:      {len(product_ids):3d} records")
        print(f"📋 Sales Orders:  {len(order_ids):3d} records")
        print(f"💬 Quotes:        {len(quote_ids):3d} records")
        print(f"🧾 Invoices:      {len(invoice_ids):3d} records")
        print(f"📈 TOTAL:         {total_records:3d} records")
        print("=" * 65)
        
        print("\n🔍 Test pagination with:")
        print("GET /api/v1/customers?skip=0&limit=10")
        print("GET /api/v1/customers?skip=10&limit=20")
        print("GET /api/v1/sales-orders?skip=0&limit=15")
        print("GET /api/v1/quotes?skip=0&limit=12")
        print("GET /api/v1/invoices?skip=0&limit=16")
        
        await self.client.close() if self.client else None
        
        return {
            "customers": len(customer_ids),
            "products": len(product_ids),
            "sales_orders": len(order_ids),
            "quotes": len(quote_ids),
            "invoices": len(invoice_ids),
            "total": total_records
        }

async def main():
    """Main execution function"""
    try:
        creator = DirectDatabaseSalesDataCreator()
        result = await creator.create_all_data()
        
        print(f"\n🎉 SUCCESS! Created comprehensive sales data:")
        print(f"   Total: {result['total']} records across all entities")
        print(f"\n💡 Frontend pagination should now work perfectly!")
        print(f"   The system now has enough data to test all pagination scenarios.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
