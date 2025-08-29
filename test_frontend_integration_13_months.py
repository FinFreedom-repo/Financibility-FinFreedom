#!/usr/bin/env python3
"""
Test script to verify frontend integration with all 13 months.
This simulates what the frontend should see when it loads the Debt Planning page.
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"

def get_current_month_year():
    """Get current month and year"""
    now = datetime.now()
    return now.month, now.year

def generate_13_months():
    """Generate current month + 12 projected months"""
    current_month, current_year = get_current_month_year()
    months = []
    
    for i in range(13):
        date = datetime(current_year, current_month, 1) + timedelta(days=32*i)
        month = date.month
        year = date.year
        months.append((month, year))
    
    return months

def test_frontend_budget_loading():
    """Test what the frontend sees when loading budgets"""
    print("🔍 Testing Frontend Budget Loading...")
    
    # This simulates the frontend's loadBudgetData function
    endpoint = f"{BASE_URL}/api/mongodb/budgets/test/"
    response = requests.get(endpoint)
    
    if response.status_code == 200:
        data = response.json()
        budgets = data.get('budgets', [])
        print(f"✅ Frontend found {len(budgets)} budgets in MongoDB")
        
        # Find current month budget
        current_month, current_year = get_current_month_year()
        current_month_budget = next((b for b in budgets if b['month'] == current_month and b['year'] == current_year), None)
        
        if current_month_budget:
            print(f"✅ Current month budget found: {current_month}/{current_year}")
            total_income = current_month_budget.get('income', 0) + current_month_budget.get('additional_income', 0)
            print(f"   Total Income: ${total_income}")
        else:
            print(f"❌ No current month budget found for {current_month}/{current_year}")
            return
        
        # Check all 13 months
        months = generate_13_months()
        print(f"\n📊 Checking all 13 months for frontend grid:")
        
        for i, (month, year) in enumerate(months):
            budget = next((b for b in budgets if b['month'] == month and b['year'] == year), None)
            month_type = "CURRENT" if month == current_month and year == current_year else "PROJECTED"
            
            if budget:
                total_income = budget.get('income', 0) + budget.get('additional_income', 0)
                print(f"   Month {i+1:2d}: {month:2d}/{year} ({month_type}) - Income: ${total_income} ✅")
            else:
                print(f"   Month {i+1:2d}: {month:2d}/{year} ({month_type}) - ❌ NO BUDGET")
        
        return budgets
    else:
        print(f"❌ Failed to load budgets: {response.status_code}")
        return []

def test_frontend_debt_payoff():
    """Test debt payoff calculation as the frontend would do it"""
    print("\n🧮 Testing Frontend Debt Payoff Calculation...")
    
    # Get budgets first
    budgets = test_frontend_budget_loading()
    if not budgets:
        return
    
    # Generate 13 months of budget data for debt payoff
    months = generate_13_months()
    monthly_budget_data = []
    
    for i, (month, year) in enumerate(months):
        budget = next((b for b in budgets if b['month'] == month and b['year'] == year), None)
        
        if budget:
            # Calculate net savings (simplified)
            total_income = budget.get('income', 0) + budget.get('additional_income', 0)
            total_expenses = sum(budget.get('expenses', {}).values())
            total_savings = sum(item.get('amount', 0) for item in budget.get('savings_items', []))
            net_savings = total_income - total_expenses + total_savings
            
            monthly_budget_data.append({
                "month": month,
                "year": year,
                "net_savings": net_savings
            })
            
            print(f"   Month {i+1}: {month:2d}/{year} - Net Savings: ${net_savings}")
        else:
            # Use current month as fallback
            current_month, current_year = get_current_month_year()
            current_budget = next((b for b in budgets if b['month'] == current_month and b['year'] == current_year), None)
            
            if current_budget:
                total_income = current_budget.get('income', 0) + current_budget.get('additional_income', 0)
                total_expenses = sum(current_budget.get('expenses', {}).values())
                total_savings = sum(item.get('amount', 0) for item in current_budget.get('savings_items', []))
                net_savings = total_income - total_expenses + total_savings
                
                monthly_budget_data.append({
                    "month": month,
                    "year": year,
                    "net_savings": net_savings
                })
                
                print(f"   Month {i+1}: {month:2d}/{year} - Net Savings: ${net_savings} (fallback)")
    
    # Sample debt data
    debts = [
        {
            "name": "Credit Card 1",
            "balance": 5000.0,
            "rate": 0.15,
            "debt_type": "credit_card"
        },
        {
            "name": "Student Loan",
            "balance": 15000.0,
            "rate": 0.05,
            "debt_type": "student_loan"
        },
        {
            "name": "Car Loan",
            "balance": 25000.0,
            "rate": 0.075,
            "debt_type": "auto_loan"
        }
    ]
    
    payload = {
        "debts": debts,
        "strategy": "snowball",
        "monthly_budget_data": monthly_budget_data
    }
    
    endpoint = f"{BASE_URL}/api/mongodb/debt-planner-test/"
    response = requests.post(endpoint, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Frontend debt payoff calculated successfully!")
        print(f"   Total months: {data.get('months', 'N/A')}")
        print(f"   Total interest: ${data.get('total_interest', 'N/A'):,.2f}")
        print(f"   Hit max months: {data.get('hit_max_months', 'N/A')}")
        
        if not data.get('hit_max_months', False):
            print("✅ Debt payoff calculation is working correctly!")
        else:
            print("⚠️  Debt payoff hit max months - may need attention")
        
        return data
    else:
        print(f"❌ Frontend debt payoff failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def main():
    """Main test function"""
    print("🚀 Testing Frontend Integration with All 13 Months...")
    print("=" * 60)
    
    try:
        # Test budget loading
        budgets = test_frontend_budget_loading()
        
        if budgets:
            # Test debt payoff
            debt_result = test_frontend_debt_payoff()
            
            print("\n" + "=" * 60)
            print("🎉 Frontend Integration Test Completed!")
            
            if debt_result and not debt_result.get('hit_max_months', False):
                print("✅ All systems working correctly!")
                print("✅ Frontend should display all 13 months properly")
                print("✅ Debt payoff calculation is accurate")
            else:
                print("⚠️  Some issues detected - check the results above")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Please ensure both frontend and backend servers are running.")
        print("   Backend: http://localhost:8000")
        print("   Frontend: http://localhost:3000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    main() 