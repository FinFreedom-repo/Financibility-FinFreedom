from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from .mongodb_authentication import get_user_from_token, MongoDBJWTAuthentication
import math
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def mongodb_debt_planner_test(request):
    """
    Test endpoint for debt planner without authentication
    """
    return mongodb_debt_planner_logic(request)

def mongodb_debt_planner_logic(request):
    """
    MongoDB-specific debt planner logic (shared between authenticated and test endpoints)
    """
    try:
        # For test endpoint, use default user ID
        if request.path.endswith('/test/') or request.path.endswith('/debt-planner-test/'):
            user = {'_id': '68a48a902dcc7d3db3e997e6'}  # Default test user
        else:
            # Get user from token using MongoDB authentication
            user = get_user_from_token(request)
            if not user:
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        data = request.data
        debts = data.get('debts', [])
        strategy = data.get('strategy', 'snowball')
        monthly_budget_data = data.get('monthly_budget_data', [])

        # Validate strategy
        if strategy not in ['snowball', 'avalanche']:
            return Response({'error': 'Strategy must be either "snowball" or "avalanche".'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate monthly_budget_data
        if monthly_budget_data and not isinstance(monthly_budget_data, list):
            return Response({'error': 'Monthly budget data must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Starting debt planner with strategy: {strategy}")
        logger.info(f"Monthly budget data provided: {len(monthly_budget_data)} months")
        logger.info("Monthly budget data details:")
        for budget_item in monthly_budget_data:
            logger.info(f"  Month {budget_item.get('month')}: Net savings ${budget_item.get('net_savings', 0):.2f}")
        logger.info("Initial debts:")
        for d in debts:
            logger.info(f"- {d.get('name', 'Unknown')}: ${d.get('balance', 0):.2f} at {d.get('rate', 0)*100}% (rate as decimal: {d.get('rate', 0)})")

        # Validate debts
        if not debts or not isinstance(debts, list):
            return Response({'error': 'Debts must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

        # Prepare debts with proper validation and field mapping
        for d in debts:
            try:
                # Ensure required fields exist
                if 'name' not in d or not d['name']:
                    return Response({'error': f'Debt name is required for all debts.'}, status=status.HTTP_400_BAD_REQUEST)
                
                if 'balance' not in d or d['balance'] is None:
                    return Response({'error': f'Balance is required for debt: {d["name"]}'}, status=status.HTTP_400_BAD_REQUEST)
                
                if 'rate' not in d or d['rate'] is None:
                    return Response({'error': f'Interest rate is required for debt: {d["name"]}'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Convert and validate balance
                d['balance'] = float(d['balance'])
                if d['balance'] < 0:
                    return Response({'error': f'Balance cannot be negative for debt: {d["name"]}'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Convert and validate interest rate
                original_rate = d['rate']
                d['rate'] = float(d['rate'])  # Already converted to decimal by frontend
                if d['rate'] < 0 or d['rate'] > 1:  # Rate should be between 0 and 1 (0% to 100%)
                    return Response({'error': f'Interest rate must be between 0 and 1 (0% to 100%) for debt: {d["name"]}'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Set default values
                d['name'] = d.get('name', 'Debt')
                d['total_paid'] = 0
                d['total_interest'] = 0
                
                logger.info(f"Prepared {d['name']} - Original rate: {original_rate}, Final rate: {d['rate']} ({d['rate']*100}%), Balance: ${d['balance']:.2f}")
                
            except (ValueError, TypeError) as e:
                return Response({'error': f'Invalid data format for debt: {d.get("name", "Unknown")}. Error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

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

        # Add initial month
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

        max_months = 360  # 30 years maximum (more realistic for long-term debt)
        while any(d['balance'] > 0.01 for d in debts) and month < max_months:
            month += 1
            month_plan = {'month': month, 'debts': []}
            
            # Calculate net savings for this month
            net_savings = 0
            if monthly_budget_data and len(monthly_budget_data) > 0:
                # Find the budget data for this specific month
                # The frontend sends month numbers starting from 1, so we need to convert to 0-based index
                month_budget = None
                if month <= len(monthly_budget_data):
                    # Use the month index (0-based) to get the corresponding budget data
                    month_budget = monthly_budget_data[month - 1]
                    logger.info(f"Debt Payoff Month {month} using budget data index {month - 1}")
                else:
                    # If we've exceeded the available budget data, use the last available month
                    month_budget = monthly_budget_data[-1]
                    logger.info(f"Debt Payoff Month {month} using last available budget data (index {len(monthly_budget_data) - 1})")
                
                if month_budget:
                    try:
                        net_savings = float(month_budget.get('net_savings', 0))
                        logger.info(f"Debt Payoff Month {month} net savings: ${net_savings:.2f} (found budget data)")
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Invalid net_savings value for month {month}: {month_budget.get('net_savings')}. Using 0. Error: {e}")
                        net_savings = 0
                else:
                    # Use the last available month's data as fallback
                    if monthly_budget_data:
                        last_month_budget = monthly_budget_data[-1]
                        try:
                            net_savings = float(last_month_budget.get('net_savings', 0))
                            logger.info(f"Debt Payoff Month {month} using last available net savings: ${net_savings:.2f} (fallback)")
                        except (ValueError, TypeError) as e:
                            logger.warning(f"Invalid net_savings value in fallback: {last_month_budget.get('net_savings')}. Using 0. Error: {e}")
                            net_savings = 0
                    else:
                        net_savings = 0
                        logger.info(f"Debt Payoff Month {month} no budget data available, net savings: $0.00")
            else:
                net_savings = 0
                logger.info(f"Debt Payoff Month {month} no budget data available, net savings: $0.00")
            
            # Calculate monthly interest for all debts and add it to balances
            month_interest = 0
            debt_interest = {}
            for d in debts:
                if d['balance'] <= 0:
                    debt_interest[d['name']] = 0
                    continue
                initial_balance = d['balance']
                monthly_rate = d['rate'] / 12
                interest = d['balance'] * monthly_rate
                debt_interest[d['name']] = interest
                month_interest += interest
                total_interest += interest
                d['total_interest'] += interest
                d['balance'] += interest
                logger.info(f"{d['name']} - Initial balance: ${initial_balance:.2f}, Monthly interest: ${interest:.2f}, New balance: ${d['balance']:.2f}")

            # One-by-one allocation (snowball or avalanche ordering)
            available_to_pay = max(0, net_savings)
            ordered_debts = [d for d in debts if d['balance'] > 0.01]
            if strategy == 'snowball':
                ordered_debts.sort(key=lambda d: d['balance'])
            else:
                ordered_debts.sort(key=lambda d: d['rate'], reverse=True)

            # Initialize month rows for all debts (paid defaults to 0)
            debt_to_plan = {d['name']: {'name': d['name'], 'balance': d['balance'], 'paid': 0, 'interest': round(debt_interest[d['name']], 2), 'interest_payment': round(debt_interest[d['name']], 2), 'total_paid': d['total_paid'], 'total_interest': d['total_interest']} for d in debts}

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

            # Push all debts for this month into plan in stable order
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

        logger.info("\nFinal Summary:")
        for d in debts:
            logger.info(f"{d['name']}:")
            logger.info(f"- Total paid: ${d['total_paid']:.2f}")
            logger.info(f"- Total interest: ${d['total_interest']:.2f}")
            logger.info(f"- Final balance: ${d['balance']:.2f}")

        # Check if we hit the maximum months limit
        hit_max_months = month >= max_months
        remaining_debts = [d for d in debts if d['balance'] > 0.01]
        
        logger.info(f"\nFinal Summary:")
        logger.info(f"Total months calculated: {month}")
        logger.info(f"Hit max months: {hit_max_months}")
        logger.info(f"Remaining debts: {len(remaining_debts)}")
        for d in debts:
            logger.info(f"{d['name']}: Final balance ${d['balance']:.2f}, Total paid ${d['total_paid']:.2f}")
        
        return Response({
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
        })
        
    except Exception as e:
        logger.error(f"Unexpected error in debt planner: {str(e)}")
        return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([IsAuthenticated])
def mongodb_debt_planner(request):
    """
    MongoDB-specific debt planner endpoint that integrates with MongoDB authentication
    """
    return mongodb_debt_planner_logic(request) 