#!/usr/bin/env python3
"""
Test to simulate the exact frontend logic for processing June, July, August 2026 data
"""

import requests
from datetime import datetime

BASE_URL = "http://localhost:8000"

def simulate_frontend_logic():
    """Simulate the exact frontend logic"""
    print("🔍 Simulating Frontend Logic for June, July, August 2026...")
    print("=" * 60)
    
    # Get current month and year
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    print(f"📅 Current month: {current_month}/{current_year}")
    
    # Get all budgets (simulate frontend API call)
    response = requests.get(f"{BASE_URL}/api/mongodb/budgets/test/")
    budgets = response.json().get('budgets', [])
    
    # Find current month budget (simulate frontend logic)
    current_month_budget = next((b for b in budgets if b['month'] == current_month and b['year'] == current_year), None)
    
    if not current_month_budget:
        print(f"❌ No current month budget found for {current_month}/{current_year}")
        return
    
    print(f"✅ Current month budget found: {current_month}/{current_year}")
    
    # Simulate frontend's isBudgetEffectivelyEmpty function
    def is_budget_effectively_empty(budget):
        total_income = (budget.get('income', 0) or 0) + (budget.get('additional_income', 0) or 0)
        total_expenses = sum(budget.get('expenses', {}).values()) if budget.get('expenses') else 0
        total_savings = sum(item.get('amount', 0) for item in budget.get('savings_items', [])) if budget.get('savings_items') else 0
        return total_income == 0 and total_expenses == 0 and total_savings == 0
    
    # Simulate frontend's generateGridDataWithEditableMonths logic
    print(f"\n🔍 Simulating generateGridDataWithEditableMonths logic:")
    
    # Create expense categories from current month (simulate frontend logic)
    expense_categories = []
    if current_month_budget.get('expenses'):
        for key, value in current_month_budget['expenses'].items():
            category_name = key[0].upper() + key[1:].replace('_', ' ')
            expense_categories.append({
                'name': category_name,
                'value': value,
                'type': 'expense'
            })
    
    print(f"📊 Created expense categories from current month:")
    for cat in expense_categories:
        print(f"   {cat['name']}: ${cat['value']}")
    
    # Test June, July, August 2026
    target_months = [(6, 2026, "June 2026"), (7, 2026, "July 2026"), (8, 2026, "August 2026")]
    
    for month, year, label in target_months:
        print(f"\n🔍 Testing {label} ({month}/{year}):")
        
        # Find existing budget (simulate frontend logic)
        existing_budget = next((b for b in budgets if b['month'] == month and b['year'] == year), None)
        
        if existing_budget:
            print(f"   ✅ Found existing budget")
            
            # Check if effectively empty
            is_empty = is_budget_effectively_empty(existing_budget)
            print(f"   Is effectively empty: {is_empty}")
            
            if not is_empty:
                print(f"   ✅ Should use existing budget data")
                
                # Simulate expense mapping
                total_income = existing_budget.get('income', 0) + existing_budget.get('additional_income', 0)
                print(f"   Income: ${total_income}")
                
                # Check expense mapping
                if existing_budget.get('expenses'):
                    print(f"   Expenses from {label}:")
                    for key, value in existing_budget['expenses'].items():
                        category_name = key[0].upper() + key[1:].replace('_', ' ')
                        print(f"     {key} -> {category_name}: ${value}")
                        
                        # Check if category exists in expense_categories
                        matching_category = next((cat for cat in expense_categories if cat['name'] == category_name), None)
                        if matching_category:
                            print(f"       ✅ Found matching category: {category_name}")
                        else:
                            print(f"       ❌ No matching category found for: {category_name}")
                
                # Calculate net savings
                total_expenses = sum(existing_budget.get('expenses', {}).values())
                total_savings = sum(item.get('amount', 0) for item in existing_budget.get('savings_items', []))
                net_savings = total_income - total_expenses + total_savings
                print(f"   Net Savings: ${net_savings}")
                
            else:
                print(f"   ⚠️  Budget is effectively empty, should use current month fallback")
        else:
            print(f"   ⚠️  No budget found, should use current month fallback")

if __name__ == "__main__":
    simulate_frontend_logic() 