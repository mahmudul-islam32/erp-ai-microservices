#!/usr/bin/env python3
"""
Test notification flow by creating an order and checking if notifications are created
"""
import asyncio
import httpx
import json
from datetime import datetime, date

# Service URLs
AUTH_URL = "http://localhost:8001"
SALES_URL = "http://localhost:8003"
NOTIFICATION_URL = "http://localhost:8004"

async def login(email: str, password: str):
    """Login and get access token"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{AUTH_URL}/api/v1/auth/login",
            json={"email": email, "password": password}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Logged in as {email}")
            return data["access_token"]
        else:
            print(f"❌ Login failed for {email}: {response.status_code}")
            print(f"   Response: {response.text}")
            return None

async def get_users_by_role(token: str, role: str):
    """Get users by role"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{AUTH_URL}/api/v1/users/",
            headers={"Authorization": f"Bearer {token}"},
            params={"role": role, "status": "active", "limit": 100}
        )
        if response.status_code == 200:
            users = response.json()
            return users
        else:
            print(f"❌ Failed to get {role} users: {response.status_code}")
            print(f"   Response: {response.text}")
            return []

async def get_customers(token: str):
    """Get customers"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{SALES_URL}/api/v1/customers/",
            headers={"Authorization": f"Bearer {token}"},
            params={"limit": 5}
        )
        if response.status_code == 200:
            return response.json()
        else:
            print(f"⚠️  No customers found, will create one")
            return []

async def create_customer(token: str):
    """Create a test customer"""
    customer_data = {
        "first_name": "Test",
        "last_name": "Customer",
        "email": f"testcustomer_{datetime.now().timestamp()}@example.com",
        "phone": "1234567890",
        "customer_type": "individual",
        "billing_address": {
            "street": "123 Test St",
            "city": "Test City",
            "state": "TS",
            "postal_code": "12345",
            "country": "US"
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{SALES_URL}/api/v1/customers/",
            headers={"Authorization": f"Bearer {token}"},
            json=customer_data
        )
        if response.status_code == 201:
            customer = response.json()
            print(f"✅ Created customer: {customer.get('email')}")
            return customer
        else:
            print(f"❌ Failed to create customer: {response.status_code}")
            print(f"   Response: {response.text}")
            return None

async def get_products(token: str):
    """Get products from inventory"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"http://localhost:8002/api/products",
            headers={"Authorization": f"Bearer {token}"},
            params={"limit": 5}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("products", []) if isinstance(data, dict) else data
        else:
            print(f"⚠️  No products found")
            return []

async def create_order(token: str, customer_id: str, product_id: str = None):
    """Create a test order"""
    # If no product, use a dummy product ID for testing
    if not product_id:
        product_id = "test_product_001"
    
    order_data = {
        "customer_id": customer_id,
        "order_date": date.today().isoformat(),
        "line_items": [
            {
                "product_id": product_id,
                "quantity": 2,
                "unit_price": 99.99,
                "discount_percent": 0,
                "discount_amount": 0,
                "notes": "Test order item"
            }
        ],
        "shipping_method": "standard",
        "priority": "normal",
        "payment_method": "credit_card",
        "notes": "Test order for notification testing",
        "shipping_cost": 10.00,
        "subtotal_discount_percent": 0,
        "subtotal_discount_amount": 0
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{SALES_URL}/api/v1/orders/",
            headers={"Authorization": f"Bearer {token}"},
            json=order_data
        )
        if response.status_code in [200, 201]:
            order = response.json()
            print(f"✅ Created order: {order.get('order_number')} (ID: {order.get('_id')})")
            return order
        else:
            print(f"❌ Failed to create order: {response.status_code}")
            print(f"   Response: {response.text}")
            return None

