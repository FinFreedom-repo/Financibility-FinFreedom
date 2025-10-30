"""
Analytics Views
Expense analysis and financial analytics
"""

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
import logging

from authentication.authentication import MongoDBJWTAuthentication, get_user_from_token
from authentication.permissions import MongoDBIsAuthenticated
from transactions.services import TransactionService
from budgets.services import BudgetService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def analyze_expenses(request):
    """Analyze user expenses"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        transaction_service = TransactionService()
        budget_service = BudgetService()
        
        transactions = transaction_service.get_user_transactions(user.id, limit=100)
        budgets = budget_service.get_user_budgets(user.id)
        
        # Simple expense analysis
        total_expenses = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'expense')
        total_income = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'income')
        
        return Response({
            'analysis': {
                'total_expenses': round(total_expenses, 2),
                'total_income': round(total_income, 2),
                'net': round(total_income - total_expenses, 2),
                'transactions_count': len(transactions),
                'budgets_count': len(budgets)
            },
            'message': 'Expense analysis completed'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Analyze expenses error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
