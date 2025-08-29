#!/usr/bin/env python3
"""
Test script to simulate frontend requests and check integration
"""

import requests
import json

def test_frontend_integration():
    """Test frontend integration with MongoDB"""
    
    print("🔍 Testing Frontend Integration...")
    
    # 1. Test getting all budgets (like the frontend does)
    print("\n1. Testing GET /api/mongodb/budgets/test/")
    try:
        response = requests.get('http://localhost:8000/api/mongodb/budgets/test/')
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            budgets = data.get('budgets', [])
            print(f"✅ Found {len(budgets)} budgets")
            
            # Show current month budget
            current_month = 8  # August 2025
            current_year = 2025
            current_budget = None
            
            for budget in budgets:
                if budget.get('month') == current_month and budget.get('year') == current_year:
                    current_budget = budget
                    break
            
            if current_budget:
                print(f"✅ Current month budget (8/2025):")
                print(f"   Income: ${current_budget.get('income', 0)}")
                print(f"   Additional Income: ${current_budget.get('additional_income', 0)}")
                print(f"   Total Income: ${current_budget.get('income', 0) + current_budget.get('additional_income', 0)}")
                print(f"   Expenses: {current_budget.get('expenses', {})}")
            else:
                print("❌ Current month budget not found")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 2. Test saving a budget (simulate frontend save)
    print("\n2. Testing Budget Save (simulating frontend)")
    try:
        # Simulate what the frontend sends
        test_budget = {
            "month": 9,
            "year": 2025,
            "income": 12000,  # Updated income
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
        
        # Note: This will fail due to authentication, but let's see the response
        response = requests.post(
            'http://localhost:8000/api/mongodb/budgets/save-month/',
            json=test_budget,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Save Status: {response.status_code}")
        if response.status_code in [200, 201]:
            print("✅ Budget saved successfully!")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Save failed (expected due to auth): {response.text}")
            
    except Exception as e:
        print(f"❌ Save error: {e}")
    
    # 3. Test the debt payoff endpoint
    print("\n3. Testing Debt Payoff Endpoint")
    try:
        # Simulate debt payoff request
        debt_payoff_data = {
            "debts": [
                {
                    "name": "Credit Card 1",
                    "balance": 5000,
                    "rate": 0.15,
                    "debt_type": "credit_card"
                },
                {
                    "name": "Student Loan",
                    "balance": 15000,
                    "rate": 0.05,
                    "debt_type": "student_loan"
                }
            ],
            "strategy": "snowball",
            "monthly_budget_data": [
                {"month": 1, "net_savings": 3300},
                {"month": 2, "net_savings": 10800},
                {"month": 3, "net_savings": 6570},
                {"month": 4, "net_savings": 9770},
                {"month": 5, "net_savings": 4770}
            ]
        }
        
        response = requests.post(
            'http://localhost:8000/api/mongodb/debt-planner/',
            json=debt_payoff_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Debt Payoff Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Debt payoff calculated successfully!")
            print(f"Total months: {data.get('months', 'N/A')}")
            print(f"Total interest: ${data.get('total_interest', 'N/A')}")
            print(f"Hit max months: {data.get('hit_max_months', 'N/A')}")
        else:
            print(f"❌ Debt payoff failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Debt payoff error: {e}")

if __name__ == "__main__":
    test_frontend_integration() 