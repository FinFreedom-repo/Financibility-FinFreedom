#!/usr/bin/env python
"""
Script to add historical data for the mccarvik user.
This adds 3 months of historical data for debts, accounts, and budgets.
"""

import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Debt, Account
from budget.models import Budget

def add_historical_data():
    """Add 3 months of historical data for mccarvik user"""
    
    # Get the mccarvik user
    try:
        user = User.objects.get(username='mccarvik')
        print(f"Found user: {user.username}")
    except User.DoesNotExist:
        print("User 'mccarvik' not found. Please create the user first.")
        return
    
    # Calculate dates for the last 3 months
    today = date.today()
    dates = []
    for i in range(3, 0, -1):  # 3, 2, 1 months ago
        historical_date = today.replace(day=1) - timedelta(days=i*30)
        dates.append(historical_date)
    
    print(f"Adding historical data for dates: {[d.strftime('%Y-%m-%d') for d in dates]}")
    
    # Add historical debt data
    add_historical_debts(user, dates)
    
    # Add historical account data
    add_historical_accounts(user, dates)
    
    # Add historical budget data
    add_historical_budgets(user, dates)
    
    print("Historical data added successfully!")

def add_historical_debts(user, dates):
    """Add historical debt records"""
    print("\nAdding historical debt data...")
    
    # Get current debts for the user
    current_debts = Debt.objects.filter(user=user).order_by('-effective_date', '-created_at')
    
    # Group by debt name to get the latest for each
    debt_names = {}
    for debt in current_debts:
        if debt.name not in debt_names:
            debt_names[debt.name] = debt
    
    # Create historical records for each debt
    for debt_name, current_debt in debt_names.items():
        print(f"  Processing debt: {debt_name}")
        
        # Start with higher balances (assuming debt was being paid down)
        base_balance = float(current_debt.balance)
        base_rate = float(current_debt.interest_rate)
        
        for i, historical_date in enumerate(dates):
            # Increase balance going back in time (debt was higher in the past)
            # Add some interest accumulation and assume some payments were made
            months_back = len(dates) - i
            interest_accumulated = base_balance * (base_rate / 100) * months_back
            payments_made = 150 * months_back  # Assume $150/month payments
            
            historical_balance = base_balance + interest_accumulated - payments_made
            
            # Ensure balance doesn't go negative
            historical_balance = max(historical_balance, 100)
            
            # Create historical debt record
            historical_debt = Debt(
                user=user,
                name=debt_name,
                debt_type=current_debt.debt_type,
                balance=Decimal(str(round(historical_balance, 2))),
                interest_rate=current_debt.interest_rate,
                effective_date=historical_date
            )
            historical_debt.save()
            print(f"    {historical_date.strftime('%Y-%m-%d')}: ${historical_balance:.2f}")

def add_historical_accounts(user, dates):
    """Add historical account records"""
    print("\nAdding historical account data...")
    
    # Get current accounts for the user
    current_accounts = Account.objects.filter(user=user).order_by('-effective_date', '-created_at')
    
    # Group by account name to get the latest for each
    account_names = {}
    for account in current_accounts:
        if account.name not in account_names:
            account_names[account.name] = account
    
    # Create historical records for each account
    for account_name, current_account in account_names.items():
        print(f"  Processing account: {account_name}")
        
        # Start with lower balances (assuming money was being saved)
        base_balance = float(current_account.balance)
        base_rate = float(current_account.interest_rate)
        
        for i, historical_date in enumerate(dates):
            # Decrease balance going back in time (account had less money in the past)
            # Assume monthly deposits and some interest earned
            months_back = len(dates) - i
            monthly_deposit = 500 if current_account.account_type == 'savings' else 200
            deposits_made = monthly_deposit * months_back
            interest_earned = base_balance * (base_rate / 100) * months_back / 12
            
            historical_balance = base_balance - deposits_made + interest_earned
            
            # Ensure balance doesn't go negative
            historical_balance = max(historical_balance, 100)
            
            # Create historical account record
            historical_account = Account(
                user=user,
                name=account_name,
                account_type=current_account.account_type,
                balance=Decimal(str(round(historical_balance, 2))),
                interest_rate=current_account.interest_rate,
                effective_date=historical_date
            )
            historical_account.save()
            print(f"    {historical_date.strftime('%Y-%m-%d')}: ${historical_balance:.2f}")

def add_historical_budgets(user, dates):
    """Add historical budget records"""
    print("\nAdding historical budget data...")
    
    # Get current budget for the user
    try:
        current_budget = Budget.objects.filter(user=user).order_by('-updated_at').first()
        if not current_budget:
            print("  No current budget found, skipping historical budgets")
            return
    except Budget.DoesNotExist:
        print("  No current budget found, skipping historical budgets")
        return
    
    print(f"  Processing budget")
    
    # Create historical records
    for i, historical_date in enumerate(dates):
        # Slightly vary the budget amounts to make it realistic
        variation_factor = 1 + (i * 0.05)  # 5% variation per month
        
        historical_budget = Budget(
            user=user,
            income=current_budget.income * variation_factor,
            housing=current_budget.housing * variation_factor,
            debt_payments=current_budget.debt_payments * variation_factor,
            transportation=current_budget.transportation * variation_factor,
            utilities=current_budget.utilities * variation_factor,
            food=current_budget.food * variation_factor,
            healthcare=current_budget.healthcare * variation_factor,
            entertainment=current_budget.entertainment * variation_factor,
            shopping=current_budget.shopping * variation_factor,
            travel=current_budget.travel * variation_factor,
            education=current_budget.education * variation_factor,
            childcare=current_budget.childcare * variation_factor,
            other=current_budget.other * variation_factor,
            additional_items=current_budget.additional_items,
            savings=current_budget.savings
        )
        historical_budget.save()
        print(f"    {historical_date.strftime('%Y-%m-%d')}: Budget created")

if __name__ == '__main__':
    add_historical_data() 