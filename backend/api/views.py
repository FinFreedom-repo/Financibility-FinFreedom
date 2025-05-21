from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Account, Transaction, Category
from .serializers import AccountSerializer, TransactionSerializer, CategorySerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .wealth_projection import calculate_wealth_projection

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

@api_view(['POST'])
def project_wealth(request):
    try:
        # Validate required fields
        required_fields = [
            'age', 'startWealth', 'debt', 'debtInterest',
            'assetInterest', 'inflation', 'taxRate', 'annualContributions'
        ]
        
        for field in required_fields:
            if field not in request.data:
                return Response(
                    {'error': f'Missing required field: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Calculate projection
        projections = calculate_wealth_projection(request.data)
        
        return Response({
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
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
