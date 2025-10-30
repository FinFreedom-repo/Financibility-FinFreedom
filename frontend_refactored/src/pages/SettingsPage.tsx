import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  LinearProgress,
  Button,
  Grid,
  Paper,
  Divider,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import Layout from "@/components/Layout/Layout";
import { useTheme } from "@/contexts/ThemeContext";
import settingsService from "@/services/settingsService";

const SettingsPage: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentPlans = [
    {
      id: "basic",
      name: "Basic",
      price: "Free",
      features: ["Core features", "Basic support"],
    },
    {
      id: "premium",
      name: "Premium",
      price: "$9.99/month",
      features: ["Advanced analytics", "Priority support", "Export data"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$29.99/month",
      features: ["All features", "Dedicated support", "Custom integrations"],
    },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError("Failed to load settings. Using default values.");
      const defaultSettings = settingsService.getDefaultSettings();
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box>
          <Typography variant="h4" gutterBottom>
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Manage your account preferences and settings
          </Typography>
          <LinearProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <SettingsIcon />
          </Avatar>
          <Box>
            <Typography variant="h4">Settings</Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account preferences and settings
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Appearance Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
              >
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
                </Avatar>
                <Typography variant="h6">Appearance</Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <ListItemIcon>
                    <DarkModeIcon />
                  </ListItemIcon>
                  <Box>
                    <Typography variant="body1">Dark Mode</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Switch between light & dark theme
                    </Typography>
                  </Box>
                </Box>
                <Switch checked={isDarkMode} onChange={toggleTheme} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Plan Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
              >
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <PaymentIcon />
                </Avatar>
                <Typography variant="h6">Payment Plan</Typography>
              </Box>

              <Grid container spacing={3}>
                {paymentPlans.map((plan) => (
                  <Grid item xs={12} sm={4} key={plan.id}>
                    <Paper
                      elevation={plan.id === settings?.payment_plan ? 8 : 2}
                      sx={{
                        p: 3,
                        height: "100%",
                        border: plan.id === settings?.payment_plan ? 2 : 1,
                        borderColor:
                          plan.id === settings?.payment_plan
                            ? "primary.main"
                            : "divider",
                      }}
                    >
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          {plan.name}
                        </Typography>
                        <Typography variant="h5" color="primary" gutterBottom>
                          {plan.price}
                        </Typography>
                        {plan.id === settings?.payment_plan && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Current Plan"
                            color="primary"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <List dense>
                        {plan.features.map((feature, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CheckCircleIcon
                                color="success"
                                fontSize="small"
                              />
                            </ListItemIcon>
                            <ListItemText primary={feature} />
                          </ListItem>
                        ))}
                      </List>

                      <Button
                        variant={
                          plan.id === settings?.payment_plan
                            ? "outlined"
                            : "contained"
                        }
                        fullWidth
                        sx={{ mt: 2 }}
                      >
                        {plan.id === settings?.payment_plan
                          ? "Current Plan"
                          : "Upgrade"}
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default SettingsPage;
