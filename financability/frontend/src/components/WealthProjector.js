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
  CircularProgress,
  FormHelperText,
  alpha
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
  ShowChart as ShowChartIcon,
  Help as HelpIcon
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
  const [validationErrors, setValidationErrors] = useState({});
  const [chartMode, setChartMode] = useState(0); // 0: No Inflation, 1: Inflation Adjusted, 2: Checking

  useEffect(() => {
    loadUserData();
  }, []);

  // Debug: Log form data changes
  useEffect(() => {
    console.log('📊 Form data updated:', formData);
  }, [formData]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading user data for Wealth Projector...');
      
      // Load wealth projection settings first
      console.log('💰 Loading wealth projection settings...');
      try {
        const settingsResponse = await axios.get('/api/mongodb/wealth-projection-settings/');
        console.log('✅ Settings response:', settingsResponse.data);
        if (settingsResponse.data && settingsResponse.data.success && settingsResponse.data.settings) {
          const settings = settingsResponse.data.settings;
          console.log('📊 Loading saved settings:', settings);
          setFormData({
            age: settings.age || 25,
            maxAge: settings.max_age || 100,
            startWealth: settings.start_wealth || 0,
            debt: settings.debt || 0,
            debtInterest: settings.debt_interest || 6,
            assetInterest: settings.asset_interest || 10.5,
            inflation: settings.inflation || 2.5,
            taxRate: settings.tax_rate || 25,
            annualContributions: settings.annual_contributions || 1000,
            checkingInterest: settings.checking_interest || 4
          });
          console.log('✅ Settings loaded successfully');
          setDataLoaded(true);
          return; // Exit early if settings were loaded
        }
      } catch (settingsError) {
        console.warn('⚠️ Could not load wealth projection settings:', settingsError);
        // Continue with loading other data
      }
      
      // Load user profile
      console.log('📋 Loading user profile...');
      try {
        const profileResponse = await axios.get('/api/mongodb/auth/mongodb/profile/'); // Updated to MongoDB endpoint
        console.log('✅ Profile response:', profileResponse.data);
        if (profileResponse.data) {
          setUserProfile(profileResponse.data);
          if (profileResponse.data.age) {
            console.log('👤 Setting age from profile:', profileResponse.data.age);
            setFormData(prev => ({ ...prev, age: profileResponse.data.age }));
          }
        }
      } catch (profileError) {
        console.warn('⚠️ Could not load profile data:', profileError);
        // Continue with default age
      }

      // Load budget data
      console.log('💰 Loading budget data...');
      try {
        const budgetResponse = await axios.get('/api/mongodb/budgets/');
        console.log('✅ Budget response:', budgetResponse.data);
        if (budgetResponse.data && budgetResponse.data.length > 0) {
          setBudgetData(budgetResponse.data[0]);
          
          // Calculate annual contributions from budget (monthly savings * 12)
          const budget = budgetResponse.data[0];
          let monthlyIncome = parseFloat(budget.income || 0) + parseFloat(budget.additional_income || 0);
          
          // Add additional income items
          if (budget.additional_income_items && Array.isArray(budget.additional_income_items)) {
            budget.additional_income_items.forEach(item => {
              monthlyIncome += parseFloat(item.amount || 0);
            });
          }
          
          // Calculate total monthly expenses
          let monthlyExpenses = (
            parseFloat(budget.housing || 0) +
            parseFloat(budget.transportation || 0) +
            parseFloat(budget.food || 0) +
            parseFloat(budget.healthcare || 0) +
            parseFloat(budget.entertainment || 0) +
            parseFloat(budget.shopping || 0) +
            parseFloat(budget.travel || 0) +
            parseFloat(budget.education || 0) +
            parseFloat(budget.utilities || 0) +
            parseFloat(budget.childcare || 0) +
            parseFloat(budget.others || 0) +  // Changed from 'other' to 'others'
            parseFloat(budget.debt_payments || 0)  // Add debt payments
          );
          
          // Add additional expenses
          if (budget.additional_items) {
            budget.additional_items
              .filter(item => item.type === 'expense')
              .forEach(item => {
                monthlyExpenses += parseFloat(item.amount || 0);
              });
          }
          
          // Calculate monthly savings
          const monthlySavings = monthlyIncome - monthlyExpenses;
          const annualContributions = Math.max(0, monthlySavings * 12);
          
          console.log('💰 Budget calculations:');
          console.log('  - Monthly income:', monthlyIncome);
          console.log('  - Monthly expenses:', monthlyExpenses);
          console.log('  - Monthly savings:', monthlySavings);
          console.log('  - Annual contributions:', annualContributions);
          
          setFormData(prev => ({ 
            ...prev, 
            annualContributions: Math.round(annualContributions)
          }));
        }
      } catch (budgetError) {
        console.warn('⚠️ Could not load budget data:', budgetError);
        // Continue with default annual contributions
      }

      // Load accounts data (Starting Wealth = Total Account Balances)
      console.log('🏦 Loading accounts data...');
      try {
        const accountsResponse = await axios.get('/api/mongodb/accounts/');
        console.log('✅ Accounts response:', accountsResponse.data);
        console.log('📊 Accounts response type:', typeof accountsResponse.data);
        console.log('📊 Accounts response length:', accountsResponse.data?.length);
        
        if (accountsResponse.data && Array.isArray(accountsResponse.data)) {
          console.log('📊 Processing accounts array:', accountsResponse.data);
          const totalAssets = accountsResponse.data.reduce((sum, account) => {
            const balance = parseFloat(account.balance || 0);
            console.log(`  - Account ${account.name}: $${balance} (raw: ${account.balance})`);
            return sum + balance;
          }, 0);
          console.log('💰 Total assets from accounts:', totalAssets);
          setFormData(prev => ({ ...prev, startWealth: totalAssets }));
        } else {
          console.warn('⚠️ No accounts data found or invalid response');
          console.warn('⚠️ Response data:', accountsResponse.data);
        }
      } catch (accountsError) {
        console.warn('⚠️ Could not load accounts data:', accountsError);
        console.warn('⚠️ Error details:', accountsError.response?.data);
        // Continue with default starting wealth
      }

      // Load debts data (Current Debt = Total Outstanding Debts)
      console.log('💳 Loading debts data...');
      try {
        const debtsResponse = await axios.get('/api/mongodb/debts/');
        console.log('✅ Debts response:', debtsResponse.data);
        console.log('📊 Debts response type:', typeof debtsResponse.data);
        console.log('📊 Debts response length:', debtsResponse.data?.length);
        
        if (debtsResponse.data && Array.isArray(debtsResponse.data)) {
          console.log('📊 Processing debts array:', debtsResponse.data);
          const totalDebts = debtsResponse.data.reduce((sum, debt) => {
            const balance = parseFloat(debt.balance || 0);
            console.log(`  - Debt ${debt.name}: $${balance} (raw: ${debt.balance})`);
            return sum + balance;
          }, 0);
          console.log('💳 Total debts:', totalDebts);
          setFormData(prev => ({ ...prev, debt: totalDebts }));
        } else {
          console.warn('⚠️ No debts data found or invalid response');
          console.warn('⚠️ Response data:', debtsResponse.data);
        }
      } catch (debtsError) {
        console.warn('⚠️ Could not load debts data:', debtsError);
        console.warn('⚠️ Error details:', debtsError.response?.data);
        // Continue with default debt amount
      }

      // Log final form data
      console.log('📊 Final form data after loading:', formData);
      
      setDataLoaded(true);
      console.log('✅ User data loading completed');
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      console.error('Error details:', error.response?.data || error.message);
      setErrorMessage(`Failed to load user data: ${error.response?.data?.error || error.message}`);
      setShowErrorSnackbar(true);

      // Set fallback values if data loading fails
      setFormData(prev => ({
        ...prev,
        startWealth: 0,
        debt: 0,
        annualContributions: 1000 // Default fallback
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate age
    if (formData.age < 18 || formData.age > 130) {
      errors.age = 'Age must be between 18 and 130 years';
    }
    
    // Validate max age
    if (formData.maxAge <= formData.age) {
      errors.maxAge = 'Maximum age must be greater than current age';
    }
    if (formData.maxAge > 130) {
      errors.maxAge = 'Maximum age cannot exceed 130 years';
    }
    
    // Validate financial inputs
    if (formData.startWealth < 0) {
      errors.startWealth = 'Starting wealth cannot be negative';
    }
    
    if (formData.debt < 0) {
      errors.debt = 'Debt cannot be negative';
    }
    
    if (formData.annualContributions < 0) {
      errors.annualContributions = 'Annual contributions cannot be negative';
    }
    
    // Validate rates
    if (formData.assetInterest < 0 || formData.assetInterest > 50) {
      errors.assetInterest = 'Asset interest rate must be between 0% and 50%';
    }
    
    if (formData.debtInterest < 0 || formData.debtInterest > 50) {
      errors.debtInterest = 'Debt interest rate must be between 0% and 50%';
    }
    
    if (formData.inflation < -10 || formData.inflation > 50) {
      errors.inflation = 'Inflation rate must be between -10% and 50%';
    }
    
    if (formData.taxRate < 0 || formData.taxRate > 100) {
      errors.taxRate = 'Tax rate must be between 0% and 100%';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      console.log('💾 Saving wealth projection settings:', formData);
      
      const settingsData = {
        age: formData.age,
        max_age: formData.maxAge,
        start_wealth: formData.startWealth,
        debt: formData.debt,
        debt_interest: formData.debtInterest,
        asset_interest: formData.assetInterest,
        inflation: formData.inflation,
        tax_rate: formData.taxRate,
        annual_contributions: formData.annualContributions,
        checking_interest: formData.checkingInterest
      };
      
      const response = await axios.post('/api/mongodb/wealth-projection-settings/save/', settingsData);
      console.log('✅ Settings saved successfully:', response.data);
      
      if (response.data && response.data.success) {
        setSuccessMessage('Settings saved successfully!');
        setShowSuccessSnackbar(true);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to save settings';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrorMessage(errorMessage);
      setShowErrorSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProjection = async () => {
    if (!validateForm()) {
      setErrorMessage('Please fix the validation errors before calculating');
      setShowErrorSnackbar(true);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🚀 Sending enhanced projection request with data:', formData);
      
      const response = await axios.post('/api/mongodb/project-wealth-enhanced/', formData);
      console.log('✅ Enhanced projection response received:', response.data);
      
      if (response.data && response.data.projections) {
        setProjectionData(response.data.projections);
        setShowChart(true);
        setSuccessMessage('Enhanced projection calculated successfully!');
        setShowSuccessSnackbar(true);
        console.log('📊 Enhanced projection data set successfully');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Error calculating enhanced projection:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to calculate enhanced projection';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrorMessage(errorMessage);
      setShowErrorSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const importFinancials = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Importing financial data...');
      
      const response = await axios.get('/api/mongodb/import-financials/');
      console.log('✅ Import financials response:', response.data);
      
      if (response.data && response.data.financial_data) {
        const financialData = response.data.financial_data;
        
        setFormData(prev => ({
          ...prev,
          startWealth: financialData.startWealth,
          debt: financialData.debt,
          debtInterest: financialData.debtInterest,
          annualContributions: financialData.annualContributions
        }));
        
        setSuccessMessage(`Financial data imported successfully! Found ${financialData.accounts_count} accounts, ${financialData.debts_count} debts, and ${financialData.has_budget ? 'budget data' : 'no budget data'}.`);
        setShowSuccessSnackbar(true);
        console.log('📊 Financial data imported successfully');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Error importing financial data:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to import financial data';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrorMessage(errorMessage);
      setShowErrorSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
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
    
    // Calculate Net Worth for each scenario
    const netWorthData = projectionData.map(item => item.scenario_1 - item.debt_line);
    const netWorthInflAdjData = projectionData.map(item => item.scenario_2 - item.debt_line);
    const netWorthCheckingData = projectionData.map(item => item.scenario_3 - item.debt_line);
    const netWorthCheckingInflAdjData = projectionData.map(item => item.scenario_4 - item.debt_line);
    const assetsData = projectionData.map(item => item.scenario_1);
    const debtData = projectionData.map(item => item.debt_line);
    
    // Calculate inflation adjustment factor for each year
    const inflationRate = formData.inflation / 100;
    const inflationAdjustmentData = projectionData.map((item, index) => {
      const year = index;
      return 1 / Math.pow(1 + inflationRate, year);
    });
    
    // Base datasets - always show Assets and Debt
    const baseDatasets = [
      {
        label: 'Assets',
        data: assetsData,
        borderColor: '#800080', // Purple
        backgroundColor: 'rgba(128, 0, 128, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.6,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#800080',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        pointBackgroundColor: '#800080',
        pointBorderColor: '#800080',
        animation: {
          duration: 1200,
          easing: 'easeInOutSine'
        }
      },
      {
        label: 'Debt',
        data: debtData,
        borderColor: '#FF1493', // Deep Pink
        backgroundColor: 'rgba(255, 20, 147, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.6,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#FF1493',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        pointBackgroundColor: '#FF1493',
        pointBorderColor: '#FF1493',
        animation: {
          duration: 1000,
          easing: 'easeInOutSine'
        }
      }
    ];

    // Net Worth datasets based on chart mode
    let netWorthDatasets = [];
    
    if (chartMode === 0) { // No Inflation Adjustment
      netWorthDatasets = [
        {
          label: 'Net Worth',
          data: netWorthData,
          borderColor: '#FF0000', // Red
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.6,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#FF0000',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          pointBackgroundColor: '#FF0000',
          pointBorderColor: '#FF0000',
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          }
        }
      ];
    } else if (chartMode === 1) { // Inflation Adjusted
      netWorthDatasets = [
        {
          label: 'Net Worth (Infl Adj.)',
          data: netWorthInflAdjData,
          borderColor: '#FF8C00', // Dark Orange
          backgroundColor: 'rgba(255, 140, 0, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.6,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#FF8C00',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          pointBackgroundColor: '#FF8C00',
          pointBorderColor: '#FF8C00',
          animation: {
            duration: 1800,
            easing: 'easeInOutCubic'
          }
        }
      ];
    } else if (chartMode === 2) { // Checking
      netWorthDatasets = [
        {
          label: 'Net Worth (if in checking)',
          data: netWorthCheckingData,
          borderColor: '#00FF00', // Green
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.6,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#00FF00',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          pointBackgroundColor: '#00FF00',
          pointBorderColor: '#00FF00',
          animation: {
            duration: 1600,
            easing: 'easeInOutQuad'
          }
        },
        {
          label: 'Net Worth (if in checking, Infl Adj.)',
          data: netWorthCheckingInflAdjData,
          borderColor: '#0000FF', // Blue
          backgroundColor: 'rgba(0, 0, 255, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.6,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#0000FF',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          pointBackgroundColor: '#0000FF',
          pointBorderColor: '#0000FF',
          animation: {
            duration: 1400,
            easing: 'easeInOutSine'
          }
        }
      ];
    }

    const datasets = [...netWorthDatasets, ...baseDatasets];

    return { labels, datasets };
  }, [projectionData, theme, formData.inflation, chartMode]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    // Disable default color generation to use our custom colors
    color: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
      onProgress: function(animation) {
        // Add subtle pulse effect during animation
        const chart = animation.chart;
        if (chart.ctx) {
          chart.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          chart.ctx.shadowBlur = 10;
          chart.ctx.shadowOffsetX = 2;
          chart.ctx.shadowOffsetY = 2;
        }
      },
      onComplete: function(animation) {
        // Remove shadow after animation completes
        const chart = animation.chart;
        if (chart.ctx) {
          chart.ctx.shadowColor = 'transparent';
          chart.ctx.shadowBlur = 0;
          chart.ctx.shadowOffsetX = 0;
          chart.ctx.shadowOffsetY = 0;
        }
      }
    },
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
          color: isDarkMode ? '#ffffff' : '#000000',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000',
          font: {
            size: 12
          }
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Amount ($)',
          color: isDarkMode ? '#ffffff' : '#000000',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000',
          font: {
            size: 12
          },
          callback: function(value) {
            return formatCurrency(value);
          }
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      }
    },
    plugins: {
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#ffffff' : '#000000',
        bodyColor: isDarkMode ? '#ffffff' : '#000000',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
          title: function(context) {
            return `Age ${context[0].label}`;
          }
        }
      },
      legend: {
        position: 'bottom',
        align: 'center',
        labels: {
          color: isDarkMode ? '#ffffff' : '#000000',
          font: {
            size: 13,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.datasets.map((dataset, i) => ({
                text: dataset.label,
                fillStyle: dataset.borderColor,
                strokeStyle: dataset.borderColor,
                lineWidth: 2,
                pointStyle: 'circle',
                hidden: !chart.isDatasetVisible(i),
                datasetIndex: i,
                fontColor: isDarkMode ? '#ffffff' : '#000000'
              }));
            }
            return [];
          }
        }
      }
    },
    elements: {
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 3
      },
      line: {
        borderWidth: 3
      }
    }
  }), [isDarkMode, theme]);

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
            color: isDarkMode ? '#ffffff' : '#000000',
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
                            error={!!validationErrors.age}
                            helperText={validationErrors.age}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">years</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Maximum Age for Projection"
                            type="number"
                            value={formData.maxAge}
                            onChange={(e) => handleInputChange('maxAge', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            error={!!validationErrors.maxAge}
                            helperText={validationErrors.maxAge || "Maximum 130 years"}
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
                            label="Starting Wealth (Total Account Balances)"
                            type="number"
                            value={formData.startWealth}
                            onChange={(e) => handleInputChange('startWealth', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            error={!!validationErrors.startWealth}
                            helperText={validationErrors.startWealth || "Total of all your account balances"}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Current Debt (Total Outstanding Debts)"
                            type="number"
                            value={formData.debt}
                            onChange={(e) => handleInputChange('debt', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            error={!!validationErrors.debt}
                            helperText={validationErrors.debt || "Total of all your outstanding debts"}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Annual Contributions (Yearly Savings/Investment)"
                            type="number"
                            value={formData.annualContributions}
                            onChange={(e) => handleInputChange('annualContributions', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            error={!!validationErrors.annualContributions}
                            helperText={validationErrors.annualContributions || "Amount you can save/invest annually"}
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
                          <Box>
                            <TextField
                              label="Asset Interest Rate (Investment Returns)"
                              type="number"
                              value={formData.assetInterest}
                              onChange={(e) => handleInputChange('assetInterest', parseFloat(e.target.value))}
                              fullWidth
                              size="small"
                              error={!!validationErrors.assetInterest}
                              helperText={validationErrors.assetInterest || "Expected annual return on investments"}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                              }}
                            />
                          </Box>
                          <Box>
                            <TextField
                              label="Debt Interest Rate"
                              type="number"
                              value={formData.debtInterest}
                              onChange={(e) => handleInputChange('debtInterest', parseFloat(e.target.value))}
                              fullWidth
                              size="small"
                              error={!!validationErrors.debtInterest}
                              helperText={validationErrors.debtInterest || "Average interest rate on your debts"}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                              }}
                            />
                          </Box>
                          <Box>
                            <TextField
                              label="Inflation Rate"
                              type="number"
                              value={formData.inflation}
                              onChange={(e) => handleInputChange('inflation', parseFloat(e.target.value))}
                              fullWidth
                              size="small"
                              error={!!validationErrors.inflation}
                              helperText={validationErrors.inflation || "Expected annual inflation rate"}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                              }}
                            />
                          </Box>
                          <Box>
                            <TextField
                              label="Tax Rate (Investment Gains)"
                              type="number"
                              value={formData.taxRate}
                              onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                              fullWidth
                              size="small"
                              error={!!validationErrors.taxRate}
                              helperText={validationErrors.taxRate || "Tax rate on investment returns"}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                              }}
                            />
                          </Box>
                          <Box>
                            <TextField
                              label="Checking Interest Rate"
                              type="number"
                              value={formData.checkingInterest}
                              onChange={(e) => handleInputChange('checkingInterest', parseFloat(e.target.value))}
                              fullWidth
                              size="small"
                              error={!!validationErrors.checkingInterest}
                              helperText={validationErrors.checkingInterest || "Interest rate on checking/savings accounts"}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                              }}
                            />
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                      <CustomButton
                        variant="outlined"
                        color="primary"
                        onClick={saveSettings}
                        startIcon={isLoading ? <CircularProgress size={20} /> : <SettingsIcon />}
                        disabled={isLoading}
                        size="large"
                      >
                        {isLoading ? 'Saving...' : 'Save Settings'}
                      </CustomButton>
                      <CustomButton
                        variant="outlined"
                        color="secondary"
                        onClick={importFinancials}
                        startIcon={isLoading ? <CircularProgress size={20} /> : <AccountBalanceIcon />}
                        disabled={isLoading}
                        size="large"
                        sx={{ mr: 2 }}
                      >
                        {isLoading ? 'Importing...' : 'Import Financials'}
                      </CustomButton>
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
                  <CustomCard 
                    elevation={3}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      borderRadius: 3,
                      overflow: 'hidden',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, #4CAF50 0%, #2196F3 50%, #FF5722 100%)`,
                        zIndex: 1
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Chart Mode Slider */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                          Chart Display Mode
                        </Typography>
                        <Box sx={{ px: 2 }}>
                          <Slider
                            value={chartMode}
                            onChange={(event, newValue) => setChartMode(newValue)}
                            step={1}
                            min={0}
                            max={2}
                            marks={[
                              { value: 0, label: 'No Inflation Adjustment' },
                              { value: 1, label: 'Inflation Adjusted' },
                              { value: 2, label: 'Checking' }
                            ]}
                            sx={{
                              '& .MuiSlider-markLabel': {
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box
                          sx={{
                            background: `linear-gradient(135deg, #4CAF50, #2196F3)`,
                            borderRadius: '50%',
                            p: 1,
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                          }}
                        >
                          <TimelineIcon sx={{ color: '#fff', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 'bold', 
                            color: isDarkMode ? '#ffffff' : '#000000' 
                          }}>
                            Wealth Projection Over Time
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: isDarkMode ? '#e0e0e0' : '#424242' 
                          }}>
                            Interactive chart showing your financial growth trajectory
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box
                        sx={{
                          background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.5)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                          borderRadius: 2,
                          p: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'radial-gradient(circle at 30% 20%, rgba(76, 175, 80, 0.03) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(33, 150, 243, 0.03) 0%, transparent 50%)',
                            pointerEvents: 'none',
                            borderRadius: 2
                          }
                        }}
                      >
                        <Chart
                          type="line"
                          data={chartData}
                          options={chartOptions}
                          height={450}
                        />
                      </Box>
                      
                    </CardContent>
                  </CustomCard>
                )}

                {/* Instructions */}
                {!showChart && (
                  <CustomCard elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <InfoIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                        <Typography variant="h6" sx={{ 
                          color: isDarkMode ? '#ffffff' : '#000000' 
                        }}>
                          How to Use the Wealth Projector
                        </Typography>
                      </Box>
                      <Typography variant="body1" paragraph sx={{ 
                        color: isDarkMode ? '#e0e0e0' : '#424242' 
                      }}>
                        The Enhanced Wealth Projector helps you visualize your financial future by modeling how your wealth will grow over time using 5 different scenarios, including debt repayment simulation, based on your current financial situation and assumptions about returns, inflation, and contributions.
                      </Typography>
                      <Typography variant="body2" paragraph sx={{ 
                        color: isDarkMode ? '#e0e0e0' : '#424242',
                        fontWeight: 'bold'
                      }}>
                        5 Projection Scenarios:
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ 
                        color: isDarkMode ? '#e0e0e0' : '#424242' 
                      }}>
                        • <strong style={{color: '#FF0000'}}>Red Line:</strong> Investment Growth After Tax - Wₙ₊₁ = Wₙ × (1 + rₐ × (1 - t))<br/>
                        • <strong style={{color: '#FF8C00'}}>Orange Line:</strong> Investment Growth After Tax & Inflation - Wₙ₊₁ = Wₙ × (1 + (rₐ × (1 - t)) - i)<br/>
                        • <strong style={{color: '#00FF00'}}>Green Line:</strong> Checking Account Growth (No Taxes) - Wₙ₊₁ = Wₙ × (1 + r𝚌)<br/>
                        • <strong style={{color: '#0000FF'}}>Blue Line:</strong> Checking Account Growth After Tax - Wₙ₊₁ = Wₙ × (1 + r𝚌 × (1 - t))<br/>
                        • <strong style={{color: '#800080'}}>Purple Line:</strong> Debt Over Time - Shows how your debt changes with interest and payments
                      </Typography>
                      <Typography variant="body2" paragraph sx={{ 
                        color: isDarkMode ? '#e0e0e0' : '#424242',
                        fontWeight: 'bold'
                      }}>
                        Input Fields Explained:
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ 
                        color: isDarkMode ? '#e0e0e0' : '#424242' 
                      }}>
                        • <strong>Starting Wealth (W₀):</strong> Total of all your account balances<br/>
                        • <strong>Annual Contributions (C):</strong> Amount you can save/invest each year<br/>
                        • <strong>Asset Interest Rate (rₐ):</strong> Expected annual return on your investments<br/>
                        • <strong>Checking Interest Rate (r𝚌):</strong> Interest rate on checking/savings accounts<br/>
                        • <strong>Inflation Rate (i):</strong> Expected annual inflation rate<br/>
                        • <strong>Tax Rate (t):</strong> Tax rate on investment returns<br/>
                        • <strong>Debt Interest Rate (r_d):</strong> Average interest rate on your debts<br/>
                        • <strong>Save Settings:</strong> Store your inputs in MongoDB Atlas for future use<br/>
                        • <strong>Import Financials:</strong> Auto-fill form with data from your accounts, debts, and budget
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
