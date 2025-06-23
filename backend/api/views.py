from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from .models import Account, Transaction, Category, UserProfile
from .serializers import AccountSerializer, TransactionSerializer, CategorySerializer, UserProfileSerializer
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
    permission_classes = [IsAuthenticated]
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
def calculate_net_savings(request):
    """Calculate net savings using the same logic as debt planning"""
    try:
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
