from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Account, Debt
from .serializers import AccountSerializer, DebtSerializer
from .mongodb_services import MongoDBService, DataConverter
import logging
from django.db.models import Max

logger = logging.getLogger(__name__)

# Account Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def account_list(request):
    """Get all accounts for the user or create a new account"""
    if request.method == 'GET':
        # Get accounts from MongoDB
        mongo_accounts = MongoDBService.get_user_accounts(request.user.id)
        accounts_data = [DataConverter.mongo_account_to_dict(acc) for acc in mongo_accounts]
        return Response(accounts_data)
    
    elif request.method == 'POST':
        logger.info(f"Creating account with data: {request.data}")
        serializer = AccountSerializer(data=request.data)
        if serializer.is_valid():
            # Save to Django ORM first
            account = serializer.save(user=request.user)
            logger.info(f"Account created successfully: {account.id}")
            
            # Also save to MongoDB
            try:
                from .mongodb_services import MongoAccount
                mongo_account = MongoAccount(
                    id=account.id,
                    user_id=account.user.id,
                    name=account.name,
                    account_type=account.account_type,
                    balance=account.balance,
                    interest_rate=account.interest_rate,
                    effective_date=account.effective_date,
                    created_at=account.created_at,
                    updated_at=account.updated_at
                )
                mongo_account.save()
                logger.info(f"MongoDB account created: {account.id}")
            except Exception as e:
                logger.error(f"Error creating MongoDB account: {e}")
            
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
            
        # Get debts from MongoDB
        mongo_debts = MongoDBService.get_user_debts(request.user.id)
        debts_data = [DataConverter.mongo_debt_to_dict(debt) for debt in mongo_debts]
        return Response(debts_data)
    
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
            
            # Also save to MongoDB
            try:
                from .mongodb_services import MongoDebt
                mongo_debt = MongoDebt(
                    id=debt.id,
                    user_id=debt.user.id if debt.user else 1,  # Default to user 1 if no user
                    name=debt.name,
                    debt_type=debt.debt_type,
                    balance=debt.balance,
                    interest_rate=debt.interest_rate,
                    effective_date=debt.effective_date,
                    payoff_date=debt.payoff_date,
                    created_at=debt.created_at,
                    updated_at=debt.updated_at
                )
                mongo_debt.save()
                logger.info(f"MongoDB debt created: {debt.id}")
            except Exception as e:
                logger.error(f"Error creating MongoDB debt: {e}")
            
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
    """Mongo-only bulk append of accounts and debts"""
    try:
        from .mongodb_services import MongoAccount, MongoDebt
        from datetime import datetime
        accounts_data = request.data.get('accounts', [])
        debts_data = request.data.get('debts', [])

        created_accounts = []
        created_debts = []

        # Insert accounts directly to Mongo
        for ad in accounts_data:
            existing = MongoAccount.objects.order_by('-id').first()
            next_id = (existing.id + 1) if existing else 1
            ma = MongoAccount(
                id=next_id,
                user_id=request.user.id,
                name=ad.get('name'),
                account_type=ad.get('account_type'),
                balance=ad.get('balance'),
                interest_rate=ad.get('interest_rate'),
                effective_date=ad.get('effective_date'),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            ma.save()
            created_accounts.append(ma)

        # Insert debts directly to Mongo
        for dd in debts_data:
            existing = MongoDebt.objects.order_by('-id').first()
            next_id = (existing.id + 1) if existing else 1
            md = MongoDebt(
                id=next_id,
                user_id=request.user.id,
                name=dd.get('name'),
                debt_type=dd.get('debt_type'),
                balance=dd.get('balance'),
                interest_rate=dd.get('interest_rate'),
                effective_date=dd.get('effective_date'),
                payoff_date=dd.get('payoff_date'),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            md.save()
            created_debts.append(md)

        # Return simple summaries
        return Response({
            'accounts_created': len(created_accounts),
            'debts_created': len(created_debts),
            'message': 'Saved to MongoDB'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in Mongo bulk save: {str(e)}")
        return Response({'error': 'Failed to save accounts and debts'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_accounts_debts_summary(request):
    """Get all accounts and debts for the user with summary data from MongoDB"""
    try:
        # Get accounts and debts from MongoDB
        mongo_accounts = MongoDBService.get_user_accounts(request.user.id)
        mongo_debts = MongoDBService.get_user_debts(request.user.id)
        
        # Convert to dictionaries
        accounts_data = [DataConverter.mongo_account_to_dict(acc) for acc in mongo_accounts]
        debts_data = [DataConverter.mongo_debt_to_dict(debt) for debt in mongo_debts]
        
        # Calculate summary data
        total_account_balance = sum(float(acc['balance']) for acc in accounts_data)
        total_debt_balance = sum(float(debt['balance']) for debt in debts_data)
        net_worth = total_account_balance - total_debt_balance
        
        return Response({
            'accounts': accounts_data,
            'debts': debts_data,
            'summary': {
                'total_account_balance': total_account_balance,
                'total_debt_balance': total_debt_balance,
                'net_worth': net_worth,
                'account_count': len(accounts_data),
                'debt_count': len(debts_data)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting summary: {str(e)}")
        return Response({
            'error': 'Failed to get accounts and debts summary'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 