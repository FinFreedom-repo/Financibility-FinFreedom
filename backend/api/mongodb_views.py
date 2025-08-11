"""
Django views that demonstrate MongoDB integration.
These views show how to access MongoDB data through Django REST framework.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .mongodb_services import MongoDBService, HybridDataService, DataConverter

@api_view(['GET'])
@permission_classes([AllowAny])
def mongodb_test_view(request):
    """Test view to demonstrate MongoDB integration"""
    try:
        # Get sample data from MongoDB
        users = MongoDBService.get_all_users()
        accounts = HybridDataService.get_all_accounts()
        debts = HybridDataService.get_all_debts()
        budgets = HybridDataService.get_all_budgets()
        
        # Convert to dictionaries for JSON response
        users_data = []
        for user in users[:3]:  # Limit to 3 users
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email
            })
        
        accounts_data = []
        for account in accounts[:3]:  # Limit to 3 accounts
            accounts_data.append(DataConverter.mongo_account_to_dict(account))
        
        debts_data = []
        for debt in debts[:3]:  # Limit to 3 debts
            debts_data.append(DataConverter.mongo_debt_to_dict(debt))
        
        budgets_data = []
        for budget in budgets[:3]:  # Limit to 3 budgets
            budgets_data.append(DataConverter.mongo_budget_to_dict(budget))
        
        return Response({
            'status': 'success',
            'message': 'MongoDB integration is working!',
            'data': {
                'total_users': len(users),
                'total_accounts': len(accounts),
                'total_debts': len(debts),
                'total_budgets': len(budgets),
                'sample_users': users_data,
                'sample_accounts': accounts_data,
                'sample_debts': debts_data,
                'sample_budgets': budgets_data
            }
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'MongoDB integration error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def user_mongodb_data(request, user_id):
    """Get comprehensive user data from MongoDB"""
    try:
        # Get hybrid user data
        user_data = HybridDataService.get_user_data(user_id)
        
        if not user_data:
            return Response({
                'status': 'error',
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Convert MongoDB objects to dictionaries
        accounts_data = [DataConverter.mongo_account_to_dict(acc) for acc in user_data['accounts']]
        debts_data = [DataConverter.mongo_debt_to_dict(debt) for debt in user_data['debts']]
        budgets_data = [DataConverter.mongo_budget_to_dict(budget) for budget in user_data['budgets']]
        
        financial_step_data = None
        if user_data['financial_step']:
            financial_step_data = {
                'current_step': user_data['financial_step'].current_step,
                'emergency_fund_goal': float(user_data['financial_step'].emergency_fund_goal),
                'emergency_fund_current': float(user_data['financial_step'].emergency_fund_current),
                'monthly_expenses': float(user_data['financial_step'].monthly_expenses),
                'retirement_contribution_percent': float(user_data['financial_step'].retirement_contribution_percent),
                'has_children': user_data['financial_step'].has_children,
                'college_fund_goal': float(user_data['financial_step'].college_fund_goal),
                'college_fund_current': float(user_data['financial_step'].college_fund_current),
                'mortgage_balance': float(user_data['financial_step'].mortgage_balance),
            }
        
        return Response({
            'status': 'success',
            'user': {
                'id': user_data['user'].id,
                'username': user_data['user'].username,
                'email': user_data['user'].email,
                'first_name': user_data['user'].first_name,
                'last_name': user_data['user'].last_name,
            },
            'accounts': accounts_data,
            'debts': debts_data,
            'budgets': budgets_data,
            'financial_step': financial_step_data
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Error getting user data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def mongodb_stats(request):
    """Get MongoDB statistics"""
    try:
        users = MongoDBService.get_all_users()
        accounts = HybridDataService.get_all_accounts()
        debts = HybridDataService.get_all_debts()
        budgets = HybridDataService.get_all_budgets()
        
        # Calculate some statistics
        total_account_balance = sum(float(acc.balance) if acc.balance else 0 for acc in accounts)
        total_debt_balance = sum(float(debt.balance) if debt.balance else 0 for debt in debts)
        total_budget_income = sum(float(budget.income) if budget.income else 0 for budget in budgets)
        
        return Response({
            'status': 'success',
            'statistics': {
                'total_users': len(users),
                'total_accounts': len(accounts),
                'total_debts': len(debts),
                'total_budgets': len(budgets),
                'total_account_balance': total_account_balance,
                'total_debt_balance': total_debt_balance,
                'total_budget_income': total_budget_income,
                'net_worth': total_account_balance - total_debt_balance
            }
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Error getting statistics: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 