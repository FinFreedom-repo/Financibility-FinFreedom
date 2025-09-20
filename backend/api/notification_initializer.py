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
    
    def initialize_user_notifications(self, user_id: str) -> bool:
        """Initialize notifications for a new or existing user"""
        try:
            # Check if user already has meaningful notifications (not just test ones)
            existing_notifications = self.notification_service.get_user_notifications(user_id, limit=10)
            
            # Check if user has any welcome or tip notifications
            has_welcome_notifications = any(
                notif.get('type') in ['welcome', 'getting_started', 'tip', 'reminder'] 
                for notif in existing_notifications
            )
            
            if has_welcome_notifications:
                logger.info(f"User {user_id} already has welcome notifications, skipping initialization")
                return True
            
            # Create welcome notifications
            self._create_welcome_notifications(user_id)
            
            # Create helpful tip notifications
            self._create_tip_notifications(user_id)
            
            # Create reminder notifications
            self._create_reminder_notifications(user_id)
            
            logger.info(f"Successfully initialized notifications for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing notifications for user {user_id}: {e}")
            return False
    
    def _create_welcome_notifications(self, user_id: str):
        """Create welcome notifications for new users"""
        welcome_notifications = [
            {
                "type": "welcome",
                "title": "🎉 Welcome to Financability!",
                "message": "Welcome to your personal finance management platform. Start by setting up your budget and tracking your expenses.",
                "priority": "high"
            },
            {
                "type": "getting_started",
                "title": "📊 Getting Started Guide",
                "message": "Check out the Dashboard to see your financial overview, or visit Debt Planning to create your debt payoff strategy.",
                "priority": "medium"
            }
        ]
        
        for notif_data in welcome_notifications:
            self.notification_service.create_notification(user_id, notif_data)
    
    def _create_tip_notifications(self, user_id: str):
        """Create helpful tip notifications"""
        tip_notifications = [
            {
                "type": "tip",
                "title": "💡 Pro Tip: Track Your Expenses",
                "message": "Regularly tracking your expenses helps you identify spending patterns and make better financial decisions.",
                "priority": "low"
            },
            {
                "type": "tip",
                "title": "💡 Pro Tip: Emergency Fund",
                "message": "Aim to build an emergency fund that covers 3-6 months of expenses for financial security.",
                "priority": "low"
            },
            {
                "type": "tip",
                "title": "💡 Pro Tip: Debt Snowball vs Avalanche",
                "message": "Snowball method: pay smallest debts first. Avalanche method: pay highest interest first. Choose what motivates you!",
                "priority": "low"
            }
        ]
        
        for notif_data in tip_notifications:
            self.notification_service.create_notification(user_id, notif_data)
    
    def _create_reminder_notifications(self, user_id: str):
        """Create reminder notifications"""
        reminder_notifications = [
            {
                "type": "reminder",
                "title": "📅 Monthly Budget Review",
                "message": "Don't forget to review your monthly budget and adjust categories as needed.",
                "priority": "medium"
            },
            {
                "type": "reminder",
                "title": "🎯 Set Financial Goals",
                "message": "Set specific, measurable financial goals to stay motivated on your journey to financial freedom.",
                "priority": "medium"
            }
        ]
        
        for notif_data in reminder_notifications:
            self.notification_service.create_notification(user_id, notif_data)
    
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
