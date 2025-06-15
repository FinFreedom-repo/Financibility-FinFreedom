from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import math
import logging

logger = logging.getLogger(__name__)

class DebtPlannerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        debts = data.get('debts', [])
        strategy = data.get('strategy', 'snowball')
        net_savings = float(data.get('net_savings', 0))
        print("net savings", net_savings)

        logger.info(f"Starting debt planner with strategy: {strategy}")
        logger.info(f"Net savings available: ${net_savings:.2f}")
        logger.info("Initial debts:")
        for d in debts:
            logger.info(f"- {d['name']}: ${d['balance']:.2f} at {d['rate']*100}%")

        # Validate debts
        if not debts or not isinstance(debts, list):
            return Response({'error': 'Debts must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

        # Prepare debts
        for d in debts:
            d['balance'] = float(d['balance'])
            d['rate'] = float(d['rate']) / 100  # percent to decimal
            d['name'] = d.get('name', 'Debt')
            d['total_paid'] = 0
            d['total_interest'] = 0
            logger.info(f"Prepared {d['name']}")

        # Sort debts based on strategy
        if strategy == 'snowball':
            debts.sort(key=lambda d: d['balance'])
            logger.info("Sorted debts by balance (snowball)")
        else:  # avalanche
            debts.sort(key=lambda d: d['rate'], reverse=True)
            logger.info("Sorted debts by interest rate (avalanche)")

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

        max_months = 24  # 2 years maximum
        while any(d['balance'] > 0.01 for d in debts) and month < max_months:
            month += 1
            logger.info(f"\nProcessing month {month}")
            month_plan = {'month': month, 'debts': []}
            available_extra = net_savings
            month_interest = 0

            # First, calculate interest for all debts
            for d in debts:
                if d['balance'] <= 0:
                    continue
                
                # Calculate interest
                interest = d['balance'] * (d['rate'] / 12)
                month_interest += interest
                total_interest += interest
                d['total_interest'] += interest
                d['balance'] += interest
                logger.info(f"{d['name']} - Interest this month: ${interest:.2f}")

            # Then, apply payments based on strategy
            for i, d in enumerate(debts):
                if d['balance'] <= 0:
                    logger.info(f"{d['name']} is already paid off")
                    month_plan['debts'].append({
                        'name': d['name'],
                        'balance': 0,
                        'paid': 0,
                        'interest': 0,
                        'interest_payment': 0,
                        'total_paid': d['total_paid'],
                        'total_interest': d['total_interest']
                    })
                    continue

                # Apply payment based on strategy
                payment = 0
                if strategy == 'snowball':
                    # For snowball, apply all available extra to the first non-zero debt
                    if d['balance'] > 0 and available_extra > 0:
                        payment = min(available_extra, d['balance'])
                        logger.info(f"{d['name']} - Adding payment of ${payment:.2f} (snowball)")
                        available_extra -= payment
                elif strategy == 'avalanche' and d['balance'] > 0 and available_extra > 0:
                    payment = min(available_extra, d['balance'])
                    logger.info(f"{d['name']} - Adding payment of ${payment:.2f} (avalanche)")
                    available_extra -= payment

                d['balance'] -= payment
                d['total_paid'] += payment
                logger.info(f"{d['name']} - New balance: ${d['balance']:.2f}")

                month_plan['debts'].append({
                    'name': d['name'],
                    'balance': round(d['balance'], 2),
                    'paid': round(payment, 2),
                    'interest': round(interest, 2),
                    'interest_payment': round(interest, 2),
                    'total_paid': round(d['total_paid'], 2),
                    'total_interest': round(d['total_interest'], 2)
                })

            monthly_interest_payments.append(month_interest)
            plan.append(month_plan)

        logger.info("\nFinal Summary:")
        for d in debts:
            logger.info(f"{d['name']}:")
            logger.info(f"- Total paid: ${d['total_paid']:.2f}")
            logger.info(f"- Total interest: ${d['total_interest']:.2f}")
            logger.info(f"- Final balance: ${d['balance']:.2f}")

        return Response({
            'plan': plan,
            'months': month,
            'total_interest': round(total_interest, 2),
            'monthly_interest_payments': [round(x, 2) for x in monthly_interest_payments],
            'debts': [{
                'name': d['name'],
                'balance': round(d['balance'], 2),
                'rate': round(d['rate'] * 100, 2),
                'total_paid': round(d['total_paid'], 2),
                'total_interest': round(d['total_interest'], 2)
            } for d in debts]
        }) 