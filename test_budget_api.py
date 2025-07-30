#!/usr/bin/env python3
"""
Test script for the Budget API endpoints
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000/api"

def test_budget_endpoints():
    """Test the budget API endpoints"""
    
    print("=== Testing Budget API Endpoints ===\n")
    
    # Test 1: Get current month budget
    print("1. Testing GET /api/budgets/ (current month budget)")
    try:
        response = requests.get(f"{BASE_URL}/budgets/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Data: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    print()
    
    # Test 2: Create/Update current month budget
    print("2. Testing POST /api/budgets/update-current/ (create/update current month)")
    try:
        current_date = datetime.now()
        budget_data = {
            "income": 5000.0,
            "housing": 1500.0,
            "transportation": 300.0,
            "food": 400.0,
            "healthcare": 200.0,
            "entertainment": 300.0,
            "shopping": 200.0,
            "travel": 100.0,
            "education": 0.0,
            "utilities": 150.0,
            "childcare": 0.0,
            "other": 100.0,
            "additional_items": [],
            "savings_items": []
        }
        
        response = requests.post(f"{BASE_URL}/budgets/update-current/", json=budget_data)
        print(f"Status: {response.status_code}")
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"Data: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    print()
    
    # Test 3: Get all budgets (debug endpoint)
    print("3. Testing GET /api/budgets/all-budgets/ (all budgets)")
    try:
        response = requests.get(f"{BASE_URL}/budgets/all-budgets/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Data: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    print()
    
    # Test 4: Get specific month budget
    print("4. Testing GET /api/budgets/get-month/ (specific month)")
    try:
        current_date = datetime.now()
        params = {
            "month": current_date.month,
            "year": current_date.year
        }
        response = requests.get(f"{BASE_URL}/budgets/get-month/", params=params)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Data: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    print()
    
    # Test 5: Update specific month budget
    print("5. Testing POST /api/budgets/update-month/ (specific month)")
    try:
        current_date = datetime.now()
        budget_data = {
            "month": current_date.month,
            "year": current_date.year,
            "income": 6000.0,
            "housing": 1600.0,
            "transportation": 350.0,
            "food": 450.0,
            "healthcare": 250.0,
            "entertainment": 350.0,
            "shopping": 250.0,
            "travel": 150.0,
            "education": 0.0,
            "utilities": 175.0,
            "childcare": 0.0,
            "other": 125.0,
            "additional_items": [],
            "savings_items": []
        }
        
        response = requests.post(f"{BASE_URL}/budgets/update-month/", json=budget_data)
        print(f"Status: {response.status_code}")
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"Data: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    print()

if __name__ == "__main__":
    test_budget_endpoints() 