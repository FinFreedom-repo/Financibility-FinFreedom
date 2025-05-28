from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Budget
from .serializers import BudgetSerializer

# Create your views here.

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        print("Getting queryset for budget data")
        return Budget.objects.all()

    def list(self, request, *args, **kwargs):
        print("List method called")
        queryset = self.get_queryset()
        print(f"Found {queryset.count()} budgets")
        serializer = self.get_serializer(queryset, many=True)
        print("Serialized data:", serializer.data)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        print("Create method called with data:", request.data)
        # Check if any budget exists
        if Budget.objects.exists():
            print("Budget already exists, returning existing budget")
            existing_budget = Budget.objects.first()
            serializer = self.get_serializer(existing_budget)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        print("No existing budget, creating new one")
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        print("Performing create with data:", serializer.validated_data)
        serializer.save()
