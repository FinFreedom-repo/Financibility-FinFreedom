import apiClient from './api';
import { API_CONFIG } from '../constants';

export interface Notification {
  _id: string;
  user_id: string;
  type: 'welcome' | 'getting_started' | 'tip' | 'reminder' | 'budget_alert' | 'debt_reminder' | 'savings_milestone' | 'general' | 'bundle';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unread_count: number;
  total: number;
}

export interface CreateNotificationData {
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  data?: Record<string, any>;
}

export interface BudgetAlertData {
  category: string;
  spent: number;
  limit: number;
}

export interface DebtReminderData {
  debt_name: string;
  due_date: string;
  amount: number;
}

export interface SavingsMilestoneData {
  goal: string;
  progress: number;
  target: number;
}

class NotificationService {
  /**
   * Get all notifications for the authenticated user
   */
  async getNotifications(limit: number = 5): Promise<NotificationResponse> {
    try {
      console.log(`🔔 Fetching notifications (limit: ${limit})...`);
      const response = await apiClient.get(`/api/mongodb/notifications/?limit=${limit}`);
      console.log(`🔔 Notifications response:`, response.data);
      
      const responseData = response.data as any;
      
      // Handle case when response.data is undefined or null
      if (!responseData) {
        console.log('🔔 No notifications data received, returning empty response');
        return {
          notifications: [],
          unread_count: 0,
          total: 0
        };
      }
      
      return {
        notifications: responseData.notifications || [],
        unread_count: responseData.unread_count || 0,
        total: responseData.total || 0
      };
    } catch (error) {
      console.error('🔔 Error fetching notifications:', error);
      // Return empty response instead of throwing error
      return {
        notifications: [],
        unread_count: 0,
        total: 0
      };
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      console.log(`🔔 Fetching unread count...`);
      const response = await apiClient.get('/api/mongodb/notifications/unread-count/');
      console.log(`🔔 Unread count response:`, response.data);
      
      const responseData = response.data as any;
      return responseData.unread_count || 0;
    } catch (error) {
      throw new Error(`Failed to fetch unread count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      console.log(`🔔 Marking notification ${notificationId} as read...`);
      const response = await apiClient.post(`/api/mongodb/notifications/${notificationId}/mark-read/`);
      console.log(`🔔 Mark as read response:`, response.data);
      
      return response.status === 200;
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark a specific notification as unread
   */
  async markAsUnread(notificationId: string): Promise<boolean> {
    try {
      console.log(`🔔 Marking notification ${notificationId} as unread...`);
      const response = await apiClient.post(`/api/mongodb/notifications/${notificationId}/mark-unread/`);
      console.log(`🔔 Mark as unread response:`, response.data);
      
      return response.status === 200;
    } catch (error) {
      throw new Error(`Failed to mark notification as unread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      console.log(`🔔 Marking all notifications as read...`);
      const response = await apiClient.post('/api/mongodb/notifications/mark-all-read/');
      console.log(`🔔 Mark all as read response:`, response.data);
      
      return response.status === 200;
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a specific notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      console.log(`🔔 Deleting notification ${notificationId}...`);
      const response = await apiClient.delete(`/api/mongodb/notifications/${notificationId}/delete/`);
      console.log(`🔔 Delete notification response:`, response.data);
      
      return response.status === 200;
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(notificationData: CreateNotificationData): Promise<string> {
    try {
      console.log(`🔔 Creating notification:`, notificationData);
      const response = await apiClient.post('/api/mongodb/notifications/create/', notificationData);
      console.log(`🔔 Create notification response:`, response.data);
      
      const responseData = response.data as any;
      return responseData.notification_id;
    } catch (error) {
      throw new Error(`Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a budget alert notification
   */
  async createBudgetAlert(alertData: BudgetAlertData): Promise<string> {
    try {
      console.log(`🔔 Creating budget alert:`, alertData);
      const response = await apiClient.post('/api/mongodb/notifications/budget-alert/', alertData);
      console.log(`🔔 Budget alert response:`, response.data);
      
      const responseData = response.data as any;
      return responseData.notification_id;
    } catch (error) {
      throw new Error(`Failed to create budget alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a debt reminder notification
   */
  async createDebtReminder(reminderData: DebtReminderData): Promise<string> {
    try {
      console.log(`🔔 Creating debt reminder:`, reminderData);
      const response = await apiClient.post('/api/mongodb/notifications/debt-reminder/', reminderData);
      console.log(`🔔 Debt reminder response:`, response.data);
      
      const responseData = response.data as any;
      return responseData.notification_id;
    } catch (error) {
      throw new Error(`Failed to create debt reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a savings milestone notification
   */
  async createSavingsMilestone(milestoneData: SavingsMilestoneData): Promise<string> {
    try {
      console.log(`🔔 Creating savings milestone:`, milestoneData);
      const response = await apiClient.post('/api/mongodb/notifications/savings-milestone/', milestoneData);
      console.log(`🔔 Savings milestone response:`, response.data);
      
      const responseData = response.data as any;
      return responseData.notification_id;
    } catch (error) {
      throw new Error(`Failed to create savings milestone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize notifications for the user
   */
  async initializeNotifications(): Promise<NotificationResponse> {
    try {
      console.log(`🔔 Initializing notifications...`);
      const response = await apiClient.post('/api/mongodb/notifications/initialize/');
      console.log(`🔔 Initialize notifications response:`, response.data);
      
      const responseData = response.data as any;
      
      // Handle case when response.data is undefined or null
      if (!responseData) {
        console.log('🔔 No notifications data received from initialization, returning empty response');
        return {
          notifications: [],
          unread_count: 0,
          total: 0
        };
      }
      
      return {
        notifications: responseData.notifications || [],
        unread_count: responseData.unread_count || 0,
        total: responseData.total || 0
      };
    } catch (error) {
      console.error('🔔 Error initializing notifications:', error);
      // Return empty response instead of throwing error
      return {
        notifications: [],
        unread_count: 0,
        total: 0
      };
    }
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'welcome': 'sparkles',
      'getting_started': 'compass',
      'tip': 'bulb',
      'reminder': 'time',
      'budget_alert': 'warning',
      'debt_reminder': 'card',
      'savings_milestone': 'trophy',
      'general': 'notifications',
      'bundle': 'list'
    };
    return iconMap[type] || 'notifications';
  }

  /**
   * Get notification color based on priority
   */
  getNotificationColor(priority: string): string {
    const colorMap: Record<string, string> = {
      'low': '#4CAF50',
      'medium': '#FF9800',
      'high': '#F44336'
    };
    return colorMap[priority] || '#2196F3';
  }

  /**
   * Format notification date
   */
  formatNotificationDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown';
    }
  }
}

export default new NotificationService();
