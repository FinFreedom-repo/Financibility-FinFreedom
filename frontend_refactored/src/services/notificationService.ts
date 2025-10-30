import axios from "@/utils/axios";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  priority: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Array<
    (data: { notifications: Notification[]; unreadCount: number }) => void
  > = [];
  private unreadCount: number = 0;
  private isInitialized: boolean = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.fetchNotifications();
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
      // Start with empty notifications if backend is unavailable
      this.notifications = [];
      this.unreadCount = 0;
      this.isInitialized = true;
    }
  }

  async fetchNotifications() {
    try {
      const response = await axios.get("/api/mongodb/notifications/");
      this.notifications = response.data.notifications || [];
      this.unreadCount = response.data.unread_count || 0;
      this.notifyListeners();
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  getNotifications() {
    return this.notifications;
  }

  getUnreadCount() {
    return this.unreadCount;
  }

  async markAsRead(notificationId: string) {
    try {
      const notification = this.notifications.find(
        (n) => n._id === notificationId
      );
      if (notification) {
        notification.is_read = true;
        this.updateUnreadCount();
        this.notifyListeners();
      }

      await axios.post(`/api/mongodb/notifications/${notificationId}/read/`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async markAllAsRead() {
    try {
      this.notifications.forEach((n) => (n.is_read = true));
      this.updateUnreadCount();
      this.notifyListeners();

      await axios.post("/api/mongodb/notifications/mark-all-read/");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  subscribe(
    listener: (data: {
      notifications: Notification[];
      unreadCount: number;
    }) => void
  ) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) =>
      listener({
        notifications: this.notifications,
        unreadCount: this.unreadCount,
      })
    );
  }

  private updateUnreadCount() {
    this.unreadCount = this.notifications.filter((n) => !n.is_read).length;
  }

  formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  }
}

export default new NotificationService();
