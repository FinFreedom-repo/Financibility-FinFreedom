from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
import math
import logging

logger = logging.getLogger(__name__)

class DebtPlannerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
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
                    # Find the budget data for this specific month (use actual calendar month)
                    month_budget = None
                    if month <= len(monthly_budget_data):
                        # Use the month index (0-based) to get the corresponding budget data
                        month_budget = monthly_budget_data[month - 1]
                        logger.info(f"Month {month} using budget data index {month - 1}")
                    else:
                        # If we've exceeded the available budget data, use the last available month
                        month_budget = monthly_budget_data[-1]
                        logger.info(f"Month {month} using last available budget data (index {len(monthly_budget_data) - 1})")
                    
                    if month_budget:
                        try:
                            net_savings = float(month_budget.get('net_savings', 0))
                            logger.info(f"Month {month} net savings: ${net_savings:.2f} (found budget data)")
                        except (ValueError, TypeError) as e:
                            logger.warning(f"Invalid net_savings value for month {month}: {month_budget.get('net_savings')}. Using 0. Error: {e}")
                            net_savings = 0
                    else:
                        # Use the last available month's data as fallback
                        if monthly_budget_data:
                            last_month_budget = monthly_budget_data[-1]
                            try:
                                net_savings = float(last_month_budget.get('net_savings', 0))
                                logger.info(f"Month {month} using last available net savings: ${net_savings:.2f} (fallback)")
                            except (ValueError, TypeError) as e:
                                logger.warning(f"Invalid net_savings value in fallback: {last_month_budget.get('net_savings')}. Using 0. Error: {e}")
                                net_savings = 0
                        else:
                            net_savings = 0
                            logger.info(f"Month {month} no budget data available, net savings: $0.00")
                else:
                    net_savings = 0
                    logger.info(f"Month {month} no budget data available, net savings: $0.00")
                
                available_extra = max(0, net_savings)  # Ensure we don't have negative available extra
                month_interest = 0
                
                logger.info(f"Month {month} - Net savings: ${net_savings:.2f}, Available extra for debt payments: ${available_extra:.2f}")

                # First, calculate interest for all debts and store it
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
                    logger.info(f"{d['name']} - Initial balance: ${initial_balance:.2f}, Annual rate: {d['rate']*100}%, Monthly rate: {monthly_rate*100}%, Interest: ${interest:.2f}, New balance: ${d['balance']:.2f}")

                # Apply payments based on strategy
                if strategy == 'snowball':
                    # Snowball: Apply available extra to the smallest debt first, then move to next
                    for i, d in enumerate(debts):
                        if d['balance'] <= 0:
                            logger.info(f"{d['name']} is already paid off")
                            month_plan['debts'].append({
                                'name': d['name'],
                                'balance': 0,
                                'paid': 0,
                                'interest': round(debt_interest[d['name']], 2),
                                'interest_payment': round(debt_interest[d['name']], 2),
                                'total_paid': d['total_paid'],
                                'total_interest': d['total_interest']
                            })
                            continue

                        payment = 0
                        if available_extra > 0:
                            # Calculate the maximum payment possible (the full available amount)
                            payment = min(available_extra, d['balance'])
                            logger.info(f"{d['name']} - Snowball payment: ${payment:.2f} (available: ${available_extra:.2f}, balance: ${d['balance']:.2f})")
                            available_extra -= payment
                            d['balance'] -= payment
                            d['total_paid'] += payment
                            logger.info(f"{d['name']} - After payment: balance=${d['balance']:.2f}, available_extra=${available_extra:.2f}")
                            
                        logger.info(f"{d['name']} - Final balance for month: ${d['balance']:.2f}")

                        month_plan['debts'].append({
                            'name': d['name'],
                            'balance': round(d['balance'], 2),
                            'paid': round(payment, 2),
                            'interest': round(debt_interest[d['name']], 2),
                            'interest_payment': round(debt_interest[d['name']], 2),
                            'total_paid': round(d['total_paid'], 2),
                            'total_interest': round(d['total_interest'], 2)
                        })
                        
                        # If no more extra money, add remaining debts without payments
                        if available_extra <= 0:
                            for j in range(i + 1, len(debts)):
                                remaining_debt = debts[j]
                                if remaining_debt['balance'] > 0:
                                    month_plan['debts'].append({
                                        'name': remaining_debt['name'],
                                        'balance': round(remaining_debt['balance'], 2),
                                        'paid': 0,
                                        'interest': round(debt_interest[remaining_debt['name']], 2),
                                        'interest_payment': round(debt_interest[remaining_debt['name']], 2),
                                        'total_paid': round(remaining_debt['total_paid'], 2),
                                        'total_interest': round(remaining_debt['total_interest'], 2)
                                    })
                            break
                            
                else:  # avalanche
                    # Avalanche: Apply available extra to the highest interest rate debt first, then move to next
                    for i, d in enumerate(debts):
                        if d['balance'] <= 0:
                            logger.info(f"{d['name']} is already paid off")
                            month_plan['debts'].append({
                                'name': d['name'],
                                'balance': 0,
                                'paid': 0,
                                'interest': round(debt_interest[d['name']], 2),
                                'interest_payment': round(debt_interest[d['name']], 2),
                                'total_paid': d['total_paid'],
                                'total_interest': d['total_interest']
                            })
                            continue

                        payment = 0
                        if available_extra > 0:
                            # Calculate the maximum payment possible (the full available amount)
                            payment = min(available_extra, d['balance'])
                            logger.info(f"{d['name']} - Avalanche payment: ${payment:.2f} (available: ${available_extra:.2f}, balance: ${d['balance']:.2f})")
                            available_extra -= payment
                            d['balance'] -= payment
                            d['total_paid'] += payment
                            logger.info(f"{d['name']} - After payment: balance=${d['balance']:.2f}, available_extra=${available_extra:.2f}")
                            
                        logger.info(f"{d['name']} - Final balance for month: ${d['balance']:.2f}")

                        month_plan['debts'].append({
                            'name': d['name'],
                            'balance': round(d['balance'], 2),
                            'paid': round(payment, 2),
                            'interest': round(debt_interest[d['name']], 2),
                            'interest_payment': round(debt_interest[d['name']], 2),
                            'total_paid': round(d['total_paid'], 2),
                            'total_interest': round(d['total_interest'], 2)
                        })
                        
                        # If no more extra money, add remaining debts without payments
                        if available_extra <= 0:
                            for j in range(i + 1, len(debts)):
                                remaining_debt = debts[j]
                                if remaining_debt['balance'] > 0:
                                    month_plan['debts'].append({
                                        'name': remaining_debt['name'],
                                        'balance': round(remaining_debt['balance'], 2),
                                        'paid': 0,
                                        'interest': round(debt_interest[remaining_debt['name']], 2),
                                        'interest_payment': round(debt_interest[remaining_debt['name']], 2),
                                        'total_paid': round(remaining_debt['total_paid'], 2),
                                        'total_interest': round(remaining_debt['total_interest'], 2)
                                    })
                            break

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
