#!/usr/bin/env python3
"""
Test script to verify sales API endpoints directly
"""
import requests
import json
from datetime import date, datetime
import sys

# Configuration
BASE_URL = "http://localhost:8003"
SALES_API = f"{BASE_URL}/api/v1"

def get_auth_token():
    """Get auth token - you'll need to update this with actual credentials"""
    # TODO: Get actual token from login
    # For now, we'll need to get it manually
    print("⚠️  You need to provide an auth token")
    print("   1. Login to the ERP frontend")
    print("   2. Get the JWT token from browser localStorage")
    print("   3. Update this script with the token")
    return None

def test_analytics_dashboard(token: str, start_date: str = None, end_date: str = None):
    """Test analytics dashboard endpoint"""
    url = f"{SALES_API}/analytics/dashboard"
    headers = {"Authorization": f"Bearer {token}"}
    params = {}
    
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    
    print(f"\n📊 Testing Analytics Dashboard:")
    print(f"   URL: {url}")
    print(f"   Params: {params}")
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"\n   Response:")
            print(json.dumps(data, indent=2))
            return data
        else:
            print(f"   ❌ Error: {response.text}")
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
    
    print(f"\n📦 Testing Sales Orders:")
    print(f"   URL: {url}")
    print(f"   Params: {params}")
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"\n   Total Orders: {data.get('total', 0)}")
            print(f"   Items Returned: {len(data.get('items', []))}")
            
            if data.get('items'):
                print(f"\n   Sample Orders:")
                for i, order in enumerate(data['items'][:3], 1):
                    print(f"   {i}. {order.get('order_number')} - ${order.get('total_amount', 0)} - {order.get('order_date')} - {order.get('status')}")
            
            return data
        else:
            print(f"   ❌ Error: {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None

if __name__ == "__main__":
    print("=" * 60)
    print("Sales API Test Script")
    print("=" * 60)
    
    # Check if token provided
    if len(sys.argv) > 1:
        token = sys.argv[1]
    else:
        token = get_auth_token()
        if not token:
            print("\nUsage: python test_sales_api.py <auth_token>")
            sys.exit(1)
    
    # Test dates
    today = date.today()
    start_date = today.replace(day=1).isoformat()  # First of month
    end_date = today.isoformat()
    
    print(f"\nTesting with date range: {start_date} to {end_date}")
    
    # Test 1: Analytics Dashboard
    analytics_data = test_analytics_dashboard(token, start_date, end_date)
    
    # Test 2: Sales Orders List
    orders_data = test_sales_orders(token, start_date, end_date, limit=20)
    
    # Test 3: No date restrictions
    print(f"\n{'='*60}")
    print("Testing without date restrictions:")
    analytics_all = test_analytics_dashboard(token)
    orders_all = test_sales_orders(token, limit=20)
    
    print(f"\n{'='*60}")
    print("✅ Testing Complete!")

