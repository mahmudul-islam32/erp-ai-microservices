# Sample data initialization script for Sales Service
import asyncio
import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Sample data
SAMPLE_CUSTOMERS = [
    {
        "customer_code": "CUST-001",
        "first_name": "John",
        "last_name": "Smith",
        "email": "john.smith@acmecorp.com",
        "phone": "+1-555-0101",
        "company_name": "Acme Corporation",
        "customer_type": "business",
        "billing_address": {
            "street": "123 Business Ave",
            "city": "New York",
            "state": "NY",
            "country": "USA",
            "zip_code": "10001"
        },
        "shipping_address": {
            "street": "123 Business Ave",
            "city": "New York",
            "state": "NY",
            "country": "USA",
            "zip_code": "10001"
        },
        "payment_terms": "net_30",
        "credit_limit": 50000.00,
        "credit_used": 0.0,
        "tax_id": "12-3456789",
        "status": "active",
        "total_orders": 0,
        "total_spent": 0.0
    },
    {
        "customer_code": "CUST-002",
        "first_name": "Sarah",
        "last_name": "Johnson",
        "email": "sarah.johnson@techstart.com",
        "phone": "+1-555-0102",
        "company_name": "TechStart Inc",
        "customer_type": "business",
        "billing_address": {
            "street": "456 Innovation Dr",
            "city": "San Francisco",
            "state": "CA",
            "country": "USA",
            "zip_code": "94105"
        },
        "payment_terms": "net_15",
        "credit_limit": 25000.00,
        "credit_used": 0.0,
        "status": "active",
        "total_orders": 0,
        "total_spent": 0.0
    },
    {
        "customer_code": "CUST-003",
        "first_name": "Michael",
        "last_name": "Brown",
        "email": "michael.brown@email.com",
        "phone": "+1-555-0103",
        "customer_type": "individual",
        "billing_address": {
            "street": "789 Residential St",
            "city": "Chicago",
            "state": "IL",
            "country": "USA",
            "zip_code": "60601"
        },
        "payment_terms": "immediate",
        "credit_limit": 5000.00,
        "credit_used": 0.0,
        "status": "active",
        "total_orders": 0,
        "total_spent": 0.0
    }
]

SAMPLE_PRODUCTS = [
    {
        "name": "Professional Laptop",
        "description": "High-performance laptop for business professionals",
        "sku": "LAP-PRO-001",
        "category": "Electronics",
        "subcategory": "Computers",
        "brand": "TechBrand",
        "product_type": "physical",
        "unit_of_measure": "piece",
        "unit_price": 1299.99,
        "cost_price": 800.00,
        "tax_rate": 0.08,
        "current_stock": 50,
        "min_stock_level": 10,
        "max_stock_level": 100,
        "reorder_point": 15,
        "is_active": True,
        "weight": 2.5,
        "dimensions": {
            "length": 35.0,
            "width": 25.0,
            "height": 2.0
        }
    },
    {
        "name": "Wireless Mouse",
        "description": "Ergonomic wireless mouse with precision tracking",
        "sku": "MOU-WIR-001",
        "category": "Electronics",
        "subcategory": "Accessories",
        "brand": "TechBrand",
        "product_type": "physical",
        "unit_of_measure": "piece",
        "unit_price": 29.99,
        "cost_price": 15.00,
        "tax_rate": 0.08,
        "current_stock": 200,
        "min_stock_level": 50,
        "max_stock_level": 500,
        "reorder_point": 75,
        "is_active": True,
        "weight": 0.1
    },
    {
        "name": "Office Chair",
        "description": "Ergonomic office chair with lumbar support",
        "sku": "CHR-OFF-001",
        "category": "Furniture",
        "subcategory": "Chairs",
        "brand": "ComfortPro",
        "product_type": "physical",
        "unit_of_measure": "piece",
        "unit_price": 299.99,
        "cost_price": 150.00,
        "tax_rate": 0.08,
        "current_stock": 25,
        "min_stock_level": 5,
        "max_stock_level": 50,
        "reorder_point": 10,
        "is_active": True,
        "weight": 15.0,
        "dimensions": {
            "length": 60.0,
            "width": 60.0,
            "height": 120.0
        }
    },
    {
        "name": "Software License - Pro",
        "description": "Annual professional software license",
        "sku": "SFT-PRO-001",
        "category": "Software",
        "subcategory": "Licenses",
        "brand": "SoftwareCorp",
        "product_type": "service",
        "unit_of_measure": "license",
        "unit_price": 499.99,
        "cost_price": 100.00,
        "tax_rate": 0.00,
        "is_active": True,
        "is_digital": True
    },
    {
        "name": "Desk Lamp",
        "description": "LED desk lamp with adjustable brightness",
        "sku": "LAM-DSK-001",
        "category": "Electronics",
        "subcategory": "Lighting",
        "brand": "BrightLight",
        "product_type": "physical",
        "unit_of_measure": "piece",
        "unit_price": 79.99,
        "cost_price": 35.00,
        "tax_rate": 0.08,
        "current_stock": 75,
        "min_stock_level": 15,
        "max_stock_level": 150,
        "reorder_point": 25,
        "is_active": True,
        "weight": 1.2
    }
]

