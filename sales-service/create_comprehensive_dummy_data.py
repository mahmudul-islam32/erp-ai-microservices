#!/usr/bin/env python3
"""
Comprehensive Dummy Data Generator for ERP Sales Service
Creates 50+ customers, products, sales orders, quotes, and invoices
Includes realistic relationships between entities
"""

import asyncio
import random
import requests
from datetime import datetime, timedelta, date
from typing import List, Dict, Any
import json
from faker import Faker

fake = Faker()

# API Configuration
BASE_URL = "http://localhost:8003"
AUTH_URL = "http://localhost:8001"

# Session for authentication
session = requests.Session()

def login():
    """Login and get authentication tokens"""
    login_data = {
        "email": "admin@erp.com",
        "password": "admin123"
    }
    
    response = session.post(f"{AUTH_URL}/api/v1/auth/login", json=login_data)
    if response.status_code == 200:
        print("✅ Successfully logged in")
        return True
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return False

def get_existing_customers() -> List[Dict]:
    """Get existing customers from the database"""
    response = session.get(f"{BASE_URL}/api/v1/customers/?limit=100")
    if response.status_code == 200:
        customers = response.json()
        print(f"📊 Found {len(customers)} existing customers")
        return customers
    else:
        print(f"❌ Failed to get customers: {response.status_code}")
        return []

def create_sales_orders(customers: List[Dict], num_orders: int = 75) -> List[Dict]:
    """Create sales orders for existing customers"""
    orders = []
    order_statuses = ["draft", "pending", "confirmed", "processing", "shipped", "delivered"]
    shipping_methods = ["standard", "express", "overnight", "pickup"]
    priorities = ["low", "normal", "high", "urgent"]
    
    print(f"🛒 Creating {num_orders} sales orders...")
    
    for i in range(num_orders):
        customer = random.choice(customers)
        
        # Generate random line items
        num_items = random.randint(1, 5)
        line_items = []
        subtotal = 0
        
        for _ in range(num_items):
            # Create dummy product data
            product_id = fake.uuid4()
            product_name = fake.catch_phrase()
            product_sku = f"PRD-{random.randint(1000, 9999)}"
            quantity = random.randint(1, 10)
            unit_price = round(random.uniform(10.0, 500.0), 2)
            discount_percent = random.choice([0, 5, 10, 15, 20])
            discount_amount = round((unit_price * quantity * discount_percent / 100), 2)
            tax_rate = 0.08  # 8% tax
            
            line_total = (unit_price * quantity) - discount_amount
            tax_amount = round(line_total * tax_rate, 2)
            
            line_items.append({
                "product_id": product_id,
                "product_name": product_name,
                "product_sku": product_sku,
                "quantity": quantity,
                "unit_price": unit_price,
                "discount_percent": discount_percent,
                "discount_amount": discount_amount,
                "tax_rate": tax_rate,
                "tax_amount": tax_amount,
                "line_total": line_total + tax_amount,
                "notes": fake.sentence() if random.choice([True, False]) else None
            })
            
            subtotal += line_total
        
        # Calculate totals
        order_discount_percent = random.choice([0, 0, 0, 5, 10])
        order_discount_amount = round(subtotal * order_discount_percent / 100, 2)
        shipping_cost = round(random.uniform(0, 50.0), 2)
        tax_amount = round((subtotal - order_discount_amount) * 0.08, 2)
        total_amount = subtotal - order_discount_amount + shipping_cost + tax_amount
        
        order_data = {
            "customer_id": customer["_id"],
            "order_date": (datetime.now() - timedelta(days=random.randint(0, 90))).date().isoformat(),
            "expected_delivery_date": (datetime.now() + timedelta(days=random.randint(1, 30))).date().isoformat(),
            "shipping_method": random.choice(shipping_methods),
            "priority": random.choice(priorities),
            "line_items": [{
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "unit_price": item["unit_price"],
                "discount_percent": item["discount_percent"],
                "discount_amount": item["discount_amount"],
                "notes": item["notes"]
            } for item in line_items],
            "subtotal_discount_percent": order_discount_percent,
            "subtotal_discount_amount": order_discount_amount,
            "shipping_cost": shipping_cost,
            "notes": fake.text(max_nb_chars=200) if random.choice([True, False]) else None,
            "internal_notes": fake.text(max_nb_chars=100) if random.choice([True, False]) else None
        }
        
        try:
            response = session.post(f"{BASE_URL}/api/v1/sales-orders/", json=order_data)
            if response.status_code == 201:
                order = response.json()
                
                # Update order status randomly (some orders should be in different states)
                if random.choice([True, False, False]):  # 33% chance to update status
                    new_status = random.choice(order_statuses)
                    update_response = session.put(
                        f"{BASE_URL}/api/v1/sales-orders/{order['id']}", 
                        json={"status": new_status}
                    )
                    if update_response.status_code == 200:
                        order = update_response.json()
                
                orders.append(order)
                if len(orders) % 10 == 0:
                    print(f"   Created {len(orders)} orders...")
            else:
                print(f"❌ Failed to create order {i+1}: {response.status_code}")
                print(response.text[:200])
        except Exception as e:
            print(f"❌ Error creating order {i+1}: {e}")
    
    print(f"✅ Successfully created {len(orders)} sales orders")
    return orders

