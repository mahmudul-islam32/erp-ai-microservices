#!/usr/bin/env python3
"""
Test script to verify the frontend API integration works correctly
Tests the corrected pagination parameter conversion
"""

import requests
import json

def test_api_integration():
    """Test that the API works with the corrected pagination parameters"""
    
    # Login to get cookies
    session = requests.Session()
    login_response = session.post(
        "http://localhost:8001/api/v1/auth/login",
        json={"email": "admin@erp.com", "password": "admin123"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return False
    
    print("✅ Login successful")
    
    # Test scenarios that the frontend would use
    test_scenarios = [
        {"description": "First page (page=1, limit=5)", "skip": 0, "limit": 5},
        {"description": "Second page (page=2, limit=5)", "skip": 5, "limit": 5},
        {"description": "Third page (page=3, limit=10)", "skip": 20, "limit": 10},
        {"description": "Last few customers", "skip": 45, "limit": 10},
    ]
    
    print("\n📊 Testing pagination scenarios:")
    
    for scenario in test_scenarios:
        response = session.get(
            "http://localhost:8003/api/v1/customers/",
            params={"skip": scenario["skip"], "limit": scenario["limit"]}
        )
        
        if response.status_code == 200:
            customers = response.json()
            print(f"✅ {scenario['description']}: Retrieved {len(customers)} customers")
            
            if customers:
                first_customer = customers[0]
                print(f"   First customer: {first_customer['first_name']} {first_customer['last_name']} ({first_customer['company_name']})")
        else:
            print(f"❌ {scenario['description']}: Failed with status {response.status_code}")
    
    # Test analytics endpoint
    print("\n📈 Testing analytics endpoint:")
    analytics_response = session.get("http://localhost:8003/api/v1/analytics/dashboard")
    
    if analytics_response.status_code == 200:
        analytics = analytics_response.json()
        print(f"✅ Analytics dashboard: {analytics['summary']['total_customers']} customers in system")
        print(f"   Total revenue: ${analytics['summary']['total_revenue']}")
        print(f"   Total orders: {analytics['summary']['total_orders']}")
    else:
        print(f"❌ Analytics failed: {analytics_response.status_code}")
    
    print("\n🎉 All API tests completed!")
    return True

if __name__ == "__main__":
    test_api_integration()
