#!/usr/bin/env python3
"""
Script to create comprehensive dummy data for ERP Sales Service
Creates 50+ customers, products, orders, quotes, and invoices
"""

import asyncio
import random
from datetime import datetime, timedelta
from decimal import Decimal
import json

# Dummy data for customers
CUSTOMER_DATA = [
    {"first_name": "John", "last_name": "Smith", "company": "Tech Solutions Inc", "email": "john.smith@techsolutions.com"},
    {"first_name": "Sarah", "last_name": "Johnson", "company": "Global Enterprises", "email": "sarah.j@globalent.com"},
    {"first_name": "Michael", "last_name": "Brown", "company": "Innovation Labs", "email": "michael.brown@innovlabs.com"},
    {"first_name": "Emily", "last_name": "Davis", "company": "Digital Dynamics", "email": "emily.davis@digidyn.com"},
    {"first_name": "David", "last_name": "Wilson", "company": "Future Systems", "email": "david.wilson@futuresys.com"},
    {"first_name": "Jessica", "last_name": "Martinez", "company": "Smart Solutions", "email": "jessica.m@smartsol.com"},
    {"first_name": "Christopher", "last_name": "Anderson", "company": "Tech Innovations", "email": "chris.anderson@techinno.com"},
    {"first_name": "Amanda", "last_name": "Taylor", "company": "Digital Networks", "email": "amanda.taylor@digitnet.com"},
    {"first_name": "Matthew", "last_name": "Thomas", "company": "Cloud Systems", "email": "matthew.thomas@cloudsys.com"},
    {"first_name": "Ashley", "last_name": "Jackson", "company": "Data Solutions", "email": "ashley.jackson@datasol.com"},
    {"first_name": "James", "last_name": "White", "company": "Network Pros", "email": "james.white@networkpros.com"},
    {"first_name": "Jennifer", "last_name": "Harris", "company": "Software Corp", "email": "jennifer.harris@softcorp.com"},
    {"first_name": "Ryan", "last_name": "Clark", "company": "Tech Ventures", "email": "ryan.clark@techventures.com"},
    {"first_name": "Stephanie", "last_name": "Lewis", "company": "Digital Media", "email": "stephanie.lewis@digimedia.com"},
    {"first_name": "Kevin", "last_name": "Robinson", "company": "IT Solutions", "email": "kevin.robinson@itsol.com"},
    {"first_name": "Rachel", "last_name": "Walker", "company": "Cyber Systems", "email": "rachel.walker@cybersys.com"},
    {"first_name": "Brian", "last_name": "Hall", "company": "Web Technologies", "email": "brian.hall@webtech.com"},
    {"first_name": "Nicole", "last_name": "Allen", "company": "Mobile Apps Inc", "email": "nicole.allen@mobileapps.com"},
    {"first_name": "Daniel", "last_name": "Young", "company": "AI Solutions", "email": "daniel.young@aisol.com"},
    {"first_name": "Lauren", "last_name": "King", "company": "Blockchain Ltd", "email": "lauren.king@blockchain.com"},
    {"first_name": "Steven", "last_name": "Wright", "company": "DevOps Pro", "email": "steven.wright@devopspro.com"},
    {"first_name": "Megan", "last_name": "Lopez", "company": "Security First", "email": "megan.lopez@secfirst.com"},
    {"first_name": "Anthony", "last_name": "Hill", "company": "Data Analytics", "email": "anthony.hill@dataanalytics.com"},
    {"first_name": "Samantha", "last_name": "Scott", "company": "Machine Learning Co", "email": "samantha.scott@mlco.com"},
    {"first_name": "Jason", "last_name": "Green", "company": "Quantum Computing", "email": "jason.green@quantum.com"},
    {"first_name": "Elizabeth", "last_name": "Adams", "company": "IoT Innovations", "email": "elizabeth.adams@iot.com"},
    {"first_name": "Andrew", "last_name": "Baker", "company": "Robotics Inc", "email": "andrew.baker@robotics.com"},
    {"first_name": "Melissa", "last_name": "Gonzalez", "company": "VR Solutions", "email": "melissa.gonzalez@vrsol.com"},
    {"first_name": "Joshua", "last_name": "Nelson", "company": "AR Technologies", "email": "joshua.nelson@artech.com"},
    {"first_name": "Amy", "last_name": "Carter", "company": "Fintech Solutions", "email": "amy.carter@fintech.com"},
    {"first_name": "Tyler", "last_name": "Mitchell", "company": "EdTech Innovations", "email": "tyler.mitchell@edtech.com"},
    {"first_name": "Brittany", "last_name": "Perez", "company": "HealthTech Corp", "email": "brittany.perez@healthtech.com"},
    {"first_name": "Brandon", "last_name": "Roberts", "company": "GreenTech Solutions", "email": "brandon.roberts@greentech.com"},
    {"first_name": "Christina", "last_name": "Turner", "company": "SpaceTech Industries", "email": "christina.turner@spacetech.com"},
    {"first_name": "Justin", "last_name": "Phillips", "company": "BioTech Labs", "email": "justin.phillips@biotech.com"},
    {"first_name": "Kimberly", "last_name": "Campbell", "company": "NanoTech Solutions", "email": "kimberly.campbell@nanotech.com"},
    {"first_name": "Adam", "last_name": "Parker", "company": "EnergyTech Corp", "email": "adam.parker@energytech.com"},
    {"first_name": "Danielle", "last_name": "Evans", "company": "WaterTech Systems", "email": "danielle.evans@watertech.com"},
    {"first_name": "Nathan", "last_name": "Edwards", "company": "AgriTech Solutions", "email": "nathan.edwards@agritech.com"},
    {"first_name": "Heather", "last_name": "Collins", "company": "FoodTech Innovations", "email": "heather.collins@foodtech.com"},
    {"first_name": "Jeremy", "last_name": "Stewart", "company": "TransportTech", "email": "jeremy.stewart@transporttech.com"},
    {"first_name": "Kelly", "last_name": "Sanchez", "company": "AutoTech Systems", "email": "kelly.sanchez@autotech.samuelcom"},
    {"first_name": "Benjamin", "last_name": "Morris", "company": "AeroTech Corp", "email": "benjamin.morris@aerotech.com"},
    {"first_name": "Michelle", "last_name": "Rogers", "company": "MarineTech Solutions", "email": "michelle.rogers@marinetech.com"},
    {"first_name": "Jacob", "last_name": "Reed", "company": "SportsTech Inc", "email": "jacob.reed@sportstech.com"},
    {"first_name": "Lisa", "last_name": "Cook", "company": "EntertainmentTech", "email": "lisa.cook@entertaintech.com"},
    {"first_name": "Aaron", "last_name": "Bailey", "company": "GameTech Studios", "email": "aaron.bailey@gametech.com"},
    {"first_name": "Karen", "last_name": "Rivera", "company": "SocialTech Platforms", "email": "karen.rivera@socialtech.com"},
    {"first_name": "Jordan", "last_name": "Cooper", "company": "MediaTech Corp", "email": "jordan.cooper@mediatech.com"},
    {"first_name": "Linda", "last_name": "Richardson", "company": "RetailTech Solutions", "email": "linda.richardson@retailtech.com"}
]

