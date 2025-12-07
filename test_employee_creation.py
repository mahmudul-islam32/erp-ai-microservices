#!/usr/bin/env python3
"""Test script to create an employee via HRM API"""

import requests
import json
from datetime import date, datetime

HRM_SERVICE_URL = "http://localhost:8007/api/v1"

def test_create_employee():
    """Test creating an employee"""
    
    # Sample employee data matching the EmployeeCreate model
    employee_data = {
        "employee_id": "EMP001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1-555-123-4567",
        "date_of_birth": "1990-01-15",
        "gender": "male",
        "address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "United States"
        },
        "emergency_contact": {
            "name": "Jane Doe",
            "relationship": "Spouse",
            "phone": "+1-555-123-4568",
            "email": "jane.doe@example.com"
        },
        "position": "Software Engineer",
        "department": "IT",
        "employment_type": "full_time",
        "start_date": "2024-01-01",
        "salary": 75000.0,
        "skills": ["Python", "JavaScript", "React"],
        "certifications": ["AWS Certified"],
        "notes": "Test employee"
    }
    
    print("Testing employee creation...")
    print(f"URL: {HRM_SERVICE_URL}/employees")
    print(f"Data: {json.dumps(employee_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{HRM_SERVICE_URL}/employees",
            json=employee_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            print("\n✅ Employee created successfully!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            try:
                error_data = response.json()
                print(f"Error Details: {json.dumps(error_data, indent=2)}")
            except:
                pass
                
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Could not connect to HRM service")
        print("Make sure the HRM service is running on http://localhost:8007")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_create_employee()

