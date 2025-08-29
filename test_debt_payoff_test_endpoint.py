#!/usr/bin/env python3
"""
Test script to test the debt payoff test endpoint
"""

import requests
import json

def test_debt_payoff_test_endpoint():
    """Test the debt payoff test endpoint"""
    
    print("🔍 Testing Debt Payoff Test Endpoint...")
    
    # Test debt payoff calculation without authentication
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
    
    try:
        response = requests.post(
            'http://localhost:8000/api/mongodb/debt-planner-test/',
            json=debt_payoff_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Debt Payoff Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Debt payoff calculated successfully!")
            print(f"   Total months: {data.get('months', 'N/A')}")
            print(f"   Total interest: ${data.get('total_interest', 'N/A')}")
            print(f"   Hit max months: {data.get('hit_max_months', 'N/A')}")
            
            # Show first few months of the plan
            plan = data.get('plan', [])
            if plan:
                print(f"\nFirst 3 months of debt payoff plan:")
                for i, month_plan in enumerate(plan[:3]):
                    print(f"Month {i}: {month_plan}")
        else:
            print(f"❌ Debt payoff failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_debt_payoff_test_endpoint() 