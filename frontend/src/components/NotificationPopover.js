import React, { useState, useEffect } from 'react';
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
  Slide,
  IconButton,
  Badge,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import notificationService from '../services/notificationService';



const getNotificationIcon = (type) => {
  switch (type) {
    case 'budget_alert':
      return <WarningIcon color="error" />; // Red
    case 'debt_reminder':
      return <CreditCardIcon color="primary" />; // Blue
    case 'financial_insight':
      return <TrendingUpIcon color="success" />; // Green
    case 'system_update':
      return <InfoIcon color="primary" />; // Blue
    default:
      return <NotificationsIcon color="primary" />; // Blue
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'error'; // Red
    case 'medium':
      return 'primary'; // Blue
    case 'low':
      return 'success'; // Green
    default:
      return 'primary'; // Blue
  }
};

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const handleMarkAsRead = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <ListItem
      sx={{
        backgroundColor: notification.isRead 
          ? 'transparent' 
          : isDarkMode 
            ? 'rgba(255,255,255,0.05)' 
            : 'action.hover',
        '&:hover': {
          backgroundColor: isDarkMode 
            ? 'rgba(255,255,255,0.1)' 
            : 'action.selected',
        },
        cursor: 'pointer',
        borderLeft: notification.isRead ? 'none' : `4px solid ${getPriorityColor(notification.priority) === 'error' ? '#f44336' : getPriorityColor(notification.priority) === 'primary' ? '#2196f3' : '#4caf50'}`,
      }}
      onClick={handleMarkAsRead}
    >
      <ListItemIcon>
        {getNotificationIcon(notification.type)}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: notification.isRead ? 'normal' : 'bold',
              color: isDarkMode ? 'white' : 'inherit'
            }}>
              {notification.title}
            </Typography>
            {!notification.isRead && (
              <Chip 
                label="New" 
                size="small" 
                color={getPriorityColor(notification.priority)}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" sx={{ 
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary'
            }}>
              {notification.message}
            </Typography>
            <Typography variant="caption" sx={{ 
              mt: 0.5, 
              display: 'block',
              color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'text.disabled'
            }}>
              {notification.timestamp}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
};

const NotificationPopover = ({ open, anchorEl, onClose }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to notification service updates
    const unsubscribe = notificationService.subscribe(({ notifications, unreadCount }) => {
      setNotifications(notifications);
      setUnreadCount(unreadCount);
    });

    // Initialize with current data
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    return unsubscribe;
  }, []);

  const handleMarkAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClose = () => {
    onClose();
  };

  return (
                    <Popover
                  open={open}
                  anchorEl={anchorEl}
                  onClose={handleClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    sx: {
                      width: 400,
                      maxHeight: 500,
                      borderRadius: 2,
                      marginLeft: '10px',
                      boxShadow: isDarkMode 
                        ? '0 8px 32px rgba(0,0,0,0.4)' 
                        : '0 8px 32px rgba(0,0,0,0.12)',
                      border: isDarkMode 
                        ? '1px solid rgba(255,255,255,0.1)' 
                        : '1px solid rgba(0,0,0,0.1)',
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    }
                  }}
                >
                        <Slide 
                    direction="down" 
                    in={open} 
                    mountOnEnter 
                    unmountOnExit
                    timeout={300}
                    easing={{
                      enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
                      exit: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
        <Box>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isDarkMode 
              ? 'linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%)'
              : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
          }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <NotificationsIcon color={isDarkMode ? "primary" : "primary"} />
                          <Typography variant="h6" sx={{ 
                            fontWeight: 'bold',
                            color: isDarkMode ? 'white' : 'inherit',
                            marginRight: '8px'
                          }}>
                            Notifications
                          </Typography>
                          {unreadCount > 0 && (
                            <Badge badgeContent={unreadCount} color="error" />
                          )}
                        </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {unreadCount > 0 && (
                <Button 
                  size="small" 
                  onClick={handleMarkAllAsRead}
                  sx={{ 
                    fontSize: '0.75rem',
                    color: isDarkMode ? 'white' : 'inherit',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  Mark all read
                </Button>
              )}
              <IconButton 
                size="small" 
                onClick={handleClose}
                sx={{
                  color: isDarkMode ? 'white' : 'inherit',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          
          {/* Notification List */}
          <List sx={{ 
            maxHeight: 400, 
            overflow: 'auto', 
            p: 0,
            background: isDarkMode ? 'transparent' : 'transparent'
          }}>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem 
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                  {index < notifications.length - 1 && (
                    <Divider sx={{ mx: 2 }} />
                  )}
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <NotificationsIcon sx={{ 
                  fontSize: 48, 
                  color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'text.disabled', 
                  mb: 1 
                }} />
                <Typography variant="body2" sx={{ 
                  color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                }}>
                  No notifications yet
                </Typography>
              </Box>
            )}
          </List>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <Box sx={{ 
              p: 1.5, 
              borderTop: 1, 
              borderColor: 'divider',
              textAlign: 'center',
              background: isDarkMode 
                ? 'rgba(255,255,255,0.02)' 
                : 'rgba(0,0,0,0.02)'
            }}>
              <Typography variant="caption" sx={{ 
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary'
              }}>
                {unreadCount} unread • {notifications.length} total
              </Typography>
            </Box>
          )}
        </Box>
      </Slide>
    </Popover>
  );
};

export default NotificationPopover; 