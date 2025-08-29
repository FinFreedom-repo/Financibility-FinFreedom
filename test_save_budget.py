#!/usr/bin/env python3
"""
Test script to test the new save budget test endpoint
"""

import requests
import json

def test_save_budget():
    """Test the new save budget test endpoint"""
    
    print("🔍 Testing Save Budget Test Endpoint...")
    
    # Test saving a budget without authentication
    test_budget = {
        "month": 9,
        "year": 2025,
        "income": 15000,  # Updated income
        "additional_income": 0,
        "expenses": {
            "housing": 30,
            "transportation": 30,
            "food": 30,
            "healthcare": 30,
            "entertainment": 30,
            "shopping": 30,
            "travel": 30,
            "education": 30,
            "utilities": 30,
            "childcare": 30,
            "debt_payments": 30,
            "others": 30
        },
        "additional_items": [],
        "savings_items": [
            {"name": "Emergency", "amount": 230}
        ]
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/mongodb/budgets/save-month-test/',
            json=test_budget,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Save Status: {response.status_code}")
        if response.status_code in [200, 201]:
            print("✅ Budget saved successfully!")
            print(f"Response: {response.json()}")
            
            # Now test getting the updated budget
            print("\n🔍 Testing GET updated budget...")
            response = requests.get('http://localhost:8000/api/mongodb/budgets/test/')
            if response.status_code == 200:
                data = response.json()
                budgets = data.get('budgets', [])
                
                # Find the updated budget
                for budget in budgets:
                    if budget.get('month') == 9 and budget.get('year') == 2025:
                        print(f"✅ Found updated budget for 9/2025:")
                        print(f"   Income: ${budget.get('income', 0)}")
                        print(f"   Additional Income: ${budget.get('additional_income', 0)}")
                        print(f"   Total Income: ${budget.get('income', 0) + budget.get('additional_income', 0)}")
                        break
        else:
            print(f"❌ Save failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_save_budget() 