"""
MongoDB-based API Views (Updated)
Replaces Django ORM with MongoDB for all financial data operations
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import JsonResponse
from .mongodb_authentication import MongoDBJWTAuthentication
import json
import logging

from .mongodb_service import (
    UserService, AccountService, DebtService, BudgetService, TransactionService, JWTAuthService
)

logger = logging.getLogger(__name__)

class MongoDBApiViews:
    """MongoDB-based API views for financial data"""
    
    def __init__(self):
        self.user_service = UserService()
        self.account_service = AccountService()
        self.debt_service = DebtService()
        self.budget_service = BudgetService()
        self.transaction_service = TransactionService()
        self.jwt_service = JWTAuthService()
    
    @staticmethod
    def get_user_from_token(request):
        """Extract user from JWT token"""
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return None
            
            token = auth_header.split(' ')[1]
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return None
            
            user_service = UserService()
            user = user_service.get_user_by_id(payload.get('user_id'))
            return user
            
        except Exception as e:
            logger.error(f"Error extracting user from token: {e}")
            return None

class AccountViews(MongoDBApiViews):
    """Account management views"""
    
    @staticmethod
    @api_view(['GET'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def get_accounts(request):
        """Get all accounts for the authenticated user"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            account_service = AccountService()
            accounts = account_service.get_user_accounts(str(user['_id']))
            
            return Response({
                'accounts': accounts
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Get accounts error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['POST'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def create_account(request):
        """Create a new account"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            account_service = AccountService()
            account = account_service.create_account(str(user['_id']), data)
            
            return Response({
                'account': account
            }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Create account error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['PUT'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def update_account(request, account_id):
        """Update an account"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            account_service = AccountService()
            success = account_service.update_account(account_id, data)
            
            if not success:
                return Response({
                    'error': 'Account not found or update failed'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'message': 'Account updated successfully'
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update account error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['DELETE'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def delete_account(request, account_id):
        """Delete an account"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            account_service = AccountService()
            success = account_service.delete_account(account_id)
            
            if not success:
                return Response({
                    'error': 'Account not found or delete failed'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'message': 'Account deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Delete account error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DebtViews(MongoDBApiViews):
    """Debt management views"""
    
    @staticmethod
    @api_view(['GET'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def get_debts(request):
        """Get all debts for the authenticated user"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            debt_service = DebtService()
            debts = debt_service.get_user_debts(str(user['_id']))
            
            return Response({
                'debts': debts
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Get debts error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['POST'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def create_debt(request):
        """Create a new debt"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            debt_service = DebtService()
            debt = debt_service.create_debt(str(user['_id']), data)
            
            return Response({
                'debt': debt
            }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Create debt error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['PUT'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def update_debt(request, debt_id):
        """Update a debt"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            debt_service = DebtService()
            success = debt_service.update_debt(debt_id, data)
            
            if not success:
                return Response({
                    'error': 'Debt not found or update failed'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'message': 'Debt updated successfully'
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update debt error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['DELETE'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def delete_debt(request, debt_id):
        """Delete a debt"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            debt_service = DebtService()
            success = debt_service.delete_debt(debt_id)
            
            if not success:
                return Response({
                    'error': 'Debt not found or delete failed'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'message': 'Debt deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Delete debt error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BudgetViews(MongoDBApiViews):
    """Budget management views"""
    
    @staticmethod
    @api_view(['GET'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def get_budgets(request):
        """Get all budgets for the authenticated user"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            budget_service = BudgetService()
            budgets = budget_service.get_user_budgets(str(user['_id']))
            
            return Response({
                'budgets': budgets
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Get budgets error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['POST'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def create_budget(request):
        """Create a new budget"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            budget_service = BudgetService()
            budget = budget_service.create_budget(str(user['_id']), data)
            
            return Response({
                'budget': budget
            }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Create budget error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['PUT'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def update_budget(request, budget_id):
        """Update a budget"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            budget_service = BudgetService()
            success = budget_service.update_budget(budget_id, data)
            
            if not success:
                return Response({
                    'error': 'Budget not found or update failed'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'message': 'Budget updated successfully'
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update budget error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['DELETE'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def delete_budget(request, budget_id):
        """Delete a budget"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            budget_service = BudgetService()
            success = budget_service.delete_budget(budget_id)
            
            if not success:
                return Response({
                    'error': 'Budget not found or delete failed'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'message': 'Budget deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Delete budget error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TransactionViews(MongoDBApiViews):
    """Transaction management views"""
    
    @staticmethod
    @api_view(['GET'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def get_transactions(request):
        """Get all transactions for the authenticated user"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            transaction_service = TransactionService()
            transactions = transaction_service.get_user_transactions(str(user['_id']))
            
            return Response({
                'transactions': transactions
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Get transactions error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['POST'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def create_transaction(request):
        """Create a new transaction"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            transaction_service = TransactionService()
            transaction = transaction_service.create_transaction(str(user['_id']), data)
            
            return Response({
                'transaction': transaction
            }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Create transaction error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['PUT'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def update_transaction(request, transaction_id):
        """Update a transaction"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            transaction_service = TransactionService()
            success = transaction_service.update_transaction(transaction_id, data)
            
            if not success:
                return Response({
                    'error': 'Transaction not found or update failed'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'message': 'Transaction updated successfully'
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update transaction error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['DELETE'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def delete_transaction(request, transaction_id):
        """Delete a transaction"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            transaction_service = TransactionService()
            success = transaction_service.delete_transaction(transaction_id)
            
            if not success:
                return Response({
                    'error': 'Transaction not found or delete failed'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'message': 'Transaction deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Delete transaction error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Create view functions for URL routing
def mongodb_get_accounts(request):
    return AccountViews.get_accounts(request)

def mongodb_create_account(request):
    return AccountViews.create_account(request)

def mongodb_update_account(request, account_id):
    return AccountViews.update_account(request, account_id)

def mongodb_delete_account(request, account_id):
    return AccountViews.delete_account(request, account_id)

def mongodb_get_debts(request):
    return DebtViews.get_debts(request)

def mongodb_create_debt(request):
    return DebtViews.create_debt(request)

def mongodb_update_debt(request, debt_id):
    return DebtViews.update_debt(request, debt_id)

def mongodb_delete_debt(request, debt_id):
    return DebtViews.delete_debt(request, debt_id)

def mongodb_get_budgets(request):
    return BudgetViews.get_budgets(request)

def mongodb_create_budget(request):
    return BudgetViews.create_budget(request)

def mongodb_update_budget(request, budget_id):
    return BudgetViews.update_budget(request, budget_id)

def mongodb_delete_budget(request, budget_id):
    return BudgetViews.delete_budget(request, budget_id)

def mongodb_get_transactions(request):
    return TransactionViews.get_transactions(request)

def mongodb_create_transaction(request):
    return TransactionViews.create_transaction(request)

def mongodb_update_transaction(request, transaction_id):
    return TransactionViews.update_transaction(request, transaction_id)

def mongodb_delete_transaction(request, transaction_id):
    return TransactionViews.delete_transaction(request, transaction_id) 