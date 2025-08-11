from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Account, Transaction, Category, UserProfile, Debt
from .serializers import (
    AccountSerializer, TransactionSerializer, CategorySerializer, UserProfileSerializer, 
    AccountAuditSerializer, TransactionAuditSerializer, DebtAuditSerializer, DebtSerializer,
    ChangePasswordSerializer, UpdateUsernameSerializer, DeleteAccountSerializer
)
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework import status
from .wealth_projection import calculate_wealth_projection
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
import pandas as pd
import os
from dotenv import load_dotenv
import logging
from openai import OpenAI
from budget.models import Budget
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import models
from decimal import Decimal
from collections import defaultdict
from .mongodb_services import MongoDBService, DataConverter
from django.conf import settings
from django.contrib.auth.models import User
from django.http import JsonResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import json

logger = logging.getLogger(__name__)
load_dotenv()

print("=== GrokExcelView module loaded ===")  # This will print when the module is imported
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_me(request):
    """Minimal profile endpoint for auth check and user basics (Mongo-only safe)."""
    try:
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'date_joined': user.date_joined.isoformat() if getattr(user, 'date_joined', None) else None,
        })
    except Exception as e:
        return Response({'error': 'Failed to load user profile'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GrokExcelView(APIView):
    parser_classes = (MultiPartParser,)

    def post(self, request):
        print("=== GrokExcelView.post() called ===")  # This will print when the view is hit
        logger.info("=== Starting Grok Excel Analysis ===")
        logger.info(f"Request headers: {request.headers}")
        logger.info(f"Request user: {request.user}")
        logger.info(f"Request auth: {request.auth}")
        
        try:
            # Get the Excel file from the request
            excel_file = request.FILES.get('file')
            if not excel_file:
                logger.error("No file provided in request")
                return Response(
                    {'error': 'No file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Received file: {excel_file.name}, size: {excel_file.size} bytes")
            logger.info(f"File content type: {excel_file.content_type}")

            # Read the entire Excel file
            logger.info("Reading Excel file with pandas...")
            df = pd.read_excel(excel_file)
            logger.info(f"Excel file read successfully. Shape: {df.shape}")
            logger.info(f"Columns: {df.columns.tolist()}")
            
            # Get the first row for the response
            first_row = df.iloc[0].to_dict()
            logger.info(f"First row data: {first_row}")
            
            # Get categories for the user
            budget = Budget.objects.filter(user=request.user).order_by('-updated_at').first()
            fixed_categories = [
                'housing', 'debt_payments', 'transportation', 'utilities', 'food', 'healthcare',
                'entertainment', 'shopping', 'travel', 'education', 'childcare', 'other'
            ]
            additional_categories = []
            if budget and budget.additional_items:
                additional_categories = [item['name'] for item in budget.additional_items if 'name' in item]
            all_categories = fixed_categories + additional_categories
            category_list_str = ', '.join(all_categories)

            # Convert the entire DataFrame to a string format for Grok
            excel_content = df.to_string()
            prompt = (
                f"Please categorize all the following expenses into one of these categories: {category_list_str}.\n"
                "If an expense does not fit, use 'other'.\n\n"
                "Expenses:\n"
                + excel_content
            )
            logger.info(f"Generated prompt length: {len(prompt)} characters")

            # Initialize the OpenAI client with xAI's API endpoint
            api_key = os.getenv("XAI_API_KEY")
            if not api_key:
                logger.error("XAI_API_KEY not found in environment variables")
                return Response(
                    {'error': 'API key not configured'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            logger.info("Initializing OpenAI client...")
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.x.ai/v1",
            )

            # Make a request to the Grok API
            logger.info("Making request to Grok API...")
            completion = client.chat.completions.create(
                model="grok-beta",
                messages=[
                    {"role": "system", "content": "You are Grok, a helpful AI assistant."},
                    {"role": "user", "content": prompt},
                ],
            )
            logger.info("Received response from Grok API")

            # Get the response content
            grok_response = completion.choices[0].message.content
            logger.info(f"Grok response length: {len(grok_response)} characters")
            logger.info(f"Grok response: {grok_response}")

            response_data = {
                'analysis': grok_response,
                'line_item': first_row
            }
            logger.info("=== Grok Excel Analysis Completed Successfully ===")
            return Response(response_data)

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Create your views here.

class AccountViewSet(viewsets.ModelViewSet):
    # Temporarily disabled for development
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]
    serializer_class = AccountSerializer
    


    def get_queryset(self):
        # Handle unauthenticated users in development mode
        if not self.request.user or not self.request.user.is_authenticated:
            # Return all accounts from MongoDB for development
            from .mongodb_services import HybridDataService
            mongo_accounts = HybridDataService.get_all_accounts()
            # Convert MongoDB objects to Django ORM format for serializer compatibility
            accounts_data = []
            for acc in mongo_accounts:
                # Create a mock Django ORM object
                class MockAccount:
                    def __init__(self, data):
                        for key, value in data.items():
                            setattr(self, key, value)
                
                account_dict = {
                    'id': acc.id,
                    'user_id': acc.user_id,
                    'name': acc.name,
                    'account_type': acc.account_type,
                    'balance': acc.balance,
                    'interest_rate': acc.interest_rate,
                    'effective_date': acc.effective_date,
                    'created_at': acc.created_at,
                    'updated_at': acc.updated_at
                }
                accounts_data.append(MockAccount(account_dict))
            
            # Return a mock queryset
            class MockQuerySet:
                def __init__(self, data):
                    self.data = data
                
                def __iter__(self):
                    return iter(self.data)
                
                def __len__(self):
                    return len(self.data)
            
            return MockQuerySet(accounts_data)
        
        # For authenticated users, route based on feature flag
        if getattr(settings, 'USE_MONGO_ACCOUNTS', True):
            from .mongodb_services import MongoDBService
            mongo_accounts = MongoDBService.get_user_accounts(self.request.user.id)
        else:
            # If we are removing SQLite entirely, do not use ORM
            return Account.objects.none()
        accounts_data = []
        for acc in mongo_accounts:
            class MockAccount:
                def __init__(self, data):
                    for key, value in data.items():
                        setattr(self, key, value)
            
            account_dict = {
                'id': acc.id,
                'user_id': acc.user_id,
                'name': acc.name,
                'account_type': acc.account_type,
                'balance': acc.balance,
                'interest_rate': acc.interest_rate,
                'effective_date': acc.effective_date,
                'created_at': acc.created_at,
                'updated_at': acc.updated_at
            }
            accounts_data.append(MockAccount(account_dict))
        
        class MockQuerySet:
            def __init__(self, data):
                self.data = data
            
            def __iter__(self):
                return iter(self.data)
            
            def __len__(self):
                return len(self.data)
        
        return MockQuerySet(accounts_data)

    def get_object(self):
        """Override get_object to work with MongoDB data"""
        print(f"🔍 AccountViewSet.get_object called - User authenticated: {self.request.user.is_authenticated if self.request.user else False}")
        print(f"🔍 Request method: {self.request.method}")
        print(f"🔍 Request path: {self.request.path}")
        print(f"🔍 Request headers: {dict(self.request.headers)}")
        
        # For development, always use MongoDB regardless of authentication
        from .mongodb_services import MongoAccount
        
        # Get the account ID from the URL and convert to int
        account_id = int(self.kwargs.get('pk'))
        print(f"🔍 Looking for account ID: {account_id}")
        
        try:
            # Get account from MongoDB
            mongo_account = MongoAccount.objects.get(id=account_id)
            print(f"✅ Found account: {mongo_account.name} (ID: {mongo_account.id})")
            
            # Create a mock Django ORM object
            class MockAccount:
                def __init__(self, data):
                    for key, value in data.items():
                        setattr(self, key, value)
            
            account_dict = {
                'id': mongo_account.id,
                'user_id': mongo_account.user_id,
                'name': mongo_account.name,
                'account_type': mongo_account.account_type,
                'balance': mongo_account.balance,
                'interest_rate': mongo_account.interest_rate,
                'effective_date': mongo_account.effective_date,
                'created_at': mongo_account.created_at,
                'updated_at': mongo_account.updated_at
            }
            
            return MockAccount(account_dict)
        except MongoAccount.DoesNotExist:
            print(f"❌ Account ID {account_id} not found in MongoDB")
            from django.http import Http404
            raise Http404("Account not found")

    def perform_create(self, serializer):
        # Handle unauthenticated users in development mode
        if not self.request.user or not self.request.user.is_authenticated:
            # For development, save directly to MongoDB
            try:
                from .mongodb_services import MongoAccount
                from datetime import datetime
                
                # Get the next available ID
                existing_accounts = MongoAccount.objects.all()
                next_id = max([acc.id for acc in existing_accounts], default=0) + 1
                
                # Create account data
                account_data = serializer.validated_data
                mongo_account = MongoAccount(
                    id=next_id,
                    user_id=1,  # Default user ID for development
                    name=account_data.get('name'),
                    account_type=account_data.get('account_type'),
                    balance=account_data.get('balance'),
                    interest_rate=account_data.get('interest_rate'),
                    effective_date=account_data.get('effective_date'),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                mongo_account.save()
                print(f"✅ MongoDB account created: {next_id}")
                
                # Update the serializer instance with the new ID
                serializer.instance = type('MockAccount', (), {
                    'id': next_id,
                    'user_id': 1,
                    'name': mongo_account.name,
                    'account_type': mongo_account.account_type,
                    'balance': mongo_account.balance,
                    'interest_rate': mongo_account.interest_rate,
                    'effective_date': mongo_account.effective_date,
                    'created_at': mongo_account.created_at,
                    'updated_at': mongo_account.updated_at
                })()
            except Exception as e:
                print(f"❌ Error creating MongoDB account: {e}")
                raise
        else:
            # For authenticated users, save according to flags
            if getattr(settings, 'DUAL_WRITE_ACCOUNTS', True):
                account = serializer.save(user=self.request.user)
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
                    print(f"✅ MongoDB account created: {account.id}")
                except Exception as e:
                    print(f"❌ Error creating MongoDB account: {e}")
            elif getattr(settings, 'USE_MONGO_ACCOUNTS', True):
                # Mongo-only write path
                try:
                    from .mongodb_services import MongoAccount
                    from datetime import datetime
                    existing = MongoAccount.objects.order_by('-id').first()
                    next_id = (existing.id + 1) if existing else 1
                    data = serializer.validated_data
                    mongo_account = MongoAccount(
                        id=next_id,
                        user_id=self.request.user.id,
                        name=data.get('name'),
                        account_type=data.get('account_type'),
                        balance=data.get('balance'),
                        interest_rate=data.get('interest_rate'),
                        effective_date=data.get('effective_date'),
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    mongo_account.save()
                    serializer.instance = type('MockAccount', (), {
                        'id': mongo_account.id,
                        'user_id': mongo_account.user_id,
                        'name': mongo_account.name,
                        'account_type': mongo_account.account_type,
                        'balance': mongo_account.balance,
                        'interest_rate': mongo_account.interest_rate,
                        'effective_date': mongo_account.effective_date,
                        'created_at': mongo_account.created_at,
                        'updated_at': mongo_account.updated_at
                    })()
                except Exception as e:
                    print(f"❌ Error creating MongoDB account (mongo-only): {e}")
                    raise
            else:
                # ORM-only
                serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        print(f"🔍 AccountViewSet.perform_update called - User authenticated: {self.request.user.is_authenticated if self.request.user else False}")
        print(f"🔍 Request method: {self.request.method}")
        print(f"🔍 Request path: {self.request.path}")
        
        # For development, always use MongoDB regardless of authentication
        try:
            from .mongodb_services import MongoAccount
            from datetime import datetime
            
            # Get the account ID from the URL and convert to int
            account_id = int(self.kwargs.get('pk'))
            print(f"🔍 Updating account ID: {account_id}")
            
            # Update in MongoDB
            mongo_account = MongoAccount.objects.get(id=account_id)
            account_data = serializer.validated_data
            print(f"🔍 Update data: {account_data}")
            
            for field, value in account_data.items():
                if hasattr(mongo_account, field):
                    setattr(mongo_account, field, value)
            
            mongo_account.updated_at = datetime.now()
            mongo_account.save()
            print(f"✅ MongoDB account updated: {account_id}")
            
            # Update the serializer instance
            serializer.instance = type('MockAccount', (), {
                'id': mongo_account.id,
                'user_id': mongo_account.user_id,
                'name': mongo_account.name,
                'account_type': mongo_account.account_type,
                'balance': mongo_account.balance,
                'interest_rate': mongo_account.interest_rate,
                'effective_date': mongo_account.effective_date,
                'created_at': mongo_account.created_at,
                'updated_at': mongo_account.updated_at
            })()
        except Exception as e:
            print(f"❌ Error updating MongoDB account: {e}")
            raise

    def perform_destroy(self, instance):
        """Override perform_destroy to work with MongoDB data"""
        print(f"🔍 AccountViewSet.perform_destroy called - User authenticated: {self.request.user.is_authenticated if self.request.user else False}")
        print(f"🔍 Request method: {self.request.method}")
        print(f"🔍 Request path: {self.request.path}")
        print(f"🔍 Instance ID: {instance.id if instance else 'None'}")
        print(f"🔍 Request headers: {dict(self.request.headers)}")
        
        # For development, always use MongoDB regardless of authentication
        try:
            from .mongodb_services import MongoAccount
            
            # Get the account ID from the instance
            account_id = instance.id
            
            # Delete from MongoDB
            mongo_account = MongoAccount.objects.get(id=account_id)
            mongo_account.delete()
            print(f"✅ MongoDB account deleted: {account_id}")
        except Exception as e:
            print(f"❌ Error deleting MongoDB account: {e}")
            raise

    def update(self, request, *args, **kwargs):
        # Update existing record instead of creating new one
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}
        
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

class TransactionViewSet(viewsets.ModelViewSet):
    # Temporarily disabled for development
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        # Route to Mongo when enabled
        if getattr(settings, 'USE_MONGO_TRANSACTIONS', True):
            from .mongodb_services import MongoDBService
            mongo_txns = []
            if self.request.user and self.request.user.is_authenticated:
                mongo_txns = MongoDBService.get_user_transactions(self.request.user.id)
            # Convert to mock objects for serializer compatibility
            class MockTxn:
                def __init__(self, d):
                    for k, v in d.items():
                        setattr(self, k, v)
            from .mongodb_services import DataConverter
            mock_list = [MockTxn(DataConverter.mongo_transaction_to_dict(t)) for t in mongo_txns]
            class MockQuerySet:
                def __init__(self, data):
                    self.data = data
                def __iter__(self):
                    return iter(self.data)
                def __len__(self):
                    return len(self.data)
            return MockQuerySet(mock_list)
        # Fallback: no ORM when removing SQLite
        return Transaction.objects.none()

    def perform_create(self, serializer):
        if getattr(settings, 'USE_MONGO_TRANSACTIONS', True) and not getattr(settings, 'DUAL_WRITE_TRANSACTIONS', False):
            try:
                from .mongodb_services import MongoTransaction
                from datetime import datetime
                data = serializer.validated_data
                existing = MongoTransaction.objects.order_by('-id').first()
                next_id = (existing.id + 1) if existing else 1
                mt = MongoTransaction(
                    id=next_id,
                    amount=data.get('amount'),
                    description=data.get('description'),
                    transaction_type=data.get('transaction_type'),
                    account_id=data.get('account').id if data.get('account') else None,
                    category_id=data.get('category').id if data.get('category') else None,
                    date=data.get('date'),
                    effective_date=data.get('effective_date'),
                    user_id=self.request.user.id if self.request.user and self.request.user.is_authenticated else 1,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                mt.save()
                serializer.instance = type('MockTxn', (), DataConverter.mongo_transaction_to_dict(mt))
                return
            except Exception as e:
                print(f"Error creating Mongo transaction: {e}")
                raise
        # Dual-write or ORM-only fallback
        instance = serializer.save(user=self.request.user)
        if getattr(settings, 'DUAL_WRITE_TRANSACTIONS', False):
            try:
                from .mongodb_services import MongoTransaction
                mt = MongoTransaction(
                    id=instance.id,
                    amount=instance.amount,
                    description=instance.description,
                    transaction_type=instance.transaction_type,
                    account_id=instance.account.id,
                    category_id=instance.category.id,
                    date=instance.date,
                    effective_date=instance.effective_date,
                    user_id=instance.user.id,
                    created_at=instance.created_at,
                    updated_at=instance.updated_at
                )
                mt.save()
            except Exception as e:
                print(f"Error dual-writing transaction to Mongo: {e}")

    def perform_update(self, serializer):
        if getattr(settings, 'USE_MONGO_TRANSACTIONS', True) and not getattr(settings, 'DUAL_WRITE_TRANSACTIONS', False):
            try:
                from .mongodb_services import MongoTransaction, DataConverter
                from datetime import datetime
                # Identify document id from URL
                txn_id = int(self.kwargs.get('pk'))
                mt = MongoTransaction.objects.get(id=txn_id)
                data = serializer.validated_data
                mt.amount = data.get('amount', mt.amount)
                mt.description = data.get('description', mt.description)
                mt.transaction_type = data.get('transaction_type', mt.transaction_type)
                mt.account_id = (data.get('account').id if data.get('account') else mt.account_id)
                mt.category_id = (data.get('category').id if data.get('category') else mt.category_id)
                mt.date = data.get('date', mt.date)
                mt.effective_date = data.get('effective_date', mt.effective_date)
                mt.updated_at = datetime.now()
                mt.save()
                serializer.instance = type('MockTxn', (), DataConverter.mongo_transaction_to_dict(mt))
                return
            except Exception as e:
                print(f"Error updating Mongo transaction: {e}")
                raise
        # Dual-write or ORM-only fallback
        instance = serializer.save()
        if getattr(settings, 'DUAL_WRITE_TRANSACTIONS', False):
            try:
                from .mongodb_services import MongoTransaction
                from datetime import datetime
                mt = MongoTransaction.objects.filter(id=instance.id).first() or MongoTransaction(id=instance.id)
                mt.amount = instance.amount
                mt.description = instance.description
                mt.transaction_type = instance.transaction_type
                mt.account_id = instance.account.id
                mt.category_id = instance.category.id
                mt.date = instance.date
                mt.effective_date = instance.effective_date
                mt.user_id = instance.user.id
                mt.created_at = getattr(instance, 'created_at', datetime.now())
                mt.updated_at = datetime.now()
                mt.save()
            except Exception as e:
                print(f"Error dual-writing transaction update to Mongo: {e}")

    def perform_destroy(self, instance):
        if getattr(settings, 'USE_MONGO_TRANSACTIONS', True) and not getattr(settings, 'DUAL_WRITE_TRANSACTIONS', False):
            try:
                from .mongodb_services import MongoTransaction
                txn_id = int(self.kwargs.get('pk'))
                mt = MongoTransaction.objects.get(id=txn_id)
                mt.delete()
                return
            except Exception as e:
                print(f"Error deleting Mongo transaction: {e}")
                raise
        # Dual-write or ORM-only fallback
        instance.delete()

class CategoryViewSet(viewsets.ModelViewSet):
    # Temporarily disabled for development
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        if getattr(settings, 'USE_MONGO_CATEGORIES', True):
            from .mongodb_services import MongoDBService, DataConverter
            cats = []
            if self.request.user and self.request.user.is_authenticated:
                cats = MongoDBService.get_user_categories(self.request.user.id)
            class MockCat:
                def __init__(self, d):
                    for k, v in d.items():
                        setattr(self, k, v)
            class MockQuerySet:
                def __init__(self, data):
                    self.data = data
                def __iter__(self):
                    return iter(self.data)
                def __len__(self):
                    return len(self.data)
            return MockQuerySet([MockCat(DataConverter.mongo_category_to_dict(c)) for c in cats])
        return Category.objects.none()

    def perform_create(self, serializer):
        if getattr(settings, 'USE_MONGO_CATEGORIES', True) and not getattr(settings, 'DUAL_WRITE_CATEGORIES', False):
            try:
                from .mongodb_services import MongoCategory
                from datetime import datetime
                data = serializer.validated_data
                existing = MongoCategory.objects.order_by('-id').first()
                next_id = (existing.id + 1) if existing else 1
                mc = MongoCategory(
                    id=next_id,
                    name=data.get('name'),
                    user_id=self.request.user.id if self.request.user and self.request.user.is_authenticated else 1,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                mc.save()
                serializer.instance = type('MockCat', (), DataConverter.mongo_category_to_dict(mc))
                return
            except Exception as e:
                print(f"Error creating Mongo category: {e}")
                raise
        instance = serializer.save(user=self.request.user)
        if getattr(settings, 'DUAL_WRITE_CATEGORIES', False):
            try:
                from .mongodb_services import MongoCategory
                mc = MongoCategory(
                    id=instance.id,
                    name=instance.name,
                    user_id=instance.user.id,
                    created_at=instance.created_at,
                    updated_at=instance.updated_at
                )
                mc.save()
            except Exception as e:
                print(f"Error dual-writing category to Mongo: {e}")

    def perform_update(self, serializer):
        if getattr(settings, 'USE_MONGO_CATEGORIES', True) and not getattr(settings, 'DUAL_WRITE_CATEGORIES', False):
            try:
                from .mongodb_services import MongoCategory, DataConverter
                from datetime import datetime
                cat_id = int(self.kwargs.get('pk'))
                mc = MongoCategory.objects.get(id=cat_id)
                data = serializer.validated_data
                mc.name = data.get('name', mc.name)
                mc.updated_at = datetime.now()
                mc.save()
                serializer.instance = type('MockCat', (), DataConverter.mongo_category_to_dict(mc))
                return
            except Exception as e:
                print(f"Error updating Mongo category: {e}")
                raise
        instance = serializer.save()
        if getattr(settings, 'DUAL_WRITE_CATEGORIES', False):
            try:
                from .mongodb_services import MongoCategory
                from datetime import datetime
                mc = MongoCategory.objects.filter(id=instance.id).first() or MongoCategory(id=instance.id)
                mc.name = instance.name
                mc.user_id = instance.user.id
                mc.created_at = getattr(instance, 'created_at', datetime.now())
                mc.updated_at = datetime.now()
                mc.save()
            except Exception as e:
                print(f"Error dual-writing category update to Mongo: {e}")

    def perform_destroy(self, instance):
        if getattr(settings, 'USE_MONGO_CATEGORIES', True) and not getattr(settings, 'DUAL_WRITE_CATEGORIES', False):
            try:
                from .mongodb_services import MongoCategory
                cat_id = int(self.kwargs.get('pk'))
                mc = MongoCategory.objects.get(id=cat_id)
                mc.delete()
                return
            except Exception as e:
                print(f"Error deleting Mongo category: {e}")
                raise
        instance.delete()

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    # Temporarily disabled for development
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Handle unauthenticated users in development mode
        if not self.request.user or not self.request.user.is_authenticated:
            return UserProfile.objects.none()  # Return empty queryset
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        # Handle unauthenticated users in development mode
        if not self.request.user or not self.request.user.is_authenticated:
            # For development, use a default user
            try:
                user = User.objects.get(username='mccarvik')
                profile, created = UserProfile.objects.get_or_create(user=user)
                return profile
            except User.DoesNotExist:
                raise Http404("Profile not found")
        
        # For authenticated users, use the default behavior
        return super().get_object()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        # Handle unauthenticated users in development mode
        if not request.user or not request.user.is_authenticated:
            # For development, use a default user
            try:
                user = User.objects.get(username='mccarvik')
                profile, created = UserProfile.objects.get_or_create(user=user)
                serializer = self.get_serializer(profile)
                return Response(serializer.data)
            except User.DoesNotExist:
                return Response({
                    'id': 1,
                    'username': 'development_user',
                    'email': 'dev@example.com'
                })
        
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def project_wealth(request):
    print("Project wealth endpoint called")
    print("Request headers:", request.headers)
    print("Request user:", request.user)
    print("Request auth:", request.auth)
    print("Request data:", request.data)
    
    try:
        # Validate required fields
        required_fields = [
            'age', 'startWealth', 'debt', 'debtInterest',
            'assetInterest', 'inflation', 'taxRate', 'annualContributions'
        ]
        
        for field in required_fields:
            if field not in request.data:
                print(f"Missing required field: {field}")
                return Response(
                    {'error': f'Missing required field: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Calculate projection
        print("Calculating projection with data:", request.data)
        projections = calculate_wealth_projection(request.data)
        print("Projection calculated successfully")
        
        response_data = {
            'projections': projections,
            'summary': {
                'starting_age': int(request.data['age']),
                'ending_age': int(request.data['age']) + 99,
                'starting_wealth': float(request.data['startWealth']),
                'starting_debt': float(request.data['debt']),
                'final_wealth': projections[-1]['wealth'],
                'final_debt': projections[-1]['debt'],
                'final_net_worth': projections[-1]['net_worth'],
                'final_adjusted_net_worth': projections[-1]['adjusted_net_worth']
            }
        }
        print("Sending response:", response_data)
        return Response(response_data)
        
    except Exception as e:
        print("Error in project_wealth:", str(e))
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def calculate_net_savings(request):
    """Calculate net savings using the same logic as debt planning"""
    try:
        # Handle unauthenticated users in development mode
        if not request.user or not request.user.is_authenticated:
            return Response({'net_savings': 0, 'annual_contributions': 0})
        
        # Get the user's budget
        budget = Budget.objects.filter(user=request.user).order_by('-updated_at').first()
        
        if not budget:
            return Response({'net_savings': 0, 'annual_contributions': 0})
        
        # Calculate total income
        total_income = (budget.income or 0) + (getattr(budget, 'additional_income', 0) or 0)
        
        # Add additional income items
        if budget.additional_items:
            additional_income = sum(
                item.get('amount', 0) for item in budget.additional_items 
                if item.get('type') == 'income'
            )
            total_income += additional_income
        
        # Calculate total expenses from base categories
        base_expenses = (
            (budget.housing or 0) +
            (budget.transportation or 0) +
            (budget.food or 0) +
            (budget.healthcare or 0) +
            (budget.entertainment or 0) +
            (budget.shopping or 0) +
            (budget.travel or 0) +
            (budget.education or 0) +
            (budget.utilities or 0) +
            (budget.childcare or 0) +
            (budget.other or 0)
        )
        
        # Add additional expense items
        additional_expenses = 0
        if budget.additional_items:
            additional_expenses = sum(
                item.get('amount', 0) for item in budget.additional_items 
                if item.get('type') == 'expense'
            )
        
        total_expenses = base_expenses + additional_expenses
        
        # Calculate total savings goals
        total_savings_goals = 0
        if budget.savings:
            total_savings_goals = sum(item.get('amount', 0) for item in budget.savings)
        
        # Calculate net savings (same as debt planning)
        net_savings = total_income - total_expenses - total_savings_goals
        annual_contributions = net_savings * 12
        
        return Response({
            'net_savings': net_savings,
            'annual_contributions': annual_contributions,
            'breakdown': {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'total_savings_goals': total_savings_goals,
                'base_expenses': base_expenses,
                'additional_expenses': additional_expenses
            }
        })
        
    except Exception as e:
        print(f"Error calculating net savings: {str(e)}")
        return Response(
            {'error': 'Failed to calculate net savings'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([])  # Added this, as without it. wasnt registering users
def register_user(request):
    """
    Register a new user with MongoDB integration
    """
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Validate required fields
        if not username or not email or not password:
            return Response(
                {'error': 'Username, email, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists in Django ORM
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Import MongoDB services
        from .mongodb_services import MongoDBService, MongoUser
        
        # Check if user exists in MongoDB
        mongo_user = MongoDBService.get_user_by_username(username)
        if mongo_user:
            return Response(
                {'error': 'Username already exists in database'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the Django user first to get a valid password hash
        user = User.objects.create_user(username=username, email=email, password=password)
        # Mirror: create Mongo user with same id (single source of truth for domain data)
        try:
            from .mongodb_services import MongoUser
            mu = MongoUser(
                id=user.id,
                username=user.username,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                is_active=user.is_active,
                date_joined=user.date_joined,
                password=user.password,
            )
            mu.save()
        except Exception as e:
            # If Mongo mirror fails, rollback Django user
            user.delete()
            return Response({'error': 'Failed to create user in MongoDB'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(
            {
                'message': 'User registered successfully',
                'user_id': user.id,
                'username': user.username
            },
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def calculate_financial_steps(request):
    """Calculate financial steps dynamically from user data."""
    try:
        # Handle unauthenticated users in development mode
        if not request.user or not request.user.is_authenticated:
            # Use MongoDB data for development
            from .mongodb_services import HybridDataService
            mongo_accounts = HybridDataService.get_all_accounts()
            mongo_debts = HybridDataService.get_all_debts()
            
            # Convert to Django ORM format for compatibility
            accounts = []
            for acc in mongo_accounts:
                class MockAccount:
                    def __init__(self, data):
                        for key, value in data.items():
                            setattr(self, key, value)
                
                account_dict = {
                    'id': acc.id,
                    'user_id': acc.user_id,
                    'name': acc.name,
                    'account_type': acc.account_type,
                    'balance': acc.balance,
                    'interest_rate': acc.interest_rate,
                    'effective_date': acc.effective_date,
                    'created_at': acc.created_at,
                    'updated_at': acc.updated_at
                }
                accounts.append(MockAccount(account_dict))
            
            debts = []
            for debt in mongo_debts:
                class MockDebt:
                    def __init__(self, data):
                        for key, value in data.items():
                            setattr(self, key, value)
                
                debt_dict = {
                    'id': debt.id,
                    'user_id': debt.user_id,
                    'name': debt.name,
                    'debt_type': debt.debt_type,
                    'balance': debt.balance,
                    'interest_rate': debt.interest_rate,
                    'effective_date': debt.effective_date,
                    'payoff_date': debt.payoff_date,
                    'created_at': debt.created_at,
                    'updated_at': debt.updated_at
                }
                debts.append(MockDebt(debt_dict))
        else:
            # For authenticated users, use MongoDB data
            from .mongodb_services import MongoDBService
            mongo_accounts = MongoDBService.get_user_accounts(request.user.id)
            mongo_debts = MongoDBService.get_user_debts(request.user.id)
            
            # Convert to Django ORM format for compatibility
            accounts = []
            for acc in mongo_accounts:
                class MockAccount:
                    def __init__(self, data):
                        for key, value in data.items():
                            setattr(self, key, value)
                
                account_dict = {
                    'id': acc.id,
                    'user_id': acc.user_id,
                    'name': acc.name,
                    'account_type': acc.account_type,
                    'balance': acc.balance,
                    'interest_rate': acc.interest_rate,
                    'effective_date': acc.effective_date,
                    'created_at': acc.created_at,
                    'updated_at': acc.updated_at
                }
                accounts.append(MockAccount(account_dict))
            
            debts = []
            for debt in mongo_debts:
                class MockDebt:
                    def __init__(self, data):
                        for key, value in data.items():
                            setattr(self, key, value)
                
                debt_dict = {
                    'id': debt.id,
                    'user_id': debt.user_id,
                    'name': debt.name,
                    'debt_type': debt.debt_type,
                    'balance': debt.balance,
                    'interest_rate': debt.interest_rate,
                    'effective_date': debt.effective_date,
                    'payoff_date': debt.payoff_date,
                    'created_at': debt.created_at,
                    'updated_at': debt.updated_at
                }
                debts.append(MockDebt(debt_dict))
        
        # Calculate total account balance
        total_account_balance = sum(float(acc.balance) for acc in accounts) if accounts else Decimal('0.00')
        
        # Calculate total debt (excluding mortgage)
        total_debt = sum(float(debt.balance) for debt in debts if debt.debt_type != 'mortgage') if debts else Decimal('0.00')
        
        # Calculate mortgage balance
        mortgage_balance = sum(float(debt.balance) for debt in debts if debt.debt_type == 'mortgage') if debts else Decimal('0.00')
        
        # Get user's budget for monthly expenses
        monthly_expenses = Decimal('0.00')
        if not request.user or not request.user.is_authenticated:
            # Use MongoDB data for development
            from .mongodb_services import HybridDataService
            mongo_budgets = HybridDataService.get_all_budgets()
            if mongo_budgets:
                budget = mongo_budgets[0]  # Use first budget for development
                expense_fields = [
                    'housing', 'debt_payments', 'transportation', 'utilities',
                    'food', 'healthcare', 'entertainment', 'shopping',
                    'travel', 'education', 'childcare', 'other'
                ]
                monthly_expenses = sum(float(getattr(budget, field, 0)) for field in expense_fields)
                if budget.additional_items:
                    additional_expenses = sum(
                        item.get('amount', 0) for item in budget.additional_items 
                        if item.get('type') == 'expense'
                    )
                    monthly_expenses += additional_expenses
        else:
            # For authenticated users, use MongoDB data
            from .mongodb_services import MongoDBService
            mongo_budgets = MongoDBService.get_user_budgets(request.user.id)
            if mongo_budgets:
                budget = mongo_budgets[0]  # Use first budget
                expense_fields = [
                    'housing', 'debt_payments', 'transportation', 'utilities',
                    'food', 'healthcare', 'entertainment', 'shopping',
                    'travel', 'education', 'childcare', 'other'
                ]
                monthly_expenses = sum(float(getattr(budget, field, 0)) for field in expense_fields)
                if budget.additional_items:
                    additional_expenses = sum(
                        item.get('amount', 0) for item in budget.additional_items 
                        if item.get('type') == 'expense'
                    )
                    monthly_expenses += additional_expenses
        
        # Determine current step and progress
        current_step = 1
        step_progress = {}
        
        # Step 1: Save $2,000 for emergency fund
        if total_account_balance >= 2000:
            current_step = 2
            step_progress = {'completed': True, 'next_step': 2}
        else:
            progress = min((total_account_balance / 2000) * 100, 100)
            step_progress = {
                'completed': False,
                'progress': progress,
                'current_amount': total_account_balance,
                'goal_amount': 2000
            }
        
        # Step 2: Pay off all debt (except mortgage)
        if current_step == 2:
            # Get current debt (from latest records only - what's displayed)
            current_debts = [debt for debt in debts if debt.debt_type != 'mortgage']
            current_total_debt = sum(float(debt.balance) for debt in current_debts) if current_debts else Decimal('0.00')
            
            # For simplicity, use current debt as max debt (since we don't have historical data in this format)
            max_total_debt = current_total_debt
            
            # Calculate progress: how much paid off from max
            if max_total_debt > 0:
                # Progress = (max_debt - current_debt) / max_debt * 100
                progress = max(0, min(100, ((max_total_debt - current_total_debt) / max_total_debt) * 100))
                amount_paid_off = max_total_debt - current_total_debt
            else:
                progress = 100  # No debt ever, so 100% complete
                amount_paid_off = Decimal('0.00')
            
            if current_total_debt <= 0:
                current_step = 3
                step_progress = {'completed': True, 'next_step': 3}
            else:
                step_progress = {
                    'completed': False,
                    'progress': progress,
                    'current_debt': current_total_debt,
                    'max_total_debt': max_total_debt,
                    'amount_paid_off': amount_paid_off,
                    'goal_amount': 0,
                    'message': f'Paid off ${amount_paid_off:,.2f} of ${max_total_debt:,.2f} total debt ({progress:.1f}% complete)'
                }
        
        # Step 3: 3-6 months emergency fund
        if current_step == 3 and monthly_expenses > 0:
            target_emergency = monthly_expenses * 6  # 6 months
            if total_account_balance >= Decimal(str(target_emergency)):
                current_step = 4
                step_progress = {'completed': True, 'next_step': 4}
            else:
                progress = min((float(total_account_balance) / target_emergency) * 100, 100)
                step_progress = {
                    'completed': False,
                    'progress': progress,
                    'current_amount': float(total_account_balance),
                    'goal_amount': target_emergency
                }
        elif current_step == 3:
            step_progress = {
                'completed': False,
                'progress': 0,
                'message': 'Please set your monthly expenses to calculate emergency fund goal'
            }
        
        # Step 4: Invest 15% in retirement (placeholder - would need income data)
        if current_step == 4:
            # For now, assume they need to manually set this
            step_progress = {
                'completed': False,
                'progress': 0,
                'message': 'Set your retirement contribution to 15% of income'
            }
        
        # Step 5: College fund (placeholder)
        if current_step == 5:
            step_progress = {
                'completed': False,
                'progress': 0,
                'message': 'Set up college fund for children'
            }
        
        # Step 6: Pay off mortgage
        if current_step == 6:
            if mortgage_balance <= 0:
                step_progress = {'completed': True, 'final_step': True}
            else:
                step_progress = {
                    'completed': False,
                    'progress': 0,
                    'current_mortgage': mortgage_balance,
                    'goal_amount': 0
                }
        
        response_data = {
            'current_step': current_step,
            'step_progress': step_progress,
            'total_account_balance': total_account_balance,
            'total_debt': total_debt,
            'mortgage_balance': mortgage_balance,
            'monthly_expenses': monthly_expenses
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error calculating financial steps: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to calculate financial steps', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Audit viewsets removed in Mongo-only mode; audits can be reintroduced later using Mongo collections

class DebtViewSet(viewsets.ModelViewSet):
    # Temporarily disabled for development
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]
    serializer_class = DebtSerializer
    


    def get_queryset(self):
        # Handle unauthenticated users in development mode
        if not self.request.user or not self.request.user.is_authenticated:
            # Return all debts from MongoDB for development
            from .mongodb_services import HybridDataService
            mongo_debts = HybridDataService.get_all_debts()
            # Convert MongoDB objects to Django ORM format for serializer compatibility
            debts_data = []
            for debt in mongo_debts:
                # Create a mock Django ORM object
                class MockDebt:
                    def __init__(self, data):
                        for key, value in data.items():
                            setattr(self, key, value)
                
                debt_dict = {
                    'id': debt.id,
                    'user_id': debt.user_id,
                    'name': debt.name,
                    'debt_type': debt.debt_type,
                    'balance': debt.balance,
                    'interest_rate': debt.interest_rate,
                    'effective_date': debt.effective_date,
                    'payoff_date': debt.payoff_date,
                    'created_at': debt.created_at,
                    'updated_at': debt.updated_at
                }
                debts_data.append(MockDebt(debt_dict))
            
            # Return a mock queryset
            class MockQuerySet:
                def __init__(self, data):
                    self.data = data
                
                def __iter__(self):
                    return iter(self.data)
                
                def __len__(self):
                    return len(self.data)
            
            return MockQuerySet(debts_data)
        
        # For authenticated users, route based on feature flag
        if getattr(settings, 'USE_MONGO_DEBTS', True):
            from .mongodb_services import MongoDBService
            mongo_debts = MongoDBService.get_user_debts(self.request.user.id)
        else:
            # If we are removing SQLite entirely, do not use ORM
            return Debt.objects.none()
        debts_data = []
        for debt in mongo_debts:
            class MockDebt:
                def __init__(self, data):
                    for key, value in data.items():
                        setattr(self, key, value)
            
            debt_dict = {
                'id': debt.id,
                'user_id': debt.user_id,
                'name': debt.name,
                'debt_type': debt.debt_type,
                'balance': debt.balance,
                'interest_rate': debt.interest_rate,
                'effective_date': debt.effective_date,
                'payoff_date': debt.payoff_date,
                'created_at': debt.created_at,
                'updated_at': debt.updated_at
            }
            debts_data.append(MockDebt(debt_dict))
        
        class MockQuerySet:
            def __init__(self, data):
                self.data = data
            
            def __iter__(self):
                return iter(self.data)
            
            def __len__(self):
                return len(self.data)
        
        return MockQuerySet(debts_data)

    def get_object(self):
        """Override get_object to work with MongoDB data"""
        print(f"🔍 DebtViewSet.get_object called - User authenticated: {self.request.user.is_authenticated if self.request.user else False}")
        print(f"🔍 Request method: {self.request.method}")
        print(f"🔍 Request path: {self.request.path}")
        
        # For development, always use MongoDB regardless of authentication
        from .mongodb_services import MongoDebt
        
        # Get the debt ID from the URL and convert to int
        debt_id = int(self.kwargs.get('pk'))
        print(f"🔍 Looking for debt ID: {debt_id}")
        
        try:
            # Get debt from MongoDB
            mongo_debt = MongoDebt.objects.get(id=debt_id)
            print(f"✅ Found debt: {mongo_debt.name} (ID: {mongo_debt.id})")
            
            # Create a mock Django ORM object
            class MockDebt:
                def __init__(self, data):
                    for key, value in data.items():
                        setattr(self, key, value)
            
            debt_dict = {
                'id': mongo_debt.id,
                'user_id': mongo_debt.user_id,
                'name': mongo_debt.name,
                'debt_type': mongo_debt.debt_type,
                'balance': mongo_debt.balance,
                'interest_rate': mongo_debt.interest_rate,
                'effective_date': mongo_debt.effective_date,
                'payoff_date': mongo_debt.payoff_date,
                'created_at': mongo_debt.created_at,
                'updated_at': mongo_debt.updated_at
            }
            
            return MockDebt(debt_dict)
        except MongoDebt.DoesNotExist:
            print(f"❌ Debt ID {debt_id} not found in MongoDB")
            from django.http import Http404
            raise Http404("Debt not found")

    def perform_create(self, serializer):
        # Handle unauthenticated users in development mode
        if not self.request.user or not self.request.user.is_authenticated:
            # For development, save directly to MongoDB
            try:
                from .mongodb_services import MongoDebt
                from datetime import datetime
                
                # Get the next available ID
                existing_debts = MongoDebt.objects.all()
                next_id = max([debt.id for debt in existing_debts], default=0) + 1
                
                # Create debt data
                debt_data = serializer.validated_data
                mongo_debt = MongoDebt(
                    id=next_id,
                    user_id=1,  # Default user ID for development
                    name=debt_data.get('name'),
                    debt_type=debt_data.get('debt_type'),
                    balance=debt_data.get('balance'),
                    interest_rate=debt_data.get('interest_rate'),
                    effective_date=debt_data.get('effective_date'),
                    payoff_date=debt_data.get('payoff_date'),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                mongo_debt.save()
                print(f"✅ MongoDB debt created: {next_id}")
                
                # Update the serializer instance with the new ID
                serializer.instance = type('MockDebt', (), {
                    'id': next_id,
                    'user_id': 1,
                    'name': mongo_debt.name,
                    'debt_type': mongo_debt.debt_type,
                    'balance': mongo_debt.balance,
                    'interest_rate': mongo_debt.interest_rate,
                    'effective_date': mongo_debt.effective_date,
                    'payoff_date': mongo_debt.payoff_date,
                    'created_at': mongo_debt.created_at,
                    'updated_at': mongo_debt.updated_at
                })()
            except Exception as e:
                print(f"❌ Error creating MongoDB debt: {e}")
                raise
        else:
            # For authenticated users, save according to flags
            if getattr(settings, 'DUAL_WRITE_DEBTS', True):
                debt = serializer.save(user=self.request.user)
                try:
                    from .mongodb_services import MongoDebt
                    mongo_debt = MongoDebt(
                        id=debt.id,
                        user_id=debt.user.id,
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
                    print(f"✅ MongoDB debt created: {debt.id}")
                except Exception as e:
                    print(f"❌ Error creating MongoDB debt: {e}")
            elif getattr(settings, 'USE_MONGO_DEBTS', True):
                try:
                    from .mongodb_services import MongoDebt
                    from datetime import datetime
                    existing = MongoDebt.objects.order_by('-id').first()
                    next_id = (existing.id + 1) if existing else 1
                    data = serializer.validated_data
                    mongo_debt = MongoDebt(
                        id=next_id,
                        user_id=self.request.user.id,
                        name=data.get('name'),
                        debt_type=data.get('debt_type'),
                        balance=data.get('balance'),
                        interest_rate=data.get('interest_rate'),
                        effective_date=data.get('effective_date'),
                        payoff_date=data.get('payoff_date'),
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    mongo_debt.save()
                    serializer.instance = type('MockDebt', (), {
                        'id': mongo_debt.id,
                        'user_id': mongo_debt.user_id,
                        'name': mongo_debt.name,
                        'debt_type': mongo_debt.debt_type,
                        'balance': mongo_debt.balance,
                        'interest_rate': mongo_debt.interest_rate,
                        'effective_date': mongo_debt.effective_date,
                        'payoff_date': mongo_debt.payoff_date,
                        'created_at': mongo_debt.created_at,
                        'updated_at': mongo_debt.updated_at
                    })()
                except Exception as e:
                    print(f"❌ Error creating MongoDB debt (mongo-only): {e}")
                    raise
            else:
                serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        print(f"🔍 DebtViewSet.perform_update called - User authenticated: {self.request.user.is_authenticated if self.request.user else False}")
        print(f"🔍 Request method: {self.request.method}")
        print(f"🔍 Request path: {self.request.path}")
        
        # For development, always use MongoDB regardless of authentication
        try:
            from .mongodb_services import MongoDebt
            from datetime import datetime
            
            # Get the debt ID from the URL and convert to int
            debt_id = int(self.kwargs.get('pk'))
            print(f"🔍 Updating debt ID: {debt_id}")
            
            # Update in MongoDB
            mongo_debt = MongoDebt.objects.get(id=debt_id)
            debt_data = serializer.validated_data
            print(f"🔍 Update data: {debt_data}")
            
            for field, value in debt_data.items():
                if hasattr(mongo_debt, field):
                    setattr(mongo_debt, field, value)
            
            mongo_debt.updated_at = datetime.now()
            mongo_debt.save()
            print(f"✅ MongoDB debt updated: {debt_id}")
            
            # Update the serializer instance
            serializer.instance = type('MockDebt', (), {
                'id': mongo_debt.id,
                'user_id': mongo_debt.user_id,
                'name': mongo_debt.name,
                'debt_type': mongo_debt.debt_type,
                'balance': mongo_debt.balance,
                'interest_rate': mongo_debt.interest_rate,
                'effective_date': mongo_debt.effective_date,
                'payoff_date': mongo_debt.payoff_date,
                'created_at': mongo_debt.created_at,
                'updated_at': mongo_debt.updated_at
            })()
        except Exception as e:
            print(f"❌ Error updating MongoDB debt: {e}")
            raise

    def perform_destroy(self, instance):
        """Override perform_destroy to work with MongoDB data"""
        print(f"🔍 DebtViewSet.perform_destroy called - User authenticated: {self.request.user.is_authenticated if self.request.user else False}")
        print(f"🔍 Request method: {self.request.method}")
        print(f"🔍 Request path: {self.request.path}")
        print(f"🔍 Instance ID: {instance.id if instance else 'None'}")
        
        # For development, always use MongoDB regardless of authentication
        try:
            from .mongodb_services import MongoDebt
            
            # Get the debt ID from the instance
            debt_id = instance.id
            
            # Delete from MongoDB
            mongo_debt = MongoDebt.objects.get(id=debt_id)
            mongo_debt.delete()
            print(f"✅ MongoDB debt deleted: {debt_id}")
        except Exception as e:
            print(f"❌ Error deleting MongoDB debt: {e}")
            raise

    def update(self, request, *args, **kwargs):
        # Update existing record instead of creating new one
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}
        
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_settings(request):
    """
    Get user settings (placeholder endpoint)
    Returns hardcoded settings data for now
    """
    settings_data = {
        "theme": "light",
        "payment_plan": "basic",
        "notifications": {
            "email": True,
            "push": False,
            "sms": False
        },
        "language": "en",
        "timezone": "UTC"
    }
    
    return Response(settings_data)

# Profile Management Views
@api_view(['POST'])
@permission_classes([AllowAny])  # Temporarily disabled for development
def change_password(request):
    """
    Change user password
    """
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        # Handle unauthenticated users in development mode
        if not request.user.is_authenticated:
            # For development, use a default user
            try:
                user = User.objects.get(username='mccarvik')
            except User.DoesNotExist:
                return Response(
                    {'error': 'Development user not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            user = request.user
        
        # Check if old password is correct
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Current password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        # Mirror to Mongo user
        try:
            from .mongodb_services import MongoDBService
            mongo_user = MongoDBService.get_user_by_id(user.id)
            if mongo_user:
                mongo_user.password = user.password
                mongo_user.save()
        except Exception as e:
            print(f"Warning: failed to mirror password change to Mongo: {e}")
        
        return Response({'message': 'Password changed successfully'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])  # Temporarily disabled for development
def update_username(request):
    """
    Update username
    """
    serializer = UpdateUsernameSerializer(data=request.data)
    if serializer.is_valid():
        # Handle unauthenticated users in development mode
        if not request.user.is_authenticated:
            # For development, use a default user
            try:
                user = User.objects.get(username='mccarvik')
            except User.DoesNotExist:
                return Response(
                    {'error': 'Development user not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            user = request.user
            
        new_username = serializer.validated_data['new_username']
        
        # Check if username is already taken
        if User.objects.filter(username=new_username).exclude(id=user.id).exists():
            return Response(
                {'error': 'Username is already taken'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.username = new_username
        user.save()
        # Mirror to Mongo user
        try:
            from .mongodb_services import MongoDBService
            mongo_user = MongoDBService.get_user_by_id(user.id)
            if mongo_user:
                mongo_user.username = user.username
                mongo_user.save()
        except Exception as e:
            print(f"Warning: failed to mirror username change to Mongo: {e}")
        
        return Response({'message': 'Username updated successfully'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])  # Temporarily disabled for development
def delete_account(request):
    """
    Delete user account
    """
    serializer = DeleteAccountSerializer(data=request.data)
    if serializer.is_valid():
        # Handle unauthenticated users in development mode
        if not request.user.is_authenticated:
            # For development, use a default user
            try:
                user = User.objects.get(username='mccarvik')
            except User.DoesNotExist:
                return Response(
                    {'error': 'Development user not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            user = request.user
        
        # Check if password is correct
        if not user.check_password(serializer.validated_data['password']):
            return Response(
                {'error': 'Password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete user (this will cascade delete all related data)
        user.delete()
        # Also delete Mongo user and domain docs
        try:
            from .mongodb_services import MongoUser, MongoAccount, MongoDebt, MongoBudget, MongoUserProfile
            # Delete user doc
            mu = MongoUser.objects.filter(id=user.id).first()
            if mu:
                mu.delete()
            # Delete domain docs by user_id
            MongoAccount.objects.filter(user_id=user.id).delete()
            MongoDebt.objects.filter(user_id=user.id).delete()
            MongoBudget.objects.filter(user_id=user.id).delete()
            mup = MongoUserProfile.objects.filter(user_id=user.id).first()
            if mup:
                mup.delete()
        except Exception as e:
            print(f"Warning: failed to delete Mongo user/domain docs: {e}")
        
        return Response({'message': 'Account deleted successfully'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])  # Temporarily disabled for development
def upload_profile_image(request):
    """
    Upload profile image
    """
    if 'image' not in request.FILES:
        return Response(
            {'error': 'No image file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    image_file = request.FILES['image']
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif']
    if image_file.content_type not in allowed_types:
        return Response(
            {'error': 'Invalid file type. Only JPEG, PNG, and GIF are allowed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (max 5MB)
    if image_file.size > 5 * 1024 * 1024:
        return Response(
            {'error': 'File size too large. Maximum size is 5MB'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Handle unauthenticated users in development mode
        if not request.user.is_authenticated:
            # For development, use a default user
            try:
                user = User.objects.get(username='mccarvik')
            except User.DoesNotExist:
                return Response(
                    {'error': 'Development user not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            user = request.user
        
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Delete old image if exists
        if profile.profile_image:
            profile.profile_image.delete(save=False)
        
        # Save new image
        profile.profile_image = image_file
        profile.save()
        
        # Return updated profile data
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': f'Error uploading image: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])  # Temporarily disabled for development
def delete_profile_image(request):
    """
    Delete profile image
    """
    try:
        # Handle unauthenticated users in development mode
        if not request.user.is_authenticated:
            # For development, use a default user
            try:
                user = User.objects.get(username='mccarvik')
            except User.DoesNotExist:
                return Response(
                    {'error': 'Development user not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            user = request.user
        
        # Get user profile
        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delete image if exists
        if profile.profile_image:
            profile.profile_image.delete(save=False)
            profile.profile_image = None
            profile.save()
            return Response({'message': 'Profile image deleted successfully'})
        else:
            return Response(
                {'error': 'No profile image to delete'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
    except Exception as e:
        return Response(
            {'error': f'Error deleting image: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# MongoDB-based UserProfile Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile_mongo(request):
    """Get user profile from MongoDB"""
    try:
        user_id = request.user.id
        mongo_profile = MongoDBService.get_user_profile(user_id)
        
        if mongo_profile:
            profile_data = DataConverter.mongo_userprofile_to_dict(mongo_profile)
            # Add username, email, and date_joined from Django User
            profile_data['username'] = request.user.username
            profile_data['email'] = request.user.email
            profile_data['date_joined'] = request.user.date_joined.isoformat() if request.user.date_joined else None
            return Response(profile_data)
        else:
            # Return empty profile structure
            return Response({
                'id': None,
                'user_id': user_id,
                'username': request.user.username,
                'email': request.user.email,
                'date_joined': request.user.date_joined.isoformat() if request.user.date_joined else None,
                'age': None,
                'sex': None,
                'marital_status': None,
                'profile_image': None,
                'bio': None,
                'phone': None,
                'address': None,
                'date_of_birth': None,
                'created_at': None,
                'updated_at': None
            })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile_mongo(request):
    """Update user profile in MongoDB"""
    try:
        user_id = request.user.id
        profile_data = request.data
        
        print(f"🔧 Updating profile for user {user_id}")
        print(f"📝 Profile data received: {profile_data}")
        
        # Remove fields that shouldn't be updated
        profile_data.pop('id', None)
        profile_data.pop('user_id', None)
        profile_data.pop('username', None)
        profile_data.pop('email', None)
        profile_data.pop('created_at', None)
        profile_data.pop('updated_at', None)
        
        print(f"📝 Cleaned profile data: {profile_data}")
        
        # Validate required fields
        if 'age' in profile_data and profile_data['age']:
            try:
                age = int(profile_data['age'])
                if age < 0 or age > 150:
                    return Response({'error': 'Age must be between 0 and 150'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid age value'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update profile in MongoDB
        updated_profile = MongoDBService.update_user_profile(user_id, profile_data)
        
        if updated_profile:
            print(f"✅ Profile updated successfully for user {user_id}")
            profile_data = DataConverter.mongo_userprofile_to_dict(updated_profile)
            profile_data['username'] = request.user.username
            profile_data['email'] = request.user.email
            profile_data['date_joined'] = request.user.date_joined.isoformat() if request.user.date_joined else None
            return Response(profile_data)
        else:
            print(f"❌ Failed to update profile for user {user_id}")
            return Response({'error': 'Failed to update profile - MongoDB operation failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(f"❌ Error updating profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_image_mongo(request):
    """Upload profile image and store path in MongoDB"""
    try:
        user_id = request.user.id
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Save image to media folder
        import os
        from django.conf import settings
        from django.core.files.storage import default_storage
        
        # Create directory if it doesn't exist
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'profile_images')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        file_extension = os.path.splitext(image_file.name)[1]
        filename = f"profile_{user_id}_{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join('profile_images', filename)
        
        # Save file
        saved_path = default_storage.save(file_path, image_file)
        
        # Update profile in MongoDB
        profile_data = {'profile_image': saved_path}
        updated_profile = MongoDBService.update_user_profile(user_id, profile_data)
        
        if updated_profile:
            profile_data = DataConverter.mongo_userprofile_to_dict(updated_profile)
            profile_data['username'] = request.user.username
            profile_data['email'] = request.user.email
            
            # Add full URL for profile image
            if profile_data['profile_image']:
                request = request._request  # Get the original request
                profile_data['profile_image_url'] = request.build_absolute_uri(settings.MEDIA_URL + profile_data['profile_image'])
            
            return Response(profile_data)
        else:
            return Response({'error': 'Failed to update profile'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_profile_image_mongo(request):
    """Delete profile image from MongoDB and file system"""
    try:
        user_id = request.user.id
        
        # Get current profile
        mongo_profile = MongoDBService.get_user_profile(user_id)
        
        if not mongo_profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if mongo_profile.profile_image:
            # Delete file from storage
            from django.core.files.storage import default_storage
            if default_storage.exists(mongo_profile.profile_image):
                default_storage.delete(mongo_profile.profile_image)
            
            # Update profile in MongoDB
            profile_data = {'profile_image': None}
            updated_profile = MongoDBService.update_user_profile(user_id, profile_data)
            
            if updated_profile:
                profile_data = DataConverter.mongo_userprofile_to_dict(updated_profile)
                profile_data['username'] = request.user.username
                profile_data['email'] = request.user.email
                return Response(profile_data)
        
        return Response({'error': 'No profile image to delete'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
