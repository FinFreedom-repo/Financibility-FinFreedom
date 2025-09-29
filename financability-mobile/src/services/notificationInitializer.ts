import notificationService from './notificationService';
import { CreateNotificationData } from './notificationService';

class NotificationInitializer {
  /**
   * Initialize notifications for a new user
   */
  async initializeUserNotifications(): Promise<boolean> {
    try {
      console.log('🔔 Initializing user notifications...');
      const response = await notificationService.initializeNotifications();
      console.log('🔔 Notifications initialized:', response);
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Create a budget alert notification
   */
  async createBudgetAlert(category: string, spent: number, limit: number): Promise<string | null> {
    try {
      const alertData = {
        category,
        spent,
        limit,
      };
      
      const notificationId = await notificationService.createBudgetAlert(alertData);
      console.log('🔔 Budget alert created:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to create budget alert:', error);
      return null;
    }
  }

  /**
   * Create a debt reminder notification
   */
  async createDebtReminder(debtName: string, dueDate: string, amount: number): Promise<string | null> {
    try {
      const reminderData = {
        debt_name: debtName,
        due_date: dueDate,
        amount,
      };
      
      const notificationId = await notificationService.createDebtReminder(reminderData);
      console.log('🔔 Debt reminder created:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to create debt reminder:', error);
      return null;
    }
  }

  /**
   * Create a savings milestone notification
   */
  async createSavingsMilestone(goal: string, progress: number, target: number): Promise<string | null> {
    try {
      const milestoneData = {
        goal,
        progress,
        target,
      };
      
      const notificationId = await notificationService.createSavingsMilestone(milestoneData);
      console.log('🔔 Savings milestone created:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to create savings milestone:', error);
      return null;
    }
  }

  /**
   * Create a custom notification
   */
  async createCustomNotification(
    type: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    data?: Record<string, any>
  ): Promise<string | null> {
    try {
      const notificationData: CreateNotificationData = {
        type,
        title,
        message,
        priority,
        data,
      };
      
      const notificationId = await notificationService.createNotification(notificationData);
      console.log('🔔 Custom notification created:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to create custom notification:', error);
      return null;
    }
  }

  /**
   * Create welcome notifications for new users
   */
  async createWelcomeNotifications(): Promise<void> {
    try {
      const welcomeNotifications = [
        {
          type: 'welcome',
          title: '🎉 Welcome to Financability!',
          message: 'Welcome to your personal finance management platform. Start by setting up your budget and tracking your expenses.',
          priority: 'high' as const,
        },
        {
          type: 'getting_started',
          title: '📊 Getting Started Guide',
          message: 'Check out the Dashboard to see your financial overview, or visit Debt Planning to create your debt payoff strategy.',
          priority: 'medium' as const,
        },
        {
          type: 'tip',
          title: '💡 Pro Tip: Emergency Fund',
          message: 'Aim to build an emergency fund that covers 3-6 months of expenses for financial security.',
          priority: 'low' as const,
        },
        {
          type: 'tip',
          title: '💡 Pro Tip: Debt Snowball vs Avalanche',
          message: 'Snowball method: pay smallest debts first. Avalanche method: pay highest interest first. Choose what motivates you!',
          priority: 'low' as const,
        },
      ];

      for (const notification of welcomeNotifications) {
        await this.createCustomNotification(
          notification.type,
          notification.title,
          notification.message,
          notification.priority
        );
      }
    } catch (error) {
      console.error('Failed to create welcome notifications:', error);
    }
  }

  /**
   * Create financial milestone notifications
   */
  async createFinancialMilestoneNotifications(): Promise<void> {
    try {
      const milestoneNotifications = [
        {
          type: 'milestone',
          title: '🏆 Financial Milestone Achieved!',
          message: 'Congratulations! You\'ve reached a significant financial milestone. Keep up the great work!',
          priority: 'high' as const,
        },
        {
          type: 'reminder',
          title: '⏰ Monthly Budget Review',
          message: 'It\'s time to review your monthly budget and make adjustments for the upcoming month.',
          priority: 'medium' as const,
        },
        {
          type: 'reminder',
          title: '💳 Debt Payment Reminder',
          message: 'Don\'t forget to make your debt payments on time to avoid late fees and maintain your credit score.',
          priority: 'medium' as const,
        },
      ];

      for (const notification of milestoneNotifications) {
        await this.createCustomNotification(
          notification.type,
          notification.title,
          notification.message,
          notification.priority
        );
      }
    } catch (error) {
      console.error('Failed to create financial milestone notifications:', error);
    }
  }

  /**
   * Create educational tip notifications
   */
  async createEducationalTipNotifications(): Promise<void> {
    try {
      const tipNotifications = [
        {
          type: 'tip',
          title: '📚 Financial Education: Compound Interest',
          message: 'Compound interest is the eighth wonder of the world. Start investing early to take advantage of this powerful force.',
          priority: 'low' as const,
        },
        {
          type: 'tip',
          title: '📚 Financial Education: 50/30/20 Rule',
          message: 'Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.',
          priority: 'low' as const,
        },
        {
          type: 'tip',
          title: '📚 Financial Education: Credit Score',
          message: 'Your credit score affects loan rates and insurance premiums. Pay bills on time and keep credit utilization low.',
          priority: 'low' as const,
        },
      ];

      for (const notification of tipNotifications) {
        await this.createCustomNotification(
          notification.type,
          notification.title,
          notification.message,
          notification.priority
        );
      }
    } catch (error) {
      console.error('Failed to create educational tip notifications:', error);
    }
  }
}

export default new NotificationInitializer();