async def get_notifications_for_user(token: str, user_id: str):
    """Get notifications for a user"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{NOTIFICATION_URL}/api/v1/notifications/user/{user_id}",
            headers={"Authorization": f"Bearer {token}"},
            params={"limit": 10}
        )
        if response.status_code == 200:
            return response.json()
        else:
            print(f"⚠️  Failed to get notifications: {response.status_code}")
            return []

async def main():
    print("=" * 80)
    print("NOTIFICATION FLOW TEST")
    print("=" * 80)
    print()
    
    # Step 1: Login as manager
    print("📝 Step 1: Login as manager...")
    manager_email = input("Enter manager email: ").strip()
    manager_password = input("Enter manager password: ").strip()
    manager_token = await login(manager_email, manager_password)
    
    if not manager_token:
        print("❌ Cannot proceed without manager login")
        return
    
    print()
    
    # Step 2: Check superadmin users
    print("📝 Step 2: Checking superadmin users...")
    superadmins = await get_users_by_role(manager_token, "super_admin")
    print(f"   Found {len(superadmins)} superadmin(s)")
    if superadmins:
        for sa in superadmins[:3]:
            print(f"   - {sa.get('email')} (ID: {sa.get('_id') or sa.get('id')})")
    print()
    
    # Step 3: Check admin users
    print("📝 Step 3: Checking admin users...")
    admins = await get_users_by_role(manager_token, "admin")
    print(f"   Found {len(admins)} admin(s)")
    if admins:
        for admin in admins[:3]:
            print(f"   - {admin.get('email')} (ID: {admin.get('_id') or admin.get('id')})")
    print()
    
    # Step 4: Get or create customer
    print("📝 Step 4: Getting/creating test customer...")
    customers = await get_customers(manager_token)
    if customers:
        customer = customers[0] if isinstance(customers, list) else customers.get('items', [{}])[0]
        print(f"   Using existing customer: {customer.get('email')}")
    else:
        customer = await create_customer(manager_token)
        if not customer:
            print("❌ Cannot proceed without customer")
            return
    
    customer_id = customer.get('_id') or customer.get('id')
    print(f"   Customer ID: {customer_id}")
    print()
    
    # Step 5: Get products
    print("📝 Step 5: Getting products...")
    products = await get_products(manager_token)
    product_id = None
    if products:
        product = products[0]
        product_id = product.get('_id') or product.get('id')
        print(f"   Using product: {product.get('name')} (ID: {product_id})")
    else:
        print(f"   ⚠️  No products found, will use test product ID")
    print()
    
    # Step 6: Create order
    print("📝 Step 6: Creating order as manager...")
    order = await create_order(manager_token, customer_id, product_id)
    if not order:
        print("❌ Cannot proceed without order")
        return
    print()
    
    # Step 7: Wait a moment for notifications to be created
    print("⏳ Waiting 3 seconds for notifications to be processed...")
    await asyncio.sleep(3)
    print()
    
    # Step 8: Check notifications for superadmins
    print("📝 Step 7: Checking notifications for superadmins...")
    if superadmins:
        for sa in superadmins:
            user_id = sa.get('_id') or sa.get('id')
            notifications = await get_notifications_for_user(manager_token, user_id)
            print(f"   Superadmin {sa.get('email')}:")
            if notifications:
                print(f"   ✅ Has {len(notifications)} notification(s)")
                for notif in notifications[:3]:
                    print(f"      - {notif.get('title')}")
                    print(f"        {notif.get('message')}")
            else:
                print(f"   ❌ No notifications found!")
    print()
    
    # Step 9: Check notifications for admins
    if admins:
        print("📝 Step 8: Checking notifications for admins...")
        for admin in admins[:2]:
            user_id = admin.get('_id') or admin.get('id')
            notifications = await get_notifications_for_user(manager_token, user_id)
            print(f"   Admin {admin.get('email')}:")
            if notifications:
                print(f"   ✅ Has {len(notifications)} notification(s)")
                for notif in notifications[:2]:
                    print(f"      - {notif.get('title')}")
            else:
                print(f"   ❌ No notifications found!")
        print()
    
    # Step 10: Check sales service logs
    print("📝 Step 9: Checking sales service logs...")
    print("   Run this command to see logs:")
    print(f"   docker-compose logs sales-service | grep -A 5 -B 5 '{order.get('order_number')}'")
    print()
    
    print("=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(main())

