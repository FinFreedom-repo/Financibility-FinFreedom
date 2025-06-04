from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        print("Getting queryset for budget data")
        return Budget.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        print("List method called")
        queryset = self.get_queryset()
        print(f"Found {queryset.count()} budgets")
        serializer = self.get_serializer(queryset, many=True)
        print("Serialized data:", serializer.data)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        print("Create method called with data:", request.data)
        # Check if budget exists for current user
        if Budget.objects.filter(user=request.user).exists():
            print("Budget already exists for user, returning existing budget")
            existing_budget = Budget.objects.filter(user=request.user).first()
            serializer = self.get_serializer(existing_budget)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        print("No existing budget for user, creating new one")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        print("Update method called with data:", request.data)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_create(self, serializer):
        print("Performing create with data:", serializer.validated_data)
        serializer.save(user=self.request.user)

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

    @action(detail=False, methods=['post'])
    def upload_statement(self, request):
        print("Upload statement called with files:", request.FILES)
        print("Upload statement called with data:", request.data)
        
        if 'file' not in request.FILES:
            print("No file in request.FILES")
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']
        print("File received:", file.name, "Type:", file.content_type)

        # Read and print first line
        try:
            first_line = file.readline().decode('utf-8').strip()
            print("First line of document:", first_line)
        except Exception as e:
            print("Error reading first line:", str(e))

        # Just confirm receipt of the file
        return Response({
            'message': 'Document received successfully',
            'filename': file.name
        }, status=status.HTTP_200_OK)
