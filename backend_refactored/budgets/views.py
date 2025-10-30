"""
Budget Views
CRUD operations for budgets
"""

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
import json
import logging

from authentication.authentication import MongoDBJWTAuthentication, get_user_from_token
from authentication.permissions import MongoDBIsAuthenticated
from .services import BudgetService
from common.encoders import serialize_documents, serialize_document

logger = logging.getLogger(__name__)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_budgets(request):
    """Get all budgets for the authenticated user"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        budget_service = BudgetService()
        budgets = budget_service.get_user_budgets(user.id)
        
        return Response({
            'budgets': serialize_documents(budgets)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get budgets error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def create_budget(request):
    """Create a new budget"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        budget_service = BudgetService()
        budget = budget_service.create_budget(user.id, data)
        
        return Response({
            'budget': serialize_document(budget),
            'message': 'Budget created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Create budget error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def update_budget(request, budget_id):
    """Update a budget"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        budget_service = BudgetService()
        success = budget_service.update_budget(budget_id, data)
        
        if success:
            return Response({
                'message': 'Budget updated successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to update budget'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Update budget error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def delete_budget(request, budget_id):
    """Delete a budget"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        budget_service = BudgetService()
        success = budget_service.delete_budget(budget_id)
        
        if success:
            return Response({
                'message': 'Budget deleted successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to delete budget'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Delete budget error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_month_budget(request):
    """Get budget for a specific month and year"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        month = int(request.GET.get('month', 1))
        year = int(request.GET.get('year', datetime.now().year))
        
        budget_service = BudgetService()
        budget = budget_service.get_budget_by_month_year(user.id, month, year)
        
        if budget:
            return Response({
                'budget': serialize_document(budget)
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'budget': None,
                'message': 'No budget found for this month'
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.error(f"Get month budget error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def save_month_budget(request):
    """Save/update budget for a specific month"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        budget_service = BudgetService()
        budget = budget_service.create_budget(user.id, data)
        
        return Response({
            'budget': serialize_document(budget),
            'message': 'Budget saved successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Save month budget error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Import datetime at top
from datetime import datetime
