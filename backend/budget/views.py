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
from django.conf import settings

# Create your views here.

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    # Temporarily disabled for development
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        print("Getting queryset for budget data")
        # If using Mongo for budgets, provide a mock queryset
        if getattr(settings, 'USE_MONGO_BUDGET', False):
            try:
                from api.mongodb_services import MongoDBService
                mongo_budgets = (
                    MongoDBService.get_user_budgets(self.request.user.id)
                    if self.request.user and self.request.user.is_authenticated
                    else MongoDBService.get_all_budgets()
                )
                # Wrap as mock objects to keep serializer compatibility
                class MockBudget:
                    def __init__(self, b):
                        self.id = b.id
                        self.user_id = getattr(b, 'user_id', None)
                        self.income = getattr(b, 'income', 0)
                        self.additional_income = getattr(b, 'additional_income', 0)
                        self.housing = getattr(b, 'housing', 0)
                        self.debt_payments = getattr(b, 'debt_payments', 0)
                        self.transportation = getattr(b, 'transportation', 0)
                        self.utilities = getattr(b, 'utilities', 0)
                        self.food = getattr(b, 'food', 0)
                        self.healthcare = getattr(b, 'healthcare', 0)
                        self.entertainment = getattr(b, 'entertainment', 0)
                        self.shopping = getattr(b, 'shopping', 0)
                        self.travel = getattr(b, 'travel', 0)
                        self.education = getattr(b, 'education', 0)
                        self.childcare = getattr(b, 'childcare', 0)
                        self.other = getattr(b, 'other', 0)
                        self.additional_items = getattr(b, 'additional_items', [])
                        self.savings_items = getattr(b, 'savings_items', [])
                        self.month = getattr(b, 'month', None)
                        self.year = getattr(b, 'year', None)

                mock_list = [MockBudget(b) for b in mongo_budgets]

                class MockQuerySet:
                    def __init__(self, data):
                        self.data = data
                    def __iter__(self):
                        return iter(self.data)
                    def __len__(self):
                        return len(self.data)

                return MockQuerySet(mock_list)
            except Exception as e:
                print(f"Mongo budget get_queryset fallback to ORM due to error: {e}")
                # Fallback to ORM
        # Default no-ORM path when fully on Mongo
        return Budget.objects.none()

    def list(self, request, *args, **kwargs):
        print("List method called")
        
        # Return only the current month's budget
        # This prevents the frontend from getting confused about which budget to use
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        if getattr(settings, 'USE_MONGO_BUDGET', False):
            try:
                from api.mongodb_services import MongoBudget
                if self.request.user and self.request.user.is_authenticated:
                    current_budget = MongoBudget.objects.filter(
                        user_id=request.user.id,
                        month=current_month,
                        year=current_year
                    ).first()
                else:
                    current_budget = MongoBudget.objects.filter(
                        month=current_month,
                        year=current_year
                    ).first()
                if current_budget:
                    class MockBudget:
                        def __init__(self, b):
                            for field in [
                                'id','user_id','income','additional_income','housing','debt_payments','transportation',
                                'utilities','food','healthcare','entertainment','shopping','travel','education',
                                'childcare','other','additional_items','savings_items','month','year']:
                                setattr(self, field, getattr(b, field, None))
                    serializer = self.get_serializer(MockBudget(current_budget))
                    return Response([serializer.data])
                else:
                    return Response([])
            except Exception as e:
                print(f"Mongo list fallback to ORM due to error: {e}")

        if self.request.user and self.request.user.is_authenticated:
            current_budget = Budget.objects.filter(
                user=request.user,
                month=current_month,
                year=current_year
            ).first()
        else:
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
        
        # Handle the case where a budget already exists for the current month
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
        
        # Mongo-only upsert path: update if exists in Mongo, else create
        if getattr(settings, 'USE_MONGO_BUDGET', False) and not getattr(settings, 'DUAL_WRITE_BUDGET', False):
            try:
                from api.mongodb_services import MongoBudget
                data = request.data
                user_id = (request.user.id if request.user and request.user.is_authenticated else 1)
                mb = MongoBudget.objects.filter(user_id=user_id, month=current_month, year=current_year).first()
                if mb:
                    mb.income = data.get('income', 0)
                    mb.additional_income = data.get('additional_income', 0)
                    mb.housing = data.get('housing', 0)
                    mb.debt_payments = data.get('debt_payments', 0)
                    mb.transportation = data.get('transportation', 0)
                    mb.utilities = data.get('utilities', 0)
                    mb.food = data.get('food', 0)
                    mb.healthcare = data.get('healthcare', 0)
                    mb.entertainment = data.get('entertainment', 0)
                    mb.shopping = data.get('shopping', 0)
                    mb.travel = data.get('travel', 0)
                    mb.education = data.get('education', 0)
                    mb.childcare = data.get('childcare', 0)
                    mb.other = data.get('other', 0)
                    mb.additional_items = data.get('additional_items', [])
                    mb.savings_items = data.get('savings_items', [])
                    mb.updated_at = datetime.now()
                    mb.save()
                else:
                    last = MongoBudget.objects.order_by('-id').first()
                    next_id = (last.id + 1) if last else 1
                    mb = MongoBudget(
                        id=next_id,
                        user_id=user_id,
                        created_at=datetime.now(),
                        updated_at=datetime.now(),
                        income=data.get('income', 0),
                        additional_income=data.get('additional_income', 0),
                        housing=data.get('housing', 0),
                        debt_payments=data.get('debt_payments', 0),
                        transportation=data.get('transportation', 0),
                        utilities=data.get('utilities', 0),
                        food=data.get('food', 0),
                        healthcare=data.get('healthcare', 0),
                        entertainment=data.get('entertainment', 0),
                        shopping=data.get('shopping', 0),
                        travel=data.get('travel', 0),
                        education=data.get('education', 0),
                        childcare=data.get('childcare', 0),
                        other=data.get('other', 0),
                        additional_items=data.get('additional_items', []),
                        savings_items=data.get('savings_items', []),
                        month=current_month,
                        year=current_year,
                    )
                    mb.save()
                class MockBudget:
                    def __init__(self, b):
                        for field in [
                            'id','user_id','income','additional_income','housing','debt_payments','transportation',
                            'utilities','food','healthcare','entertainment','shopping','travel','education',
                            'childcare','other','additional_items','savings_items','month','year']:
                            setattr(self, field, getattr(b, field, None))
                serializer = self.get_serializer(MockBudget(mb))
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"Error upserting Mongo budget: {e}")
                return Response({'error': 'Failed to save budget'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Fallback to ORM (not used in Mongo-only mode)
        if existing_budget:
            serializer = self.get_serializer(existing_budget, data=request.data, partial=False)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        print("Update method called with data:", request.data)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        # Dual-write path handled in perform_update
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
        
        # Mongo-only upsert path
        if getattr(settings, 'USE_MONGO_BUDGET', False) and not getattr(settings, 'DUAL_WRITE_BUDGET', False):
            try:
                from api.mongodb_services import MongoBudget
                user_id = (request.user.id if request.user and request.user.is_authenticated else 1)
                data = request.data
                mb = MongoBudget.objects.filter(user_id=user_id, month=current_month, year=current_year).first()
                if not mb:
                    last = MongoBudget.objects.order_by('-id').first()
                    next_id = (last.id + 1) if last else 1
                    mb = MongoBudget(id=next_id, user_id=user_id, created_at=datetime.now())
                # Assign fields
                mb.updated_at = datetime.now()
                for field in [
                    'income','additional_income','housing','debt_payments','transportation','utilities','food',
                    'healthcare','entertainment','shopping','travel','education','childcare','other'
                ]:
                    setattr(mb, field, data.get(field, 0))
                mb.additional_items = data.get('additional_items', [])
                mb.savings_items = data.get('savings_items', [])
                mb.month = current_month
                mb.year = current_year
                mb.save()
                # Serialize via mock
                class MockBudget:
                    def __init__(self, b):
                        for field in [
                            'id','user_id','income','additional_income','housing','debt_payments','transportation',
                            'utilities','food','healthcare','entertainment','shopping','travel','education',
                            'childcare','other','additional_items','savings_items','month','year']:
                            setattr(self, field, getattr(b, field, None))
                serializer = self.get_serializer(MockBudget(mb))
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"Error upserting current Mongo budget: {e}")
                return Response({'error': 'Failed to save budget'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Fallback to ORM path (not used in Mongo-only mode)
        budget_data = request.data.copy()
        budget_data['month'] = current_month
        budget_data['year'] = current_year
        existing_budget = Budget.objects.filter(user=request.user, month=current_month, year=current_year).first()
        if existing_budget:
            serializer = self.get_serializer(existing_budget, data=budget_data, partial=False)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
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
            return Response({'error': 'Month and year are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if getattr(settings, 'USE_MONGO_BUDGET', False) and not getattr(settings, 'DUAL_WRITE_BUDGET', False):
            try:
                from api.mongodb_services import MongoBudget
                user_id = (request.user.id if request.user and request.user.is_authenticated else 1)
                data = request.data
                mb = MongoBudget.objects.filter(user_id=user_id, month=month, year=year).first()
                if not mb:
                    last = MongoBudget.objects.order_by('-id').first()
                    next_id = (last.id + 1) if last else 1
                    mb = MongoBudget(id=next_id, user_id=user_id, created_at=datetime.now())
                mb.updated_at = datetime.now()
                for field in [
                    'income','additional_income','housing','debt_payments','transportation','utilities','food',
                    'healthcare','entertainment','shopping','travel','education','childcare','other'
                ]:
                    setattr(mb, field, data.get(field, 0))
                mb.additional_items = data.get('additional_items', [])
                mb.savings_items = data.get('savings_items', [])
                mb.month = month
                mb.year = year
                mb.save()
                class MockBudget:
                    def __init__(self, b):
                        for field in [
                            'id','user_id','income','additional_income','housing','debt_payments','transportation',
                            'utilities','food','healthcare','entertainment','shopping','travel','education',
                            'childcare','other','additional_items','savings_items','month','year']:
                            setattr(self, field, getattr(b, field, None))
                serializer = self.get_serializer(MockBudget(mb))
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"Error upserting month Mongo budget: {e}")
                return Response({'error': 'Failed to save budget'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Fallback to ORM
        existing_budget = Budget.objects.filter(user=request.user, month=month, year=year).first()
        budget_data = request.data.copy()
        budget_data['month'] = month
        budget_data['year'] = year
        if existing_budget:
            serializer = self.get_serializer(existing_budget, data=budget_data, partial=False)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
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
            return Response({'error': 'Month and year are required'}, status=status.HTTP_400_BAD_REQUEST)
        if getattr(settings, 'USE_MONGO_BUDGET', False):
            try:
                from api.mongodb_services import MongoBudget
                user_id = (request.user.id if request.user and request.user.is_authenticated else 1)
                mb = MongoBudget.objects.filter(user_id=user_id, month=int(month), year=int(year)).first()
                if not mb:
                    return Response(None, status=status.HTTP_404_NOT_FOUND)
                class MockBudget:
                    def __init__(self, b):
                        for field in [
                            'id','user_id','income','additional_income','housing','debt_payments','transportation',
                            'utilities','food','healthcare','entertainment','shopping','travel','education',
                            'childcare','other','additional_items','savings_items','month','year']:
                            setattr(self, field, getattr(b, field, None))
                serializer = self.get_serializer(MockBudget(mb))
                return Response(serializer.data)
            except Exception as e:
                print(f"Error getting month Mongo budget: {e}")
                return Response({'error': 'Failed to get budget'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # Fallback to ORM
        budget = Budget.objects.filter(user=request.user, month=month, year=year).first()
        if budget:
            serializer = self.get_serializer(budget)
            return Response(serializer.data)
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
        # If Mongo-only and not dual-write, skip ORM save (handled in create)
        if getattr(settings, 'USE_MONGO_BUDGET', False) and not getattr(settings, 'DUAL_WRITE_BUDGET', False):
            return
        # Otherwise perform ORM save (and dual-write in update below if enabled)
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            from django.contrib.auth.models import User
            user = User.objects.first() or User.objects.create_user(username='testuser', password='testpass')
            serializer.save(user=user)

    def perform_update(self, serializer):
        print("Performing update with data:", serializer.validated_data)
        # If dual-write is enabled, mirror to Mongo after ORM save
        if getattr(settings, 'USE_MONGO_BUDGET', False) and getattr(settings, 'DUAL_WRITE_BUDGET', False):
            instance = serializer.save()
            try:
                from api.mongodb_services import MongoBudget
                mb = MongoBudget.objects.filter(id=instance.id).first()
                if not mb:
                    mb = MongoBudget(id=instance.id, user_id=instance.user.id)
                # Map fields
                mb.created_at = getattr(instance, 'created_at', datetime.now())
                mb.updated_at = datetime.now()
                for field in [
                    'income','additional_income','housing','debt_payments','transportation','utilities','food','healthcare',
                    'entertainment','shopping','travel','education','childcare','other','additional_items',
                    'savings_items','month','year']:
                    setattr(mb, field, getattr(instance, field, None))
                mb.save()
            except Exception as e:
                print(f"Error dual-writing budget to Mongo: {e}")
        else:
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
