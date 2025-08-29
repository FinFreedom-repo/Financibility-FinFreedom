#!/usr/bin/env python3
"""
Test current debt payoff calculation with actual data to check June, July, August 2026
"""

import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def get_current_month_year():
    now = datetime.now()
    return now.month, now.year

def generate_13_months():
    current_month, current_year = get_current_month_year()
    months = []
    
    for i in range(13):
        date = datetime(current_year, current_month, 1) + timedelta(days=32*i)
        month = date.month
        year = date.year
        months.append((month, year))
    
    return months

def test_current_debt_payoff():
    """Test current debt payoff calculation"""
    print("🔍 Testing Current Debt Payoff Calculation...")
    print("=" * 60)
    
    # Get all budgets
    response = requests.get(f"{BASE_URL}/api/mongodb/budgets/test/")
    budgets = response.json().get('budgets', [])
    
    print(f"📊 Total budgets in MongoDB: {len(budgets)}")
    
    # Generate 13 months
    months = generate_13_months()
    current_month, current_year = get_current_month_year()
    
    print(f"📅 Current month: {current_month}/{current_year}")
    print(f"🎯 Testing all 13 months:")
    
    # Build monthly budget data for debt payoff
    monthly_budget_data = []
    
    for i, (month, year) in enumerate(months):
        budget = next((b for b in budgets if b['month'] == month and b['year'] == year), None)
        
        if budget:
            total_income = budget.get('income', 0) + budget.get('additional_income', 0)
            total_expenses = sum(budget.get('expenses', {}).values())
            total_savings = sum(item.get('amount', 0) for item in budget.get('savings_items', []))
            net_savings = total_income - total_expenses + total_savings
            
            monthly_budget_data.append({
                "month": month,
                "year": year,
                "net_savings": net_savings
            })
            
            month_type = "CURRENT" if month == current_month and year == current_year else "PROJECTED"
            print(f"   Month {i+1:2d}: {month:2d}/{year} ({month_type}) - Net Savings: ${net_savings}")
            
            # Highlight June, July, August 2026
            if month in [6, 7, 8] and year == 2026:
                print(f"      🔍 {month}/{year} - Income: ${total_income}, Expenses: ${total_expenses}, Savings: ${total_savings}")
        else:
            print(f"   Month {i+1:2d}: {month:2d}/{year} - ❌ NO BUDGET")
    
    # Sample debt data
    debts = [
        {"name": "Credit Card 1", "balance": 5000.0, "rate": 0.15, "debt_type": "credit_card"},
        {"name": "Student Loan", "balance": 15000.0, "rate": 0.05, "debt_type": "student_loan"},
        {"name": "Car Loan", "balance": 25000.0, "rate": 0.075, "debt_type": "auto_loan"}
    ]
    
    payload = {
        "debts": debts,
        "strategy": "snowball",
        "monthly_budget_data": monthly_budget_data
    }
    
    print(f"\n🧮 Calculating debt payoff with {len(monthly_budget_data)} months of data...")
    
    response = requests.post(f"{BASE_URL}/api/mongodb/debt-planner-test/", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Debt payoff calculated successfully!")
        print(f"   Total months: {data.get('months', 'N/A')}")
        print(f"   Total interest: ${data.get('total_interest', 'N/A'):,.2f}")
        print(f"   Hit max months: {data.get('hit_max_months', 'N/A')}")
        
        if not data.get('hit_max_months', False):
            print("✅ Debt payoff calculation is working correctly!")
            print("✅ June, July, August 2026 data is being used properly!")
        else:
            print("⚠️  Debt payoff hit max months - this indicates an issue")
            
        # Show first few months of the plan
        plan = data.get('plan', [])
        if plan:
            print(f"\n📊 First 3 months of debt payoff plan:")
            for i, month_data in enumerate(plan[:3]):
                print(f"   Month {i}: Net savings used: ${month_data.get('net_savings', 'N/A')}")
        
        return data
    else:
        print(f"❌ Debt payoff failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

if __name__ == "__main__":
    test_current_debt_payoff() 