def create_quotes(customers: List[Dict], num_quotes: int = 60) -> List[Dict]:
    """Create quotes for existing customers"""
    quotes = []
    quote_statuses = ["draft", "sent", "viewed", "accepted", "rejected", "expired"]
    
    print(f"💰 Creating {num_quotes} quotes...")
    
    for i in range(num_quotes):
        customer = random.choice(customers)
        
        # Generate random line items
        num_items = random.randint(1, 4)
        line_items = []
        
        for _ in range(num_items):
            # Create dummy product data for quote
            product_id = fake.uuid4()
            quantity = random.randint(1, 8)
            unit_price = round(random.uniform(15.0, 800.0), 2)
            discount_percent = random.choice([0, 5, 10, 15])
            discount_amount = round((unit_price * quantity * discount_percent / 100), 2)
            
            line_items.append({
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": unit_price,
                "discount_percent": discount_percent,
                "discount_amount": discount_amount,
                "notes": fake.sentence() if random.choice([True, False]) else None
            })
        
        quote_date = datetime.now() - timedelta(days=random.randint(0, 60))
        valid_until = quote_date + timedelta(days=random.randint(7, 30))
        
        quote_data = {
            "customer_id": customer["_id"],
            "quote_date": quote_date.date().isoformat(),
            "valid_until": valid_until.date().isoformat(),
            "expected_delivery_date": (datetime.now() + timedelta(days=random.randint(5, 45))).date().isoformat(),
            "line_items": line_items,
            "subtotal_discount_percent": random.choice([0, 0, 5, 10]),
            "subtotal_discount_amount": round(random.uniform(0, 100), 2),
            "shipping_cost": round(random.uniform(0, 75.0), 2),
            "notes": fake.text(max_nb_chars=200) if random.choice([True, False]) else None,
            "terms_and_conditions": "Standard terms and conditions apply. Payment due within 30 days of delivery."
        }
        
        try:
            response = session.post(f"{BASE_URL}/api/v1/quotes/", json=quote_data)
            if response.status_code == 201:
                quote = response.json()
                
                # Update quote status randomly
                if random.choice([True, False]):  # 50% chance to update status
                    new_status = random.choice(quote_statuses)
                    update_response = session.put(
                        f"{BASE_URL}/api/v1/quotes/{quote['id']}", 
                        json={"status": new_status}
                    )
                    if update_response.status_code == 200:
                        quote = update_response.json()
                
                quotes.append(quote)
                if len(quotes) % 10 == 0:
                    print(f"   Created {len(quotes)} quotes...")
            else:
                print(f"❌ Failed to create quote {i+1}: {response.status_code}")
                print(response.text[:200])
        except Exception as e:
            print(f"❌ Error creating quote {i+1}: {e}")
    
    print(f"✅ Successfully created {len(quotes)} quotes")
    return quotes

