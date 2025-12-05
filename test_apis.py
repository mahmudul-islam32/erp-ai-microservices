#!/usr/bin/env python3
"""
Test script to verify sales API endpoints directly
This will help identify what's actually being returned
"""
import requests
import json
from datetime import date
import sys

# Configuration
SALES_API = "http://localhost:8003/api/v1"
AUTH_API = "http://localhost:8001/api/v1/auth"

def get_auth_token():
    """Get auth token - you'll need to provide credentials"""
    print("=" * 60)
    print("🔐 AUTHENTICATION REQUIRED")
    print("=" * 60)
    print("\nTo test the APIs, I need an auth token.")
    print("Please provide your email and password, or an existing JWT token.")
    print("\nOption 1: Login credentials")
    email = input("Email: ")
    password = input("Password: ")
    
    try:
        response = requests.post(
            f"{AUTH_API}/login",
            json={"email": email, "password": password},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"\n✅ Login successful!")
            return token
        else:
            print(f"\n❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"\n❌ Error logging in: {e}")
        return None

def test_analytics_dashboard(token: str, start_date: str, end_date: str):
    """Test analytics dashboard endpoint"""
    url = f"{SALES_API}/analytics/dashboard"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"start_date": start_date, "end_date": end_date}
    
    print(f"\n📊 Testing Analytics Dashboard:")
    print(f"   URL: {url}")
    print(f"   Params: start_date={start_date}, end_date={end_date}")
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"\n   Response Summary:")
            summary = data.get("summary", {})
            print(f"      Total Revenue: ${summary.get('total_revenue', 0):,.2f}")
            print(f"      Total Orders: {summary.get('total_orders', 0)}")
            print(f"      Total Customers: {summary.get('total_customers', 0)}")
            return data
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None

def test_sales_orders(token: str, start_date: str = None, end_date: str = None, limit: int = 10):
    """Test sales orders endpoint"""
    url = f"{SALES_API}/sales_orders"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"limit": limit}
    
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    
    print(f"\n📦 Testing Sales Orders List:")
    print(f"   URL: {url}")
    print(f"   Params: {params}")
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            items = data.get("items", [])
            total = data.get("total", len(items))
            print(f"\n   Response:")
            print(f"      Total Orders: {total}")
            print(f"      Items Returned: {len(items)}")
            
            if items:
                print(f"\n   Sample Orders:")
                for i, order in enumerate(items[:5], 1):
                    print(f"      {i}. {order.get('order_number')} - ${order.get('total_amount', 0):,.2f} - {order.get('order_date', 'N/A')} - {order.get('customer_name', 'Unknown')}")
            
            return data
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None

def test_order_by_number(token: str, order_number: str):
    """Test get order by order number"""
    url = f"{SALES_API}/sales_orders/number/{order_number}"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n📋 Testing Order by Number:")
    print(f"   URL: {url}")
    print(f"   Order Number: {order_number}")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"\n   Order Details:")
            print(f"      Order Number: {data.get('order_number')}")
            print(f"      Customer: {data.get('customer_name', 'Unknown')}")
            print(f"      Total Amount: ${data.get('total_amount', 0):,.2f}")
            print(f"      Status: {data.get('status')}")
            print(f"      Date: {data.get('order_date')}")
            print(f"      Line Items: {len(data.get('line_items', []))}")
            return data
        elif response.status_code == 404:
            print(f"   ❌ Order not found: {order_number}")
            return None
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None

def test_orders_by_customer_search(token: str, search_term: str):
    """Test orders search by customer name"""
    url = f"{SALES_API}/sales_orders"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"search": search_term, "limit": 20}
    
    print(f"\n🔍 Testing Orders Search:")
    print(f"   URL: {url}")
    print(f"   Search Term: '{search_term}'")
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            total = data.get("total", len(items))
            print(f"   ✅ Success!")
            print(f"\n   Response:")
            print(f"      Total Orders Found: {total}")
            print(f"      Items Returned: {len(items)}")
            
            if items:
                print(f"\n   Orders Found:")
                for i, order in enumerate(items[:5], 1):
                    print(f"      {i}. {order.get('order_number')} - Customer: {order.get('customer_name', 'Unknown')} - ${order.get('total_amount', 0):,.2f}")
            else:
                print(f"   ⚠️  No orders found for search term '{search_term}'")
            
            return data
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None

if __name__ == "__main__":
    print("=" * 60)
    print("Sales API Test Script")
    print("=" * 60)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("\n❌ Cannot proceed without authentication token")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("TESTING NOVEMBER SALES DATA")
    print("=" * 60)
    
    # Test dates for November 2025
    start_date = "2025-11-01"
    end_date = "2025-11-30"
    
    # Test 1: Analytics Dashboard for November
    analytics_data = test_analytics_dashboard(token, start_date, end_date)
    
    # Test 2: Sales Orders List for November
    orders_data = test_sales_orders(token, start_date, end_date, limit=20)
    
    print("\n" + "=" * 60)
    print("TESTING ORDER DETAILS")
    print("=" * 60)
    
    # Test 3: Get order by number (if we have orders)
    if orders_data and orders_data.get("items"):
        first_order = orders_data["items"][0]
        order_number = first_order.get("order_number")
        if order_number:
            test_order_by_number(token, order_number)
    
    # Test 4: Search orders by customer name
    if orders_data and orders_data.get("items"):
        first_order = orders_data["items"][0]
        customer_name = first_order.get("customer_name")
        if customer_name:
            test_orders_by_customer_search(token, customer_name)
    
    print("\n" + "=" * 60)
    print("✅ Testing Complete!")
    print("=" * 60)

