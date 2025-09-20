"""
Notification API Views
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .mongodb_service import NotificationService
from .mongodb_authentication import MongoDBIsAuthenticated
import logging

logger = logging.getLogger(__name__)

# Initialize notification service
notification_service = NotificationService()

@api_view(['GET'])
@permission_classes([MongoDBIsAuthenticated])
def get_notifications(request):
    """Get all notifications for the authenticated user"""
    try:
        user_id = request.user.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID not found in token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get limit from query parameters (default 50)
        limit = int(request.GET.get('limit', 50))
        
        notifications = notification_service.get_user_notifications(user_id, limit)
        unread_count = notification_service.get_unread_count(user_id)
        
        return Response({
            "notifications": notifications,
            "unread_count": unread_count,
            "total": len(notifications)
        })
        
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        return Response(
            {"error": "Failed to get notifications"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([MongoDBIsAuthenticated])
def get_unread_count(request):
    """Get unread notification count for the authenticated user"""
    try:
        user_id = request.user.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID not found in token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        unread_count = notification_service.get_unread_count(user_id)
        
        return Response({
            "unread_count": unread_count
        })
        
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        return Response(
            {"error": "Failed to get unread count"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([MongoDBIsAuthenticated])
def mark_as_read(request, notification_id):
    """Mark a specific notification as read"""
    try:
        user_id = request.user.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID not found in token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = notification_service.mark_as_read(user_id, notification_id)
        
        if success:
            return Response({
                "message": "Notification marked as read",
                "notification_id": notification_id
            })
        else:
            return Response(
                {"error": "Notification not found or already read"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        return Response(
            {"error": "Failed to mark notification as read"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([MongoDBIsAuthenticated])
def mark_all_as_read(request):
    """Mark all notifications as read for the authenticated user"""
    try:
        user_id = request.user.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID not found in token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = notification_service.mark_all_as_read(user_id)
        
        if success:
            return Response({
                "message": "All notifications marked as read"
            })
        else:
            return Response(
                {"error": "Failed to mark all notifications as read"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        return Response(
            {"error": "Failed to mark all notifications as read"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([MongoDBIsAuthenticated])
def delete_notification(request, notification_id):
    """Delete a specific notification"""
    try:
        user_id = request.user.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID not found in token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = notification_service.delete_notification(user_id, notification_id)
        
        if success:
            return Response({
                "message": "Notification deleted",
                "notification_id": notification_id
            })
        else:
            return Response(
                {"error": "Notification not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
    except Exception as e:
        logger.error(f"Error deleting notification: {e}")
        return Response(
            {"error": "Failed to delete notification"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([MongoDBIsAuthenticated])
def create_notification(request):
    """Create a new notification (for testing or admin purposes)"""
    try:
        user_id = request.user.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID not found in token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notification_data = request.data
        notification_id = notification_service.create_notification(user_id, notification_data)
        
        if notification_id:
            return Response({
                "message": "Notification created",
                "notification_id": notification_id
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"error": "Failed to create notification"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
        return Response(
            {"error": "Failed to create notification"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([MongoDBIsAuthenticated])
def create_budget_alert(request):
    """Create a budget alert notification"""
    try:
        user_id = request.user.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID not found in token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = request.data
        category = data.get('category')
        spent = data.get('spent')
        limit = data.get('limit')
        
        if not all([category, spent is not None, limit is not None]):
            return Response(
                {"error": "Missing required fields: category, spent, limit"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notification_id = notification_service.create_budget_alert(
            user_id, category, float(spent), float(limit)
        )
        
        if notification_id:
            return Response({
                "message": "Budget alert created",
                "notification_id": notification_id
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"error": "Failed to create budget alert"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        logger.error(f"Error creating budget alert: {e}")
        return Response(
            {"error": "Failed to create budget alert"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([MongoDBIsAuthenticated])
def create_debt_reminder(request):
    """Create a debt reminder notification"""
    try:
        user_id = request.user.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID not found in token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = request.data
        debt_name = data.get('debt_name')
        due_date = data.get('due_date')
        amount = data.get('amount')
        
        if not all([debt_name, due_date, amount is not None]):
            return Response(
                {"error": "Missing required fields: debt_name, due_date, amount"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notification_id = notification_service.create_debt_reminder(
            user_id, debt_name, due_date, float(amount)
        )
        
        if notification_id:
            return Response({
                "message": "Debt reminder created",
                "notification_id": notification_id
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"error": "Failed to create debt reminder"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        logger.error(f"Error creating debt reminder: {e}")
        return Response(
            {"error": "Failed to create debt reminder"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([MongoDBIsAuthenticated])
def create_savings_milestone(request):
    """Create a savings milestone notification"""
    try:
        user_id = request.user.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID not found in token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = request.data
        goal = data.get('goal')
        progress = data.get('progress')
        target = data.get('target')
        
        if not all([goal, progress is not None, target is not None]):
            return Response(
                {"error": "Missing required fields: goal, progress, target"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notification_id = notification_service.create_savings_milestone(
            user_id, goal, float(progress), float(target)
        )
        
        if notification_id:
            return Response({
                "message": "Savings milestone created",
                "notification_id": notification_id
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"error": "Failed to create savings milestone"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        logger.error(f"Error creating savings milestone: {e}")
        return Response(
            {"error": "Failed to create savings milestone"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
