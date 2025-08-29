#!/usr/bin/env python3
"""
Test script to test debt payoff with authentication
"""

import requests
import json

def test_debt_payoff_auth():
    """Test debt payoff with authentication"""
    
    print("🔍 Testing Debt Payoff with Authentication...")
    
    # 1. Login to get token
    print("\n1. Getting authentication token...")
    try:
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        response = requests.post(
            'http://localhost:8000/api/mongodb/auth/mongodb/login/',
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access')
            print("✅ Login successful!")
            
            # 2. Test debt payoff with authentication
            print("\n2. Testing Debt Payoff...")
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Test debt payoff request
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
                headers=headers
            )
            
            print(f"Debt Payoff Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("✅ Debt payoff calculated successfully!")
                print(f"Total months: {data.get('months', 'N/A')}")
                print(f"Total interest: ${data.get('total_interest', 'N/A')}")
                print(f"Hit max months: {data.get('hit_max_months', 'N/A')}")
                
                # Show first few months of the plan
                plan = data.get('plan', [])
                if plan:
                    print(f"\nFirst 3 months of debt payoff plan:")
                    for i, month_plan in enumerate(plan[:3]):
                        print(f"Month {i}: {month_plan}")
            else:
                print(f"❌ Debt payoff failed: {response.text}")
                
        else:
            print(f"❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_debt_payoff_auth() 