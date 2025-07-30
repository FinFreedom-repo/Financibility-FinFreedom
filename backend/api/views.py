from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Account, Transaction, Category, UserProfile, Debt, AccountAudit, TransactionAudit, DebtAudit
from .serializers import AccountSerializer, TransactionSerializer, CategorySerializer, UserProfileSerializer, AccountAuditSerializer, TransactionAuditSerializer, DebtAuditSerializer, DebtSerializer
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

logger = logging.getLogger(__name__)
load_dotenv()

print("=== GrokExcelView module loaded ===")  # This will print when the module is imported

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
        user = self.request.user
        history = self.request.query_params.get('history')
        qs = Account.objects.filter(user=user)
        if history:
            return qs.order_by('-effective_date', '-created_at')
        # Only return the latest record for each account name
        latest_ids = (
            qs.values('name')
            .annotate(max_id=models.Max('id'))
            .values_list('max_id', flat=True)
        )
        return qs.filter(id__in=latest_ids)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save()

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
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CategoryViewSet(viewsets.ModelViewSet):
    # Temporarily disabled for development
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        # Handle unauthenticated users in development mode
        if not request.user or not request.user.is_authenticated:
            # Return a default profile for development
            return Response({
                'id': 1,
                'username': 'development_user',
                'email': 'dev@example.com',
                'first_name': 'Development',
                'last_name': 'User'
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
        total_income = budget.income or 0
        
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
    Register a new user
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
        
        # Check if user already exists
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
        
        # Create the user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Create a user profile
        UserProfile.objects.create(user=user)
        
        return Response(
            {'message': 'User registered successfully'},
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def calculate_financial_steps(request):
    """Calculate financial steps dynamically from user data."""
    try:
        # Get user's accounts and debts
        accounts = Account.objects.filter(user=request.user)
        debts = Debt.objects.filter(user=request.user)
        
        # Calculate total account balance
        total_account_balance = accounts.aggregate(
            total=models.Sum('balance')
        )['total'] or Decimal('0.00')
        
        # Calculate total debt (excluding mortgage)
        total_debt = debts.exclude(debt_type='mortgage').aggregate(
            total=models.Sum('balance')
        )['total'] or Decimal('0.00')
        
        # Calculate mortgage balance
        mortgage_balance = debts.filter(debt_type='mortgage').aggregate(
            total=models.Sum('balance')
        )['total'] or Decimal('0.00')
        
        # Get user's budget for monthly expenses
        budget = Budget.objects.filter(user=request.user).order_by('-updated_at').first()
        monthly_expenses = Decimal('0.00')
        if budget:
            expense_fields = [
                'housing', 'debt_payments', 'transportation', 'utilities',
                'food', 'healthcare', 'entertainment', 'shopping',
                'travel', 'education', 'childcare', 'other'
            ]
            monthly_expenses = sum(getattr(budget, field, 0) for field in expense_fields)
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
            current_debts = debts.exclude(debt_type='mortgage')
            # Get only the latest record for each debt name
            latest_debt_ids = (
                current_debts.values('name')
                .annotate(max_id=models.Max('id'))
                .values_list('max_id', flat=True)
            )
            current_debts_latest = current_debts.filter(id__in=latest_debt_ids)
            current_total_debt = current_debts_latest.aggregate(
                total=models.Sum('balance')
            )['total'] or Decimal('0.00')
            
            # Find max total non-mortgage debt ever from ALL historical records
            all_historical_debts = Debt.objects.filter(user=request.user).exclude(debt_type='mortgage')
            
            # Build a dict: {date: total_balance} for each effective date
            debt_by_date = defaultdict(Decimal)
            for debt in all_historical_debts:
                debt_by_date[debt.effective_date] += debt.balance
            
            # Find the maximum total debt ever
            max_total_debt = max(debt_by_date.values()) if debt_by_date else Decimal('0.00')
            
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

class AccountAuditViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AccountAuditSerializer

    def get_queryset(self):
        return AccountAudit.objects.filter(user=self.request.user)

class TransactionAuditViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionAuditSerializer

    def get_queryset(self):
        return TransactionAudit.objects.filter(user=self.request.user)

class DebtAuditViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DebtAuditSerializer

    def get_queryset(self):
        return DebtAudit.objects.filter(user=self.request.user)

class DebtViewSet(viewsets.ModelViewSet):
    # Temporarily disabled for development
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]
    serializer_class = DebtSerializer

    def get_queryset(self):
        user = self.request.user
        history = self.request.query_params.get('history')
        qs = Debt.objects.filter(user=user)
        if history:
            return qs.order_by('-effective_date', '-created_at')
        # Only return the latest record for each debt name
        latest_ids = (
            qs.values('name')
            .annotate(max_id=models.Max('id'))
            .values_list('max_id', flat=True)
        )
        return qs.filter(id__in=latest_ids)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save()

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
