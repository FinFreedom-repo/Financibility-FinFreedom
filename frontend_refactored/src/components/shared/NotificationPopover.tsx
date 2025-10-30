import React, { useState, useEffect } from "react";
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  Chip,
  IconButton,
  Badge,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  CreditCard as CreditCardIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import notificationService from "@/services/notificationService";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  priority: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "budget_alert":
      return <WarningIcon color="error" />;
    case "debt_reminder":
      return <CreditCardIcon color="primary" />;
    case "financial_insight":
      return <TrendingUpIcon color="success" />;
    case "system_update":
      return <InfoIcon color="primary" />;
    default:
      return <NotificationsIcon color="primary" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "error";
    case "medium":
      return "primary";
    case "low":
      return "success";
    default:
      return "primary";
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const { isDarkMode } = useTheme();

  const handleMarkAsRead = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification._id);
    }
  };

  return (
    <ListItem
      sx={{
        backgroundColor: notification.is_read
          ? "transparent"
          : isDarkMode
          ? "rgba(255,255,255,0.05)"
          : "action.hover",
        "&:hover": {
          backgroundColor: isDarkMode
            ? "rgba(255,255,255,0.1)"
            : "action.selected",
        },
        cursor: "pointer",
        borderLeft: notification.is_read
          ? "none"
          : `4px solid ${
              getPriorityColor(notification.priority) === "error"
                ? "#f44336"
                : getPriorityColor(notification.priority) === "primary"
                ? "#2196f3"
                : "#4caf50"
            }`,
      }}
      onClick={handleMarkAsRead}
    >
      <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: notification.is_read ? "normal" : "bold",
              }}
            >
              {notification.title}
            </Typography>
            {!notification.is_read && (
              <Chip
                label="New"
                size="small"
                color={getPriorityColor(notification.priority) as any}
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            )}
          </Box>
        }
        secondary={
          <>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {notificationService.formatTimestamp(notification.created_at)}
            </Typography>
          </>
        }
      />
    </ListItem>
  );
};

interface NotificationPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  open,
  anchorEl,
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(
      ({ notifications, unreadCount }) => {
        setNotifications(notifications);
        setUnreadCount(unreadCount);
      }
    );

    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    return unsubscribe;
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          width: 400,
          maxHeight: 500,
          overflow: "auto",
          borderRadius: 2,
          marginLeft: "10px",
        },
      }}
    >
      <Box>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" />
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllAsRead}>
                Mark all read
              </Button>
            )}
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Notification List */}
        <List sx={{ p: 0 }}>
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
                {index < notifications.length - 1 && <Divider sx={{ mx: 2 }} />}
              </React.Fragment>
            ))
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <NotificationsIcon
                sx={{
                  fontSize: 48,
                  color: "text.disabled",
                  mb: 1,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          )}
        </List>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              borderTop: 1,
              borderColor: "divider",
              textAlign: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {unreadCount} unread • {notifications.length} total
            </Typography>
          </Box>
        )}
      </Box>
    </Popover>
  );
};

export default NotificationPopover;
