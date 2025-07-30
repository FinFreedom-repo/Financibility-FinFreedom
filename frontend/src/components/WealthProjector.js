import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Slider,
  Divider,
  Alert,
  Snackbar,
  Fade,
  useTheme,
  useMediaQuery,
  Stack,
  Paper,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Timeline as TimelineIcon,
  AttachMoney as MoneyIcon,
  Calculate as CalculateIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Savings as SavingsIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import axios from '../utils/axios';
import accountsDebtsService from '../services/accountsDebtsService';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import Chart from './common/Chart';
import Loading from './common/Loading';
import { Button as CustomButton } from './common/Button';
import CustomCard from './common/Card';
import Input from './common/Input';

function WealthProjector({ onNavigateToAccount }) {
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = useState({
    age: 25,
    startWealth: 0,
    debt: 0,
    debtInterest: 6,
    assetInterest: 10.5,
    inflation: 2.5,
    taxRate: 25,
    annualContributions: 1000,
    checkingInterest: 4,
    maxAge: 85
  });

  const [showChart, setShowChart] = useState(false);
  const [projectionData, setProjectionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [useRealData, setUseRealData] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load user profile
      const profileResponse = await axios.get('/api/user-profile/');
      if (profileResponse.data) {
        setUserProfile(profileResponse.data);
        if (profileResponse.data.age) {
          setFormData(prev => ({ ...prev, age: profileResponse.data.age }));
        }
      }

      // Load budget data
      const budgetResponse = await axios.get('/api/budgets/');
      if (budgetResponse.data && budgetResponse.data.length > 0) {
        setBudgetData(budgetResponse.data[0]);
      }

      // Load accounts data
      const accountsResponse = await accountsDebtsService.getAccounts();
      if (accountsResponse && Array.isArray(accountsResponse)) {
        const totalAssets = accountsResponse.reduce((sum, account) => 
          sum + parseFloat(account.balance || 0), 0
        );
        setFormData(prev => ({ ...prev, startWealth: totalAssets }));
      }

      // Load debts data
      const debtsResponse = await accountsDebtsService.getDebts();
      if (debtsResponse && Array.isArray(debtsResponse)) {
        const totalDebts = debtsResponse.reduce((sum, debt) => 
          sum + parseFloat(debt.balance || 0), 0
        );
        setFormData(prev => ({ ...prev, debt: totalDebts }));
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading user data:', error);
      setErrorMessage('Failed to load user data');
      setShowErrorSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProjection = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/wealth-projection/', formData);
      setProjectionData(response.data);
      setShowChart(true);
      setSuccessMessage('Projection calculated successfully!');
      setShowSuccessSnackbar(true);
    } catch (error) {
      console.error('Error calculating projection:', error);
      setErrorMessage('Failed to calculate projection');
      setShowErrorSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatAge = (age) => {
    return `${age} years old`;
  };

  const chartData = useMemo(() => {
    if (!projectionData) return null;

    const labels = projectionData.map(item => item.age);
    const datasets = [
      {
        label: 'Net Worth',
        data: projectionData.map(item => item.net_worth),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Assets',
        data: projectionData.map(item => item.assets),
        borderColor: theme.palette.success.main,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4
      },
      {
        label: 'Debt',
        data: projectionData.map(item => item.debt),
        borderColor: theme.palette.error.main,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4
      }
    ];

    return { labels, datasets };
  }, [projectionData, theme]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Age',
          color: theme.palette.text.primary
        },
        ticks: {
          color: theme.palette.text.secondary
        },
        grid: {
          color: theme.palette.divider
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Amount ($)',
          color: theme.palette.text.primary
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: function(value) {
            return formatCurrency(value);
          }
        },
        grid: {
          color: theme.palette.divider
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      },
      legend: {
        labels: {
          color: theme.palette.text.primary
        }
      }
    }
  };

  const getKeyMetrics = () => {
    if (!projectionData) return null;

    const finalData = projectionData[projectionData.length - 1];
    const retirementAge = 65;
    const retirementData = projectionData.find(item => item.age >= retirementAge);
    
    return {
      finalNetWorth: finalData.net_worth,
      retirementNetWorth: retirementData ? retirementData.net_worth : 0,
      debtFreeAge: projectionData.find(item => item.debt <= 0)?.age || 'Never',
      millionaireAge: projectionData.find(item => item.net_worth >= 1000000)?.age || 'Never'
    };
  };

  const keyMetrics = getKeyMetrics();

  if (isLoading && !dataLoaded) {
    return <Loading.PageLoader />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Fade in={true}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.text.primary,
            mb: 3
          }}>
            Wealth Projector
          </Typography>

          <Grid container spacing={3}>
            {/* Input Panel */}
            <Grid item xs={12} lg={4}>
              <CustomCard elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <CalculateIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">
                      Projection Parameters
                    </Typography>
                  </Box>

                  <Stack spacing={3}>
                    {/* Basic Info */}
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Personal Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            label="Current Age"
                            type="number"
                            value={formData.age}
                            onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">years</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Maximum Age"
                            type="number"
                            value={formData.maxAge}
                            onChange={(e) => handleInputChange('maxAge', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">years</InputAdornment>
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    {/* Financial Position */}
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Current Financial Position
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            label="Starting Wealth"
                            type="number"
                            value={formData.startWealth}
                            onChange={(e) => handleInputChange('startWealth', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Current Debt"
                            type="number"
                            value={formData.debt}
                            onChange={(e) => handleInputChange('debt', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Annual Contributions"
                            type="number"
                            value={formData.annualContributions}
                            onChange={(e) => handleInputChange('annualContributions', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    {/* Interest Rates */}
                    <Accordion 
                      expanded={expandedAccordion} 
                      onChange={() => setExpandedAccordion(!expandedAccordion)}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SettingsIcon sx={{ mr: 1 }} />
                          <Typography variant="subtitle1">Advanced Settings</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            label="Asset Interest Rate"
                            type="number"
                            value={formData.assetInterest}
                            onChange={(e) => handleInputChange('assetInterest', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>
                            }}
                          />
                          <TextField
                            label="Debt Interest Rate"
                            type="number"
                            value={formData.debtInterest}
                            onChange={(e) => handleInputChange('debtInterest', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>
                            }}
                          />
                          <TextField
                            label="Inflation Rate"
                            type="number"
                            value={formData.inflation}
                            onChange={(e) => handleInputChange('inflation', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>
                            }}
                          />
                          <TextField
                            label="Tax Rate"
                            type="number"
                            value={formData.taxRate}
                            onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>
                            }}
                          />
                          <TextField
                            label="Checking Interest Rate"
                            type="number"
                            value={formData.checkingInterest}
                            onChange={(e) => handleInputChange('checkingInterest', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>
                            }}
                          />
                        </Stack>
                      </AccordionDetails>
                    </Accordion>

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <CustomButton
                        variant="contained"
                        color="primary"
                        onClick={calculateProjection}
                        startIcon={isLoading ? <CircularProgress size={20} /> : <ShowChartIcon />}
                        disabled={isLoading}
                        size="large"
                      >
                        {isLoading ? 'Calculating...' : 'Calculate Projection'}
                      </CustomButton>
                    </Box>
                  </Stack>
                </CardContent>
              </CustomCard>
            </Grid>

            {/* Results Panel */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={3}>
                {/* Key Metrics */}
                {keyMetrics && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <CustomCard elevation={2}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2, width: 32, height: 32 }}>
                              <TrendingUpIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {formatCurrency(keyMetrics.finalNetWorth)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Final Net Worth
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </CustomCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <CustomCard elevation={2}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2, width: 32, height: 32 }}>
                              <SavingsIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {formatCurrency(keyMetrics.retirementNetWorth)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                At Retirement (65)
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </CustomCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <CustomCard elevation={2}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 2, width: 32, height: 32 }}>
                              <AccountBalanceIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {keyMetrics.debtFreeAge === 'Never' ? 'Never' : formatAge(keyMetrics.debtFreeAge)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Debt Free Age
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </CustomCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <CustomCard elevation={2}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2, width: 32, height: 32 }}>
                              <MoneyIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {keyMetrics.millionaireAge === 'Never' ? 'Never' : formatAge(keyMetrics.millionaireAge)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Millionaire Age
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </CustomCard>
                    </Grid>
                  </Grid>
                )}

                {/* Chart */}
                {showChart && chartData && (
                  <CustomCard elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TimelineIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="h6">
                          Wealth Projection Over Time
                        </Typography>
                      </Box>
                      <Chart
                        type="line"
                        data={chartData}
                        options={chartOptions}
                        height={400}
                      />
                    </CardContent>
                  </CustomCard>
                )}

                {/* Instructions */}
                {!showChart && (
                  <CustomCard elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <InfoIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                        <Typography variant="h6">
                          How to Use the Wealth Projector
                        </Typography>
                      </Box>
                      <Typography variant="body1" paragraph>
                        The Wealth Projector helps you visualize your financial future by modeling how your wealth will grow over time based on your current financial situation and assumptions about returns, inflation, and contributions.
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        1. Enter your current age and financial position<br/>
                        2. Adjust the interest rates and other parameters in Advanced Settings<br/>
                        3. Click "Calculate Projection" to see your wealth growth chart<br/>
                        4. Use the insights to make informed financial decisions
                      </Typography>
                    </CardContent>
                  </CustomCard>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Fade>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowErrorSnackbar(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default WealthProjector;
