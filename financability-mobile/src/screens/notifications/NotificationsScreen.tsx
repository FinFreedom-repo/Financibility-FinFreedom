import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification } from '../../services/notificationService';
import { NotificationList } from '../../components/notifications';

const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  // Refresh notifications when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  const handleNotificationPress = useCallback((notification: Notification) => {
    // Handle notification press - could navigate to specific screens based on type
    console.log('Notification pressed:', notification);

    // Example navigation logic based on notification type
    switch (notification.type) {
      case 'budget_alert':
        // Navigate to budget screen
        console.log('Navigate to budget screen');
        break;
      case 'debt_reminder':
        // Navigate to debt planning screen
        console.log('Navigate to debt planning screen');
        break;
      case 'savings_milestone':
        // Navigate to savings screen
        console.log('Navigate to savings screen');
        break;
      default:
        console.log('General notification pressed');
    }
  }, []);

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsRead(notificationId);
      } catch (error) {
        Alert.alert('Error', 'Failed to mark notification as read');
      }
    },
    [markAsRead]
  );

  const handleDelete = useCallback(
    async (notificationId: string) => {
      try {
        await deleteNotification(notificationId);
      } catch (error) {
        Alert.alert('Error', 'Failed to delete notification');
      }
    },
    [deleteNotification]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  }, [markAllAsRead]);

  const styles = createStyles(theme);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons
              name="notifications"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Ionicons
                name="checkmark-done"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.markAllText, { color: theme.colors.primary }]}
              >
                Mark All Read
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notification List */}
      <NotificationList
        onNotificationPress={handleNotificationPress}
        style={styles.listContainer}
      />
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginLeft: theme.spacing.sm,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      marginLeft: theme.spacing.sm,
    },
    badgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    markAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '10',
    },
    markAllText: {
      fontSize: 14,
      fontWeight: '500',
      marginLeft: theme.spacing.xs,
    },
    listContainer: {
      flex: 1,
    },
  });

export default NotificationsScreen;
