#!/usr/bin/env python3
"""
Debug script to check exactly what data the frontend is receiving for June, July, and August 2026
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

def debug_june_july_august_2026():
    """Debug specifically June, July, August 2026 data"""
    print("🔍 DEBUGGING: June, July, August 2026 Data")
    print("=" * 60)
    
    # Get all budgets from MongoDB
    response = requests.get(f"{BASE_URL}/api/mongodb/budgets/test/")
    budgets = response.json().get('budgets', [])
    
    print(f"📊 Total budgets in MongoDB: {len(budgets)}")
    
    # Check specifically for June, July, August 2026
    target_months = [
        (6, 2026, "June 2026"),
        (7, 2026, "July 2026"), 
        (8, 2026, "August 2026")
    ]
    
    for month, year, label in target_months:
        budget = next((b for b in budgets if b['month'] == month and b['year'] == year), None)
        
        if budget:
            total_income = budget.get('income', 0) + budget.get('additional_income', 0)
            total_expenses = sum(budget.get('expenses', {}).values())
            total_savings = sum(item.get('amount', 0) for item in budget.get('savings_items', []))
            net_savings = total_income - total_expenses + total_savings
            
            print(f"✅ {label} ({month}/{year}):")
            print(f"   Income: ${budget.get('income', 0)}")
            print(f"   Additional Income: ${budget.get('additional_income', 0)}")
            print(f"   Total Income: ${total_income}")
            print(f"   Total Expenses: ${total_expenses}")
            print(f"   Total Savings: ${total_savings}")
            print(f"   Net Savings: ${net_savings}")
            print(f"   Budget Object: {budget}")
        else:
            print(f"❌ {label} ({month}/{year}): NO BUDGET FOUND")
    
    print("\n" + "=" * 60)
    print("🔍 Checking all budgets for 2026:")
    
    # List all 2026 budgets
    budgets_2026 = [b for b in budgets if b['year'] == 2026]
    for budget in budgets_2026:
        total_income = budget.get('income', 0) + budget.get('additional_income', 0)
        print(f"   {budget['month']}/2026 - Income: ${total_income}")
    
    print(f"\n📊 Total 2026 budgets: {len(budgets_2026)}")
    
    # Check if there are any "effectively empty" budgets
    print("\n🔍 Checking for effectively empty budgets:")
    for budget in budgets:
        total_income = budget.get('income', 0) + budget.get('additional_income', 0)
        total_expenses = sum(budget.get('expenses', {}).values())
        total_savings = sum(item.get('amount', 0) for item in budget.get('savings_items', []))
        
        if total_income == 0 and total_expenses == 0 and total_savings == 0:
            print(f"   ⚠️  Effectively empty budget: {budget['month']}/{budget['year']}")
    
    # Test the frontend's loadBudgetData logic
    print("\n🔍 Testing Frontend's loadBudgetData Logic:")
    current_month, current_year = get_current_month_year()
    current_month_budget = next((b for b in budgets if b['month'] == current_month and b['year'] == current_year), None)
    
    if current_month_budget:
        print(f"✅ Current month budget found: {current_month}/{current_year}")
        current_income = current_month_budget.get('income', 0) + current_month_budget.get('additional_income', 0)
        print(f"   Current month income: ${current_income}")
        
        # Simulate the frontend's logic for June, July, August 2026
        for month, year, label in target_months:
            existing_budget = next((b for b in budgets if b['month'] == month and b['year'] == year), None)
            
            if existing_budget:
                total_income = existing_budget.get('income', 0) + existing_budget.get('additional_income', 0)
                total_expenses = sum(existing_budget.get('expenses', {}).values())
                total_savings = sum(item.get('amount', 0) for item in existing_budget.get('savings_items', []))
                is_effectively_empty = total_income == 0 and total_expenses == 0 and total_savings == 0
                
                if is_effectively_empty:
                    print(f"   ⚠️  {label}: Found budget but effectively empty - should use current month fallback")
                else:
                    print(f"   ✅ {label}: Found budget with data - should use existing data")
            else:
                print(f"   ⚠️  {label}: No budget found - should use current month fallback")
    else:
        print(f"❌ No current month budget found for {current_month}/{current_year}")

if __name__ == "__main__":
    debug_june_july_august_2026() 