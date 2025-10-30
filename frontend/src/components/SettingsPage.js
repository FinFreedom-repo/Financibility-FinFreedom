import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  LinearProgress,
  Button,
  Grid,
  Paper,
  alpha,
} from '@mui/material';

import {
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import settingsService from '../services/settingsService';
import '../styles/SettingsPage.css';

function SettingsPage() {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsService.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load settings. Using default values.');
        // Fallback to default settings
        const defaultSettings = settingsService.getDefaultSettings();
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const paymentPlans = [
    { id: 'basic', name: 'Basic', price: 'Free', features: ['Core features', 'Basic support'] },
    { id: 'premium', name: 'Premium', price: '$9.99/month', features: ['Advanced analytics', 'Priority support', 'Export data'] },
    { id: 'enterprise', name: 'Enterprise', price: '$29.99/month', features: ['All features', 'Dedicated support', 'Custom integrations'] },
  ];

  if (loading) {
    return (
      <Box className="settings-container">
        <Box className="settings-header">
          <Typography variant="h4" className="settings-title">
            Settings
          </Typography>
          <Typography variant="body1" className="settings-subtitle">
            Manage your account preferences and settings
          </Typography>
        </Box>
        <LinearProgress className="settings-progress" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="settings-container">
        <Alert severity="error" className="settings-error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box className={`settings-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header Section */}
      <Box className="settings-header">
        <Box className="settings-header-content">
          <Box className="settings-title-section">
            <Avatar className="settings-avatar">
              <SettingsIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" className="settings-title">
                Settings
              </Typography>
              <Typography variant="body1" className="settings-subtitle">
                Manage your account preferences and settings
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="settings-content">
        <Grid container spacing={3} className="settings-grid">
        {/* Appearance Section */}
        <Grid item xs={12} md={6}>
          <Card className="settings-card appearance-card">
            <CardContent className="settings-card-content">
              <Box className="settings-section-header">
                <Box className="settings-section-icon">
                  {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
                </Box>
                <Typography variant="h6" className="settings-section-title">
                  Appearance
                </Typography>
              </Box>
              
              <Box className="settings-toggle-container">
                <Box className="settings-toggle-content">
                  <Box className="settings-toggle-info">
                    <ListItemIcon className="settings-list-icon">
                      <DarkModeIcon />
                    </ListItemIcon>
                    <Box className="settings-toggle-text">
                      <Typography variant="body1" className="settings-toggle-primary">
                        Dark Mode
                      </Typography>
                      <Typography variant="body2" className="settings-toggle-secondary">
                        Switch between light & dark theme
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    className="settings-switch"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Plan Section */}
        <Grid item xs={12}>
          <Card className="settings-card payment-card">
            <CardContent className="settings-card-content">
              <Box className="settings-section-header">
                <Box className="settings-section-icon">
                  <PaymentIcon />
                </Box>
                <Typography variant="h6" className="settings-section-title">
                  Payment Plan
                </Typography>
              </Box>
              
              <Box className="payment-plans-container">
                <Grid container spacing={3}>
                  {paymentPlans.map((plan) => (
                    <Grid item xs={12} sm={4} key={plan.id}>
                      <Paper 
                        className={`payment-plan ${plan.id === settings?.payment_plan ? 'active' : ''}`}
                        elevation={plan.id === settings?.payment_plan ? 8 : 2}
                      >
                        <Box className="payment-plan-header">
                          <Typography variant="h6" className="payment-plan-name">
                            {plan.name}
                          </Typography>
                          <Typography variant="h5" className="payment-plan-price">
                            {plan.price}
                          </Typography>
                          {plan.id === settings?.payment_plan && (
                            <Chip 
                              icon={<CheckCircleIcon />}
                              label="Current Plan"
                              className="current-plan-chip"
                              size="small"
                            />
                          )}
                        </Box>
                        <Divider className="payment-plan-divider" />
                        <List className="payment-plan-features">
                          {plan.features.map((feature, index) => (
                            <ListItem key={index} className="payment-plan-feature">
                              <ListItemIcon className="payment-plan-feature-icon">
                                <CheckCircleIcon />
                              </ListItemIcon>
                              <ListItemText 
                                primary={feature}
                                className="payment-plan-feature-text"
                              />
                            </ListItem>
                          ))}
                        </List>
                        <Box className="payment-plan-actions">
                          <Button 
                            variant={plan.id === settings?.payment_plan ? "outlined" : "contained"}
                            className={`payment-plan-button ${plan.id === settings?.payment_plan ? 'current' : ''}`}
                            fullWidth
                          >
                            {plan.id === settings?.payment_plan ? 'Current Plan' : 'Upgrade'}
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default SettingsPage; 