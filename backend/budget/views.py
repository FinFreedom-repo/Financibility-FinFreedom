from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
from datetime import datetime
from .models import Budget
from .serializers import BudgetSerializer
from rest_framework.decorators import action

# Create your views here.

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    # Temporarily disabled for development
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        print("Getting queryset for budget data")
        # For development without authentication, return all budgets
        if not self.request.user or not self.request.user.is_authenticated:
            print("No authenticated user, returning all budgets for development")
            return Budget.objects.all()
        return Budget.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        print("List method called")
        
        # FIXED: Return only the current month's budget, not all budgets
        # This prevents the frontend from getting confused about which budget to use
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        if self.request.user and self.request.user.is_authenticated:
            current_budget = Budget.objects.filter(
                user=request.user,
                month=current_month,
                year=current_year
            ).first()
        else:
            # For development without authentication, get current month budget
            current_budget = Budget.objects.filter(
                month=current_month,
                year=current_year
            ).first()
        
        if current_budget:
            serializer = self.get_serializer(current_budget)
            print("Returning current month budget:", serializer.data)
            return Response([serializer.data])  # Return as list for consistency
        else:
            print("No current month budget found, returning empty list")
            return Response([])

    def create(self, request, *args, **kwargs):
        print("Create method called with data:", request.data)
        
        # FIXED: Handle the case where a budget already exists for the current month
        # This prevents unique constraint violations
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # Check if budget already exists for current user, month, and year
        # Handle case where user is not authenticated (for development)
        if request.user and request.user.is_authenticated:
            existing_budget = Budget.objects.filter(
                user=request.user,
                month=current_month,
                year=current_year
            ).first()
        else:
            # For development without authentication, get any budget for current month
            existing_budget = Budget.objects.filter(
                month=current_month,
                year=current_year
            ).first()
        
        if existing_budget:
            print("Budget already exists for current month, updating instead of creating")
            # Update the existing budget
            serializer = self.get_serializer(existing_budget, data=request.data, partial=False)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            print("Creating new budget object for current month")
            return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        print("Update method called with data:", request.data)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        print("Partial update method called with data:", request.data)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=False, methods=['post', 'put'], url_path='update-current')
    def update_current_budget(self, request):
        """
        Update or create budget for the current month
        """
        print("Update current budget called with data:", request.data)
        
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # Try to get existing budget for current user, month, and year
        # Handle case where user is not authenticated (for development)
        if request.user and request.user.is_authenticated:
            existing_budget = Budget.objects.filter(
                user=request.user,
                month=current_month,
                year=current_year
            ).first()
        else:
            # For development without authentication, get any budget for current month
            existing_budget = Budget.objects.filter(
                month=current_month,
                year=current_year
            ).first()
        
        budget_data = request.data.copy()
        budget_data['month'] = current_month
        budget_data['year'] = current_year
        
        if existing_budget:
            print("Updating existing budget for current month")
            serializer = self.get_serializer(existing_budget, data=budget_data, partial=False)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            print("Creating new budget for current month")
            serializer = self.get_serializer(data=budget_data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post', 'put'], url_path='update-month')
    def update_month_budget(self, request):
        """
        Update or create budget for a specific month (for debt planning projections)
        """
        print("Update month budget called with data:", request.data)
        
        # Extract month and year from request data
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not month or not year:
            return Response(
                {'error': 'Month and year are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to get existing budget for current user, month, and year
        existing_budget = Budget.objects.filter(
            user=request.user,
            month=month,
            year=year
        ).first()
        
        budget_data = request.data.copy()
        budget_data['month'] = month
        budget_data['year'] = year
        
        if existing_budget:
            print(f"Updating existing budget for month {month}/{year}")
            serializer = self.get_serializer(existing_budget, data=budget_data, partial=False)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            print(f"Creating new budget for month {month}/{year}")
            serializer = self.get_serializer(data=budget_data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='get-month')
    def get_month_budget(self, request):
        """
        Get budget for a specific month - FIXED: No fallback to current month
        """
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        
        if not month or not year:
            return Response(
                {'error': 'Month and year are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        budget = Budget.objects.filter(
            user=request.user,
            month=month,
            year=year
        ).first()
        
        if budget:
            serializer = self.get_serializer(budget)
            return Response(serializer.data)
        else:
            # FIXED: Return None instead of falling back to current month
            # This ensures month-specific data is truly separate
            return Response(None, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='all-budgets')
    def get_all_budgets(self, request):
        """
        Get all budgets for the current user (for debugging)
        """
        if self.request.user and self.request.user.is_authenticated:
            budgets = Budget.objects.filter(user=request.user).order_by('year', 'month')
        else:
            # For development without authentication, get all budgets
            budgets = Budget.objects.all().order_by('year', 'month')
        
        serializer = self.get_serializer(budgets, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        print("Performing create with data:", serializer.validated_data)
        # Handle case where user is not authenticated (for development)
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            # For development without authentication, use the first user or create one
            from django.contrib.auth.models import User
            user = User.objects.first()
            if not user:
                user = User.objects.create_user(username='testuser', password='testpass')
            serializer.save(user=user)

    def perform_update(self, serializer):
        print("Performing update with data:", serializer.validated_data)
        serializer.save()

    def get_permissions(self):
        print("Getting permissions for request method:", self.request.method)
        return super().get_permissions()

    def check_permissions(self, request):
        print("Checking permissions for request method:", request.method)
        return super().check_permissions(request)

    def check_object_permissions(self, request, obj):
        print("Checking object permissions for request method:", request.method)
        return super().check_object_permissions(request, obj)

    def get_object(self):
        print("Getting object for request method:", self.request.method)
        return super().get_object()

    def initial(self, request, *args, **kwargs):
        print("Initial request handling for method:", request.method)
        return super().initial(request, *args, **kwargs)
