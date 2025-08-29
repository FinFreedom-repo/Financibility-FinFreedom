#!/usr/bin/env python3
"""
Test to simulate the exact API call the frontend makes
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_frontend_api_call():
    """Test the exact API call the frontend makes"""
    print("🔍 Testing Frontend API Call...")
    print("=" * 60)
    
    # This is the exact endpoint the frontend calls
    endpoint = f"{BASE_URL}/api/mongodb/budgets/test/"
    
    print(f"📡 Making request to: {endpoint}")
    
    try:
        response = requests.get(endpoint)
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            budgets = data.get('budgets', [])
            
            print(f"📊 Total budgets received: {len(budgets)}")
            
            # Check specifically for June, July, August 2026
            target_months = [
                (6, 2026, "June 2026"),
                (7, 2026, "July 2026"), 
                (8, 2026, "August 2026")
            ]
            
            print("\n🔍 Checking target months:")
            for month, year, label in target_months:
                budget = next((b for b in budgets if b['month'] == month and b['year'] == year), None)
                
                if budget:
                    total_income = budget.get('income', 0) + budget.get('additional_income', 0)
                    total_expenses = sum(budget.get('expenses', {}).values())
                    total_savings = sum(item.get('amount', 0) for item in budget.get('savings_items', []))
                    net_savings = total_income - total_expenses + total_savings
                    
                    print(f"✅ {label} ({month}/{year}):")
                    print(f"   Income: ${total_income}")
                    print(f"   Expenses: ${total_expenses}")
                    print(f"   Savings: ${total_savings}")
                    print(f"   Net Savings: ${net_savings}")
                    print(f"   Raw budget: {json.dumps(budget, indent=2)}")
                else:
                    print(f"❌ {label} ({month}/{year}): NOT FOUND")
            
            # Check if there are any issues with the data structure
            print("\n🔍 Checking data structure issues:")
            for budget in budgets:
                if budget.get('month') in [6, 7, 8] and budget.get('year') == 2026:
                    print(f"   {budget['month']}/2026 - Raw income: {budget.get('income')}, additional_income: {budget.get('additional_income')}")
                    print(f"   {budget['month']}/2026 - Expenses keys: {list(budget.get('expenses', {}).keys())}")
                    print(f"   {budget['month']}/2026 - Savings items: {budget.get('savings_items', [])}")
            
        else:
            print(f"❌ API call failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error making API call: {e}")

if __name__ == "__main__":
    test_frontend_api_call() 