import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  LinearProgress,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CreditCard as CreditCardIcon,
  Analytics as AnalyticsIcon,
  Savings as SavingsIcon,
  School as SchoolIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import axios from "@/utils/axios";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [financialSteps, setFinancialSteps] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const babySteps = [
    {
      id: 1,
      title: "Save $2,000 for your starter emergency fund",
      icon: <SavingsIcon />,
    },
    {
      id: 2,
      title: "Pay off all debt (except the house) using the debt snowball",
      icon: <CreditCardIcon />,
    },
    {
      id: 3,
      title: "Save 3-6 months of expenses in a fully funded emergency fund",
      icon: <AccountBalanceIcon />,
    },
    {
      id: 4,
      title: "Invest 15% of your household income in retirement",
      icon: <TrendingUpIcon />,
    },
    {
      id: 5,
      title: "Save for your children's college fund",
      icon: <SchoolIcon />,
    },
    {
      id: 6,
      title: "Pay off your home early",
      icon: <HomeIcon />,
    },
  ];

  const features = [
    {
      title: "Track Accounts & Debts",
      icon: <AccountBalanceIcon />,
      path: "/accounts-and-debts",
    },
    {
      title: "Monthly Budgeting",
      icon: <ReceiptIcon />,
      path: "/monthly-budget",
    },
    {
      title: "Debt Planning",
      icon: <CreditCardIcon />,
      path: "/debt-planning",
    },
    {
      title: "Expense Analyzer",
      icon: <AnalyticsIcon />,
      path: "/expense-analyzer",
    },
    {
      title: "Wealth Projector",
      icon: <TrendingUpIcon />,
      path: "/wealth-projector",
    },
  ];

  useEffect(() => {
    fetchFinancialSteps();
  }, []);

  const fetchFinancialSteps = async () => {
    try {
      const response = await axios.get("/api/mongodb/financial-steps/");
      setFinancialSteps(response.data);
    } catch (error) {
      console.error("Error fetching financial steps:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = async (stepId: number) => {
    try {
      await axios.post("/api/mongodb/financial-steps/toggle/", {
        step: stepId,
      });
      fetchFinancialSteps();
    } catch (error) {
      console.error("Error toggling step:", error);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Financial Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Financial Baby Steps */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Financial Baby Steps
            </Typography>
            {loading ? (
              <LinearProgress />
            ) : (
              <List>
                {babySteps.map((step) => {
                  const isComplete = financialSteps?.completed_steps?.includes(
                    step.id
                  );
                  return (
                    <ListItem
                      key={step.id}
                      button
                      onClick={() => toggleStep(step.id)}
                    >
                      <ListItemIcon>
                        {isComplete ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <RadioButtonUncheckedIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={`Step ${step.id}: ${step.title}`}
                        primaryTypographyProps={{
                          style: {
                            textDecoration: isComplete
                              ? "line-through"
                              : "none",
                          },
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {features.map((feature) => (
                <Grid item xs={12} sm={6} key={feature.title}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={feature.icon}
                    onClick={() => navigate(feature.path)}
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                  >
                    {feature.title}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default DashboardPage;
