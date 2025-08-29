#!/usr/bin/env python3
"""
Comprehensive test script to test all 13 months (current + 12 projected months)
for the debt planning functionality.
"""

import requests
import json
from datetime import datetime, timedelta
import time

# Configuration
BASE_URL = "http://localhost:8000"
TEST_ENDPOINTS = True  # Use test endpoints that bypass authentication

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

def test_get_budgets():
    """Test getting all budgets from MongoDB"""
    print("🔍 Testing GET budgets...")
    
    endpoint = f"{BASE_URL}/api/mongodb/budgets/test/"
    response = requests.get(endpoint)
    
    if response.status_code == 200:
        data = response.json()
        budgets = data.get('budgets', [])
        print(f"✅ Found {len(budgets)} budgets")
        
        # Show current month budget
        current_month, current_year = get_current_month_year()
        current_budget = next((b for b in budgets if b['month'] == current_month and b['year'] == current_year), None)
        
        if current_budget:
            total_income = current_budget.get('income', 0) + current_budget.get('additional_income', 0)
            print(f"✅ Current month budget ({current_month}/{current_year}):")
            print(f"   Income: ${current_budget.get('income', 0)}")
            print(f"   Additional Income: ${current_budget.get('additional_income', 0)}")
            print(f"   Total Income: ${total_income}")
        else:
            print(f"❌ No budget found for current month {current_month}/{current_year}")
        
        return budgets
    else:
        print(f"❌ Failed to get budgets: {response.status_code}")
        return []

def test_save_budget_for_month(month, year, income, additional_income=0):
    """Test saving budget for a specific month"""
    print(f"💾 Testing budget save for {month}/{year}...")
    
    budget_data = {
        "month": month,
        "year": year,
        "income": income,
        "additional_income": additional_income,
        "expenses": {
            "housing": 1000,
            "transportation": 300,
            "food": 400,
            "healthcare": 200,
            "entertainment": 150,
            "shopping": 100,
            "travel": 0,
            "education": 0,
            "utilities": 150,
            "childcare": 0,
            "debt_payments": 0,
            "others": 50
        },
        "additional_items": [],
        "savings_items": [
            {"name": "Emergency Fund", "amount": 200},
            {"name": "Investment", "amount": 300}
        ]
    }
    
    endpoint = f"{BASE_URL}/api/mongodb/budgets/save-month-test/"
    response = requests.post(endpoint, json=budget_data)
    
    if response.status_code == 200:
        print(f"✅ Budget saved successfully for {month}/{year}!")
        return True
    else:
        print(f"❌ Failed to save budget for {month}/{year}: {response.status_code}")
        return False

def test_debt_payoff_calculation():
    """Test debt payoff calculation with all 13 months"""
    print("🧮 Testing debt payoff calculation...")
    
    # Sample debt data
    debts = [
        {
            "name": "Credit Card 1",
            "balance": 5000.0,
            "rate": 0.15,  # 15% as decimal
            "debt_type": "credit_card"
        },
        {
            "name": "Student Loan",
            "balance": 15000.0,
            "rate": 0.05,  # 5% as decimal
            "debt_type": "student_loan"
        },
        {
            "name": "Car Loan",
            "balance": 25000.0,
            "rate": 0.075,  # 7.5% as decimal
            "debt_type": "auto_loan"
        }
    ]
    
    # Generate 13 months of budget data with varying net savings
    months = generate_13_months()
    monthly_budget_data = []
    
    for i, (month, year) in enumerate(months):
        # Vary net savings to test different scenarios
        if i < 3:
            net_savings = 3000  # First 3 months: $3000
        elif i < 6:
            net_savings = 5000  # Months 4-6: $5000
        elif i < 9:
            net_savings = 7000  # Months 7-9: $7000
        else:
            net_savings = 4000  # Months 10-13: $4000
        
        monthly_budget_data.append({
            "month": month,
            "year": year,
            "net_savings": net_savings
        })
    
    payload = {
        "debts": debts,
        "strategy": "snowball",
        "monthly_budget_data": monthly_budget_data
    }
    
    endpoint = f"{BASE_URL}/api/mongodb/debt-planner-test/"
    response = requests.post(endpoint, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Debt payoff calculated successfully!")
        print(f"   Total months: {data.get('months', 'N/A')}")
        print(f"   Total interest: ${data.get('total_interest', 'N/A'):,.2f}")
        print(f"   Hit max months: {data.get('hit_max_months', 'N/A')}")
        
        # Show first few months of the plan
        plan = data.get('plan', [])
        if plan:
            print("   First 3 months of debt payoff plan:")
            for i, month_data in enumerate(plan[:3]):
                print(f"   Month {i}: {month_data}")
        
        return data
    else:
        print(f"❌ Debt payoff failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def test_all_13_months():
    """Test all 13 months comprehensively"""
    print("🚀 Starting comprehensive test of all 13 months...")
    print("=" * 60)
    
    # Step 1: Get current budgets
    budgets = test_get_budgets()
    print()
    
    # Step 2: Generate and test all 13 months
    months = generate_13_months()
    current_month, current_year = get_current_month_year()
    
    print(f"📅 Testing all 13 months (current: {current_month}/{current_year}):")
    for i, (month, year) in enumerate(months):
        month_type = "CURRENT" if month == current_month and year == current_year else "PROJECTED"
        print(f"   Month {i+1:2d}: {month:2d}/{year} ({month_type})")
    print()
    
    # Step 3: Save budgets for each month with different income values
    print("💾 Saving budgets for all 13 months...")
    success_count = 0
    
    for i, (month, year) in enumerate(months):
        # Vary income to test different scenarios
        if i < 3:
            income = 4000  # First 3 months: $4000
        elif i < 6:
            income = 6000  # Months 4-6: $6000
        elif i < 9:
            income = 8000  # Months 7-9: $8000
        else:
            income = 5000  # Months 10-13: $5000
        
        if test_save_budget_for_month(month, year, income):
            success_count += 1
    
    print(f"✅ Successfully saved {success_count}/13 budgets")
    print()
    
    # Step 4: Test debt payoff calculation
    debt_result = test_debt_payoff_calculation()
    print()
    
    # Step 5: Verify all budgets were saved
    print("🔍 Verifying all budgets were saved...")
    final_budgets = test_get_budgets()
    
    if final_budgets:
        print(f"✅ Final budget count: {len(final_budgets)}")
        
        # Check if all 13 months have budgets
        month_budgets = {}
        for budget in final_budgets:
            key = f"{budget['month']}/{budget['year']}"
            month_budgets[key] = budget
        
        print("📊 Budget summary for all 13 months:")
        for i, (month, year) in enumerate(months):
            key = f"{month}/{year}"
            budget = month_budgets.get(key)
            if budget:
                total_income = budget.get('income', 0) + budget.get('additional_income', 0)
                print(f"   Month {i+1:2d}: {month:2d}/{year} - Income: ${total_income}")
            else:
                print(f"   Month {i+1:2d}: {month:2d}/{year} - ❌ NO BUDGET")
    
    print()
    print("=" * 60)
    print("🎉 Comprehensive test completed!")
    
    if debt_result and not debt_result.get('hit_max_months', False):
        print("✅ Debt payoff calculation working correctly!")
    else:
        print("⚠️  Debt payoff calculation may need attention")

if __name__ == "__main__":
    # Wait a moment for servers to start
    print("⏳ Waiting for servers to be ready...")
    time.sleep(3)
    
    try:
        test_all_13_months()
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Please ensure both frontend and backend servers are running.")
        print("   Backend: http://localhost:8000")
        print("   Frontend: http://localhost:3000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}") 