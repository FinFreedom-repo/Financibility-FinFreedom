"""
Notification Initializer Service
Automatically creates relevant notifications for users
"""

from .mongodb_service import NotificationService
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class NotificationInitializer:
    """Service for initializing user notifications"""
    
    def __init__(self):
        self.notification_service = NotificationService()
    
    def _to_object_id(self, user_id: str):
        """Convert string to ObjectId"""
        from bson import ObjectId
        if isinstance(user_id, str):
            return ObjectId(user_id)
        return user_id
    
    def initialize_user_notifications(self, user_id: str) -> bool:
        """Initialize notifications for a new or existing user"""
        try:
            # Check if user already has a notification bundle
            existing_bundle = self.notification_service.db.notifications.find_one({
                "user_id": self.notification_service._to_object_id(user_id),
                "type": "bundle"
            })
            
            if existing_bundle:
                logger.info(f"User {user_id} already has notification bundle, skipping initialization")
                return True
            
            # Create all notification messages
            all_messages = []
            all_messages.extend(self._get_welcome_messages())
            all_messages.extend(self._get_tip_messages())
            all_messages.extend(self._get_reminder_messages())
            
            # Create single notification bundle
            bundle_id = self.notification_service.create_user_notification_bundle(user_id, all_messages)
            
            if bundle_id:
                logger.info(f"Successfully created notification bundle {bundle_id} for user {user_id}")
                return True
            else:
                logger.error(f"Failed to create notification bundle for user {user_id}")
                return False
            
        except Exception as e:
            logger.error(f"Error initializing notifications for user {user_id}: {e}")
            return False
    
    def _get_welcome_messages(self):
        """Get welcome messages for new users"""
        return [
            {
                "type": "welcome",
                "title": "🎉 Welcome to Financability!",
                "message": "Welcome to your personal finance management platform. Start by setting up your budget and tracking your expenses.",
                "priority": "high",
                "is_read": False
            },
            {
                "type": "getting_started",
                "title": "📊 Getting Started Guide",
                "message": "Check out the Dashboard to see your financial overview, or visit Debt Planning to create your debt payoff strategy.",
                "priority": "medium",
                "is_read": False
            }
        ]
    
    def _get_tip_messages(self):
        """Get helpful tip messages"""
        return [
            {
                "type": "tip",
                "title": "💡 Pro Tip: Emergency Fund",
                "message": "Aim to build an emergency fund that covers 3-6 months of expenses for financial security.",
                "priority": "low",
                "is_read": False
            },
            {
                "type": "tip",
                "title": "💡 Pro Tip: Debt Snowball vs Avalanche",
                "message": "Snowball method: pay smallest debts first. Avalanche method: pay highest interest first. Choose what motivates you!",
                "priority": "low",
                "is_read": False
            }
        ]
    
    def _get_reminder_messages(self):
        """Get reminder messages"""
        return [
            {
                "type": "reminder",
                "title": "🎯 Set Financial Goals",
                "message": "Set specific, measurable financial goals to stay motivated on your journey to financial freedom.",
                "priority": "medium",
                "is_read": False
            }
        ]
    
    def create_budget_alert_notification(self, user_id: str, category: str, spent: float, limit: float):
        """Create a budget alert notification"""
        over_budget = spent > limit
        percentage = (spent / limit) * 100 if limit > 0 else 0
        
        if over_budget:
            title = f"⚠️ Budget Alert: {category}"
            message = f"You've exceeded your {category} budget by ${spent - limit:.2f} ({percentage:.1f}% over limit)."
            priority = "high"
        else:
            title = f"💰 Budget Update: {category}"
            message = f"You've spent ${spent:.2f} of ${limit:.2f} in {category} ({percentage:.1f}% used)."
            priority = "medium"
        
        notification_data = {
            "type": "budget_alert",
            "title": title,
            "message": message,
            "priority": priority,
            "data": {
                "category": category,
                "spent": spent,
                "limit": limit,
                "percentage": percentage,
                "over_budget": over_budget
            }
        }
        
        return self.notification_service.create_notification(user_id, notification_data)
    
    def create_debt_milestone_notification(self, user_id: str, debt_name: str, milestone: str):
        """Create a debt milestone notification"""
        notification_data = {
            "type": "debt_milestone",
            "title": f"🎉 Debt Milestone: {debt_name}",
            "message": f"Congratulations! You've reached a milestone: {milestone}",
            "priority": "high",
            "data": {
                "debt_name": debt_name,
                "milestone": milestone
            }
        }
        
        return self.notification_service.create_notification(user_id, notification_data)
    
    def create_savings_goal_notification(self, user_id: str, goal_name: str, current_amount: float, target_amount: float):
        """Create a savings goal notification"""
        percentage = (current_amount / target_amount) * 100 if target_amount > 0 else 0
        
        if percentage >= 100:
            title = f"🎯 Goal Achieved: {goal_name}"
            message = f"Congratulations! You've reached your {goal_name} goal of ${target_amount:.2f}!"
            priority = "high"
        elif percentage >= 75:
            title = f"🏁 Almost There: {goal_name}"
            message = f"You're {percentage:.1f}% towards your {goal_name} goal. Keep it up!"
            priority = "medium"
        else:
            title = f"💪 Progress Update: {goal_name}"
            message = f"You're {percentage:.1f}% towards your {goal_name} goal (${current_amount:.2f} of ${target_amount:.2f})."
            priority = "low"
        
        notification_data = {
            "type": "savings_goal",
            "title": title,
            "message": message,
            "priority": priority,
            "data": {
                "goal_name": goal_name,
                "current_amount": current_amount,
                "target_amount": target_amount,
                "percentage": percentage
            }
        }
        
        return self.notification_service.create_notification(user_id, notification_data)
