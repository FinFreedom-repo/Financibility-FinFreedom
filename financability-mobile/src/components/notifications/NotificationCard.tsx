import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Notification } from '../../services/notificationService';
import notificationService from '../../services/notificationService';

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
  onToggleRead?: (id: string) => void;
  style?: any;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onToggleRead,
  style,
}) => {
  const { theme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    // Toggle read status on tap
    if (onToggleRead) {
      onToggleRead(notification._id);
    }
    if (onPress) {
      onPress();
    }
  };

  const getNotificationIcon = () => {
    return notificationService.getNotificationIcon(notification.type);
  };

  const getNotificationColor = () => {
    return notificationService.getNotificationColor(notification.priority);
  };

  const formatDate = () => {
    return notificationService.formatNotificationDate(notification.created_at);
  };

  const styles = createStyles(theme);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: notification.is_read 
              ? theme.colors.surface 
              : theme.colors.primary + '10',
            borderLeftColor: getNotificationColor(),
            borderLeftWidth: 4,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconBackground,
                { backgroundColor: getNotificationColor() + '20' },
              ]}
            >
              <Ionicons
                name={getNotificationIcon() as any}
                size={20}
                color={getNotificationColor()}
              />
            </View>
          </View>
          
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  {
                    color: notification.is_read 
                      ? theme.colors.textSecondary 
                      : theme.colors.text,
                    fontWeight: notification.is_read ? '400' : '600',
                  },
                ]}
                numberOfLines={2}
              >
                {notification.title}
              </Text>
              
              {!notification.is_read && (
                <View style={styles.unreadDot} />
              )}
            </View>
            
            <Text
              style={[
                styles.message,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={3}
            >
              {notification.message}
            </Text>
            
            <View style={styles.footer}>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusIndicator,
                    { 
                      backgroundColor: notification.is_read 
                        ? theme.colors.textSecondary + '30'
                        : theme.colors.primary 
                    }
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { 
                      color: notification.is_read 
                        ? theme.colors.textSecondary 
                        : theme.colors.primary 
                    }
                  ]}
                >
                  {notification.is_read ? 'Read' : 'Unread'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  card: {
    borderRadius: 12,
    padding: theme.spacing.md,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: 16,
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default NotificationCard;