async def init_database():
    """Initialize the database with sample data."""
    print("🚀 Initializing Sales Service database with sample data...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    try:
        # Clear existing data (optional - remove if you want to keep existing data)
        print("📝 Clearing existing data...")
        await db.customers.delete_many({})
        await db.products.delete_many({})
        await db.sales_orders.delete_many({})
        await db.quotes.delete_many({})
        await db.invoices.delete_many({})
        
        # Insert sample customers
        print("👥 Creating sample customers...")
        for customer_data in SAMPLE_CUSTOMERS:
            customer_data["created_at"] = datetime.utcnow()
            customer_data["updated_at"] = datetime.utcnow()
        
        result = await db.customers.insert_many(SAMPLE_CUSTOMERS)
        customer_ids = result.inserted_ids
        print(f"✅ Created {len(customer_ids)} customers")
        
        # Insert sample products
        print("📦 Creating sample products...")
        for product_data in SAMPLE_PRODUCTS:
            product_data["created_at"] = datetime.utcnow()
            product_data["updated_at"] = datetime.utcnow()
        
        result = await db.products.insert_many(SAMPLE_PRODUCTS)
        product_ids = result.inserted_ids
        print(f"✅ Created {len(product_ids)} products")
        
        # Create sample quotes
        print("💼 Creating sample quotes...")
        quotes_data = []
        
        # Quote 1: For Acme Corporation
        quote1 = {
            "quote_number": "Q-2024-001",
            "customer_id": customer_ids[0],
            "customer_info": {
                "name": "John Smith",
                "company": "Acme Corporation",
                "email": "john.smith@acmecorp.com"
            },
            "items": [
                {
                    "product_id": product_ids[0],  # Professional Laptop
                    "product_name": "Professional Laptop",
                    "product_sku": "LAP-PRO-001",
                    "quantity": 10,
                    "unit_price": 1299.99,
                    "discount_percent": 5.0,
                    "tax_rate": 0.08,
                    "line_total": 12349.91
                },
                {
                    "product_id": product_ids[1],  # Wireless Mouse
                    "product_name": "Wireless Mouse",
                    "product_sku": "MOU-WIR-001",
                    "quantity": 10,
                    "unit_price": 29.99,
                    "discount_percent": 0.0,
                    "tax_rate": 0.08,
                    "line_total": 299.90
                }
            ],
            "subtotal": 12649.81,
            "total_discount": 649.995,
            "total_tax": 991.98,
            "total_amount": 13641.79,
            "status": "sent",
            "valid_until": datetime.utcnow() + timedelta(days=30),
            "notes": "Bulk order discount applied",
            "created_at": datetime.utcnow() - timedelta(days=5),
            "updated_at": datetime.utcnow() - timedelta(days=5)
        }
        quotes_data.append(quote1)
        
        # Quote 2: For TechStart Inc
        quote2 = {
            "quote_number": "Q-2024-002",
            "customer_id": customer_ids[1],
            "customer_info": {
                "name": "Sarah Johnson",
                "company": "TechStart Inc",
                "email": "sarah.johnson@techstart.com"
            },
            "items": [
                {
                    "product_id": product_ids[2],  # Office Chair
                    "product_name": "Office Chair",
                    "product_sku": "CHR-OFF-001",
                    "quantity": 5,
                    "unit_price": 299.99,
                    "discount_percent": 0.0,
                    "tax_rate": 0.08,
                    "line_total": 1499.95
                },
                {
                    "product_id": product_ids[3],  # Software License
                    "product_name": "Software License - Pro",
                    "product_sku": "SFT-PRO-001",
                    "quantity": 5,
                    "unit_price": 499.99,
                    "discount_percent": 10.0,
                    "tax_rate": 0.00,
                    "line_total": 2249.955
                }
            ],
            "subtotal": 3749.905,
            "total_discount": 249.995,
            "total_tax": 119.996,
            "total_amount": 3869.901,
            "status": "approved",
            "valid_until": datetime.utcnow() + timedelta(days=25),
            "notes": "Startup discount applied on software licenses",
            "created_at": datetime.utcnow() - timedelta(days=3),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        }
        quotes_data.append(quote2)
        
        result = await db.quotes.insert_many(quotes_data)
        quote_ids = result.inserted_ids
        print(f"✅ Created {len(quote_ids)} quotes")
        
        # Create sample sales orders (from approved quotes)
        print("🛒 Creating sample sales orders...")
        
        # Convert approved quote to sales order
        sales_order = {
            "order_number": "SO-2024-001",
            "customer_id": customer_ids[1],
            "customer_info": quote2["customer_info"],
            "quote_id": quote_ids[1],
            "items": quote2["items"],
            "subtotal": quote2["subtotal"],
            "total_discount": quote2["total_discount"],
            "total_tax": quote2["total_tax"],
            "total_amount": quote2["total_amount"],
            "status": "confirmed",
            "order_date": datetime.utcnow() - timedelta(days=1),
            "expected_delivery_date": datetime.utcnow() + timedelta(days=14),
            "shipping_address": {
                "street": "456 Innovation Dr",
                "city": "San Francisco",
                "state": "CA",
                "country": "USA",
                "zip_code": "94105"
            },
            "payment_terms": "net_15",
            "notes": "Priority order - expedited shipping",
            "created_at": datetime.utcnow() - timedelta(days=1),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        }
        
        result = await db.sales_orders.insert_one(sales_order)
        sales_order_id = result.inserted_id
        print(f"✅ Created 1 sales order")
        
        # Create sample invoice
        print("🧾 Creating sample invoice...")
        
        invoice = {
            "invoice_number": "INV-2024-001",
            "customer_id": customer_ids[1],
            "customer_info": quote2["customer_info"],
            "sales_order_id": sales_order_id,
            "items": quote2["items"],
            "subtotal": quote2["subtotal"],
            "total_discount": quote2["total_discount"],
            "total_tax": quote2["total_tax"],
            "total_amount": quote2["total_amount"],
            "status": "sent",
            "invoice_date": datetime.utcnow(),
            "due_date": datetime.utcnow() + timedelta(days=15),
            "payment_terms": "net_15",
            "billing_address": {
                "street": "456 Innovation Dr",
                "city": "San Francisco",
                "state": "CA",
                "country": "USA",
                "zip_code": "94105"
            },
            "notes": "Payment due within 15 days",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.invoices.insert_one(invoice)
        print(f"✅ Created 1 invoice")
        
        print("\n🎉 Database initialization completed successfully!")
        print("\n📊 Sample Data Summary:")
        print(f"   👥 Customers: {len(SAMPLE_CUSTOMERS)}")
        print(f"   📦 Products: {len(SAMPLE_PRODUCTS)}")
        print(f"   💼 Quotes: {len(quotes_data)}")
        print(f"   🛒 Sales Orders: 1")
        print(f"   🧾 Invoices: 1")
        print("\n🌐 You can now test the API endpoints with this sample data!")
        print("📖 API Documentation: http://localhost:8002/docs")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    # Run the initialization
    asyncio.run(init_database())
