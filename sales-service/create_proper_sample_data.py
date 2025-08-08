import asyncio
import os
import sys
from datetime import datetime, date, timedelta
from decimal import Decimal

# Add the project root to Python path
sys.path.append('/app')

from app.database.connection import get_database
from app.models.customer import CustomerCreate
from app.models.product import ProductCreate
from app.models.quote import QuoteCreate
from app.models.sales_order import SalesOrderCreate, OrderLineItemCreate, ShippingMethod, OrderPriority
from app.models.invoice import InvoiceCreate
from app.services.customer_service import CustomerService
from app.services.product_service import ProductService


async def clear_and_populate_database():
    """Clear existing data and populate with proper sample data"""
    
    # Get database
    db = get_database()
    if not db:
        print("Error: Database connection not available")
        return
    
    print("Clearing existing data...")
    
    # Clear all collections
    await db.customers.delete_many({})
    await db.products.delete_many({})
    await db.quotes.delete_many({})
    await db.sales_orders.delete_many({})
    await db.invoices.delete_many({})
    
    print("Creating sample data...")
    
    # Initialize services
    customer_service = CustomerService()
    product_service = ProductService()
    
    # Sample customers
    customers_data = [
        {
            "name": "TechCorp Solutions",
            "email": "contact@techcorp.com",
            "phone": "+1-555-0101",
            "customer_code": "TECH001",
            "company_name": "TechCorp Solutions Inc.",
            "billing_address": {
                "street": "123 Business Ave",
                "city": "New York",
                "state": "NY",
                "postal_code": "10001",
                "country": "USA"
            },
            "shipping_address": {
                "street": "123 Business Ave",
                "city": "New York", 
                "state": "NY",
                "postal_code": "10001",
                "country": "USA"
            }
        },
        {
            "name": "Global Enterprises",
            "email": "orders@globalent.com",
            "phone": "+1-555-0202",
            "customer_code": "GLOB001",
            "company_name": "Global Enterprises LLC",
            "billing_address": {
                "street": "456 Commerce St",
                "city": "Los Angeles",
                "state": "CA",
                "postal_code": "90210",
                "country": "USA"
            },
            "shipping_address": {
                "street": "456 Commerce St",
                "city": "Los Angeles",
                "state": "CA", 
                "postal_code": "90210",
                "country": "USA"
            }
        },
        {
            "name": "StartupXYZ",
            "email": "team@startupxyz.com",
            "phone": "+1-555-0303",
            "customer_code": "START001",
            "company_name": "StartupXYZ Inc.",
            "billing_address": {
                "street": "789 Innovation Dr",
                "city": "San Francisco",
                "state": "CA",
                "postal_code": "94105",
                "country": "USA"
            },
            "shipping_address": {
                "street": "789 Innovation Dr",
                "city": "San Francisco",
                "state": "CA",
                "postal_code": "94105", 
                "country": "USA"
            }
        }
    ]
    
    # Create customers
    created_customers = []
    for customer_data in customers_data:
        try:
            customer = CustomerCreate(**customer_data)
            created_customer = await customer_service.create_customer(customer)
            created_customers.append(created_customer)
            print(f"Created customer: {created_customer.name}")
        except Exception as e:
            print(f"Error creating customer: {e}")
    
    # Sample products
    products_data = [
        {
            "name": "Professional Software License",
            "sku": "PSL-001",
            "description": "Annual professional software license",
            "category": "Software",
            "unit_price": 999.99,
            "cost_price": 200.00,
            "stock_quantity": 100,
            "reorder_level": 10,
            "supplier": "Software Solutions Inc.",
            "unit_of_measure": "license"
        },
        {
            "name": "Cloud Storage Plan",
            "sku": "CSP-100",
            "description": "100GB cloud storage annual plan",
            "category": "Services",
            "unit_price": 120.00,
            "cost_price": 30.00,
            "stock_quantity": 1000,
            "reorder_level": 50,
            "supplier": "Cloud Provider Inc.",
            "unit_of_measure": "subscription"
        },
        {
            "name": "Premium Support Package",
            "sku": "PSP-PRE",
            "description": "24/7 premium support package",
            "category": "Support",
            "unit_price": 2500.00,
            "cost_price": 500.00,
            "stock_quantity": 50,
            "reorder_level": 5,
            "supplier": "Support Solutions LLC",
            "unit_of_measure": "package"
        },
        {
            "name": "Training Workshop",
            "sku": "TW-001",
            "description": "Full-day professional training workshop",
            "category": "Training",
            "unit_price": 750.00,
            "cost_price": 200.00,
            "stock_quantity": 25,
            "reorder_level": 3,
            "supplier": "Training Experts Inc.",
            "unit_of_measure": "session"
        },
        {
            "name": "Consultation Service",
            "sku": "CS-HOUR",
            "description": "Professional consultation per hour",
            "category": "Consulting",
            "unit_price": 150.00,
            "cost_price": 50.00,
            "stock_quantity": 500,
            "reorder_level": 50,
            "supplier": "Expert Consultants LLC",
            "unit_of_measure": "hour"
        }
    ]
    
    # Create products
    created_products = []
    for product_data in products_data:
        try:
            product = ProductCreate(**product_data)
            created_product = await product_service.create_product(product)
            created_products.append(created_product)
            print(f"Created product: {created_product.name}")
        except Exception as e:
            print(f"Error creating product: {e}")
    
    if not created_customers or not created_products:
        print("Error: Failed to create customers or products")
        return
    
    # Sample sales orders
    admin_user_id = "688f40920f736ffe81ef33b"  # From auth service
    
    # Create a sales order
    order_line_items = [
        OrderLineItemCreate(
            product_id=str(created_products[0].id),
            quantity=2,
            unit_price=created_products[0].unit_price,
            discount_percent=5.0
        ),
        OrderLineItemCreate(
            product_id=str(created_products[1].id),
            quantity=1,
            unit_price=created_products[1].unit_price
        )
    ]
    
    sales_order_data = {
        "customer_id": str(created_customers[0].id),
        "order_date": date.today(),
        "expected_delivery_date": date.today() + timedelta(days=14),
        "shipping_method": ShippingMethod.STANDARD,
        "priority": OrderPriority.NORMAL,
        "line_items": order_line_items,
        "shipping_cost": 25.50,
        "notes": "First sample sales order"
    }
    
    # Calculate totals for the order
    subtotal = sum(item.quantity * item.unit_price * (1 - item.discount_percent / 100) for item in order_line_items)
    tax_amount = subtotal * 0.08  # 8% tax
    total_amount = subtotal + tax_amount + sales_order_data["shipping_cost"]
    
    # Create sales order document
    sales_order_doc = {
        "order_number": "SO-2025-001",
        "customer_id": sales_order_data["customer_id"],
        "customer_name": created_customers[0].name,
        "customer_email": created_customers[0].email,
        "order_date": sales_order_data["order_date"],
        "expected_delivery_date": sales_order_data["expected_delivery_date"],
        "shipping_method": sales_order_data["shipping_method"].value,
        "shipping_address": created_customers[0].shipping_address,
        "priority": sales_order_data["priority"].value,
        "line_items": [
            {
                "product_id": item.product_id,
                "product_name": next(p.name for p in created_products if str(p.id) == item.product_id),
                "product_sku": next(p.sku for p in created_products if str(p.id) == item.product_id),
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "discount_percent": item.discount_percent,
                "discount_amount": item.quantity * item.unit_price * (item.discount_percent / 100),
                "tax_rate": 0.08,
                "tax_amount": item.quantity * item.unit_price * (1 - item.discount_percent / 100) * 0.08,
                "line_total": item.quantity * item.unit_price * (1 - item.discount_percent / 100)
            }
            for item in order_line_items
        ],
        "subtotal": subtotal,
        "subtotal_discount_percent": 0,
        "subtotal_discount_amount": 0,
        "tax_amount": tax_amount,
        "shipping_cost": sales_order_data["shipping_cost"],
        "total_amount": total_amount,
        "payment_status": "pending",
        "paid_amount": 0,
        "balance_due": total_amount,
        "notes": sales_order_data["notes"],
        "status": "confirmed",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": admin_user_id
    }
    
    # Insert sales order
    sales_order_result = await db.sales_orders.insert_one(sales_order_doc)
    if sales_order_result.inserted_id:
        print(f"Created sales order: SO-2025-001")
    
    # Sample quote
    quote_line_items_data = [
        {
            "product_id": str(created_products[2].id),
            "product_name": created_products[2].name,
            "product_sku": created_products[2].sku,
            "quantity": 1,
            "unit_price": created_products[2].unit_price,
            "discount_percent": 10.0,
            "discount_amount": created_products[2].unit_price * 0.10,
            "tax_rate": 0.08,
            "tax_amount": (created_products[2].unit_price * 0.90) * 0.08,
            "line_total": created_products[2].unit_price * 0.90
        }
    ]
    
    quote_subtotal = sum(item["line_total"] for item in quote_line_items_data)
    quote_tax = sum(item["tax_amount"] for item in quote_line_items_data)
    quote_total = quote_subtotal + quote_tax
    
    quote_doc = {
        "quote_number": "QT-2025-001",
        "customer_id": str(created_customers[1].id),
        "customer_name": created_customers[1].name,
        "customer_email": created_customers[1].email,
        "quote_date": date.today(),
        "valid_until": date.today() + timedelta(days=30),
        "line_items": quote_line_items_data,
        "subtotal": quote_subtotal,
        "subtotal_discount_percent": 0,
        "subtotal_discount_amount": 0,
        "tax_amount": quote_tax,
        "total_amount": quote_total,
        "notes": "Sample quote for premium support",
        "terms_and_conditions": "Quote valid for 30 days. Payment terms: Net 30.",
        "status": "sent",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": admin_user_id
    }
    
    # Insert quote
    quote_result = await db.quotes.insert_one(quote_doc)
    if quote_result.inserted_id:
        print(f"Created quote: QT-2025-001")
    
    # Sample invoice (from the sales order)
    invoice_line_items = [
        {
            "product_id": item["product_id"],
            "product_name": item["product_name"],
            "product_sku": item["product_sku"],
            "quantity": item["quantity"],
            "unit_price": item["unit_price"],
            "discount_percent": item["discount_percent"],
            "discount_amount": item["discount_amount"],
            "tax_rate": item["tax_rate"],
            "tax_amount": item["tax_amount"],
            "line_total": item["line_total"]
        }
        for item in sales_order_doc["line_items"]
    ]
    
    invoice_doc = {
        "invoice_number": "INV-2025-001",
        "sales_order_id": str(sales_order_result.inserted_id),
        "customer_id": sales_order_doc["customer_id"],
        "customer_name": sales_order_doc["customer_name"],
        "customer_email": sales_order_doc["customer_email"],
        "invoice_date": date.today(),
        "due_date": date.today() + timedelta(days=30),
        "billing_address": created_customers[0].billing_address,
        "line_items": invoice_line_items,
        "subtotal": sales_order_doc["subtotal"],
        "subtotal_discount_percent": 0,
        "subtotal_discount_amount": 0,
        "tax_amount": sales_order_doc["tax_amount"],
        "shipping_cost": sales_order_doc["shipping_cost"],
        "total_amount": sales_order_doc["total_amount"],
        "payment_status": "pending",
        "paid_amount": 0,
        "balance_due": sales_order_doc["total_amount"],
        "payment_terms": "Net 30",
        "notes": "Invoice for sales order SO-2025-001",
        "status": "sent",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": admin_user_id
    }
    
    # Insert invoice
    invoice_result = await db.invoices.insert_one(invoice_doc)
    if invoice_result.inserted_id:
        print(f"Created invoice: INV-2025-001")
    
    print("\nSample data creation completed!")
    print(f"Created {len(created_customers)} customers")
    print(f"Created {len(created_products)} products")
    print("Created 1 sales order")
    print("Created 1 quote")
    print("Created 1 invoice")


if __name__ == "__main__":
    asyncio.run(clear_and_populate_database())
