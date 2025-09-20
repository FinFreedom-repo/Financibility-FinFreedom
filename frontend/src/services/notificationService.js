// Notification Service for handling notifications with backend persistence
import axios from '../utils/axios';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.unreadCount = 0;
    this.isInitialized = false;
  }

  // Initialize the service by fetching notifications from backend
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.fetchNotifications();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      // Fallback to mock data if backend is unavailable
      this.initializeMockData();
      this.isInitialized = true;
    }
  }

  // Mock data for demonstration (fallback)
  initializeMockData() {
    this.notifications = [
      {
        _id: '1',
        type: 'budget_alert',
        title: 'Budget Alert',
        message: 'You\'ve spent 85% of your monthly budget',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        is_read: false,
        priority: 'high',
        data: { category: 'Food', spent: 850, limit: 1000 }
      },
      {
        _id: '2',
        type: 'debt_reminder',
        title: 'Debt Payment Due',
        message: 'Payment for "Bank Loan" is due in 3 days',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        is_read: false,
        priority: 'medium',
        data: { debt_name: 'Bank Loan', due_date: '2025-08-06', amount: 5200 }
      },
      {
        _id: '3',
        type: 'financial_insight',
        title: 'Savings Milestone',
        message: 'Congratulations! You\'ve reached 50% of your savings goal',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        is_read: true,
        priority: 'low',
        data: { goal: 'Emergency Fund', progress: 50, target: 10000 }
      },
      {
        _id: '4',
        type: 'system_update',
        title: 'System Update',
        message: 'New features added: Additional Income tracking',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_read: true,
        priority: 'low',
        data: { feature: 'Additional Income' }
      }
    ];
    this.updateUnreadCount();
  }

  // Fetch notifications from backend
  async fetchNotifications() {
    try {
      const response = await axios.get('/api/mongodb/notifications/');
      this.notifications = response.data.notifications || [];
      this.unreadCount = response.data.unread_count || 0;
      this.notifyListeners();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get all notifications
  getNotifications() {
    return this.notifications;
  }

  // Get unread count
  getUnreadCount() {
    return this.unreadCount;
  }

  // Mark notification as read (with backend sync)
  async markAsRead(notificationId) {
    try {
      // Optimistic update
      const notification = this.notifications.find(n => n._id === notificationId);
      if (notification && !notification.is_read) {
        notification.is_read = true;
        this.updateUnreadCount();
        this.notifyListeners();
      }

      // Sync with backend
      await axios.post(`/api/mongodb/notifications/${notificationId}/mark-read/`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      const notification = this.notifications.find(n => n._id === notificationId);
      if (notification) {
        notification.is_read = false;
        this.updateUnreadCount();
        this.notifyListeners();
      }
      throw error;
    }
  }

  // Mark all notifications as read (with backend sync)
  async markAllAsRead() {
    try {
      // Optimistic update
      this.notifications.forEach(notification => {
        notification.is_read = true;
      });
      this.updateUnreadCount();
      this.notifyListeners();

      // Sync with backend
      await axios.post('/api/mongodb/notifications/mark-all-read/');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert optimistic update on error
      await this.fetchNotifications();
      throw error;
    }
  }

  // Add new notification (with backend sync)
  async addNotification(notificationData) {
    try {
      const response = await axios.post('/api/mongodb/notifications/create/', notificationData);
      const newNotification = response.data;
      
      // Add to local state
      this.notifications.unshift(newNotification);
      this.updateUnreadCount();
      this.notifyListeners();
      
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Remove notification (with backend sync)
  async removeNotification(notificationId) {
    try {
      await axios.delete(`/api/mongodb/notifications/${notificationId}/delete/`);
      
      // Remove from local state
      this.notifications = this.notifications.filter(n => n._id !== notificationId);
      this.updateUnreadCount();
      this.notifyListeners();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Update unread count
  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
  }

  // Subscribe to notification changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        notifications: this.notifications,
        unreadCount: this.unreadCount
      });
    });
  }

  // Refresh notifications from backend
  async refresh() {
    try {
      await this.fetchNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }

  // Create notification helpers (with backend sync)
  async createBudgetAlert(category, spent, limit) {
    const percentage = Math.round((spent / limit) * 100);
    const notificationData = {
      type: 'budget_alert',
      title: 'Budget Alert',
      message: `You've spent ${percentage}% of your ${category} budget`,
      priority: percentage >= 90 ? 'high' : percentage >= 80 ? 'medium' : 'low',
      data: { category, spent, limit, percentage }
    };
    
    return await this.addNotification(notificationData);
  }

  async createDebtReminder(debtName, dueDate, amount) {
    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const notificationData = {
      type: 'debt_reminder',
      title: 'Debt Payment Due',
      message: `Payment for "${debtName}" is due in ${daysUntilDue} days`,
      priority: daysUntilDue <= 1 ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low',
      data: { debt_name: debtName, due_date: dueDate, amount, days_until_due: daysUntilDue }
    };
    
    return await this.addNotification(notificationData);
  }

  async createSavingsMilestone(goal, progress, target) {
    const percentage = Math.round((progress / target) * 100);
    const notificationData = {
      type: 'financial_insight',
      title: 'Savings Milestone',
      message: `Congratulations! You've reached ${percentage}% of your ${goal} goal`,
      priority: 'low',
      data: { goal, progress, target, percentage }
    };
    
    return await this.addNotification(notificationData);
  }

  async createSystemUpdate(feature) {
    const notificationData = {
      type: 'system_update',
      title: 'System Update',
      message: `New features added: ${feature}`,
      priority: 'low',
      data: { feature }
    };
    
    return await this.addNotification(notificationData);
  }

  // Format timestamp for display
  formatTimestamp(timestamp) {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    
    return notificationTime.toLocaleDateString();
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Initialize the service
notificationService.initialize();

export default notificationService;