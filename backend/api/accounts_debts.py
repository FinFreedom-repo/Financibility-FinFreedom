from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Account, Debt
from .serializers import AccountSerializer, DebtSerializer
import logging
from django.db.models import Max

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
        logger.info(f"Creating account with data: {request.data}")
        serializer = AccountSerializer(data=request.data)
        if serializer.is_valid():
            account = serializer.save(user=request.user)
            logger.info(f"Account created successfully: {account.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Account creation validation errors: {serializer.errors}")
            logger.error(f"Request data: {request.data}")
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
        # For testing without authentication, return empty list
        if not request.user or not request.user.is_authenticated:
            return Response([])
            
        # Only return the latest record for each debt name (DB-level filtering)
        latest_ids = Debt.objects.filter(user=request.user).values('name').annotate(
            latest_id=Max('id')
        ).values_list('latest_id', flat=True)
        debts = Debt.objects.filter(id__in=latest_ids)
        serializer = DebtSerializer(debts, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        logger.info(f"Creating debt with data: {request.data}")
        serializer = DebtSerializer(data=request.data)
        if serializer.is_valid():
            # For testing without authentication, use a default user or skip user assignment
            if request.user and request.user.is_authenticated:
                debt = serializer.save(user=request.user)
            else:
                # For testing, create without user
                debt = serializer.save()
            logger.info(f"Debt created successfully: {debt.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Debt creation validation errors: {serializer.errors}")
            logger.error(f"Request data: {request.data}")
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
    """Save multiple accounts and debts at once (append-only)"""
    try:
        accounts_data = request.data.get('accounts', [])
        debts_data = request.data.get('debts', [])
        
        # Create new accounts (append-only, no deletion)
        created_accounts = []
        for account_data in accounts_data:
            serializer = AccountSerializer(data=account_data)
            if serializer.is_valid():
                account = serializer.save(user=request.user)
                created_accounts.append(account)
            else:
                logger.error(f"Invalid account data: {serializer.errors}")
        
        # Create new debts (append-only, no deletion)
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
    """Get all accounts and debts for the user with summary data (most recent records only)"""
    try:
        # Get the most recent record for each unique account name
        accounts = Account.objects.filter(user=request.user).values('name').annotate(
            latest_id=Max('id')
        ).values('latest_id')
        accounts = Account.objects.filter(id__in=accounts)
        
        # Get the most recent record for each unique debt name
        debts = Debt.objects.filter(user=request.user).values('name').annotate(
            latest_id=Max('id')
        ).values('latest_id')
        debts = Debt.objects.filter(id__in=debts)
        
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