def create_invoices(orders: List[Dict], num_invoices: int = 50) -> List[Dict]:
    """Create invoices from existing orders"""
    invoices = []
    invoice_statuses = ["draft", "sent", "viewed", "paid", "partial_paid", "overdue"]
    
    print(f"🧾 Creating {num_invoices} invoices...")
    
    # Use orders that are confirmed or later in the process
    confirmed_orders = [order for order in orders if order.get("status") in ["confirmed", "processing", "shipped", "delivered"]]
    
    if len(confirmed_orders) < num_invoices:
        print(f"⚠️  Only {len(confirmed_orders)} orders available for invoice creation, creating invoices for all of them")
        orders_to_invoice = confirmed_orders
    else:
        orders_to_invoice = random.sample(confirmed_orders, num_invoices)
    
    for i, order in enumerate(orders_to_invoice):
        invoice_date = datetime.strptime(order["order_date"], "%Y-%m-%d") + timedelta(days=random.randint(1, 5))
        due_date = invoice_date + timedelta(days=random.randint(15, 45))
        
        invoice_data = {
            "order_id": order["id"],
            "invoice_date": invoice_date.date().isoformat(),
            "due_date": due_date.date().isoformat(),
            "payment_terms": order.get("payment_terms", "net_30"),
            "notes": fake.text(max_nb_chars=150) if random.choice([True, False]) else None,
            "late_fee_rate": round(random.uniform(0.01, 0.03), 3) if random.choice([True, False]) else None
        }
        
        try:
            response = session.post(f"{BASE_URL}/api/v1/invoices/", json=invoice_data)
            if response.status_code == 201:
                invoice = response.json()
                
                # Update invoice status randomly
                if random.choice([True, False]):  # 50% chance to update status
                    new_status = random.choice(invoice_statuses)
                    update_response = session.put(
                        f"{BASE_URL}/api/v1/invoices/{invoice['id']}", 
                        json={"status": new_status}
                    )
                    if update_response.status_code == 200:
                        invoice = update_response.json()
                
                # For paid invoices, record a payment
                if invoice.get("status") == "paid":
                    payment_data = {
                        "payment_date": (datetime.strptime(invoice["due_date"], "%Y-%m-%d") - timedelta(days=random.randint(0, 10))).date().isoformat(),
                        "amount": invoice["total_amount"],
                        "payment_method": random.choice(["credit_card", "bank_transfer", "check", "cash"]),
                        "payment_reference": f"PAY-{random.randint(10000, 99999)}",
                        "notes": "Payment received in full"
                    }
                    session.post(f"{BASE_URL}/api/v1/invoices/{invoice['id']}/payments", json=payment_data)
                
                invoices.append(invoice)
                if len(invoices) % 10 == 0:
                    print(f"   Created {len(invoices)} invoices...")
            else:
                print(f"❌ Failed to create invoice for order {order['id']}: {response.status_code}")
                print(response.text[:200])
        except Exception as e:
            print(f"❌ Error creating invoice {i+1}: {e}")
    
    print(f"✅ Successfully created {len(invoices)} invoices")
    return invoices

def check_current_data():
    """Check current data counts"""
    print("\n📊 Checking current data counts...")
    
    endpoints = [
        ("customers", "/api/v1/customers/"),
        ("sales orders", "/api/v1/sales-orders/"),
        ("quotes", "/api/v1/quotes/"),
        ("invoices", "/api/v1/invoices/")
    ]
    
    for name, endpoint in endpoints:
        try:
            response = session.get(f"{BASE_URL}{endpoint}?limit=1000")
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else 0
                print(f"   {name.capitalize()}: {count}")
            else:
                print(f"   {name.capitalize()}: Error getting data")
        except Exception as e:
            print(f"   {name.capitalize()}: Error - {e}")

def main():
    """Main function to create comprehensive dummy data"""
    print("🚀 Starting Comprehensive ERP Sales Dummy Data Generation")
    print("=" * 60)
    
    # Login first
    if not login():
        return
    
    # Check current data
    check_current_data()
    
    # Get existing customers
    customers = get_existing_customers()
    if not customers:
        print("❌ No customers found. Please create customers first.")
        return
    
    print(f"\n🎯 Creating comprehensive dummy data for {len(customers)} customers...")
    
    # Create sales orders
    orders = create_sales_orders(customers, 75)
    
    # Create quotes
    quotes = create_quotes(customers, 60)
    
    # Create invoices from orders
    invoices = create_invoices(orders, 45)
    
    # Final data check
    print("\n" + "=" * 60)
    print("🎉 COMPREHENSIVE DUMMY DATA CREATION COMPLETED!")
    check_current_data()
    
    print("\n📈 Summary:")
    print(f"   • Sales Orders Created: {len(orders)}")
    print(f"   • Quotes Created: {len(quotes)}")
    print(f"   • Invoices Created: {len(invoices)}")
    print("\n✅ All sales entities now have comprehensive dummy data!")
    print("🔗 You can now test all frontend pagination and data display features.")

if __name__ == "__main__":
    main()