CITIES_STATES = [
    ("New York", "NY", "10001"), ("Los Angeles", "CA", "90210"), ("Chicago", "IL", "60601"),
    ("Houston", "TX", "77001"), ("Phoenix", "AZ", "85001"), ("Philadelphia", "PA", "19101"),
    ("San Antonio", "TX", "78201"), ("San Diego", "CA", "92101"), ("Dallas", "TX", "75201"),
    ("San Jose", "CA", "95101"), ("Austin", "TX", "73301"), ("Jacksonville", "FL", "32099"),
    ("Fort Worth", "TX", "76101"), ("Columbus", "OH", "43085"), ("Charlotte", "NC", "28201"),
    ("San Francisco", "CA", "94102"), ("Indianapolis", "IN", "46201"), ("Seattle", "WA", "98101"),
    ("Denver", "CO", "80201"), ("Washington", "DC", "20001"), ("Boston", "MA", "02101"),
    ("El Paso", "TX", "79901"), ("Nashville", "TN", "37201"), ("Detroit", "MI", "48201"),
    ("Oklahoma City", "OK", "73101"), ("Portland", "OR", "97201"), ("Las Vegas", "NV", "89101"),
    ("Memphis", "TN", "38101"), ("Louisville", "KY", "40201"), ("Baltimore", "MD", "21201")
]

