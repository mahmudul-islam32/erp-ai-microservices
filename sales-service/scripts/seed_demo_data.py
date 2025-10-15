"""
Demo Data Seeder for Sales Service
Creates sample customers, orders, invoices, and payments for testing/demo purposes
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import connect_to_mongo, get_database
from bson import ObjectId


# Demo customers data
DEMO_CUSTOMERS = [
    {
        "customer_code": "CUST-001",
        "first_name": "John",
        "last_name": "Smith",
        "company_name": "Acme Corporation",
        "customer_type": "business",
        "email": "contact@acme.com",
        "phone": "+1-555-0101",
        "billing_address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "USA"
        },
        "shipping_address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "USA"
        },
        "status": "active",
        "credit_limit": 50000.00,
        "tax_id": "12-3456789",
        "notes": "Long-term corporate client"
    },
    {
        "customer_code": "CUST-002",
        "first_name": "Sarah",
        "last_name": "Johnson",
        "company_name": "Tech Solutions Inc",
        "customer_type": "business",
        "email": "info@techsolutions.com",
        "phone": "+1-555-0102",
        "billing_address": {
            "street": "456 Tech Ave",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94102",
            "country": "USA"
        },
        "shipping_address": {
            "street": "456 Tech Ave",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94102",
            "country": "USA"
        },
        "status": "active",
        "credit_limit": 75000.00,
        "tax_id": "98-7654321",
        "notes": "Preferred customer - quarterly contracts"
    },
    {
        "customer_code": "CUST-003",
        "first_name": "Michael",
        "last_name": "Brown",
        "company_name": "Global Retailers Ltd",
        "customer_type": "business",
        "email": "orders@globalretailers.com",
        "phone": "+1-555-0103",
        "billing_address": {
            "street": "789 Commerce Blvd",
            "city": "Chicago",
            "state": "IL",
            "postal_code": "60601",
            "country": "USA"
        },
        "shipping_address": {
            "street": "789 Commerce Blvd",
            "city": "Chicago",
            "state": "IL",
            "postal_code": "60601",
            "country": "USA"
        },
        "status": "active",
        "credit_limit": 100000.00,
        "tax_id": "45-6789012",
        "notes": "High volume buyer"
    },
    {
        "customer_code": "CUST-004",
        "first_name": "Emily",
        "last_name": "Davis",
        "company_name": "StartUp Ventures",
        "customer_type": "business",
        "email": "hello@startupventures.com",
        "phone": "+1-555-0104",
        "billing_address": {
            "street": "321 Innovation Dr",
            "city": "Austin",
            "state": "TX",
            "postal_code": "78701",
            "country": "USA"
        },
        "shipping_address": {
            "street": "321 Innovation Dr",
            "city": "Austin",
            "state": "TX",
            "postal_code": "78701",
            "country": "USA"
        },
        "status": "active",
        "credit_limit": 25000.00,
        "tax_id": "78-9012345",
        "notes": "New customer - 30 day payment terms"
    },
    {
        "customer_code": "CUST-005",
        "first_name": "David",
        "last_name": "Wilson",
        "company_name": "Premium Distributors",
        "customer_type": "business",
        "email": "sales@premiumdist.com",
        "phone": "+1-555-0105",
        "billing_address": {
            "street": "555 Business Park",
            "city": "Boston",
            "state": "MA",
            "postal_code": "02101",
            "country": "USA"
        },
        "shipping_address": {
            "street": "555 Business Park",
            "city": "Boston",
            "state": "MA",
            "postal_code": "02101",
            "country": "USA"
        },
        "status": "active",
        "credit_limit": 60000.00,
        "tax_id": "23-4567890",
        "notes": "VIP customer - expedited shipping"
    }
]


async def seed_demo_data():
    """Seed demo data into the database"""
    
    print("🌱 Seeding demo data for Sales Service...")
    print("=" * 50)
    
    # Connect to database
    await connect_to_mongo()
    
    # Get database connection
    db = get_database()
    
    # Create customers
    print("\n👥 Creating demo customers...")
    created_customers = []
    
    for customer_data in DEMO_CUSTOMERS:
        try:
            # Check if customer already exists
            existing = await db.customers.find_one({"email": customer_data["email"]})
            
            if existing:
                print(f"   ⏭️  Customer {customer_data.get('company_name', customer_data.get('first_name', ''))} already exists, skipping...")
                created_customers.append(existing)
                continue
            
            # Add metadata
            customer_data["created_at"] = datetime.utcnow()
            customer_data["updated_at"] = datetime.utcnow()
            customer_data["total_purchases"] = 0.0
            customer_data["outstanding_balance"] = 0.0
            customer_data["payment_terms"] = "net_30"
            
            # Insert customer
            result = await db.customers.insert_one(customer_data)
            customer_data["_id"] = result.inserted_id
            created_customers.append(customer_data)
            
            print(f"   ✅ Created customer: {customer_data.get('company_name', customer_data.get('first_name', ''))}")
            
        except Exception as e:
            print(f"   ❌ Failed to create customer {customer_data.get('company_name', customer_data.get('first_name', ''))}: {str(e)}")
    
    print(f"\n✅ Created/Found {len(created_customers)} customers")
    
    # Create sample sales orders
    print("\n📦 Creating sample sales orders...")
    
    # Realistic product catalog
    PRODUCTS = [
        {"name": "Wireless Mouse", "sku": "ACC-001", "price": 29.99},
        {"name": "USB-C Cable", "sku": "ACC-002", "price": 15.99},
        {"name": "Laptop Stand", "sku": "ACC-003", "price": 45.00},
        {"name": "Mechanical Keyboard", "sku": "KBD-001", "price": 89.99},
        {"name": "27\" Monitor", "sku": "MON-001", "price": 349.99},
        {"name": "Webcam HD", "sku": "CAM-001", "price": 79.99},
        {"name": "Desk Chair", "sku": "FUR-001", "price": 299.00},
        {"name": "Standing Desk", "sku": "FUR-002", "price": 499.00},
        {"name": "Office Lamp", "sku": "FUR-003", "price": 59.99},
        {"name": "Printer A4", "sku": "PRT-001", "price": 199.99},
        {"name": "Paper Ream (500)", "sku": "SUP-001", "price": 9.99},
        {"name": "Sticky Notes Pack", "sku": "SUP-002", "price": 4.99},
        {"name": "Pen Set (12pc)", "sku": "SUP-003", "price": 12.99},
        {"name": "Notebook Bundle", "sku": "SUP-004", "price": 19.99},
        {"name": "Headset w/Mic", "sku": "AUD-001", "price": 69.99},
        {"name": "Docking Station", "sku": "ACC-004", "price": 149.99},
        {"name": "External SSD 1TB", "sku": "STO-001", "price": 129.99},
        {"name": "Mouse Pad XL", "sku": "ACC-005", "price": 24.99},
        {"name": "Cable Organizer", "sku": "ACC-006", "price": 14.99},
        {"name": "Power Strip", "sku": "ELE-001", "price": 34.99},
    ]
    
    order_statuses = [
        ("pending", "pending", 0.2),      # 20% pending orders
        ("confirmed", "pending", 0.15),    # 15% confirmed, not paid
        ("confirmed", "paid", 0.15),       # 15% confirmed, paid
        ("processing", "paid", 0.15),      # 15% processing
        ("shipped", "paid", 0.15),         # 15% shipped
        ("delivered", "paid", 0.15),       # 15% delivered
        ("cancelled", "pending", 0.05),    # 5% cancelled
    ]
    
    created_orders = []
    
    # Create 50 orders for better demo experience
    for i in range(50):
        try:
            customer = random.choice(created_customers)
            
            # Select order status based on probability
            rand_val = random.random()
            cumulative = 0
            selected_status = "pending"
            selected_payment = "pending"
            
            for status, payment, prob in order_statuses:
                cumulative += prob
                if rand_val <= cumulative:
                    selected_status = status
                    selected_payment = payment
                    break
            
            # Create order with realistic products
            num_items = random.randint(1, 8)
            items = []
            subtotal = 0.0
            
            selected_products = random.sample(PRODUCTS, min(num_items, len(PRODUCTS)))
            
            for product in selected_products:
                quantity = random.randint(1, 15)
                unit_price = product["price"]
                discount_percent = random.choice([0, 0, 0, 5, 10, 15])  # Most have no discount
                discount_amount = round(unit_price * quantity * (discount_percent / 100), 2)
                tax_rate = 0.1  # 10% tax
                
                item_subtotal = round(unit_price * quantity - discount_amount, 2)
                tax_amount = round(item_subtotal * tax_rate, 2)
                item_total = round(item_subtotal + tax_amount, 2)
                subtotal += item_subtotal
                
                items.append({
                    "product_id": str(ObjectId()),
                    "product_name": product["name"],
                    "product_sku": product["sku"],
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "discount_percent": discount_percent,
                    "discount_amount": discount_amount,
                    "tax_rate": tax_rate,
                    "tax_amount": tax_amount,
                    "subtotal": item_subtotal,
                    "total": item_total
                })
            
            # Calculate totals
            total_discount = sum(item["discount_amount"] for item in items)
            tax_total = sum(item["tax_amount"] for item in items)
            shipping_cost = round(random.uniform(0, 50), 2) if subtotal < 500 else 0  # Free shipping over $500
            grand_total = round(subtotal + tax_total + shipping_cost, 2)
            
            # Create order with realistic dates
            days_ago = random.randint(1, 90)
            created_date = datetime.utcnow() - timedelta(days=days_ago)
            
            # Ensure shipping_address is a proper dict
            shipping_addr = customer.get("shipping_address", {})
            if not isinstance(shipping_addr, dict):
                shipping_addr = {}
            if not shipping_addr:
                shipping_addr = {
                    "street": "123 Main St",
                    "city": "City",
                    "state": "State",
                    "postal_code": "12345",
                    "country": "USA"
                }
            
            order_data = {
                "order_number": f"ORD-{datetime.utcnow().year}-{str(ObjectId())[-6:].upper()}",
                "customer_id": str(customer["_id"]),
                "customer_name": customer.get("company_name", f"{customer.get('first_name', '')} {customer.get('last_name', '')}"),
                "customer_email": customer["email"],
                "order_date": created_date,
                "expected_delivery_date": created_date + timedelta(days=random.randint(3, 10)) if selected_status not in ["cancelled", "delivered"] else None,
                "actual_delivery_date": created_date + timedelta(days=random.randint(3, 7)) if selected_status == "delivered" else None,
                "line_items": items,
                "subtotal": subtotal,
                "subtotal_discount_percent": 0,
                "subtotal_discount_amount": total_discount,
                "tax_amount": tax_total,
                "shipping_cost": shipping_cost,
                "total_amount": grand_total,
                "payment_status": selected_payment,
                "paid_amount": grand_total if selected_payment == "paid" else (grand_total * 0.5 if selected_payment == "partial" else 0),
                "balance_due": 0 if selected_payment == "paid" else (grand_total * 0.5 if selected_payment == "partial" else grand_total),
                "status": selected_status,
                "payment_method": random.choice(["credit_card", "bank_transfer", "cash", "check", "paypal"]),
                "shipping_method": random.choice(["standard", "express", "overnight"]) if selected_status != "cancelled" else "standard",
                "priority": random.choice(["normal", "normal", "normal", "high", "urgent"]),  # Most normal priority
                "notes": random.choice([
                    "Please handle with care",
                    "Urgent delivery required",
                    "Regular customer order",
                    "First-time buyer",
                    "Corporate bulk order",
                    None,
                    None
                ]),
                "internal_notes": None,
                "shipping_address": shipping_addr,
                "billing_address": customer.get("billing_address", shipping_addr),
                "created_by": "system",
                "created_at": created_date,
                "updated_at": datetime.utcnow()
            }
            
            result = await db.sales_orders.insert_one(order_data)
            order_data["_id"] = result.inserted_id
            created_orders.append(order_data)
            
            status_emoji = {
                "pending": "⏳",
                "confirmed": "✓",
                "processing": "🔄",
                "shipped": "🚚",
                "delivered": "✅",
                "cancelled": "❌"
            }
            
            print(f"   {status_emoji.get(selected_status, '📦')} Order {order_data['order_number']}: ${grand_total:.2f} ({selected_status})")
            
        except Exception as e:
            print(f"   ❌ Failed to create order: {str(e)}")
    
    # Summary by status
    status_counts = {}
    for order in created_orders:
        status = order["status"]
        status_counts[status] = status_counts.get(status, 0) + 1
    
    print(f"\n✅ Created {len(created_orders)} sales orders")
    print("   Status breakdown:")
    for status, count in sorted(status_counts.items()):
        print(f"   • {status}: {count}")

    
    # Create sample invoices
    print("\n📄 Creating sample invoices...")
    
    created_invoices = []
    invoice_statuses = ["draft", "sent", "paid", "overdue", "cancelled"]
    
    for i, order in enumerate(random.sample(created_orders, min(15, len(created_orders)))):
        try:
            total_amount = order.get("total_amount", order.get("total", 0))
            tax_amount = order.get("tax_amount", order.get("tax", 0))
            
            invoice_data = {
                "invoice_number": f"INV-{str(ObjectId())[-8:].upper()}",
                "order_id": str(order["_id"]),
                "customer_id": order["customer_id"],
                "customer_name": order["customer_name"],
                "customer_email": order["customer_email"],
                "items": order.get("line_items", order.get("items", [])),
                "subtotal": order["subtotal"],
                "tax": tax_amount,
                "discount": order.get("subtotal_discount_amount", order.get("discount", 0)),
                "total": total_amount,
                "amount_paid": 0.0 if random.random() < 0.3 else round(total_amount * random.uniform(0.5, 1.0), 2),
                "balance_due": 0.0,
                "status": random.choice(invoice_statuses),
                "due_date": datetime.utcnow() + timedelta(days=random.randint(-15, 45)),
                "issue_date": order["created_at"],
                "notes": f"Invoice for order {order['order_number']}",
                "created_at": order["created_at"],
                "updated_at": datetime.utcnow()
            }
            
            invoice_data["balance_due"] = round(invoice_data["total"] - invoice_data["amount_paid"], 2)
            
            result = await db.invoices.insert_one(invoice_data)
            invoice_data["_id"] = result.inserted_id
            created_invoices.append(invoice_data)
            
            print(f"   ✅ Created invoice: {invoice_data['invoice_number']} (${invoice_data['total']:.2f})")
            
        except Exception as e:
            print(f"   ❌ Failed to create invoice: {str(e)}")
    
    # Summary by status
    invoice_status_counts = {}
    for inv in created_invoices:
        status = inv["status"]
        invoice_status_counts[status] = invoice_status_counts.get(status, 0) + 1
    
    print(f"\n✅ Created {len(created_invoices)} invoices")
    print("   Status breakdown:")
    for status, count in sorted(invoice_status_counts.items()):
        print(f"   • {status}: {count}")
    
    # Create sample payments
    print("\n💰 Creating sample payments...")
    
    created_payments = []
    payment_methods = ["credit_card", "bank_transfer", "cash", "check", "paypal"]
    
    for invoice in created_invoices:
        if invoice["amount_paid"] > 0:
            try:
                payment_data = {
                    "payment_number": f"PAY-{str(ObjectId())[-8:].upper()}",
                    "invoice_id": str(invoice["_id"]),
                    "order_id": invoice.get("order_id"),
                    "customer_id": invoice["customer_id"],
                    "customer_name": invoice["customer_name"],
                    "amount": invoice["amount_paid"],
                    "payment_method": random.choice(payment_methods),
                    "reference_number": f"REF-{random.randint(100000, 999999)}",
                    "payment_date": invoice["created_at"] + timedelta(days=random.randint(1, 30)),
                    "notes": f"Payment for invoice {invoice['invoice_number']}",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                result = await db.payments.insert_one(payment_data)
                created_payments.append(payment_data)
                
                print(f"   ✅ Created payment: {payment_data['payment_number']} (${payment_data['amount']:.2f})")
                
            except Exception as e:
                print(f"   ❌ Failed to create payment: {str(e)}")
    
    print(f"\n✅ Created {len(created_payments)} payments")
    
    print("\n" + "=" * 50)
    print("✅ Demo data seeding complete!")
    print()
    print("📋 Summary:")
    print(f"   • {len(created_customers)} customers")
    print(f"   • {len(created_orders)} sales orders")
    print(f"   • {len(created_invoices)} invoices")
    print(f"   • {len(created_payments)} payments")
    print()
    print("💰 Total Order Value: ${:.2f}".format(sum(order.get("total_amount", order.get("total", 0)) for order in created_orders)))
    print("💳 Total Payments: ${:.2f}".format(sum(p.get("amount", 0) for p in created_payments)))
    print()
    print("=" * 50)
    print("\nSUCCESS")


if __name__ == "__main__":
    try:
        asyncio.run(seed_demo_data())
    except Exception as e:
        print(f"\n❌ Seeding failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

