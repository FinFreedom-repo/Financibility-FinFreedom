"""
MongoDB-specific views that bypass Django ORM and use MongoDB services directly.
These views provide the same API endpoints but read/write directly to MongoDB.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from .mongodb_services import MongoDBService, DataConverter
from .serializers import (
    AccountSerializer, TransactionSerializer, CategorySerializer, 
    UserProfileSerializer, DebtSerializer
)
from budget.models import Budget
from budget.serializers import BudgetSerializer
import json
from decimal import Decimal

class MongoDBAccountViewSet(viewsets.ViewSet):
    """Account views using MongoDB directly"""
    
    def list(self, request):
        """Get all accounts for the current user from MongoDB"""
        try:
            user_id = request.user.id
            mongo_accounts = MongoDBService.get_user_accounts(user_id)
            
            # Convert MongoDB documents to Django-like format
            accounts_data = []
            for mongo_account in mongo_accounts:
                account_data = {
                    'id': mongo_account.id,
                    'name': mongo_account.name,
                    'account_type': mongo_account.account_type,
                    'balance': str(mongo_account.balance),
                    'interest_rate': str(mongo_account.interest_rate),
                    'effective_date': mongo_account.effective_date.isoformat() if mongo_account.effective_date else None,
                    'created_at': mongo_account.created_at.isoformat() if mongo_account.created_at else None,
                    'updated_at': mongo_account.updated_at.isoformat() if mongo_account.updated_at else None,
                }
                accounts_data.append(account_data)
            
            return Response(accounts_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request):
        """Create a new account in MongoDB"""
        try:
            user_id = request.user.id
            account_data = request.data.copy()
            account_data['user_id'] = user_id
            
            # Convert string values to proper types
            if 'balance' in account_data:
                account_data['balance'] = Decimal(str(account_data['balance']))
            if 'interest_rate' in account_data:
                account_data['interest_rate'] = Decimal(str(account_data['interest_rate']))
            
            # Create account using MongoDB service
            mongo_account = MongoDBService.create_account(account_data)
            
            if mongo_account:
                return Response({
                    'id': mongo_account.id,
                    'name': mongo_account.name,
                    'account_type': mongo_account.account_type,
                    'balance': str(mongo_account.balance),
                    'interest_rate': str(mongo_account.interest_rate),
                    'effective_date': mongo_account.effective_date.isoformat() if mongo_account.effective_date else None,
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Failed to create account'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MongoDBDebtViewSet(viewsets.ViewSet):
    """Debt views using MongoDB directly"""
    
    def list(self, request):
        """Get all debts for the current user from MongoDB"""
        try:
            user_id = request.user.id
            mongo_debts = MongoDBService.get_user_debts(user_id)
            
            # Convert MongoDB documents to Django-like format
            debts_data = []
            for mongo_debt in mongo_debts:
                debt_data = {
                    'id': mongo_debt.id,
                    'name': mongo_debt.name,
                    'debt_type': mongo_debt.debt_type,
                    'balance': str(mongo_debt.balance),
                    'interest_rate': str(mongo_debt.interest_rate),
                    'effective_date': mongo_debt.effective_date.isoformat() if mongo_debt.effective_date else None,
                    'payoff_date': mongo_debt.payoff_date.isoformat() if mongo_debt.payoff_date else None,
                    'created_at': mongo_debt.created_at.isoformat() if mongo_debt.created_at else None,
                    'updated_at': mongo_debt.updated_at.isoformat() if mongo_debt.updated_at else None,
                }
                debts_data.append(debt_data)
            
            return Response(debts_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request):
        """Create a new debt in MongoDB"""
        try:
            user_id = request.user.id
            debt_data = request.data.copy()
            debt_data['user_id'] = user_id
            
            # Convert string values to proper types
            if 'balance' in debt_data:
                debt_data['balance'] = Decimal(str(debt_data['balance']))
            if 'interest_rate' in debt_data:
                debt_data['interest_rate'] = Decimal(str(debt_data['interest_rate']))
            
            # Create debt using MongoDB service
            mongo_debt = MongoDBService.create_debt(debt_data)
            
            if mongo_debt:
                return Response({
                    'id': mongo_debt.id,
                    'name': mongo_debt.name,
                    'debt_type': mongo_debt.debt_type,
                    'balance': str(mongo_debt.balance),
                    'interest_rate': str(mongo_debt.interest_rate),
                    'effective_date': mongo_debt.effective_date.isoformat() if mongo_debt.effective_date else None,
                    'payoff_date': mongo_debt.payoff_date.isoformat() if mongo_debt.payoff_date else None,
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Failed to create debt'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MongoDBBudgetViewSet(viewsets.ViewSet):
    """Budget views using MongoDB directly"""
    
    def list(self, request):
        """Get all budgets for the current user from MongoDB"""
        try:
            user_id = request.user.id
            mongo_budgets = MongoDBService.get_user_budgets(user_id)
            
            # Convert MongoDB documents to Django-like format
            budgets_data = []
            for mongo_budget in mongo_budgets:
                budget_data = {
                    'id': mongo_budget.id,
                    'income': mongo_budget.income,
                    'additional_income': mongo_budget.additional_income,
                    'housing': mongo_budget.housing,
                    'debt_payments': mongo_budget.debt_payments,
                    'transportation': mongo_budget.transportation,
                    'utilities': mongo_budget.utilities,
                    'food': mongo_budget.food,
                    'healthcare': mongo_budget.healthcare,
                    'entertainment': mongo_budget.entertainment,
                    'shopping': mongo_budget.shopping,
                    'travel': mongo_budget.travel,
                    'education': mongo_budget.education,
                    'childcare': mongo_budget.childcare,
                    'other': mongo_budget.other,
                    'additional_items': mongo_budget.additional_items,
                    'savings_items': mongo_budget.savings_items,
                    'month': mongo_budget.month,
                    'year': mongo_budget.year,
                    'created_at': mongo_budget.created_at.isoformat() if mongo_budget.created_at else None,
                    'updated_at': mongo_budget.updated_at.isoformat() if mongo_budget.updated_at else None,
                }
                budgets_data.append(budget_data)
            
            return Response(budgets_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def get_month(self, request):
        """Get budget for specific month from MongoDB"""
        try:
            user_id = request.user.id
            month = int(request.query_params.get('month', 1))
            year = int(request.query_params.get('year', 2024))
            
            mongo_budget = MongoDBService.get_user_budget_by_month(user_id, month, year)
            
            if mongo_budget:
                budget_data = {
                    'id': mongo_budget.id,
                    'income': mongo_budget.income,
                    'additional_income': mongo_budget.additional_income,
                    'housing': mongo_budget.housing,
                    'debt_payments': mongo_budget.debt_payments,
                    'transportation': mongo_budget.transportation,
                    'utilities': mongo_budget.utilities,
                    'food': mongo_budget.food,
                    'healthcare': mongo_budget.healthcare,
                    'entertainment': mongo_budget.entertainment,
                    'shopping': mongo_budget.shopping,
                    'travel': mongo_budget.travel,
                    'education': mongo_budget.education,
                    'childcare': mongo_budget.childcare,
                    'other': mongo_budget.other,
                    'additional_items': mongo_budget.additional_items,
                    'savings_items': mongo_budget.savings_items,
                    'month': mongo_budget.month,
                    'year': mongo_budget.year,
                }
                return Response(budget_data)
            else:
                return Response({'error': 'Budget not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def mongo_api_root(request):
    """API root endpoint for MongoDB views"""
    return Response({
        'accounts': 'http://localhost:8000/api/mongo/accounts/',
        'debts': 'http://localhost:8000/api/mongo/debts/',
        'budgets': 'http://localhost:8000/api/mongo/budgets/',
        'transactions': 'http://localhost:8000/api/mongo/transactions/',
        'categories': 'http://localhost:8000/api/mongo/categories/',
    }) 