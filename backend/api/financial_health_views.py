"""
Financial Health Score API Views
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
import logging

from .mongodb_service import AccountService, DebtService, BudgetService, TransactionService
from .financial_health_score import financial_health_calculator
from .mongodb_auth_views import get_user_from_token

logger = logging.getLogger(__name__)

account_service = AccountService()
debt_service = DebtService()
budget_service = BudgetService()
transaction_service = TransactionService()


@csrf_exempt
@api_view(['GET'])
def get_financial_health_score(request):
    """Get comprehensive financial health score for the user"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id = str(user['_id'])
        
        # Fetch all necessary data
        accounts = account_service.get_user_accounts(user_id)
        debts = debt_service.get_user_debts(user_id)
        budgets = budget_service.get_user_budgets(user_id)
        transactions = transaction_service.get_user_transactions(user_id)
        
        # Calculate score
        score_data = financial_health_calculator.calculate_score(
            accounts,
            debts,
            budgets,
            transactions
        )
        
        return Response(score_data)
    
    except Exception as e:
        logger.error(f"Error getting financial health score: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
