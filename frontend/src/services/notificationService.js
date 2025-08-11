// Notification Service for handling notifications
// This service can be extended later to integrate with backend APIs

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.unreadCount = 0;
  }

  // Mock data for demonstration
  initializeMockData() {
    this.notifications = [
      {
        id: 1,
        type: 'budget_alert',
        title: 'Budget Alert',
        message: 'You\'ve spent 85% of your monthly budget',
        timestamp: '2 hours ago',
        isRead: false,
        priority: 'high',
        data: { category: 'Food', spent: 850, limit: 1000 }
      },
      {
        id: 2,
        type: 'debt_reminder',
        title: 'Debt Payment Due',
        message: 'Payment for "Bank Loan" is due in 3 days',
        timestamp: '1 day ago',
        isRead: false,
        priority: 'medium',
        data: { debtName: 'Bank Loan', dueDate: '2025-08-06', amount: 5200 }
      },
      {
        id: 3,
        type: 'financial_insight',
        title: 'Savings Milestone',
        message: 'Congratulations! You\'ve reached 50% of your savings goal',
        timestamp: '3 days ago',
        isRead: true,
        priority: 'low',
        data: { goal: 'Emergency Fund', progress: 50, target: 10000 }
      },
      {
        id: 4,
        type: 'system_update',
        title: 'System Update',
        message: 'New features added: Additional Income tracking',
        timestamp: '1 week ago',
        isRead: true,
        priority: 'low',
        data: { feature: 'Additional Income' }
      }
    ];
    this.updateUnreadCount();
  }

  // Get all notifications
  getNotifications() {
    return this.notifications;
  }

  // Get unread count
  getUnreadCount() {
    return this.unreadCount;
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.updateUnreadCount();
      this.notifyListeners();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.isRead = true;
    });
    this.updateUnreadCount();
    this.notifyListeners();
  }

  // Add new notification
  addNotification(notification) {
    const newNotification = {
      id: Date.now(), // Simple ID generation
      timestamp: 'Just now',
      isRead: false,
      ...notification
    };
    this.notifications.unshift(newNotification); // Add to beginning
    this.updateUnreadCount();
    this.notifyListeners();
  }

  // Remove notification
  removeNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.updateUnreadCount();
    this.notifyListeners();
  }

  // Update unread count
  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
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

  // Future: Backend integration methods
  async fetchNotifications() {
    // TODO: Replace with actual API call
    // const response = await axios.get('/api/notifications/');
    // this.notifications = response.data;
    // this.updateUnreadCount();
    // this.notifyListeners();
  }

  async markAsReadOnServer(notificationId) {
    // TODO: Replace with actual API call
    // await axios.post(`/api/notifications/${notificationId}/mark-read/`);
    this.markAsRead(notificationId);
  }

  async markAllAsReadOnServer() {
    // TODO: Replace with actual API call
    // await axios.post('/api/notifications/mark-all-read/');
    this.markAllAsRead();
  }

  // Create notification helpers
  createBudgetAlert(category, spent, limit) {
    const percentage = Math.round((spent / limit) * 100);
    return {
      type: 'budget_alert',
      title: 'Budget Alert',
      message: `You've spent ${percentage}% of your ${category} budget`,
      priority: percentage >= 90 ? 'high' : percentage >= 80 ? 'medium' : 'low',
      data: { category, spent, limit, percentage }
    };
  }

  createDebtReminder(debtName, dueDate, amount) {
    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return {
      type: 'debt_reminder',
      title: 'Debt Payment Due',
      message: `Payment for "${debtName}" is due in ${daysUntilDue} days`,
      priority: daysUntilDue <= 1 ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low',
      data: { debtName, dueDate, amount, daysUntilDue }
    };
  }

  createSavingsMilestone(goal, progress, target) {
    const percentage = Math.round((progress / target) * 100);
    return {
      type: 'financial_insight',
      title: 'Savings Milestone',
      message: `Congratulations! You've reached ${percentage}% of your ${goal} goal`,
      priority: 'low',
      data: { goal, progress, target, percentage }
    };
  }

  createSystemUpdate(feature) {
    return {
      type: 'system_update',
      title: 'System Update',
      message: `New features added: ${feature}`,
      priority: 'low',
      data: { feature }
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Initialize with mock data
notificationService.initializeMockData();

export default notificationService; 