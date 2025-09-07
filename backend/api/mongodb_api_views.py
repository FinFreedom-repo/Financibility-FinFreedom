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
from .mongodb_json_encoder import convert_objectid_to_str
from .wealth_projection import calculate_wealth_projection

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
            
            # Convert ObjectId to string for JSON serialization
            accounts_serialized = convert_objectid_to_str(accounts)
            
            return Response({
                'accounts': accounts_serialized
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
            
            # Convert ObjectId to string for JSON serialization
            account_serialized = convert_objectid_to_str(account)
            
            return Response({
                'account': account_serialized
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
            
            # Convert ObjectId to string for JSON serialization
            debts_serialized = convert_objectid_to_str(debts)
            
            return Response({
                'debts': debts_serialized
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
            
            # Convert ObjectId to string for JSON serialization
            debt_serialized = convert_objectid_to_str(debt)
            
            return Response({
                'debt': debt_serialized
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

    @staticmethod
    @api_view(['GET'])
    @authentication_classes([])
    @permission_classes([])
    def get_debts_test(request):
        """Test endpoint to get debts without authentication"""
        try:
            debt_service = DebtService()
            # Use the same default user ID as budget system for testing
            default_user_id = "68a48a902dcc7d3db3e997e6"  # Same as budget system
            debts = debt_service.get_user_debts(default_user_id)
            
            # Convert ObjectId to string for JSON serialization
            debts_serialized = convert_objectid_to_str(debts)
            
            return Response({
                'debts': debts_serialized
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Get debts test error: {e}")
            return Response({
                'debts': []  # Return empty list for testing
            }, status=status.HTTP_200_OK)
    
    @staticmethod
    @api_view(['POST'])
    @authentication_classes([])
    @permission_classes([])
    def create_debt_test(request):
        """Test endpoint to create debt without authentication"""
        try:
            data = json.loads(request.body)
            
            # Use the same default user ID as budget system for testing
            default_user_id = "68a48a902dcc7d3db3e997e6"
            
            # Add user_id to the data
            data['user_id'] = default_user_id
            
            debt_service = DebtService()
            debt = debt_service.create_debt(default_user_id, data)
            
            # Convert ObjectId to string for JSON serialization
            debt_serialized = convert_objectid_to_str(debt)
            
            return Response({
                'message': 'Debt created successfully',
                'debt': debt_serialized
            }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Create debt test error: {e}")
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
                # For testing purposes, use a default user ID if authentication fails
                logger.warning("Authentication failed, using default user for testing")
                user = {'_id': '68a48a902dcc7d3db3e997e6'}  # Default user ID from database
            
            budget_service = BudgetService()
            budgets = budget_service.get_user_budgets(str(user['_id']))
            
            # Convert ObjectId to string for JSON serialization
            budgets_serialized = convert_objectid_to_str(budgets)
            
            return Response({
                'budgets': budgets_serialized
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Get budgets error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @staticmethod
    @api_view(['GET'])
    @authentication_classes([])
    @permission_classes([])
    def get_budgets_test(request):
        """Test endpoint to get all budgets without authentication"""
        try:
            budget_service = BudgetService()
            # Get all budgets for the default user
            budgets = budget_service.get_user_budgets('68a48a902dcc7d3db3e997e6')
            
            # Convert ObjectId to string for JSON serialization
            budgets_serialized = convert_objectid_to_str(budgets)
            
            return Response({
                'budgets': budgets_serialized
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Get budgets test error: {e}")
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
            
            # Convert ObjectId to string for JSON serialization
            budget_serialized = convert_objectid_to_str(budget)
            
            return Response({
                'budget': budget_serialized
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
            
            # Get the updated budget data
            updated_budget = budget_service.get_budget_by_id(budget_id)
            if updated_budget:
                # Convert ObjectId to string for JSON serialization
                updated_budget_serialized = convert_objectid_to_str(updated_budget)
                return Response(updated_budget_serialized, status=status.HTTP_200_OK)
            else:
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
    
    @staticmethod
    @api_view(['GET'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def get_month_budget(request):
        """Get budget for a specific month and year"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            month = request.GET.get('month')
            year = request.GET.get('year')
            
            if not month or not year:
                return Response({
                    'error': 'Month and year parameters are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                month = int(month)
                year = int(year)
            except ValueError:
                return Response({
                    'error': 'Month and year must be valid integers'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            budget_service = BudgetService()
            budget = budget_service.get_budget_by_month_year(str(user['_id']), month, year)
            
            if budget:
                # Convert ObjectId to string for JSON serialization
                budget_serialized = convert_objectid_to_str(budget)
                return Response(budget_serialized, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Budget not found for this month and year'
                }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Get month budget error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @staticmethod
    @api_view(['POST'])
    @authentication_classes([MongoDBJWTAuthentication])
    @permission_classes([IsAuthenticated])
    def save_month_budget(request):
        """Save budget data for a specific month - used by debt planning grid"""
        try:
            user = MongoDBApiViews.get_user_from_token(request)
            if not user:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            logger.info(f"💾 Received budget data: {data}")
            logger.info(f"💾 Savings items in data: {data.get('savings_items', [])}")
            
            # Validate required fields
            if 'month' not in data or 'year' not in data:
                return Response({
                    'error': 'Month and year are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            month = int(data['month'])
            year = int(data['year'])
            
            # Validate month and year ranges
            if month < 1 or month > 12:
                return Response({
                    'error': 'Month must be between 1 and 12'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if year < 2020 or year > 2030:
                return Response({
                    'error': 'Year must be between 2020 and 2030'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            budget_service = BudgetService()
            
            # Check if budget already exists for this month/year
            existing_budget = budget_service.get_budget_by_month_year(str(user['_id']), month, year)
            
            if existing_budget:
                # Update existing budget
                success = budget_service.update_budget(str(existing_budget['_id']), data)
                if not success:
                    return Response({
                        'error': 'Failed to update budget'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Get updated budget
                updated_budget = budget_service.get_budget_by_id(str(existing_budget['_id']))
                budget_serialized = convert_objectid_to_str(updated_budget)
                
                return Response({
                    'message': f'Budget for {month}/{year} updated successfully',
                    'budget': budget_serialized
                }, status=status.HTTP_200_OK)
            else:
                # Create new budget for this month/year
                budget = budget_service.create_budget(str(user['_id']), data)
                budget_serialized = convert_objectid_to_str(budget)
                
                return Response({
                    'message': f'Budget for {month}/{year} created successfully',
                    'budget': budget_serialized
                }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({
                'error': f'Invalid data format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Save month budget error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @staticmethod
    @api_view(['GET'])
    @authentication_classes([])
    @permission_classes([])
    def get_month_budget_test(request):
        """Test endpoint to get budget for a specific month without authentication"""
        try:
            month = request.GET.get('month')
            year = request.GET.get('year')
            
            if not month or not year:
                return Response({
                    'error': 'Month and year parameters are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                month = int(month)
                year = int(year)
            except ValueError:
                return Response({
                    'error': 'Month and year must be valid integers'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            budget_service = BudgetService()
            # Use the default user ID for testing
            budget = budget_service.get_budget_by_month_year('68a48a902dcc7d3db3e997e6', month, year)
            
            if budget:
                # Convert ObjectId to string for JSON serialization
                budget_serialized = convert_objectid_to_str(budget)
                return Response(budget_serialized, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Budget not found for this month and year'
                }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Get month budget test error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @staticmethod
    @api_view(['POST'])
    @authentication_classes([])
    @permission_classes([])
    def save_month_budget_test(request):
        """Test endpoint to save budget for a specific month without authentication"""
        try:
            data = json.loads(request.body)
            
            # Validate required fields
            if 'month' not in data or 'year' not in data:
                return Response({
                    'error': 'Month and year are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            month = int(data['month'])
            year = int(data['year'])
            
            # Validate month and year ranges
            if month < 1 or month > 12:
                return Response({
                    'error': 'Month must be between 1 and 12'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if year < 2020 or year > 2030:
                return Response({
                    'error': 'Year must be between 2020 and 2030'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            budget_service = BudgetService()
            
            # Use the default user ID for testing
            default_user_id = '68a48a902dcc7d3db3e997e6'
            
            # Check if budget already exists for this month/year
            existing_budget = budget_service.get_budget_by_month_year(default_user_id, month, year)
            
            if existing_budget:
                # Update existing budget
                success = budget_service.update_budget(str(existing_budget['_id']), data)
                if not success:
                    return Response({
                        'error': 'Failed to update budget'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Get updated budget
                updated_budget = budget_service.get_budget_by_id(str(existing_budget['_id']))
                budget_serialized = convert_objectid_to_str(updated_budget)
                
                return Response({
                    'message': f'Budget for {month}/{year} updated successfully',
                    'budget': budget_serialized
                }, status=status.HTTP_200_OK)
            else:
                # Create new budget for this month/year
                budget = budget_service.create_budget(default_user_id, data)
                budget_serialized = convert_objectid_to_str(budget)
                
                return Response({
                    'message': f'Budget for {month}/{year} created successfully',
                    'budget': budget_serialized
                }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({
                'error': f'Invalid data format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Save month budget test error: {e}")
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
            
            # Convert ObjectId to string for JSON serialization
            transactions_serialized = convert_objectid_to_str(transactions)
            
            return Response({
                'transactions': transactions_serialized
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
            
            # Convert ObjectId to string for JSON serialization
            transaction_serialized = convert_objectid_to_str(transaction)
            
            return Response({
                'transaction': transaction_serialized
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

def mongodb_get_month_budget(request):
    return BudgetViews.get_month_budget(request)

def mongodb_save_month_budget(request):
    return BudgetViews.save_month_budget(request)

def mongodb_get_month_budget_test(request):
    return BudgetViews.get_month_budget_test(request)

def mongodb_get_transactions(request):
    return TransactionViews.get_transactions(request)

def mongodb_create_transaction(request):
    return TransactionViews.create_transaction(request)

def mongodb_update_transaction(request, transaction_id):
    return TransactionViews.update_transaction(request, transaction_id)

def mongodb_delete_transaction(request, transaction_id):
    return TransactionViews.delete_transaction(request, transaction_id)

def mongodb_batch_update_budgets(request):
    """Optimized batch update for multiple budget changes"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        # Get user from token
        user = MongoDBApiViews.get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        # Parse request data
        data = json.loads(request.body)
        changes = data.get('changes', [])
        
        if not changes:
            return JsonResponse({'error': 'No changes provided'}, status=400)
        
        logger.info(f"Batch updating {len(changes)} budget changes for user {user['_id']}")
        
        # Process batch updates
        budget_service = BudgetService()
        updated_budgets = []
        
        for change in changes:
            month = change.get('month')
            year = change.get('year')
            category = change.get('category')
            value = change.get('value')
            additional_income = change.get('additional_income')  # For income propagation
            
            if not all([month, year, category, value is not None]):
                logger.warning(f"Invalid change data: {change}")
                continue
            
            try:
                # For income changes with additional_income specified, use special handling
                if category == 'Income' and additional_income is not None:
                    result = budget_service.update_income_with_additional(
                        user_id=str(user['_id']),
                        month=month,
                        year=year,
                        total_income=value,
                        additional_income=additional_income
                    )
                else:
                    # Update or create budget entry
                    result = budget_service.update_budget_field(
                        user_id=str(user['_id']),
                        month=month,
                        year=year,
                        category=category,
                        value=value
                    )
                
                if result:
                    updated_budgets.append(result)
                    logger.info(f"Updated {category} for {month}/{year}: {value}")
                
            except Exception as e:
                logger.error(f"Failed to update {category} for {month}/{year}: {str(e)}")
                continue
        
        return JsonResponse({
            'success': True,
            'message': f'Successfully updated {len(updated_budgets)} budget entries',
            'updated_budgets': [convert_objectid_to_str(budget) for budget in updated_budgets],
            'total_changes': len(changes),
            'successful_changes': len(updated_budgets)
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        logger.error(f"Batch update error: {str(e)}")
        return JsonResponse({'error': f'Batch update failed: {str(e)}'}, status=500)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([IsAuthenticated])
def mongodb_project_wealth(request):
    """
    Calculate wealth projection based on user input parameters.
    This endpoint uses real-time data from MongoDB Atlas.
    """
    try:
        # Get user from token
        user = MongoDBApiViews.get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        # Parse request data
        data = json.loads(request.body)
        logger.info(f"Wealth projection request from user {user['_id']}: {data}")
        
        # Validate required fields
        required_fields = ['age', 'startWealth', 'debt', 'annualContributions']
        for field in required_fields:
            if field not in data:
                return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        
        # Set default values for optional fields
        defaults = {
            'maxAge': 100,
            'debtInterest': 6.0,
            'assetInterest': 10.5,
            'inflation': 2.5,
            'taxRate': 25.0,
            'checkingInterest': 4.0
        }
        
        for field, default_value in defaults.items():
            if field not in data:
                data[field] = default_value
        
        # Calculate wealth projection
        projections = calculate_wealth_projection(data)
        
        logger.info(f"Generated {len(projections)} projection points for user {user['_id']}")
        
        return JsonResponse({
            'success': True,
            'projections': projections,
            'user_id': str(user['_id']),
            'calculation_date': data.get('calculation_date', ''),
            'total_years': len(projections) - 1
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        logger.error(f"Wealth projection error: {str(e)}")
        return JsonResponse({'error': f'Wealth projection failed: {str(e)}'}, status=500)