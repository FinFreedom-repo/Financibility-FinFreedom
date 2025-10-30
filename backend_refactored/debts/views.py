"""
Debt Views
CRUD operations for debts and debt planning
"""

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import json
import logging

from authentication.authentication import MongoDBJWTAuthentication, get_user_from_token
from authentication.permissions import MongoDBIsAuthenticated
from .services import DebtService
from .calculators import calculate_debt_payoff_plan
from common.encoders import serialize_documents, serialize_document

logger = logging.getLogger(__name__)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_debts(request):
    """Get all debts for the authenticated user"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        debt_service = DebtService()
        debts = debt_service.get_user_debts(user.id)
        
        return Response({
            'debts': serialize_documents(debts)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get debts error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def create_debt(request):
    """Create a new debt"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        debt_service = DebtService()
        debt = debt_service.create_debt(user.id, data)
        
        return Response({
            'debt': serialize_document(debt),
            'message': 'Debt created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Create debt error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def update_debt(request, debt_id):
    """Update a debt"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        debt_service = DebtService()
        success = debt_service.update_debt(debt_id, data)
        
        if success:
            return Response({
                'message': 'Debt updated successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to update debt'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Update debt error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def delete_debt(request, debt_id):
    """Delete a debt"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        debt_service = DebtService()
        success = debt_service.delete_debt(debt_id)
        
        if success:
            return Response({
                'message': 'Debt deleted successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to delete debt'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Delete debt error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def debt_planner(request):
    """Calculate debt payoff plan"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = request.data
        debts = data.get('debts', [])
        strategy = data.get('strategy', 'snowball')
        monthly_budget_data = data.get('monthly_budget_data', [])
        
        # Calculate debt plan
        result = calculate_debt_payoff_plan(debts, strategy, monthly_budget_data)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Debt planner error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def debt_planner_test(request):
    """Test endpoint for debt planner without authentication"""
    try:
        data = request.data
        debts = data.get('debts', [])
        strategy = data.get('strategy', 'snowball')
        monthly_budget_data = data.get('monthly_budget_data', [])
        
        # Calculate debt plan
        result = calculate_debt_payoff_plan(debts, strategy, monthly_budget_data)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Debt planner test error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
