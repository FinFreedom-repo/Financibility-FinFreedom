"""
Notification Services
Notification management operations
"""

from datetime import datetime
from typing import Dict, List, Optional
from bson import ObjectId
import logging

from common.database import get_collection

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for notification management operations"""
    
    def __init__(self):
        self.notifications = get_collection('notifications')
    
    def create_notification(self, user_id: str, notification_data: Dict) -> Optional[str]:
        """Create a new notification for a user"""
        try:
            notification_data.update({
                "user_id": str(user_id),
                "read": False,
                "created_at": datetime.utcnow()
            })
            
            result = self.notifications.insert_one(notification_data)
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return None
    
    def get_user_notifications(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get all notifications for a user"""
        try:
            notifications = list(self.notifications.find(
                {"user_id": str(user_id)}
            ).sort("created_at", -1).limit(limit))
            
            # Convert ObjectId to string
            for notif in notifications:
                notif['_id'] = str(notif['_id'])
            
            return notifications
        except Exception as e:
            logger.error(f"Error getting user notifications: {e}")
            return []
    
    def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        try:
            count = self.notifications.count_documents({
                "user_id": str(user_id),
                "read": False
            })
            return count
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return 0
    
    def mark_as_read(self, user_id: str, notification_id: str) -> bool:
        """Mark a specific notification as read"""
        try:
            result = self.notifications.update_one(
                {"_id": ObjectId(notification_id), "user_id": str(user_id)},
                {"$set": {"read": True}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return False
    
    def mark_as_unread(self, user_id: str, notification_id: str) -> bool:
        """Mark a specific notification as unread"""
        try:
            result = self.notifications.update_one(
                {"_id": ObjectId(notification_id), "user_id": str(user_id)},
                {"$set": {"read": False}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking notification as unread: {e}")
            return False
    
    def mark_all_as_read(self, user_id: str) -> bool:
        """Mark all notifications as read for a user"""
        try:
            result = self.notifications.update_many(
                {"user_id": str(user_id)},
                {"$set": {"read": True}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
            return False
    
    def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """Delete a specific notification"""
        try:
            result = self.notifications.delete_one({
                "_id": ObjectId(notification_id),
                "user_id": str(user_id)
            })
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting notification: {e}")
            return False
    
    def create_budget_alert(self, user_id: str, category: str, spent: float, limit: float) -> Optional[str]:
        """Create a budget alert notification"""
        percentage = round((spent / limit) * 100)
        notification_data = {
            "type": "budget_alert",
            "title": f"Budget Alert: {category}",
            "message": f"You've spent ${spent:.2f} of ${limit:.2f} ({percentage}%) on {category}",
            "category": category,
            "spent": spent,
            "limit": limit,
            "percentage": percentage
        }
        return self.create_notification(user_id, notification_data)
    
    def create_debt_reminder(self, user_id: str, debt_name: str, due_date: str, amount: float) -> Optional[str]:
        """Create a debt reminder notification"""
        notification_data = {
            "type": "debt_reminder",
            "title": f"Debt Payment Due: {debt_name}",
            "message": f"Payment of ${amount:.2f} is due on {due_date}",
            "debt_name": debt_name,
            "due_date": due_date,
            "amount": amount
        }
        return self.create_notification(user_id, notification_data)
    
    def create_savings_milestone(self, user_id: str, goal: str, progress: float, target: float) -> Optional[str]:
        """Create a savings milestone notification"""
        percentage = round((progress / target) * 100)
        notification_data = {
            "type": "savings_milestone",
            "title": f"Savings Milestone: {goal}",
            "message": f"You've reached ${progress:.2f} of your ${target:.2f} goal ({percentage}%)",
            "goal": goal,
            "progress": progress,
            "target": target,
            "percentage": percentage
        }
        return self.create_notification(user_id, notification_data)

