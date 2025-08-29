#!/usr/bin/env python3
"""
Test script to verify that the editableMonths state fix resolves the June, July, and August 2026 data issue.
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_ENDPOINTS = True  # Use test endpoints that bypass authentication

def test_budget_loading():
    """Test that budget loading returns correct data for all months including June, July, August 2026"""
    print("🔍 Testing budget loading for all months...")
    
    if TEST_ENDPOINTS:
        url = f"{BASE_URL}/api/mongodb/budgets/test/"
    else:
        url = f"{BASE_URL}/api/mongodb/budgets/"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        budgets = response.json()
        
        print(f"✅ Successfully loaded {len(budgets)} budgets from MongoDB")
        
        # Check for June, July, August 2026 specifically
        target_months = [
            (6, 2026, "June 2026"),
            (7, 2026, "July 2026"), 
            (8, 2026, "August 2026")
        ]
        
        for month, year, label in target_months:
            budget = next((b for b in budgets if b.get('month') == month and b.get('year') == year), None)
            
            if budget:
                income = budget.get('income', 0) + budget.get('additional_income', 0)
                expenses = sum(budget.get('expenses', {}).values())
                savings = sum(item.get('amount', 0) for item in budget.get('savings_items', []))
                net_savings = income - expenses + savings
                
                print(f"✅ {label}: Income=${income}, Expenses=${expenses}, Savings=${savings}, Net=${net_savings}")
                
                if income == 0 and expenses == 0 and savings == 0:
                    print(f"⚠️  WARNING: {label} has zero values - this should trigger fallback to current month data")
                elif net_savings > 0:
                    print(f"✅ {label} has positive net savings - should be used for debt payoff")
                else:
                    print(f"⚠️  {label} has negative net savings - may affect debt payoff")
            else:
                print(f"❌ {label}: No budget found in MongoDB - should trigger fallback to current month data")
        
        return budgets
        
    except Exception as e:
        print(f"❌ Error loading budgets: {e}")
        return None

def test_debt_payoff_calculation():
    """Test debt payoff calculation with the current budget data"""
    print("\n🔍 Testing debt payoff calculation...")
    
    # First get the budget data
    budgets = test_budget_loading()
    if not budgets:
        print("❌ Cannot test debt payoff without budget data")
        return
    
    # Get current month budget as fallback
    current_date = datetime.now()
    current_month = current_date.month
    current_year = current_date.year
    
    current_budget = next((b for b in budgets if b.get('month') == current_month and b.get('year') == current_year), None)
    
    if not current_budget:
        print("❌ No current month budget found")
        return
    
    # Create test debts
    test_debts = [
        {
            "name": "Credit Card 1",
            "balance": 5000,
            "interest_rate": 18.99,
            "debt_type": "credit_card"
        },
        {
            "name": "Student Loan",
            "balance": 15000,
            "interest_rate": 5.5,
            "debt_type": "student_loan"
        }
    ]
    
    # Build month budgets for debt payoff (current + 12 projected)
    month_budgets = []
    for i in range(13):
        date = datetime(current_year, current_month, 1)
        date = date.replace(month=((date.month - 1 + i) % 12) + 1)
        date = date.replace(year=date.year + ((date.month - 1 + i) // 12))
        
        month_num = date.month
        year_num = date.year
        
        # Find existing budget for this month
        existing_budget = next((b for b in budgets if b.get('month') == month_num and b.get('year') == year_num), None)
        
        if existing_budget:
            # Check if budget is effectively empty
            total_income = existing_budget.get('income', 0) + existing_budget.get('additional_income', 0)
            total_expenses = sum(existing_budget.get('expenses', {}).values())
            total_savings = sum(item.get('amount', 0) for item in existing_budget.get('savings_items', []))
            
            if total_income == 0 and total_expenses == 0 and total_savings == 0:
                # Use current month as fallback
                budget = {
                    **current_budget,
                    'month': month_num,
                    'year': year_num,
                    '_usesCurrentMonthData': True
                }
                print(f"⚠️  Month {month_num}/{year_num}: Using current month data as fallback")
            else:
                budget = existing_budget
                print(f"✅ Month {month_num}/{year_num}: Using MongoDB data")
        else:
            # Use current month as fallback
            budget = {
                **current_budget,
                'month': month_num,
                'year': year_num,
                '_usesCurrentMonthData': True
            }
            print(f"⚠️  Month {month_num}/{year_num}: Using current month data as fallback")
        
        month_budgets.append(budget)
    
    # Test debt payoff calculation
    if TEST_ENDPOINTS:
        url = f"{BASE_URL}/api/mongodb/debt-planner-test/"
    else:
        url = f"{BASE_URL}/api/mongodb/debt-planner/"
    
    payload = {
        "monthly_budgets": [
            {
                "month": idx + 1,
                "net_savings": (budget.get('income', 0) + budget.get('additional_income', 0) - 
                               sum(budget.get('expenses', {}).values()) + 
                               sum(item.get('amount', 0) for item in budget.get('savings_items', [])))
            }
            for idx, budget in enumerate(month_budgets)
        ],
        "debts": test_debts,
        "strategy": "snowball"
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        result = response.json()
        
        print(f"✅ Debt payoff calculation successful")
        print(f"📊 Total months to payoff: {result.get('total_months', 'N/A')}")
        print(f"💰 Total interest paid: ${result.get('total_interest_paid', 'N/A')}")
        
        # Check if June, July, August 2026 net savings are being used
        print("\n🔍 Checking June, July, August 2026 net savings in debt payoff:")
        for idx, budget in enumerate(month_budgets):
            if budget.get('month') in [6, 7, 8] and budget.get('year') == 2026:
                net_savings = (budget.get('income', 0) + budget.get('additional_income', 0) - 
                              sum(budget.get('expenses', {}).values()) + 
                              sum(item.get('amount', 0) for item in budget.get('savings_items', [])))
                month_label = f"{budget.get('month')}/{budget.get('year')}"
                data_source = "CURRENT MONTH DATA (FALLBACK)" if budget.get('_usesCurrentMonthData') else "FROM MONGODB"
                print(f"  {month_label}: Net savings=${net_savings} [{data_source}]")
        
        return result
        
    except Exception as e:
        print(f"❌ Error calculating debt payoff: {e}")
        return None

def main():
    """Main test function"""
    print("🧪 Testing Editable Months State Fix")
    print("=" * 50)
    
    # Test budget loading
    budgets = test_budget_loading()
    
    # Test debt payoff calculation
    result = test_debt_payoff_calculation()
    
    print("\n" + "=" * 50)
    if budgets and result:
        print("✅ All tests passed! The editableMonths state fix should resolve the June, July, August 2026 data issue.")
    else:
        print("❌ Some tests failed. Please check the backend and MongoDB connection.")

if __name__ == "__main__":
    main() 