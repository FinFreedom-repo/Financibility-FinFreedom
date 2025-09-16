import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  LinearProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Loop as LoopIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CreditCard as CreditCardIcon,
  Analytics as AnalyticsIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  Savings as SavingsIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import Card from './common/Card';
import { Button as CustomButton } from './common/Button';

function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [financialSteps, setFinancialSteps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const babySteps = [
    {
      id: 1,
      title: "Save $2,000 for your starter emergency fund",
      description: "This is your first step to financial security.",
      icon: <SavingsIcon />,
      color: '#2e7d32'
    },
    {
      id: 2,
      title: "Pay off all debt (except the house) using the debt snowball",
      description: "List your debts from smallest to largest and attack them one by one.",
      icon: <CreditCardIcon />,
      color: '#d32f2f'
    },
    {
      id: 3,
      title: "Save 3-6 months of expenses in a fully funded emergency fund",
      description: "This is your complete emergency fund.",
      icon: <AccountBalanceIcon />,
      color: '#1976d2'
    },
    {
      id: 4,
      title: "Invest 15% of your household income in retirement",
      description: "Focus on tax-advantaged retirement accounts.",
      icon: <TrendingUpIcon />,
      color: '#7b1fa2'
    },
    {
      id: 5,
      title: "Save for your children's college fund",
      description: "Start saving for your children's education.",
      icon: <SchoolIcon />,
      color: '#f57c00'
    },
    {
      id: 6,
      title: "Pay off your home early",
      description: "Work on becoming completely debt-free.",
      icon: <HomeIcon />,
      color: '#388e3c'
    }
  ];

  const features = [
    {
      title: "Track Accounts & Debts",
      description: "Get a complete picture of your financial situation",
      icon: <AccountBalanceIcon />,
      path: "/accounts-and-debts",
      color: '#2e7d32'
    },
    {
      title: "Monthly Budgeting",
      description: "Create and stick to realistic spending plans",
      icon: <ReceiptIcon />,
      path: "/monthly-budget",
      color: '#ed6c02'
    },
    {
      title: "Expense Analysis",
      description: "Understand where your money goes",
      icon: <AnalyticsIcon />,
      path: "/expense-analyzer",
      color: '#7b1fa2'
    },
    {
      title: "Debt Planning",
      description: "Create strategies to eliminate debt faster",
      icon: <CreditCardIcon />,
      path: "/debt-planning",
      color: '#d32f2f'
    },
    {
      title: "Wealth Projection",
      description: "See your financial future with different scenarios",
      icon: <TrendingUpIcon />,
      path: "/wealth-projector",
      color: '#1565c0'
    }
  ];

  useEffect(() => {
    fetchFinancialSteps();
  }, []);

  const fetchFinancialSteps = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().toISOString();
      console.log(`🔄 [${timestamp}] Fetching financial steps...`);
      const url = `/api/mongodb/financial-steps/calculate/?t=${Date.now()}`;
      console.log('🌐 API URL:', url);
      const response = await axios.get(url);
      console.log(`📊 [${timestamp}] Financial steps response:`, response.data);
      console.log('📊 Response status:', response.status);
      setFinancialSteps(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching financial steps:', err);
      setError('Failed to load financial progress');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepId) => {
    if (!financialSteps) return 'pending';
    
    const currentStep = financialSteps.current_step;
    const stepProgress = financialSteps.step_progress;
    
    console.log(`🔍 Step ${stepId} status check:`, {
      currentStep,
      stepProgress,
      step1Data: financialSteps.steps?.step_1
    });
    
    // If this step is completed (current step is higher)
    if (currentStep > stepId) {
      return 'completed';
    }
    
    // If this is the current step and it's completed
    if (currentStep === stepId && stepProgress.completed) {
      return 'completed';
    }
    
    // If this is the current step and it's in progress
    if (currentStep === stepId && !stepProgress.completed) {
      return 'in-progress';
    }
    
    // Future step
    return 'pending';
  };

  const getStepProgress = (stepId) => {
    if (!financialSteps || financialSteps.current_step !== stepId) return null;
    
    const progress = financialSteps.step_progress;
    if (!progress || progress.completed) return null;
    
    console.log(`📊 Step ${stepId} progress:`, progress);
    
    return {
      progress: progress.progress || 0,
      current: progress.current_amount || progress.current_debt || progress.current_percent || 0,
      goal: progress.goal_amount || progress.goal_percent || progress.max_total_debt || 0,
      amount_paid_off: progress.amount_paid_off || 0,
      message: progress.message
    };
  };

  const renderStepIcon = (stepId) => {
    const status = getStepStatus(stepId);
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: '#2e7d32' }} />;
      case 'in-progress':
        return <LoopIcon sx={{ color: '#ed6c02' }} />;
      default:
        return <RadioButtonUncheckedIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const renderStepProgress = (stepId) => {
    const progress = getStepProgress(stepId);
    if (!progress) {
      console.log(`❌ No progress data for step ${stepId}`);
      return null;
    }
    
    console.log(`✅ Rendering progress for step ${stepId}:`, progress);
    
    return (
      <Box sx={{ mt: 2 }}>
        <LinearProgress
          variant="determinate"
          value={progress.progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha(babySteps[stepId - 1].color, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: babySteps[stepId - 1].color,
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {progress.message || `${Math.round(progress.progress)}% complete`}
          </Typography>
          {stepId !== 2 && progress.current && progress.goal && (
            <Typography variant="body2" color="text.secondary">
              ${progress.current.toLocaleString()} / ${progress.goal.toLocaleString()}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Loading your financial progress...
            </Typography>
            <LinearProgress sx={{ mt: 2 }} />
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Welcome to Financability! 👋
      </Typography>

      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DashboardIcon color="primary" />
                Your Financial Dashboard
              </Typography>
              
              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                Your personal financial management dashboard is here to help you take control of your money and build a secure financial future. 
                This is your command center for tracking accounts, managing debts, creating budgets, and planning your path to financial freedom.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                What you can do here:
              </Typography>
              
              <Grid container spacing={2}>
                {features.map((feature, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: `1px solid ${alpha(feature.color, 0.2)}`,
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 20px ${alpha(feature.color, 0.1)}`,
                          borderColor: feature.color,
                        }
                      }}
                      onClick={() => navigate(feature.path)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                          p: 1, 
                          borderRadius: 1, 
                          bgcolor: alpha(feature.color, 0.1),
                          color: feature.color
                        }}>
                          {feature.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {feature.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4, p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  🚀 Ready to get started?
                </Typography>
                <Typography variant="body2" paragraph>
                  The best way to begin your financial journey is to input your current accounts and debts. 
                  This gives us the foundation we need to provide personalized insights and recommendations.
                </Typography>
                <CustomButton
                  variant="contained"
                  onClick={() => navigate('/accounts-and-debts')}
                  sx={{ mt: 1 }}
                >
                  📝 Add Your Accounts & Debts
                </CustomButton>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  This takes just a few minutes and will unlock all the dashboard features!
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Financial Steps Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon color="primary" />
                  Financial Planning Checklist
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    onClick={() => {
                      console.log('🔄 Manual refresh triggered');
                      fetchFinancialSteps();
                    }}
                    disabled={loading}
                    startIcon={<RefreshIcon />}
                    size="small"
                    variant="outlined"
                  >
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </Box>
              </Box>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <List>
                {babySteps.map((step) => {
                  const status = getStepStatus(step.id);
                  console.log(`🎯 Rendering step ${step.id}:`, {
                    status,
                    financialSteps: financialSteps,
                    stepData: financialSteps?.steps?.[`step_${step.id}`]
                  });
                  return (
                    <ListItem key={step.id} sx={{ px: 0, py: 1 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          width: '100%',
                          border: `1px solid ${alpha(step.color, 0.2)}`,
                          borderRadius: 2,
                          bgcolor: status === 'completed' ? alpha(step.color, 0.05) : 'transparent',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ 
                            p: 1, 
                            borderRadius: 1, 
                            bgcolor: alpha(step.color, 0.1),
                            color: step.color
                          }}>
                            {step.icon}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Chip
                                label={`Step ${step.id}`}
                                size="small"
                                sx={{ bgcolor: alpha(step.color, 0.1), color: step.color }}
                              />
                              {renderStepIcon(step.id)}
                            </Box>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              {step.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {step.description}
                            </Typography>
                            {renderStepProgress(step.id)}
                          </Box>
                        </Box>
                      </Paper>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 