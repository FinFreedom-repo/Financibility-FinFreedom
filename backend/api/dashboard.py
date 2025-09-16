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
            
            # Handle MongoDBUser object - use the id attribute
            user_id = str(user.id)
            
            if not user_id:
                return Response({'error': 'Invalid user'}, status=status.HTTP_400_BAD_REQUEST)

            # Get user's recent transactions
            recent_transactions = MongoDBService.get_user_transactions(user_id, limit=5)

            # Get account balances
            accounts = MongoDBService.get_user_accounts(user_id)
            total_balance = sum(Decimal(str(account.balance or 0)) for account in accounts)

            # Get budget overview
            budget = MongoDBService.get_user_budget(user_id)
            
            # Calculate total expenses from budget
            total_expenses = Decimal('0')
            if budget:
                # Get expenses from the expenses dict
                expenses = budget.expenses or {}
                for field, amount in expenses.items():
                    total_expenses += Decimal(str(amount or 0))
                
                # Add additional expenses if any
                additional_items = budget.additional_items or []
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
                        'id': str(a.id),
                        'name': a.name,
                        'balance': float(a.balance or 0)
                    } for a in accounts
                ],
                'total_balance': float(total_balance),
                'budget': {
                    'income': float(budget.income or 0) if budget else 0,
                    'total_expenses': float(total_expenses),
                    'net_income': float(Decimal(str(budget.income or 0)) - total_expenses) if budget else 0
                }
            }

            return Response(dashboard_data)

        except Exception as e:
            logger.error(f"Error fetching dashboard data: {str(e)}", exc_info=True)
            print(f"Dashboard error: {str(e)}")  # Add print for debugging
            return Response(
                {'error': f'Failed to fetch dashboard data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 