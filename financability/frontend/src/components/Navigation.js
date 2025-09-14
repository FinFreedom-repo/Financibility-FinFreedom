import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Switch,
  Divider,
  Collapse,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  CreditCard as CreditCardIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  MonetizationOn as MonetizationOnIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationPopover from './NotificationPopover';
import notificationService from '../services/notificationService';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
  width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    borderRight: `1px solid ${theme.palette.divider}`,
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.action.hover,
      borderRadius: '3px',
    },
  },
}));

const StyledAppBar = styled(AppBar)(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
    : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 2px 20px rgba(0,0,0,0.3)'
    : '0 2px 20px rgba(25,118,210,0.15)',
  backdropFilter: 'blur(10px)',
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%)'
    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: 64,
}));

const ProfileSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%)'
    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const NavSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 0),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(2, 2, 1, 2),
  fontSize: '0.75rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

function Navigation({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true);
  const [accountsExpanded, setAccountsExpanded] = useState(true);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to notification service updates
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(({ unreadCount }) => {
      setUnreadCount(unreadCount);
    });

    // Initialize with current unread count
    setUnreadCount(notificationService.getUnreadCount());

    return unsubscribe;
  }, []);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onNavigate) onNavigate();
  };

  const mainMenuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      color: 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)'
    },
  ];

  const accountMenuItems = [
    { 
      text: 'Accounts & Debts', 
      icon: <AccountBalanceIcon />, 
      path: '/accounts-and-debts',
      color: 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)'
    },
    { 
      text: 'Monthly Budget', 
      icon: <ReceiptIcon />, 
      path: '/monthly-budget',
      color: 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)'
    },
    { 
      text: 'Debt Planning', 
      icon: <CreditCardIcon />, 
      path: '/debt-planning',
      color: 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)'
    },
  ];

  const analyticsMenuItems = [
    { 
      text: 'Expense Analyzer', 
      icon: <AnalyticsIcon />, 
      path: '/expense-analyzer',
      color: 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)'
    },
    { 
      text: 'Wealth Projector', 
      icon: <TrendingUpIcon />, 
      path: '/wealth-projector',
      color: 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)'
    },
  ];

  const renderMenuItem = (item) => {
    const isActive = location.pathname === item.path;
    
    // Handle gradient colors for all menu items
    const getActiveBackground = () => {
      if (isActive) {
        return 'linear-gradient(135deg, rgba(255, 0, 0, 0.2) 0%, rgba(0, 0, 255, 0.2) 100%)';
      }
      return 'transparent';
    };

    const getHoverBackground = () => {
      return 'linear-gradient(135deg, rgba(255, 0, 0, 0.15) 0%, rgba(0, 0, 255, 0.15) 100%)';
    };

    const getIconColor = () => {
      if (isActive) {
        return 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)';
      }
      return 'inherit';
    };

    const getTextColor = () => {
      if (isActive) {
        return 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)';
      }
      return 'inherit';
    };
    
    return (
      <ListItem key={item.path} disablePadding>
        <ListItemButton
          onClick={() => handleNavigation(item.path)}
          sx={{
            minHeight: 48,
            justifyContent: drawerOpen ? 'initial' : 'center',
            px: 2.5,
            mx: 1,
            my: 0.5,
            borderRadius: 2,
            background: getActiveBackground(),
            borderLeft: isActive ? '4px solid #ff0000' : '4px solid transparent',
            '&:hover': {
              background: getHoverBackground(),
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: drawerOpen ? 3 : 'auto',
              justifyContent: 'center',
              color: getIconColor(),
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.text} 
            sx={{ 
              opacity: drawerOpen ? 1 : 0,
              '& .MuiTypography-root': {
                fontWeight: isActive ? 600 : 400,
                color: getTextColor(),
              }
            }} 
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const renderCollapsibleSection = (title, items, expanded, onToggle) => (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={onToggle}
          sx={{
            minHeight: 48,
            justifyContent: drawerOpen ? 'initial' : 'center',
            px: 2.5,
            mx: 1,
            my: 0.5,
            borderRadius: 2,
          }}
        >
          <ListItemText 
            primary={title}
            sx={{ 
              opacity: drawerOpen ? 1 : 0,
              '& .MuiTypography-root': {
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'text.secondary',
              }
            }} 
          />
          {drawerOpen && (expanded ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
      </ListItem>
      <Collapse in={expanded && drawerOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: drawerOpen ? 1 : 0 }}>
          {items.map(renderMenuItem)}
        </List>
      </Collapse>
      {!drawerOpen && items.map(renderMenuItem)}
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <StyledAppBar position="fixed" open={drawerOpen}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            FinFreedom
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                size="large"
                onClick={handleNotificationOpen}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Search">
              <IconButton color="inherit" size="large">
                <SearchIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile">
              <IconButton 
                color="inherit" 
                onClick={handleProfileMenuOpen}
                size="large"
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </StyledAppBar>

      <StyledDrawer
        variant="permanent"
        open={drawerOpen}
      >
        <Toolbar />
        
        <LogoContainer>
          <MonetizationOnIcon sx={{ 
            mr: drawerOpen ? 1 : 0, 
            background: 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent'
          }} />
          {drawerOpen && (
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              background: 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            }}>
              FinFreedom
            </Typography>
          )}
        </LogoContainer>

        <ProfileSection>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            {drawerOpen && (
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {user?.username || 'User'}
                </Typography>
              </Box>
            )}
          </Box>
        </ProfileSection>

        <List>
          {/* Main Menu */}
          <NavSection>
            {mainMenuItems.map(renderMenuItem)}
          </NavSection>

          <Divider sx={{ mx: 2 }} />

          {/* Accounts Section */}
          <NavSection>
            {renderCollapsibleSection('Accounts', accountMenuItems, accountsExpanded, () => setAccountsExpanded(!accountsExpanded))}
          </NavSection>

          <Divider sx={{ mx: 2 }} />

          {/* Analytics Section */}
          <NavSection>
            {renderCollapsibleSection('Analytics', analyticsMenuItems, analyticsExpanded, () => setAnalyticsExpanded(!analyticsExpanded))}
          </NavSection>
        </List>

        <Box sx={{ flexGrow: 1 }} />
      </StyledDrawer>

      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            backdropFilter: 'blur(10px)',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); handleNavigation('/profile'); }}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleProfileMenuClose(); handleNavigation('/settings'); }}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Notification Popover */}
      <NotificationPopover
        open={Boolean(notificationAnchorEl)}
        anchorEl={notificationAnchorEl}
        onClose={handleNotificationClose}
      />
    </Box>
  );
}

export default Navigation; 