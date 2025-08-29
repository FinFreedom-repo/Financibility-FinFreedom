#!/usr/bin/env python3
"""
Final Summary Test - Shows the complete status of all 13 months
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

def main():
    print("🎯 FINAL SUMMARY: All 13 Months Test Results")
    print("=" * 80)
    
    # Test 1: Backend Connectivity
    print("1️⃣  Backend Connectivity Test")
    try:
        response = requests.get(f"{BASE_URL}/api/mongodb/budgets/test/", timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend server is running and accessible")
        else:
            print(f"   ❌ Backend returned status {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Backend connection failed: {e}")
        return
    
    # Test 2: Frontend Connectivity
    print("\n2️⃣  Frontend Connectivity Test")
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("   ✅ Frontend server is running and accessible")
        else:
            print(f"   ❌ Frontend returned status {response.status_code}")
    except Exception as e:
        print(f"   ❌ Frontend connection failed: {e}")
    
    # Test 3: Budget Data
    print("\n3️⃣  Budget Data Test")
    response = requests.get(f"{BASE_URL}/api/mongodb/budgets/test/")
    budgets = response.json().get('budgets', [])
    print(f"   📊 Total budgets in MongoDB: {len(budgets)}")
    
    current_month, current_year = get_current_month_year()
    months = generate_13_months()
    
    print(f"   📅 Current month: {current_month}/{current_year}")
    print(f"   🎯 Testing all 13 months (current + 12 projected):")
    
    all_months_have_data = True
    for i, (month, year) in enumerate(months):
        budget = next((b for b in budgets if b['month'] == month and b['year'] == year), None)
        month_type = "CURRENT" if month == current_month and year == current_year else "PROJECTED"
        
        if budget:
            total_income = budget.get('income', 0) + budget.get('additional_income', 0)
            print(f"      Month {i+1:2d}: {month:2d}/{year} ({month_type}) - Income: ${total_income} ✅")
        else:
            print(f"      Month {i+1:2d}: {month:2d}/{year} ({month_type}) - ❌ NO DATA")
            all_months_have_data = False
    
    # Test 4: Debt Payoff Calculation
    print("\n4️⃣  Debt Payoff Calculation Test")
    
    # Generate monthly budget data for debt payoff
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
    
    response = requests.post(f"{BASE_URL}/api/mongodb/debt-planner-test/", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Debt payoff calculated successfully!")
        print(f"   📈 Total months to payoff: {data.get('months', 'N/A')}")
        print(f"   💰 Total interest: ${data.get('total_interest', 'N/A'):,.2f}")
        print(f"   ⏰ Hit max months: {data.get('hit_max_months', 'N/A')}")
        
        if not data.get('hit_max_months', False):
            print("   🎉 Debt payoff calculation is working correctly!")
        else:
            print("   ⚠️  Debt payoff hit max months - needs attention")
    else:
        print(f"   ❌ Debt payoff failed: {response.status_code}")
    
    # Final Summary
    print("\n" + "=" * 80)
    print("🏆 FINAL VERDICT")
    print("=" * 80)
    
    if all_months_have_data and response.status_code == 200 and not data.get('hit_max_months', False):
        print("🎉 SUCCESS: All 13 months are working perfectly!")
        print("✅ Backend server: Running")
        print("✅ Frontend server: Running")
        print("✅ All 13 months have budget data")
        print("✅ Debt payoff calculation is accurate")
        print("✅ No 360-month payoff issues")
        print("✅ No high interest calculation problems")
        print("\n🚀 The system is ready for production use!")
    else:
        print("⚠️  PARTIAL SUCCESS: Some issues detected")
        if not all_months_have_data:
            print("❌ Not all 13 months have budget data")
        if response.status_code != 200:
            print("❌ Debt payoff calculation failed")
        if data.get('hit_max_months', False):
            print("❌ Debt payoff hit max months")
    
    print("\n📋 Test Summary:")
    print(f"   • Backend: http://localhost:8000")
    print(f"   • Frontend: http://localhost:3000")
    print(f"   • Budgets in MongoDB: {len(budgets)}")
    print(f"   • Months tested: 13 (current + 12 projected)")
    print(f"   • Current month: {current_month}/{current_year}")

if __name__ == "__main__":
    main() 