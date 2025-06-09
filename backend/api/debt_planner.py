from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import math

class DebtPlannerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        debts = data.get('debts', [])
        strategy = data.get('strategy', 'snowball')  # 'snowball' or 'avalanche'
        extra_payment = float(data.get('extra_payment', 0))

        # Validate debts
        if not debts or not isinstance(debts, list):
            return Response({'error': 'Debts must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

        # Prepare debts
        for d in debts:
            d['balance'] = float(d['balance'])
            d['rate'] = float(d['rate']) / 100  # percent to decimal
            d['min_payment'] = float(d['min_payment'])
            d['name'] = d.get('name', 'Debt')

        # Sort debts
        if strategy == 'snowball':
            debts.sort(key=lambda d: d['balance'])  # smallest balance first
        else:
            debts.sort(key=lambda d: d['rate'], reverse=True)  # highest rate first

        month = 0
        plan = []
        total_interest = 0
        while any(d['balance'] > 0.01 for d in debts):
            month += 1
            month_plan = {'month': month, 'debts': []}
            available = extra_payment
            for i, d in enumerate(debts):
                if d['balance'] <= 0:
                    month_plan['debts'].append({'name': d['name'], 'balance': 0, 'paid': 0, 'interest': 0})
                    continue
                # Interest for this month
                interest = d['balance'] * (d['rate'] / 12)
                total_interest += interest
                d['balance'] += interest
                # Payment
                payment = d['min_payment']
                if i == 0:
                    payment += available  # apply extra to first debt in order
                payment = min(payment, d['balance'])
                d['balance'] -= payment
                month_plan['debts'].append({'name': d['name'], 'balance': round(d['balance'], 2), 'paid': round(payment, 2), 'interest': round(interest, 2)})
                if i == 0:
                    available = 0  # only apply extra to first debt
            plan.append(month_plan)
        return Response({
            'plan': plan,
            'months': month,
            'total_interest': round(total_interest, 2)
        }) 