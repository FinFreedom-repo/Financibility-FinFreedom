import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Notification } from '../services/notificationService';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    // Only load notifications if user is authenticated
    if (!isAuthenticated || !user) {
      // Silently clear notifications when not authenticated (expected during logout)
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(5);
      console.log('🔔 NotificationContext - API response:', response);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unread_count || 0);
      console.log('🔔 NotificationContext - Set unreadCount to:', response.unread_count || 0);
      
      // If no notifications exist, try to initialize them
      if (response.notifications.length === 0 && response.unread_count === 0) {
        console.log('🔔 No notifications found, attempting to initialize...');
        try {
          const initResponse = await notificationService.initializeNotifications();
          setNotifications(initResponse.notifications || []);
          setUnreadCount(initResponse.unread_count || 0);
        } catch (initError) {
          console.log('🔔 Initialization failed, continuing with empty state');
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Set empty state instead of showing error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId)
      );
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  }, [notifications]);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // Load notifications on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user, loadNotifications]);

  // Auto-refresh notifications every 30 seconds (only when authenticated)
  useEffect(() => {
    if (isAuthenticated && user) {
      const interval = setInterval(() => {
        // Only call loadNotifications if still authenticated
        if (isAuthenticated && user) {
          loadNotifications();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, loadNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
