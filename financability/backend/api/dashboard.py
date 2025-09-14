from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .mongodb_services import MongoDBService
from .mongodb_authentication import get_user_from_token
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

class DashboardView(APIView):
    """
    MongoDB-based dashboard view
    """

    def get(self, request):
        """
        Get dashboard data including:
        - Recent transactions
        - Account balances
        - Budget overview
        - Financial metrics
        """
        try:
            # Get user from token
            user = get_user_from_token(request)
            if not user:
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = user.get('_id')
            if not user_id:
                return Response({'error': 'Invalid user'}, status=status.HTTP_400_BAD_REQUEST)

            # Get user's recent transactions
            recent_transactions = MongoDBService.get_user_transactions(user_id, limit=5)

            # Get account balances
            accounts = MongoDBService.get_user_accounts(user_id)
            total_balance = sum(Decimal(str(account.get('balance', 0))) for account in accounts)

            # Get budget overview
            budget = MongoDBService.get_user_budget(user_id)
            
            # Calculate total expenses from budget
            total_expenses = Decimal('0')
            if budget:
                expense_fields = [
                    'housing', 'debt_payments', 'transportation', 'utilities',
                    'food', 'healthcare', 'entertainment', 'shopping',
                    'travel', 'education', 'childcare', 'other'
                ]
                for field in expense_fields:
                    total_expenses += Decimal(str(budget.get(field, 0)))
                
                # Add additional expenses if any
                additional_items = budget.get('additional_items', [])
                for item in additional_items:
                    if item.get('type') == 'expense':
                        total_expenses += Decimal(str(item.get('amount', 0)))

            # Prepare dashboard data
            dashboard_data = {
                'recent_transactions': [
                    {
                        'id': str(t.get('_id', '')),
                        'amount': float(t.get('amount', 0)),
                        'description': t.get('description', ''),
                        'date': t.get('date', ''),
                        'type': t.get('transaction_type', '')
                    } for t in recent_transactions
                ],
                'accounts': [
                    {
                        'id': str(a.get('_id', '')),
                        'name': a.get('name', ''),
                        'balance': float(a.get('balance', 0))
                    } for a in accounts
                ],
                'total_balance': float(total_balance),
                'budget': {
                    'income': float(budget.get('income', 0)) if budget else 0,
                    'total_expenses': float(total_expenses),
                    'net_income': float(budget.get('income', 0) - total_expenses) if budget else 0
                }
            }

            return Response(dashboard_data)

        except Exception as e:
            logger.error(f"Error fetching dashboard data: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch dashboard data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 