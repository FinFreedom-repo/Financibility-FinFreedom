from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Account, Debt
from .serializers import AccountSerializer, DebtSerializer
import logging

logger = logging.getLogger(__name__)

# Account Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def account_list(request):
    """Get all accounts for the user or create a new account"""
    if request.method == 'GET':
        accounts = Account.objects.filter(user=request.user)
        serializer = AccountSerializer(accounts, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = AccountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def account_detail(request, pk):
    """Get, update, or delete a specific account"""
    account = get_object_or_404(Account, pk=pk, user=request.user)
    
    if request.method == 'GET':
        serializer = AccountSerializer(account)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = AccountSerializer(account, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Debt Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def debt_list(request):
    """Get all debts for the user or create a new debt"""
    if request.method == 'GET':
        debts = Debt.objects.filter(user=request.user)
        serializer = DebtSerializer(debts, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = DebtSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def debt_detail(request, pk):
    """Get, update, or delete a specific debt"""
    debt = get_object_or_404(Debt, pk=pk, user=request.user)
    
    if request.method == 'GET':
        serializer = DebtSerializer(debt)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = DebtSerializer(debt, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        debt.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Bulk Operations
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_save_accounts_debts(request):
    """Save multiple accounts and debts at once"""
    try:
        accounts_data = request.data.get('accounts', [])
        debts_data = request.data.get('debts', [])
        
        # Clear existing data for this user
        Account.objects.filter(user=request.user).delete()
        Debt.objects.filter(user=request.user).delete()
        
        # Create new accounts
        created_accounts = []
        for account_data in accounts_data:
            serializer = AccountSerializer(data=account_data)
            if serializer.is_valid():
                account = serializer.save(user=request.user)
                created_accounts.append(account)
            else:
                logger.error(f"Invalid account data: {serializer.errors}")
        
        # Create new debts
        created_debts = []
        for debt_data in debts_data:
            serializer = DebtSerializer(data=debt_data)
            if serializer.is_valid():
                debt = serializer.save(user=request.user)
                created_debts.append(debt)
            else:
                logger.error(f"Invalid debt data: {serializer.errors}")
        
        # Return the created data
        accounts_serializer = AccountSerializer(created_accounts, many=True)
        debts_serializer = DebtSerializer(created_debts, many=True)
        
        return Response({
            'accounts': accounts_serializer.data,
            'debts': debts_serializer.data,
            'message': f'Successfully saved {len(created_accounts)} accounts and {len(created_debts)} debts'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in bulk save: {str(e)}")
        return Response({
            'error': 'Failed to save accounts and debts'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_accounts_debts_summary(request):
    """Get all accounts and debts for the user with summary data"""
    try:
        accounts = Account.objects.filter(user=request.user)
        debts = Debt.objects.filter(user=request.user)
        
        accounts_serializer = AccountSerializer(accounts, many=True)
        debts_serializer = DebtSerializer(debts, many=True)
        
        # Calculate summary data
        total_account_balance = sum(account.balance for account in accounts)
        total_debt_balance = sum(debt.balance for debt in debts)
        net_worth = total_account_balance - total_debt_balance
        
        return Response({
            'accounts': accounts_serializer.data,
            'debts': debts_serializer.data,
            'summary': {
                'total_account_balance': float(total_account_balance),
                'total_debt_balance': float(total_debt_balance),
                'net_worth': float(net_worth),
                'account_count': len(accounts),
                'debt_count': len(debts)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting summary: {str(e)}")
        return Response({
            'error': 'Failed to get accounts and debts summary'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 