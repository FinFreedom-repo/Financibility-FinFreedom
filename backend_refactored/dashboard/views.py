"""
Dashboard Views
Aggregated financial data dashboard
"""

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
import logging

from authentication.authentication import MongoDBJWTAuthentication, get_user_from_token
from authentication.permissions import MongoDBIsAuthenticated
from accounts.services import AccountService
from debts.services import DebtService
from budgets.services import BudgetService
from transactions.services import TransactionService
from common.encoders import serialize_documents

logger = logging.getLogger(__name__)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_dashboard(request):
    """Get aggregated dashboard data"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get all user data
        account_service = AccountService()
        debt_service = DebtService()
        budget_service = BudgetService()
        transaction_service = TransactionService()
        
        accounts = account_service.get_user_accounts(user.id)
        debts = debt_service.get_user_debts(user.id)
        budgets = budget_service.get_user_budgets(user.id)
        transactions = transaction_service.get_user_transactions(user.id, limit=10)
        
        # Calculate summaries
        total_assets = sum(acc.get('balance', 0) for acc in accounts)
        total_debts = sum(debt.get('balance', 0) for debt in debts)
        net_worth = total_assets - total_debts
        
        return Response({
            'summary': {
                'total_assets': round(total_assets, 2),
                'total_debts': round(total_debts, 2),
                'net_worth': round(net_worth, 2),
                'accounts_count': len(accounts),
                'debts_count': len(debts)
            },
            'accounts': serialize_documents(accounts),
            'debts': serialize_documents(debts),
            'recent_budgets': serialize_documents(budgets[:3]),
            'recent_transactions': serialize_documents(transactions)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get dashboard error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
