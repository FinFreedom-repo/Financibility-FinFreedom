"""
Debt Planning Calculators
Snowball and Avalanche debt payoff strategies
"""

import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


def calculate_debt_payoff_plan(debts: List[Dict], strategy: str, monthly_budget_data: List[Dict]) -> Dict:
    """
    Calculate debt payoff plan using snowball or avalanche strategy
    
    Args:
        debts: List of debts with balance, rate (as decimal), and name
        strategy: 'snowball' or 'avalanche'
        monthly_budget_data: List of monthly budget data with net_savings
    
    Returns:
        Dict with plan, months, total_interest, and other metrics
    """
    logger.info(f"Starting debt planner with strategy: {strategy}")
    logger.info(f"Monthly budget data provided: {len(monthly_budget_data)} months")
    
    # Validate inputs
    if strategy not in ['snowball', 'avalanche']:
        raise ValueError('Strategy must be either "snowball" or "avalanche"')
    
    if not debts or not isinstance(debts, list):
        raise ValueError('Debts must be a non-empty list')
    
    # Prepare debts with validation
    for d in debts:
        # Validate required fields
        if 'name' not in d or not d['name']:
            raise ValueError('Debt name is required for all debts')
        
        if 'balance' not in d or d['balance'] is None:
            raise ValueError(f'Balance is required for debt: {d["name"]}')
        
        if 'rate' not in d or d['rate'] is None:
            raise ValueError(f'Interest rate is required for debt: {d["name"]}')
        
        # Convert and validate
        d['balance'] = float(d['balance'])
        if d['balance'] < 0:
            raise ValueError(f'Balance cannot be negative for debt: {d["name"]}')
        
        d['rate'] = float(d['rate'])
        if d['rate'] < 0 or d['rate'] > 1:
            raise ValueError(f'Interest rate must be between 0 and 1 for debt: {d["name"]}')
        
        # Initialize tracking
        d['total_paid'] = 0
        d['total_interest'] = 0
        
        logger.info(f"Prepared {d['name']} - Rate: {d['rate']*100}%, Balance: ${d['balance']:.2f}")
    
    # Sort debts based on strategy
    if strategy == 'snowball':
        debts.sort(key=lambda d: d['balance'])
        logger.info("Sorted debts by balance (snowball - smallest to largest)")
    else:  # avalanche
        debts.sort(key=lambda d: d['rate'], reverse=True)
        logger.info("Sorted debts by interest rate (avalanche - highest to lowest)")
    
    month = 0
    plan = []
    total_interest = 0
    monthly_interest_payments = []
    
    # Add initial month (month 0)
    initial_month = {'month': 0, 'debts': []}
    for d in debts:
        initial_month['debts'].append({
            'name': d['name'],
            'balance': round(d['balance'], 2),
            'paid': 0,
            'interest': 0,
            'interest_payment': 0,
            'total_paid': 0,
            'total_interest': 0
        })
    plan.append(initial_month)
    
    max_months = 360  # 30 years maximum
    while any(d['balance'] > 0.01 for d in debts) and month < max_months:
        month += 1
        month_plan = {'month': month, 'debts': []}
        
        # Calculate net savings for this month
        net_savings = 0
        if monthly_budget_data and len(monthly_budget_data) > 0:
            if month <= len(monthly_budget_data):
                month_budget = monthly_budget_data[month - 1]
            else:
                month_budget = monthly_budget_data[-1]
            
            if month_budget:
                try:
                    net_savings = float(month_budget.get('net_savings', 0))
                except (ValueError, TypeError):
                    net_savings = 0
        
        # Calculate monthly interest for all debts
        month_interest = 0
        debt_interest = {}
        for d in debts:
            if d['balance'] <= 0:
                debt_interest[d['name']] = 0
                continue
            
            monthly_rate = d['rate'] / 12
            interest = d['balance'] * monthly_rate
            debt_interest[d['name']] = interest
            month_interest += interest
            total_interest += interest
            d['total_interest'] += interest
            d['balance'] += interest
        
        # Allocate payments based on strategy
        available_to_pay = max(0, net_savings)
        ordered_debts = [d for d in debts if d['balance'] > 0.01]
        if strategy == 'snowball':
            ordered_debts.sort(key=lambda d: d['balance'])
        else:
            ordered_debts.sort(key=lambda d: d['rate'], reverse=True)
        
        # Initialize month rows for all debts
        debt_to_plan = {
            d['name']: {
                'name': d['name'],
                'balance': d['balance'],
                'paid': 0,
                'interest': round(debt_interest[d['name']], 2),
                'interest_payment': round(debt_interest[d['name']], 2),
                'total_paid': d['total_paid'],
                'total_interest': d['total_interest']
            } for d in debts
        }
        
        # Allocate available funds
        for d in ordered_debts:
            if available_to_pay <= 0:
                break
            pay = min(available_to_pay, d['balance'])
            d['balance'] -= pay
            d['total_paid'] += pay
            available_to_pay -= pay
            
            # Update snapshot
            debt_to_plan[d['name']]['balance'] = d['balance']
            debt_to_plan[d['name']]['paid'] = round(pay, 2)
            debt_to_plan[d['name']]['total_paid'] = round(d['total_paid'], 2)
            debt_to_plan[d['name']]['total_interest'] = round(d['total_interest'], 2)
        
        # Add all debts for this month
        for d in debts:
            month_plan['debts'].append({
                'name': d['name'],
                'balance': round(debt_to_plan[d['name']]['balance'], 2),
                'paid': round(debt_to_plan[d['name']]['paid'], 2),
                'interest': round(debt_to_plan[d['name']]['interest'], 2),
                'interest_payment': round(debt_to_plan[d['name']]['interest_payment'], 2),
                'total_paid': round(debt_to_plan[d['name']]['total_paid'], 2),
                'total_interest': round(debt_to_plan[d['name']]['total_interest'], 2)
            })
        
        monthly_interest_payments.append(month_interest)
        plan.append(month_plan)
    
    # Final summary
    hit_max_months = month >= max_months
    remaining_debts = [d for d in debts if d['balance'] > 0.01]
    
    logger.info(f"Calculation complete: {month} months, Total interest: ${total_interest:.2f}")
    
    return {
        'plan': plan,
        'months': month,
        'total_interest': round(total_interest, 2),
        'monthly_interest_payments': [round(x, 2) for x in monthly_interest_payments],
        'hit_max_months': hit_max_months,
        'remaining_debts': len(remaining_debts),
        'debts': [{
            'name': d['name'],
            'balance': round(d['balance'], 2),
            'rate': round(d['rate'] * 100, 2),
            'total_paid': round(d['total_paid'], 2),
            'total_interest': round(d['total_interest'], 2)
        } for d in debts]
    }

