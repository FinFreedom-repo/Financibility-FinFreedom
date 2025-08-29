#!/usr/bin/env python3
"""
Check current month's budget structure to compare with June, July, August 2026
"""

import requests
from datetime import datetime

BASE_URL = "http://localhost:8000"

def check_current_month_budget():
    """Check current month's budget structure"""
    print("🔍 Checking Current Month Budget Structure...")
    print("=" * 60)
    
    # Get current month and year
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    print(f"📅 Current month: {current_month}/{current_year}")
    
    # Get all budgets
    response = requests.get(f"{BASE_URL}/api/mongodb/budgets/test/")
    budgets = response.json().get('budgets', [])
    
    # Find current month budget
    current_budget = next((b for b in budgets if b['month'] == current_month and b['year'] == current_year), None)
    
    if current_budget:
        print(f"✅ Current month budget found: {current_month}/{current_year}")
        print(f"   Income: ${current_budget.get('income', 0)}")
        print(f"   Additional Income: ${current_budget.get('additional_income', 0)}")
        print(f"   Total Income: ${current_budget.get('income', 0) + current_budget.get('additional_income', 0)}")
        
        print(f"\n🔍 Current month expense fields:")
        expenses = current_budget.get('expenses', {})
        for key, value in expenses.items():
            print(f"   '{key}': {value}")
        
        print(f"\n🔍 Current month savings items:")
        savings = current_budget.get('savings_items', [])
        for item in savings:
            print(f"   {item.get('name')}: ${item.get('amount')}")
        
        # Now check June, July, August 2026 structure
        print(f"\n🔍 Comparing with June, July, August 2026:")
        target_months = [(6, 2026), (7, 2026), (8, 2026)]
        
        for month, year in target_months:
            budget = next((b for b in budgets if b['month'] == month and b['year'] == year), None)
            if budget:
                print(f"\n📊 {month}/{year} expense fields:")
                expenses = budget.get('expenses', {})
                for key, value in expenses.items():
                    print(f"   '{key}': {value}")
                
                # Check if any fields are missing in current month
                current_expense_keys = set(current_budget.get('expenses', {}).keys())
                target_expense_keys = set(budget.get('expenses', {}).keys())
                
                missing_in_current = target_expense_keys - current_expense_keys
                missing_in_target = current_expense_keys - target_expense_keys
                
                if missing_in_current:
                    print(f"   ⚠️  Fields in {month}/{year} but missing in current month: {missing_in_current}")
                if missing_in_target:
                    print(f"   ⚠️  Fields in current month but missing in {month}/{year}: {missing_in_target}")
                if not missing_in_current and not missing_in_target:
                    print(f"   ✅ Expense fields match between current month and {month}/{year}")
        
    else:
        print(f"❌ No current month budget found for {current_month}/{current_year}")

if __name__ == "__main__":
    check_current_month_budget() 