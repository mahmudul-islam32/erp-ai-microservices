#!/usr/bin/env python3
"""
Script to create a payroll record via command line
"""
import requests
import json
import sys

HRM_SERVICE_URL = "http://localhost:8007"

def create_payroll(employee_id, pay_period_start, pay_period_end, basic_salary, overtime_hours=0, bonus=0):
    """Create a payroll record"""
    url = f"{HRM_SERVICE_URL}/api/v1/payroll"
    
    payload = {
        "employee_id": employee_id,
        "pay_period_start": pay_period_start,
        "pay_period_end": pay_period_end,
        "basic_salary": basic_salary,
        "overtime_hours": overtime_hours,
        "bonus": bonus,
        "notes": f"Payroll created via command line for period {pay_period_start} to {pay_period_end}"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error creating payroll: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None

if __name__ == "__main__":
    # Default values
    employee_id = "EMP001"
    pay_period_start = "2024-03-01"
    pay_period_end = "2024-03-15"
    basic_salary = 6250.0
    overtime_hours = 5.0
    bonus = 500.0
    
    # Allow command line arguments
    if len(sys.argv) > 1:
        employee_id = sys.argv[1]
    if len(sys.argv) > 2:
        pay_period_start = sys.argv[2]
    if len(sys.argv) > 3:
        pay_period_end = sys.argv[3]
    if len(sys.argv) > 4:
        basic_salary = float(sys.argv[4])
    
    print(f"Creating payroll for employee {employee_id}...")
    result = create_payroll(employee_id, pay_period_start, pay_period_end, basic_salary, overtime_hours, bonus)
    
    if result:
        print("✅ Payroll created successfully!")
        print(json.dumps(result, indent=2, default=str))
    else:
        print("❌ Failed to create payroll")
        sys.exit(1)
