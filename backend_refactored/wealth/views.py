"""
Wealth Projection Views
Wealth projection calculation and settings management
"""

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
import json
import logging

from authentication.authentication import MongoDBJWTAuthentication, get_user_from_token
from authentication.permissions import MongoDBIsAuthenticated
from .services import WealthProjectionSettingsService
from .calculators import calculate_wealth_projection
from common.encoders import serialize_document
from accounts.services import AccountService
from debts.services import DebtService
from budgets.services import BudgetService

logger = logging.getLogger(__name__)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def project_wealth(request):
    """Calculate wealth projection"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        # Calculate projection
        projections = calculate_wealth_projection(data)
        
        return Response({
            'projections': projections
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Wealth projection error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_wealth_projection_settings(request):
    """Get wealth projection settings"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        settings_service = WealthProjectionSettingsService()
        settings = settings_service.get_settings(user.id)
        
        return Response({
            'success': True,
            'settings': serialize_document(settings) if settings else {}
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get wealth settings error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def save_wealth_projection_settings(request):
    """Save wealth projection settings"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        settings_service = WealthProjectionSettingsService()
        settings = settings_service.save_settings(user.id, data)
        
        return Response({
            'success': True,
            'settings': serialize_document(settings),
            'message': 'Settings saved successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Save wealth settings error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def import_financials(request):
    """Import financial data from user's accounts, debts, and budgets"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Initialize services
        account_service = AccountService()
        debt_service = DebtService()
        budget_service = BudgetService()
        
        # Get user's accounts
        accounts = account_service.get_user_accounts(user.id)
        total_assets = sum(float(account.get('balance', 0)) for account in accounts)
        
        # Get user's debts
        debts = debt_service.get_user_debts(user.id)
        total_debt = sum(float(debt.get('balance', 0)) for debt in debts)
        
        # Calculate average debt interest rate
        debt_interest_rates = [float(debt.get('interest_rate', 0)) for debt in debts if debt.get('interest_rate')]
        avg_debt_interest = sum(debt_interest_rates) / len(debt_interest_rates) if debt_interest_rates else 0.0
        
        # Get user's budget for annual contributions
        budgets = budget_service.get_user_budgets(user.id)
        budget = budgets[0] if budgets else None
        annual_contributions = 0.0
        
        if budget:
            # Calculate annual contributions from budget
            monthly_income = float(budget.get('income', 0))
            additional_income_items = budget.get('additional_income_items', [])
            additional_income = sum(float(item.get('amount', 0)) for item in additional_income_items)
            total_monthly_income = monthly_income + additional_income
            
            # Calculate monthly expenses
            expenses = budget.get('expenses', {})
            monthly_expenses = sum(float(expenses.get(category, 0)) for category in expenses)
            
            # Annual contribution = (monthly income - monthly expenses) * 12
            monthly_savings = total_monthly_income - monthly_expenses
            annual_contributions = monthly_savings * 12
        
        # Return imported financial data
        financial_data = {
            'startWealth': round(total_assets, 2),
            'debt': round(total_debt, 2),
            'debtInterest': round(avg_debt_interest, 2),
            'annualContributions': round(annual_contributions, 2),
            'accounts_count': len(accounts),
            'debts_count': len(debts),
            'has_budget': budget is not None
        }
        
        return Response({
            'financial_data': financial_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Import financials error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
