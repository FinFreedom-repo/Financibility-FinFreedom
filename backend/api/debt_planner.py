from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import math
import logging

logger = logging.getLogger(__name__)

class DebtPlannerView(APIView):
    permission_classes = [IsAuthenticated]

    def calculate_monthly_payment(self, principal, annual_rate, years=10):
        """Calculate monthly payment using the loan payment formula"""
        monthly_rate = annual_rate / 12
        num_payments = years * 12
        if monthly_rate == 0:  # Handle 0% interest case
            return principal / num_payments
        payment = (principal * monthly_rate * (1 + monthly_rate)**num_payments) / ((1 + monthly_rate)**num_payments - 1)
        logger.info(f"Calculated monthly payment for principal ${principal:.2f} at {annual_rate*100}%: ${payment:.2f}")
        return payment

    def post(self, request):
        data = request.data
        debts = data.get('debts', [])
        strategy = data.get('strategy', 'snowball')
        net_savings = float(data.get('net_savings', 0))

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
            d['min_payment'] = self.calculate_monthly_payment(d['balance'], d['rate'] * 100)
            d['name'] = d.get('name', 'Debt')
            d['total_paid'] = 0
            d['total_interest'] = 0
            logger.info(f"Prepared {d['name']}: min payment ${d['min_payment']:.2f}")

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

        while any(d['balance'] > 0.01 for d in debts):
            month += 1
            logger.info(f"\nProcessing month {month}")
            month_plan = {'month': month, 'debts': []}
            available_extra = net_savings
            month_interest = 0

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

                # Calculate interest
                interest = d['balance'] * (d['rate'] / 12)
                month_interest += interest
                total_interest += interest
                d['total_interest'] += interest
                d['balance'] += interest
                logger.info(f"{d['name']} - Interest this month: ${interest:.2f}")

                # Calculate payment
                payment = d['min_payment']
                logger.info(f"{d['name']} - Minimum payment: ${payment:.2f}")
                
                if i == 0 and available_extra > 0:
                    payment += available_extra
                    logger.info(f"{d['name']} - Adding extra payment of ${available_extra:.2f}")
                    available_extra = 0

                payment = min(payment, d['balance'])
                d['balance'] -= payment
                d['total_paid'] += payment
                logger.info(f"{d['name']} - Total payment this month: ${payment:.2f}")
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
                'min_payment': round(d['min_payment'], 2),
                'total_paid': round(d['total_paid'], 2),
                'total_interest': round(d['total_interest'], 2)
            } for d in debts]
        }) 