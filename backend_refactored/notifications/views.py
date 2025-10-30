"""
Notification Views
Notification management endpoints
"""

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
import json
import logging

from authentication.authentication import MongoDBJWTAuthentication, get_user_from_token
from authentication.permissions import MongoDBIsAuthenticated
from .services import NotificationService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_notifications(request):
    """Get all notifications for the authenticated user"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        limit = int(request.GET.get('limit', 50))
        
        notification_service = NotificationService()
        notifications = notification_service.get_user_notifications(user.id, limit)
        unread_count = notification_service.get_unread_count(user.id)
        
        return Response({
            'notifications': notifications,
            'unread_count': unread_count,
            'total': len(notifications)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get notifications error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_unread_count(request):
    """Get unread notification count"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        notification_service = NotificationService()
        unread_count = notification_service.get_unread_count(user.id)
        
        return Response({
            'unread_count': unread_count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get unread count error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def mark_as_read(request, notification_id):
    """Mark notification as read"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        notification_service = NotificationService()
        success = notification_service.mark_as_read(user.id, notification_id)
        
        if success:
            return Response({
                'message': 'Notification marked as read'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to mark notification as read'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Mark as read error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def mark_as_unread(request, notification_id):
    """Mark notification as unread"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        notification_service = NotificationService()
        success = notification_service.mark_as_unread(user.id, notification_id)
        
        if success:
            return Response({
                'message': 'Notification marked as unread'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to mark notification as unread'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Mark as unread error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def mark_all_as_read(request):
    """Mark all notifications as read"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        notification_service = NotificationService()
        success = notification_service.mark_all_as_read(user.id)
        
        if success:
            return Response({
                'message': 'All notifications marked as read'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'No notifications to mark as read'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Mark all as read error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def delete_notification(request, notification_id):
    """Delete a notification"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        notification_service = NotificationService()
        success = notification_service.delete_notification(user.id, notification_id)
        
        if success:
            return Response({
                'message': 'Notification deleted successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to delete notification'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Delete notification error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def create_notification(request):
    """Create a custom notification"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        notification_service = NotificationService()
        notification_id = notification_service.create_notification(user.id, data)
        
        if notification_id:
            return Response({
                'notification_id': notification_id,
                'message': 'Notification created successfully'
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': 'Failed to create notification'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Create notification error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
