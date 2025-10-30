"""
Wealth Projection Views
Wealth projection calculation and settings management
"""

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
import json
import logging

from authentication.authentication import MongoDBJWTAuthentication, get_user_from_token
from authentication.permissions import MongoDBIsAuthenticated
from .services import WealthProjectionSettingsService
from .calculators import calculate_wealth_projection
from common.encoders import serialize_document

logger = logging.getLogger(__name__)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def project_wealth(request):
    """Calculate wealth projection"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        # Calculate projection
        projections = calculate_wealth_projection(data)
        
        return Response({
            'projections': projections
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Wealth projection error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_wealth_projection_settings(request):
    """Get wealth projection settings"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        settings_service = WealthProjectionSettingsService()
        settings = settings_service.get_settings(user.id)
        
        return Response({
            'settings': serialize_document(settings) if settings else {}
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get wealth settings error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def save_wealth_projection_settings(request):
    """Save wealth projection settings"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        settings_service = WealthProjectionSettingsService()
        settings = settings_service.save_settings(user.id, data)
        
        return Response({
            'settings': serialize_document(settings),
            'message': 'Settings saved successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Save wealth settings error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
