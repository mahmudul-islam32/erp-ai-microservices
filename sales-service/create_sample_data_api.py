#!/usr/bin/env python3
"""
Simple API-based data initialization script for Sales Service
Uses the sales service API endpoints to create sample data
"""

import requests
import json
from datetime import datetime, timedelta

# Sales service API base URL
API_BASE = "http://localhost:8003/api/v1"

# Sample customers data (using API format)
SAMPLE_CUSTOMERS = [
    {
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
            "postal_code": "10001",
            "country": "USA"
        },
        "shipping_address": {
            "street": "123 Business Ave",
            "city": "New York", 
            "state": "NY",
            "postal_code": "10001",
            "country": "USA"
        },
        "credit_limit": 50000.00,
        "payment_terms": "net_30",
        "tax_id": "12-3456789"
    },
    {
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
            "postal_code": "94105",
            "country": "USA"
        },
        "credit_limit": 25000.00,
        "payment_terms": "net_15"
    },
    {
        "first_name": "Michael",
        "last_name": "Brown",
        "email": "michael.brown@email.com",
        "phone": "+1-555-0103",
        "customer_type": "individual",
        "billing_address": {
            "street": "789 Residential St",
            "city": "Chicago",
            "state": "IL",
            "postal_code": "60601",
            "country": "USA"
        },
        "credit_limit": 5000.00,
        "payment_terms": "cod"
    },
    {
        "first_name": "Emily",
        "last_name": "Davis",
        "email": "emily.davis@globex.com",
        "phone": "+1-555-0104",
        "company_name": "Globex Solutions",
        "customer_type": "business",
        "billing_address": {
            "street": "321 Corporate Blvd",
            "city": "Austin",
            "state": "TX",
            "postal_code": "73301",
            "country": "USA"
        },
        "credit_limit": 75000.00,
        "payment_terms": "net_60"
    },
    {
        "first_name": "David",
        "last_name": "Wilson",
        "email": "david.wilson@freelancer.com",
        "phone": "+1-555-0105",
        "customer_type": "individual",
        "billing_address": {
            "street": "654 Creative Ave",
            "city": "Portland",
            "state": "OR", 
            "postal_code": "97201",
            "country": "USA"
        },
        "credit_limit": 10000.00,
        "payment_terms": "net_30"
    }
]


def create_sample_data():
    """Create sample data using the sales service API"""
    print("🚀 Creating sample data via Sales Service API...")
    
    created_customers = []
    
    # Create customers
    print("👥 Creating sample customers...")
    for i, customer_data in enumerate(SAMPLE_CUSTOMERS):
        try:
            response = requests.post(
                f"{API_BASE}/customers/",
                json=customer_data,
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 201:
                customer = response.json()
                created_customers.append(customer)
                print(f"   ✅ Created customer: {customer['first_name']} {customer['last_name']} (Code: {customer['customer_code']})")
            else:
                print(f"   ❌ Failed to create customer {customer_data['first_name']} {customer_data['last_name']}: {response.text}")
        except Exception as e:
            print(f"   ❌ Error creating customer {customer_data['first_name']} {customer_data['last_name']}: {e}")
    
    print(f"✅ Successfully created {len(created_customers)} customers")
    
    # Get some sample products from inventory service (if available)
    print("📦 Fetching products from inventory service...")
    try:
        response = requests.get("http://localhost:8002/api/v1/products?limit=10")
        if response.status_code == 200:
            inventory_data = response.json()
            products = inventory_data.get('products', [])
            print(f"   ✅ Found {len(products)} products from inventory service")
        else:
            print("   ⚠️  Could not fetch products from inventory service")
            products = []
    except Exception as e:
        print(f"   ⚠️  Could not connect to inventory service: {e}")
        products = []
    
    # Create some sample quotes if we have customers and products
    if created_customers and products:
        print("💼 Creating sample quotes...")
        
        # Quote 1: For the first customer with first 2 products
        quote_data_1 = {
            "customer_id": created_customers[0]["id"],
            "items": [
                {
                    "product_id": products[0]["_id"],
                    "product_name": products[0]["name"],
                    "product_sku": products[0]["sku"],
                    "quantity": 5,
                    "unit_price": products[0]["price"],
                    "discount_percentage": 5.0,
                    "tax_rate": 0.08
                },
                {
                    "product_id": products[1]["_id"] if len(products) > 1 else products[0]["_id"],
                    "product_name": products[1]["name"] if len(products) > 1 else products[0]["name"],
                    "product_sku": products[1]["sku"] if len(products) > 1 else products[0]["sku"],
                    "quantity": 10,
                    "unit_price": products[1]["price"] if len(products) > 1 else products[0]["price"],
                    "discount_percentage": 0.0,
                    "tax_rate": 0.08
                }
            ],
            "tax_rate": 0.08,
            "discount_amount": 100.0,
            "expiry_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "notes": "Bulk order discount applied"
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/quotes/",
                json=quote_data_1,
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 201:
                quote1 = response.json()
                print(f"   ✅ Created quote: {quote1['quote_number']}")
            else:
                print(f"   ❌ Failed to create quote 1: {response.text}")
        except Exception as e:
            print(f"   ❌ Error creating quote 1: {e}")
        
        # Quote 2: For the second customer 
        if len(created_customers) > 1 and len(products) > 2:
            quote_data_2 = {
                "customer_id": created_customers[1]["id"],
                "items": [
                    {
                        "product_id": products[2]["_id"],
                        "product_name": products[2]["name"],
                        "product_sku": products[2]["sku"],
                        "quantity": 3,
                        "unit_price": products[2]["price"],
                        "discount_percentage": 10.0,
                        "tax_rate": 0.08
                    }
                ],
                "tax_rate": 0.08,
                "discount_amount": 50.0,
                "expiry_date": (datetime.utcnow() + timedelta(days=45)).isoformat(),
                "notes": "Startup discount applied"
            }
            
            try:
                response = requests.post(
                    f"{API_BASE}/quotes/",
                    json=quote_data_2,
                    headers={"Content-Type": "application/json"}
                )
                if response.status_code == 201:
                    quote2 = response.json()
                    print(f"   ✅ Created quote: {quote2['quote_number']}")
                else:
                    print(f"   ❌ Failed to create quote 2: {response.text}")
            except Exception as e:
                print(f"   ❌ Error creating quote 2: {e}")
    
    print("\n🎉 Sample data creation completed!")
    print(f"📊 Summary:")
    print(f"   👥 Customers: {len(created_customers)}")
    print(f"   📦 Products: Available from inventory service")
    print(f"   💼 Quotes: Created sample quotes")
    print("\n🌐 You can now test the sales frontend!")
    print("📱 Frontend URL: http://localhost:5173/dashboard/sales")


if __name__ == "__main__":
    create_sample_data()
