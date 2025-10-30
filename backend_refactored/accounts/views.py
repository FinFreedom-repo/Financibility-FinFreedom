"""
Account Views
CRUD operations for accounts
"""

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
import json
import logging

from authentication.authentication import MongoDBJWTAuthentication, get_user_from_token
from authentication.permissions import MongoDBIsAuthenticated
from .services import AccountService
from common.encoders import serialize_documents, serialize_document

logger = logging.getLogger(__name__)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_accounts(request):
    """Get all accounts for the authenticated user"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        account_service = AccountService()
        accounts = account_service.get_user_accounts(user.id)
        
        return Response({
            'accounts': serialize_documents(accounts)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get accounts error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def create_account(request):
    """Create a new account"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        account_service = AccountService()
        account = account_service.create_account(user.id, data)
        
        return Response({
            'account': serialize_document(account),
            'message': 'Account created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Create account error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def update_account(request, account_id):
    """Update an account"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        account_service = AccountService()
        success = account_service.update_account(account_id, data)
        
        if success:
            return Response({
                'message': 'Account updated successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to update account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Update account error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def delete_account(request, account_id):
    """Delete an account"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        account_service = AccountService()
        success = account_service.delete_account(account_id)
        
        if success:
            return Response({
                'message': 'Account deleted successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to delete account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Delete account error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_accounts_and_debts(request):
    """Get both accounts and debts for the authenticated user"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        account_service = AccountService()
        summary = account_service.get_user_accounts_and_debts_summary(user.id)
        
        return Response({
            'accounts': serialize_documents(summary['accounts']),
            'debts': serialize_documents(summary['debts'])
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get accounts and debts error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
