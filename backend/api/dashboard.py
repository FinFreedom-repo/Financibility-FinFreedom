from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from .models import Transaction, Account
from budget.models import Budget
import logging

logger = logging.getLogger(__name__)

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get dashboard data including:
        - Recent transactions
        - Account balances
        - Budget overview
        - Financial metrics
        """
        try:
            # Get user's recent transactions
            recent_transactions = Transaction.objects.filter(
                user=request.user
            ).order_by('-date')[:5]

            # Get account balances
            accounts = Account.objects.filter(user=request.user)
            total_balance = accounts.aggregate(Sum('balance'))['balance__sum'] or 0

            # Get budget overview
            budget = Budget.objects.filter(user=request.user).order_by('-updated_at').first()
            
            # Calculate total expenses from budget
            total_expenses = 0
            if budget:
                expense_fields = [
                    'housing', 'debt_payments', 'transportation', 'utilities',
                    'food', 'healthcare', 'entertainment', 'shopping',
                    'travel', 'education', 'childcare', 'other'
                ]
                total_expenses = sum(getattr(budget, field, 0) for field in expense_fields)
                
                # Add additional expenses if any
                if budget.additional_items:
                    additional_expenses = sum(
                        item.get('amount', 0) for item in budget.additional_items 
                        if item.get('type') == 'expense'
                    )
                    total_expenses += additional_expenses

            # Prepare dashboard data
            dashboard_data = {
                'recent_transactions': [
                    {
                        'id': t.id,
                        'amount': float(t.amount),
                        'description': t.description,
                        'date': t.date,
                        'type': t.transaction_type
                    } for t in recent_transactions
                ],
                'accounts': [
                    {
                        'id': a.id,
                        'name': a.name,
                        'balance': float(a.balance)
                    } for a in accounts
                ],
                'total_balance': float(total_balance),
                'budget': {
                    'income': float(budget.income) if budget else 0,
                    'total_expenses': float(total_expenses),
                    'net_income': float(budget.income - total_expenses) if budget else 0
                }
            }

            return Response(dashboard_data)

        except Exception as e:
            logger.error(f"Error fetching dashboard data: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch dashboard data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 