PRODUCT_DATA = [
    {"name": "Laptop Pro 15", "category": "Electronics", "price": 1299.99},
    {"name": "Wireless Mouse", "category": "Electronics", "price": 29.99},
    {"name": "USB-C Hub", "category": "Electronics", "price": 79.99},
    {"name": "Monitor 27inch", "category": "Electronics", "price": 299.99},
    {"name": "Keyboard Mechanical", "category": "Electronics", "price": 129.99},
    {"name": "Webcam HD", "category": "Electronics", "price": 89.99},
    {"name": "Headphones Pro", "category": "Electronics", "price": 199.99},
    {"name": "Tablet 10inch", "category": "Electronics", "price": 399.99},
    {"name": "Smartphone", "category": "Electronics", "price": 699.99},
    {"name": "Smartwatch", "category": "Electronics", "price": 249.99},
    {"name": "Office Chair", "category": "Furniture", "price": 299.99},
    {"name": "Standing Desk", "category": "Furniture", "price": 599.99},
    {"name": "Desk Lamp", "category": "Furniture", "price": 49.99},
    {"name": "Filing Cabinet", "category": "Furniture", "price": 199.99},
    {"name": "Bookshelf", "category": "Furniture", "price": 149.99},
    {"name": "Coffee Maker", "category": "Appliances", "price": 89.99},
    {"name": "Microwave", "category": "Appliances", "price": 129.99},
    {"name": "Air Purifier", "category": "Appliances", "price": 179.99},
    {"name": "Printer Laser", "category": "Office", "price": 199.99},
    {"name": "Scanner", "category": "Office", "price": 149.99}
]

async def create_customers_via_api():
    """Create customers using the API"""
    import requests
    
    print("Creating 50 customers via API...")
    
    # Login to get authentication
    login_response = requests.post(
        "http://localhost:8001/api/v1/auth/login",
        json={"email": "admin@erp.com", "password": "admin123"}
    )
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
    
    # Get session for cookies
    session = requests.Session()
    login_with_session = session.post(
        "http://localhost:8001/api/v1/auth/login",
        json={"email": "admin@erp.com", "password": "admin123"}
    )
    
    if login_with_session.status_code != 200:
        print(f"Session login failed: {login_with_session.text}")
        return
    
    print("Login successful, creating customers...")
    
    created_customers = []
    
    for i, customer_info in enumerate(CUSTOMER_DATA):
        city, state, zip_code = random.choice(CITIES_STATES)
        
        customer_data = {
            "first_name": customer_info["first_name"],
            "last_name": customer_info["last_name"],
            "company_name": customer_info["company"],
            "customer_type": "business",
            "email": customer_info["email"],
            "phone": f"+1-555-{1000 + i:04d}",
            "billing_address": {
                "street": f"{100 + i * 10} Business St",
                "city": city,
                "state": state,
                "postal_code": zip_code,
                "country": "USA"
            },
            "shipping_address": {
                "street": f"{100 + i * 10} Business St",
                "city": city,
                "state": state,
                "postal_code": zip_code,
                "country": "USA"
            },
            "payment_terms": random.choice(["net_15", "net_30", "net_60", "net_90", "cod", "prepaid"]),
            "credit_limit": random.randint(1000, 50000),
            "status": "active"
        }
        
        try:
            response = session.post(
                "http://localhost:8003/api/v1/customers/",
                json=customer_data
            )
            
            if response.status_code in [200, 201]:
                print(f"✓ Created customer {i+1}: {customer_info['first_name']} {customer_info['last_name']}")
                created_customers.append(customer_data)
            else:
                print(f"✗ Failed to create customer {i+1}: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"✗ Error creating customer {i+1}: {e}")
    
    print(f"\n✅ Successfully created {len(created_customers)} customers")
    
    # Create some products
    print("\nCreating products...")
    created_products = []
    
    for i, product_info in enumerate(PRODUCT_DATA):
        product_data = {
            "name": product_info["name"],
            "description": f"High-quality {product_info['name'].lower()} for professional use",
            "category": product_info["category"],
            "price": product_info["price"],
            "cost": product_info["price"] * 0.6,  # 40% margin
            "sku": f"SKU{1000 + i:04d}",
            "barcode": f"123456789{1000 + i:04d}",
            "stock_quantity": random.randint(10, 100),
            "reorder_level": random.randint(5, 20),
            "is_active": True
        }
        
        try:
            response = session.post(
                "http://localhost:8003/api/v1/products/",
                json=product_data
            )
            
            if response.status_code in [200, 201]:
                print(f"✓ Created product {i+1}: {product_info['name']}")
                created_products.append(product_data)
            else:
                print(f"✗ Failed to create product {i+1}: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"✗ Error creating product {i+1}: {e}")
    
    print(f"\n✅ Successfully created {len(created_products)} products")
    
    return created_customers, created_products

if __name__ == "__main__":
    asyncio.run(create_customers_via_api())
