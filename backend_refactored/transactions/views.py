"""
Transaction Views
CRUD operations for transactions
"""

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
import json
import logging

from authentication.authentication import MongoDBJWTAuthentication, get_user_from_token
from authentication.permissions import MongoDBIsAuthenticated
from .services import TransactionService
from common.encoders import serialize_documents, serialize_document

logger = logging.getLogger(__name__)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_transactions(request):
    """Get all transactions for the authenticated user"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        limit = int(request.GET.get('limit', 100))
        
        transaction_service = TransactionService()
        transactions = transaction_service.get_user_transactions(user.id, limit)
        
        return Response({
            'transactions': serialize_documents(transactions)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get transactions error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def create_transaction(request):
    """Create a new transaction"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        transaction_service = TransactionService()
        transaction = transaction_service.create_transaction(user.id, data)
        
        return Response({
            'transaction': serialize_document(transaction),
            'message': 'Transaction created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Create transaction error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def update_transaction(request, transaction_id):
    """Update a transaction"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        transaction_service = TransactionService()
        success = transaction_service.update_transaction(transaction_id, data)
        
        if success:
            return Response({
                'message': 'Transaction updated successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to update transaction'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Update transaction error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def delete_transaction(request, transaction_id):
    """Delete a transaction"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        transaction_service = TransactionService()
        success = transaction_service.delete_transaction(transaction_id)
        
        if success:
            return Response({
                'message': 'Transaction deleted successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to delete transaction'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Delete transaction error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
