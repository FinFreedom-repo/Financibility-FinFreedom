import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Divider,
  Chip,
  Alert,
  Snackbar,
  Fade,
  Slide,
  Zoom,
  useTheme,
  useMediaQuery,
  Stack,
  InputAdornment,
  Avatar,
  List,
  ListItem,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  Drawer,
  CardContent,
  CardHeader,
  Fab,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  PieChart as PieChartIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Home as HomeIcon,
  DirectionsCar as CarIcon,
  Restaurant as FoodIcon,
  LocalHospital as HealthIcon,
  Movie as EntertainmentIcon,
  School as EducationIcon,
  ShoppingCart as ShoppingIcon,
  Flight as TravelIcon,
  Build as UtilitiesIcon,
  ChildCare as ChildCareIcon,
  MoreHoriz as OtherIcon,
  AccountBalance as SavingsIcon,
  Receipt as DebtIcon,
  Warning as WarningIcon,
  FilterList as FilterIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  DonutLarge as DonutIcon,
  Analytics as AnalyticsIcon,
  Help as HelpIcon,
  DateRange as DateRangeIcon,
  ViewWeek as ViewWeekIcon,
  ViewModule as ViewMonthIcon,
  ViewQuilt as ViewQuarterIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import Card from './common/Card';
import Chart from './common/Chart';
import Loading from './common/Loading';
import Input from './common/Input';
import { Button as CustomButton } from './common/Button';
import * as XLSX from 'xlsx';

function MonthlyBudgetModern() {
  const { user } = useAuth();
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [formData, setFormData] = useState({
    income: '',
    housing: '',
    debt_payments: '',
    transportation: '',
    food: '',
    healthcare: '',
    entertainment: '',
    shopping: '',
    travel: '',
    education: '',
    utilities: '',
    childcare: '',
    other: ''
  });

  const [additionalItems, setAdditionalItems] = useState([]);
  const [savingsItems, setSavingsItems] = useState([]);
  const [expenseChartData, setExpenseChartData] = useState(null);
  const [incomeChartData, setIncomeChartData] = useState(null);
  const [trendChartData, setTrendChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);

  // Enhanced state variables
  const [activeTab, setActiveTab] = useState(0);
  const [chartType, setChartType] = useState('pie');
  const [timeFilter, setTimeFilter] = useState('month');
  const [showSidebar, setShowSidebar] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [chartSettings, setChartSettings] = useState({
    showLegend: true,
    showLabels: true,
    showPercentages: true,
    showValues: true
  });

  const categoryIcons = {
    housing: <HomeIcon />,
    transportation: <CarIcon />,
    food: <FoodIcon />,
    healthcare: <HealthIcon />,
    entertainment: <EntertainmentIcon />,
    shopping: <ShoppingIcon />,
    travel: <TravelIcon />,
    education: <EducationIcon />,
    utilities: <UtilitiesIcon />,
    childcare: <ChildCareIcon />,
    debt_payments: <DebtIcon />,
    other: <OtherIcon />
  };

  const categoryLabels = {
    housing: 'Housing',
    transportation: 'Transportation',
    food: 'Food',
    healthcare: 'Healthcare',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    travel: 'Travel',
    education: 'Education',
    utilities: 'Utilities',
    childcare: 'Childcare',
    debt_payments: 'Debt Payments',
    other: 'Other'
  };

  useEffect(() => {
    loadBudgetData();
  }, []);

  useEffect(() => {
    updateChartData();
  }, [formData, additionalItems, savingsItems]);

  const loadBudgetData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/budgets/');
      
      if (response.data && response.data.length > 0) {
        const budget = response.data[0];
        setFormData({
          income: budget.income || '',
          housing: budget.housing || '',
          debt_payments: budget.debt_payments || '',
          transportation: budget.transportation || '',
          food: budget.food || '',
          healthcare: budget.healthcare || '',
          entertainment: budget.entertainment || '',
          shopping: budget.shopping || '',
          travel: budget.travel || '',
          education: budget.education || '',
          utilities: budget.utilities || '',
          childcare: budget.childcare || '',
          other: budget.other || ''
        });
        
        setAdditionalItems(budget.additional_items || []);
        setSavingsItems(budget.savings_items || []);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      setError('Failed to load budget data');
      setShowErrorSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChartData = () => {
    const colorPalette = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
      '#F39C12', '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB', '#2ECC71',
      '#F1C40F', '#E67E22', '#8E44AD', '#16A085'
    ];

    // Expense Chart Data
    const expenseLabels = [];
    const expenseData = [];
    const expenseColors = [];
    
    let colorIndex = 0;
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'income' && value && parseFloat(value) > 0) {
        expenseLabels.push(categoryLabels[key] || key);
        expenseData.push(parseFloat(value));
        expenseColors.push(colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
      }
    });

    additionalItems.forEach(item => {
      if (item.name && item.amount && parseFloat(item.amount) > 0) {
        expenseLabels.push(item.name);
        expenseData.push(parseFloat(item.amount));
        expenseColors.push(colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
      }
    });

    if (expenseData.length > 0) {
      setExpenseChartData({
        labels: expenseLabels,
        datasets: [{
          data: expenseData,
          backgroundColor: expenseColors,
          borderColor: expenseColors.map(color => color + '80'),
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 4
        }]
      });
    } else {
      setExpenseChartData(null);
    }

    // Income Chart Data
    const incomeLabels = [];
    const incomeData = [];
    const incomeColors = [];
    
    const totalIncome = parseFloat(formData.income) || 0;
    const totalExpenses = calculateTotalExpenses();
    const totalSavings = calculateTotalSavings();
    const remaining = totalIncome - totalExpenses - totalSavings;
    
    if (totalExpenses > 0) {
      incomeLabels.push('Expenses');
      incomeData.push(totalExpenses);
      incomeColors.push('#FF6B6B');
    }
    
    if (totalSavings > 0) {
      incomeLabels.push('Savings');
      incomeData.push(totalSavings);
      incomeColors.push('#4ECDC4');
    }
    
    if (remaining > 0) {
      incomeLabels.push('Remaining');
      incomeData.push(remaining);
      incomeColors.push('#96CEB4');
    }

    if (incomeData.length > 0) {
      setIncomeChartData({
        labels: incomeLabels,
        datasets: [{
          data: incomeData,
          backgroundColor: incomeColors,
          borderColor: incomeColors.map(color => color + '80'),
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 4
        }]
      });
    } else {
      setIncomeChartData(null);
    }

    // Trend Chart Data
    updateTrendChart();
  };

  const updateTrendChart = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const trendLabels = [];
    const incomeData = [];
    const expenseData = [];
    const savingsData = [];

    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      trendLabels.push(months[monthIndex]);
      
      const baseIncome = parseFloat(formData.income) || 5000;
      const baseExpenses = calculateTotalExpenses();
      const baseSavings = calculateTotalSavings();
      
      incomeData.push(baseIncome + (Math.random() - 0.5) * 1000);
      expenseData.push(baseExpenses + (Math.random() - 0.5) * 500);
      savingsData.push(baseSavings + (Math.random() - 0.5) * 200);
    }

    setTrendChartData({
      labels: trendLabels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#2ECC71',
          backgroundColor: '#2ECC71' + '20',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#E74C3C',
          backgroundColor: '#E74C3C' + '20',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Savings',
          data: savingsData,
          borderColor: '#3498DB',
          backgroundColor: '#3498DB' + '20',
          fill: false,
          tension: 0.4
        }
      ]
    });
  };

  const calculateTotalIncome = () => {
    const baseIncome = parseFloat(formData.income) || 0;
    return baseIncome;
  };

  const calculateTotalExpenses = () => {
    let total = 0;
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'income' && value) {
        total += parseFloat(value) || 0;
      }
    });
    additionalItems.forEach(item => {
      total += parseFloat(item.amount) || 0;
    });
    return total;
  };

  const calculateTotalSavings = () => {
    return savingsItems?.reduce((total, item) => {
      const amount = parseFloat(item.amount) || 0;
      return total + (amount > 0 ? amount : 0);
    }, 0) || 0;
  };

  const calculateRemaining = () => {
    const totalIncome = calculateTotalIncome();
    const totalExpenses = calculateTotalExpenses();
    const totalSavings = calculateTotalSavings();
    return totalIncome - totalExpenses - totalSavings;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addNewItem = () => {
    setAdditionalItems([...additionalItems, { name: '', amount: '' }]);
  };

  const removeItem = (index) => {
    setAdditionalItems(additionalItems.filter((_, i) => i !== index));
  };

  const updateAdditionalItem = (index, field, value) => {
    const updated = [...additionalItems];
    updated[index][field] = value;
    setAdditionalItems(updated);
  };

  const addNewSavingsItem = () => {
    setSavingsItems([...savingsItems, { name: '', amount: '' }]);
  };

  const removeSavingsItem = (index) => {
    setSavingsItems(savingsItems.filter((_, i) => i !== index));
  };

  const updateSavingsItem = (index, field, value) => {
    const updated = [...savingsItems];
    updated[index][field] = value;
    setSavingsItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const budgetData = {
        ...formData,
        additional_items: additionalItems,
        savings_items: savingsItems
      };

      await axios.post('/api/budgets/', budgetData);
      setSuccessMessage('Budget saved successfully!');
      setShowSuccessSnackbar(true);
    } catch (error) {
      console.error('Error saving budget:', error);
      setError('Failed to save budget');
      setShowErrorSnackbar(true);
    }
  };

  // Helper functions
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTimeFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setTimeFilter(newFilter);
      updateTrendChart();
    }
  };

  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const exportData = () => {
    const totalIncome = calculateTotalIncome();
    const totalExpenses = calculateTotalExpenses();
    const totalSavings = calculateTotalSavings();
    const remaining = calculateRemaining();

    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new();

    // Budget Summary Sheet
    const summaryData = [
      ['Budget Summary', ''],
      ['', ''],
      ['Total Income', totalIncome],
      ['Total Expenses', totalExpenses],
      ['Total Savings', totalSavings],
      ['Remaining', remaining],
      ['', ''],
      ['Generated on', new Date().toLocaleDateString()]
    ];
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

    // Income Details Sheet
    const incomeData = [
      ['Income Details', ''],
      ['', ''],
      ['Monthly Income', parseFloat(formData.income) || 0]
    ];
    const incomeWorksheet = XLSX.utils.aoa_to_sheet(incomeData);
    XLSX.utils.book_append_sheet(workbook, incomeWorksheet, 'Income');

    // Expenses Sheet
    const expenseData = [
      ['Expense Category', 'Amount'],
      ['Housing', parseFloat(formData.housing) || 0],
      ['Transportation', parseFloat(formData.transportation) || 0],
      ['Food', parseFloat(formData.food) || 0],
      ['Healthcare', parseFloat(formData.healthcare) || 0],
      ['Entertainment', parseFloat(formData.entertainment) || 0],
      ['Shopping', parseFloat(formData.shopping) || 0],
      ['Travel', parseFloat(formData.travel) || 0],
      ['Education', parseFloat(formData.education) || 0],
      ['Utilities', parseFloat(formData.utilities) || 0],
      ['Childcare', parseFloat(formData.childcare) || 0],
      ['Debt Payments', parseFloat(formData.debt_payments) || 0],
      ['Other', parseFloat(formData.other) || 0]
    ];

    // Add additional items
    additionalItems.forEach(item => {
      if (item.name && item.amount) {
        expenseData.push([item.name, parseFloat(item.amount) || 0]);
      }
    });

    const expenseWorksheet = XLSX.utils.aoa_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(workbook, expenseWorksheet, 'Expenses');

    // Savings Sheet
    const savingsData = [
      ['Savings Goal', 'Amount']
    ];
    savingsItems.forEach(item => {
      if (item.name && item.amount) {
        savingsData.push([item.name, parseFloat(item.amount) || 0]);
      }
    });

    const savingsWorksheet = XLSX.utils.aoa_to_sheet(savingsData);
    XLSX.utils.book_append_sheet(workbook, savingsWorksheet, 'Savings');

    // Generate and download Excel file
    const fileName = `budget-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getAdvancedMetrics = () => {
    const totalIncome = calculateTotalIncome();
    const totalExpenses = calculateTotalExpenses();
    const totalSavings = calculateTotalSavings();
    
    return {
      savingsRate: totalIncome > 0 ? (totalSavings / totalIncome * 100).toFixed(1) : 0,
      expenseRatio: totalIncome > 0 ? (totalExpenses / totalIncome * 100).toFixed(1) : 0,
      budgetHealth: totalIncome > totalExpenses + totalSavings ? 'Healthy' : 'Over Budget',
      monthlyBuffer: totalIncome - totalExpenses - totalSavings
    };
  };

  const getChartOptions = (type) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: animationEnabled,
      plugins: {
        legend: {
          display: chartSettings.showLegend,
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
            usePointStyle: true,
            font: { size: 12 },
            color: theme.palette.text.primary
          }
        },
        tooltip: {
          enabled: showTooltips,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              
              let labelText = `${label}: ${formatCurrency(value)}`;
              if (chartSettings.showPercentages) {
                labelText += ` (${percentage}%)`;
              }
              return labelText;
            }
          }
        }
      }
    };

    if (type === 'line') {
      return {
        ...baseOptions,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time Period',
              color: theme.palette.text.primary
            },
            ticks: { color: theme.palette.text.secondary },
            grid: { color: theme.palette.divider }
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
            grid: { color: theme.palette.divider }
          }
        }
      };
    }

    return baseOptions;
  };

  if (isLoading) {
    return <Loading.PageLoader />;
  }

  const remaining = calculateRemaining();
  const advancedMetrics = getAdvancedMetrics();

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Fade in={true} timeout={800}>
        <Box>
          {/* Header Section */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography variant="h3" sx={{ 
              fontWeight: 'bold', 
              color: theme.palette.text.primary,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <AnalyticsIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              Budget Planner
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title="Filter Options">
                <IconButton onClick={handleFilterMenuOpen} color="primary">
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Export Data">
                <IconButton onClick={exportData} color="primary">
                  <ExportIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Refresh Data">
                <IconButton onClick={() => window.location.reload()} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Settings">
                <IconButton onClick={toggleSidebar} color="primary">
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Time Filter Controls */}
          <Slide in={true} direction="down" timeout={600}>
            <Card elevation={2} sx={{ mb: 3, overflow: 'visible' }}>
              <CardContent sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Time Period
                    </Typography>
                    <ToggleButtonGroup
                      value={timeFilter}
                      exclusive
                      onChange={handleTimeFilterChange}
                      aria-label="time filter"
                      size="small"
                    >
                      <ToggleButton value="week" aria-label="week">
                        <ViewWeekIcon sx={{ mr: 1 }} />
                        Week
                      </ToggleButton>
                      <ToggleButton value="month" aria-label="month">
                        <ViewMonthIcon sx={{ mr: 1 }} />
                        Month
                      </ToggleButton>
                      <ToggleButton value="quarter" aria-label="quarter">
                        <ViewQuarterIcon sx={{ mr: 1 }} />
                        Quarter
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Chart Type
                    </Typography>
                    <ToggleButtonGroup
                      value={chartType}
                      exclusive
                      onChange={handleChartTypeChange}
                      aria-label="chart type"
                      size="small"
                    >
                      <ToggleButton value="pie" aria-label="pie">
                        <DonutIcon sx={{ mr: 1 }} />
                        Pie
                      </ToggleButton>
                      <ToggleButton value="bar" aria-label="bar">
                        <BarChartIcon sx={{ mr: 1 }} />
                        Bar
                      </ToggleButton>
                      <ToggleButton value="line" aria-label="line">
                        <TimelineIcon sx={{ mr: 1 }} />
                        Line
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                  
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAdvancedMetrics}
                          onChange={(e) => setShowAdvancedMetrics(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Advanced Metrics"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Slide>

          {/* Tab Navigation */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '1rem',
                  fontWeight: 'medium'
                }
              }}
            >
              <Tab 
                icon={<EditIcon />} 
                label="Budget Input" 
                iconPosition="start"
              />
              <Tab 
                icon={<PieChartIcon />} 
                label="Overview" 
                iconPosition="start"
              />
              <Tab 
                icon={<TimelineIcon />} 
                label="Trends" 
                iconPosition="start"
              />
              <Tab 
                icon={<AnalyticsIcon />} 
                label="Analytics" 
                iconPosition="start"
              />
            </Tabs>
          </Card>

          {/* Main Content */}
          <Box sx={{ position: 'relative' }}>
            {/* Tab Panel 0: Budget Input */}
            {activeTab === 0 && (
              <Fade in={true} timeout={600}>
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={8}>
                    <Card elevation={3} sx={{ 
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
                      borderRadius: 3
                    }}>
                      <CardHeader
                        title="Budget Planning"
                        subheader="Enter your monthly income, expenses, and savings goals"
                      />
                      <CardContent>
                        <form onSubmit={handleSubmit}>
                          {/* Income Section */}
                          <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              mb: 2,
                              color: theme.palette.success.main
                            }}>
                              <MoneyIcon sx={{ mr: 1 }} />
                              Monthly Income
                              <Tooltip title="Your total monthly income from all sources">
                                <HelpIcon sx={{ ml: 1, fontSize: 16, color: theme.palette.text.secondary }} />
                              </Tooltip>
                            </Typography>
                            <TextField
                              label="Monthly Income"
                              name="income"
                              value={formData.income}
                              onChange={handleInputChange}
                              type="number"
                              fullWidth
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: theme.shadows[4]
                                  },
                                  transition: 'all 0.3s ease'
                                }
                              }}
                            />
                          </Box>

                          <Divider sx={{ my: 3 }} />

                          {/* Expenses Section */}
                          <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              mb: 2,
                              color: theme.palette.error.main
                            }}>
                              <TrendingDownIcon sx={{ mr: 1 }} />
                              Monthly Expenses
                              <Tooltip title="Your regular monthly expenses by category">
                                <HelpIcon sx={{ ml: 1, fontSize: 16, color: theme.palette.text.secondary }} />
                              </Tooltip>
                            </Typography>
                            
                            <Grid container spacing={2}>
                              {Object.entries(formData).map(([key, value]) => {
                                if (key === 'income') return null;
                                return (
                                  <Grid item xs={12} sm={6} md={4} key={key}>
                                    <TextField
                                      label={categoryLabels[key]}
                                      name={key}
                                      value={value}
                                      onChange={handleInputChange}
                                      type="number"
                                      fullWidth
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            <Avatar sx={{ 
                                              width: 24, 
                                              height: 24, 
                                              bgcolor: 'transparent',
                                              color: theme.palette.text.secondary
                                            }}>
                                              {categoryIcons[key]}
                                            </Avatar>
                                          </InputAdornment>
                                        )
                                      }}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          borderRadius: 2,
                                          '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: theme.shadows[2]
                                          },
                                          transition: 'all 0.3s ease'
                                        }
                                      }}
                                    />
                                  </Grid>
                                );
                              })}
                            </Grid>

                            {/* Additional Expense Items */}
                            <Box sx={{ mt: 3 }}>
                              <Typography variant="subtitle1" gutterBottom>
                                Additional Expenses
                              </Typography>
                              
                              <List>
                                {additionalItems.map((item, index) => (
                                  <ListItem key={index} sx={{ px: 0 }}>
                                    <Grid container spacing={2} alignItems="center">
                                      <Grid item xs={12} sm={5}>
                                        <TextField
                                          label="Expense Name"
                                          value={item.name}
                                          onChange={(e) => updateAdditionalItem(index, 'name', e.target.value)}
                                          fullWidth
                                          size="small"
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={5}>
                                        <TextField
                                          label="Amount"
                                          value={item.amount}
                                          onChange={(e) => updateAdditionalItem(index, 'amount', e.target.value)}
                                          type="number"
                                          fullWidth
                                          size="small"
                                          InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                                          }}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={2}>
                                        <IconButton 
                                          onClick={() => removeItem(index)}
                                          color="error"
                                          sx={{
                                            '&:hover': {
                                              transform: 'scale(1.1)',
                                              bgcolor: theme.palette.error.main + '10'
                                            }
                                          }}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      </Grid>
                                    </Grid>
                                  </ListItem>
                                ))}
                              </List>
                              
                              <Button
                                startIcon={<AddIcon />}
                                onClick={addNewItem}
                                variant="outlined"
                                sx={{ 
                                  mt: 1,
                                  borderRadius: 2,
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: theme.shadows[4]
                                  }
                                }}
                              >
                                Add Expense
                              </Button>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 3 }} />

                          {/* Savings Section */}
                          <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              mb: 2,
                              color: theme.palette.primary.main
                            }}>
                              <SavingsIcon sx={{ mr: 1 }} />
                              Savings & Investments
                              <Tooltip title="Your savings goals and investment contributions">
                                <HelpIcon sx={{ ml: 1, fontSize: 16, color: theme.palette.text.secondary }} />
                              </Tooltip>
                            </Typography>
                            
                            <List>
                              {savingsItems.map((item, index) => (
                                <ListItem key={index} sx={{ px: 0 }}>
                                  <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={5}>
                                      <TextField
                                        label="Savings Goal"
                                        value={item.name}
                                        onChange={(e) => updateSavingsItem(index, 'name', e.target.value)}
                                        fullWidth
                                        size="small"
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={5}>
                                      <TextField
                                        label="Amount"
                                        value={item.amount}
                                        onChange={(e) => updateSavingsItem(index, 'amount', e.target.value)}
                                        type="number"
                                        fullWidth
                                        size="small"
                                        InputProps={{
                                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                                        }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                      <IconButton 
                                        onClick={() => removeSavingsItem(index)}
                                        color="error"
                                        sx={{
                                          '&:hover': {
                                            transform: 'scale(1.1)',
                                            bgcolor: theme.palette.error.main + '10'
                                          }
                                        }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Grid>
                                  </Grid>
                                </ListItem>
                              ))}
                            </List>
                            
                            <Button
                              startIcon={<AddIcon />}
                              onClick={addNewSavingsItem}
                              variant="outlined"
                              sx={{ 
                                mt: 1,
                                borderRadius: 2,
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: theme.shadows[4]
                                }
                              }}
                            >
                              Add Savings Goal
                            </Button>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                            <CustomButton
                              variant="contained"
                              color="primary"
                              startIcon={<SaveIcon />}
                              type="submit"
                              size="large"
                              sx={{
                                borderRadius: 3,
                                px: 4,
                                py: 1.5,
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: theme.shadows[8]
                                }
                              }}
                            >
                              Save Budget
                            </CustomButton>
                          </Box>
                        </form>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Financial Overview Sidebar */}
                  <Grid item xs={12} lg={4}>
                    <Card elevation={3} sx={{ 
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3
                    }}>
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PieChartIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            Financial Overview
                          </Box>
                        }
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          {/* Total Income */}
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ 
                              p: 2,
                              bgcolor: theme.palette.success.main + '10',
                              borderRadius: 3,
                              border: `2px solid ${theme.palette.success.main}20`,
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 32px ${theme.palette.success.main}30`
                              }
                            }}>
                              <MoneyIcon sx={{ 
                                fontSize: 32, 
                                color: theme.palette.success.main,
                                mb: 1
                              }} />
                              <Typography variant="h5" sx={{ 
                                color: theme.palette.success.main,
                                fontWeight: 'bold',
                                mb: 0.5
                              }}>
                                {formatCurrency(calculateTotalIncome())}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.text.secondary,
                                fontWeight: 'medium'
                              }}>
                                Total Income
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Total Expenses */}
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ 
                              p: 2,
                              bgcolor: theme.palette.error.main + '10',
                              borderRadius: 3,
                              border: `2px solid ${theme.palette.error.main}20`,
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 32px ${theme.palette.error.main}30`
                              }
                            }}>
                              <TrendingDownIcon sx={{ 
                                fontSize: 32, 
                                color: theme.palette.error.main,
                                mb: 1
                              }} />
                              <Typography variant="h5" sx={{ 
                                color: theme.palette.error.main,
                                fontWeight: 'bold',
                                mb: 0.5
                              }}>
                                {formatCurrency(calculateTotalExpenses())}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.text.secondary,
                                fontWeight: 'medium'
                              }}>
                                Total Expenses
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Total Savings */}
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ 
                              p: 2,
                              bgcolor: theme.palette.primary.main + '10',
                              borderRadius: 3,
                              border: `2px solid ${theme.palette.primary.main}20`,
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 32px ${theme.palette.primary.main}30`
                              }
                            }}>
                              <SavingsIcon sx={{ 
                                fontSize: 32, 
                                color: theme.palette.primary.main,
                                mb: 1
                              }} />
                              <Typography variant="h5" sx={{ 
                                color: theme.palette.primary.main,
                                fontWeight: 'bold',
                                mb: 0.5
                              }}>
                                {formatCurrency(calculateTotalSavings())}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.text.secondary,
                                fontWeight: 'medium'
                              }}>
                                Total Savings
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Remaining */}
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ 
                              p: 2,
                              bgcolor: remaining >= 0 ? theme.palette.success.main + '10' : theme.palette.warning.main + '10',
                              borderRadius: 3,
                              border: `2px solid ${remaining >= 0 ? theme.palette.success.main : theme.palette.warning.main}20`,
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 32px ${remaining >= 0 ? theme.palette.success.main : theme.palette.warning.main}30`
                              }
                            }}>
                              {remaining >= 0 ? 
                                <TrendingUpIcon sx={{ 
                                  fontSize: 32, 
                                  color: theme.palette.success.main,
                                  mb: 1
                                }} /> :
                                <WarningIcon sx={{ 
                                  fontSize: 32, 
                                  color: theme.palette.warning.main,
                                  mb: 1
                                }} />
                              }
                              <Typography variant="h5" sx={{ 
                                color: remaining >= 0 ? theme.palette.success.main : theme.palette.warning.main,
                                fontWeight: 'bold',
                                mb: 0.5
                              }}>
                                {formatCurrency(remaining)}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.text.secondary,
                                fontWeight: 'medium'
                              }}>
                                {remaining >= 0 ? 'Remaining' : 'Over Budget'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        {/* Progress Bar */}
                        <Box sx={{ mt: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              Budget Health
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {calculateTotalIncome() > 0 ? ((calculateTotalExpenses() / calculateTotalIncome()) * 100).toFixed(1) : 0}% of income spent
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={calculateTotalIncome() > 0 ? Math.min((calculateTotalExpenses() / calculateTotalIncome()) * 100, 100) : 0}
                            sx={{ 
                              height: 12, 
                              borderRadius: 6,
                              backgroundColor: theme.palette.grey[300],
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 6,
                                backgroundColor: remaining >= 0 ? theme.palette.success.main : theme.palette.error.main
                              }
                            }}
                          />
                        </Box>

                        {/* Advanced Metrics */}
                        {showAdvancedMetrics && (
                          <Fade in={true} timeout={600}>
                            <Box sx={{ mt: 3 }}>
                              <Typography variant="subtitle1" gutterBottom>
                                Advanced Metrics
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Chip 
                                    label={`Savings Rate: ${advancedMetrics.savingsRate}%`}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <Chip 
                                    label={`Expense Ratio: ${advancedMetrics.expenseRatio}%`}
                                    color="secondary"
                                    variant="outlined"
                                    size="small"
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <Chip 
                                    label={`Budget Status: ${advancedMetrics.budgetHealth}`}
                                    color={advancedMetrics.budgetHealth === 'Healthy' ? 'success' : 'warning'}
                                    variant="outlined"
                                    size="small"
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          </Fade>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Fade>
            )}

            {/* Tab Panel 1: Overview Charts */}
            {activeTab === 1 && (
              <Fade in={true} timeout={600}>
                <Grid container spacing={3}>
                  {/* Financial Overview Row */}
                  <Grid item xs={12}>
                    <Card elevation={3} sx={{ 
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      mb: 2
                    }}>
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PieChartIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            Financial Overview
                          </Box>
                        }
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          {/* Total Income */}
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ 
                              p: 2,
                              bgcolor: theme.palette.success.main + '10',
                              borderRadius: 3,
                              border: `2px solid ${theme.palette.success.main}20`,
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 32px ${theme.palette.success.main}30`
                              }
                            }}>
                              <MoneyIcon sx={{ 
                                fontSize: 32, 
                                color: theme.palette.success.main,
                                mb: 1
                              }} />
                              <Typography variant="h5" sx={{ 
                                color: theme.palette.success.main,
                                fontWeight: 'bold',
                                mb: 0.5
                              }}>
                                {formatCurrency(calculateTotalIncome())}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.text.secondary,
                                fontWeight: 'medium'
                              }}>
                                Total Income
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Total Expenses */}
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ 
                              p: 2,
                              bgcolor: theme.palette.error.main + '10',
                              borderRadius: 3,
                              border: `2px solid ${theme.palette.error.main}20`,
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 32px ${theme.palette.error.main}30`
                              }
                            }}>
                              <TrendingDownIcon sx={{ 
                                fontSize: 32, 
                                color: theme.palette.error.main,
                                mb: 1
                              }} />
                              <Typography variant="h5" sx={{ 
                                color: theme.palette.error.main,
                                fontWeight: 'bold',
                                mb: 0.5
                              }}>
                                {formatCurrency(calculateTotalExpenses())}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.text.secondary,
                                fontWeight: 'medium'
                              }}>
                                Total Expenses
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Total Savings */}
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ 
                              p: 2,
                              bgcolor: theme.palette.primary.main + '10',
                              borderRadius: 3,
                              border: `2px solid ${theme.palette.primary.main}20`,
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 32px ${theme.palette.primary.main}30`
                              }
                            }}>
                              <SavingsIcon sx={{ 
                                fontSize: 32, 
                                color: theme.palette.primary.main,
                                mb: 1
                              }} />
                              <Typography variant="h5" sx={{ 
                                color: theme.palette.primary.main,
                                fontWeight: 'bold',
                                mb: 0.5
                              }}>
                                {formatCurrency(calculateTotalSavings())}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.text.secondary,
                                fontWeight: 'medium'
                              }}>
                                Total Savings
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Remaining */}
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ 
                              p: 2,
                              bgcolor: remaining >= 0 ? theme.palette.success.main + '10' : theme.palette.warning.main + '10',
                              borderRadius: 3,
                              border: `2px solid ${remaining >= 0 ? theme.palette.success.main : theme.palette.warning.main}20`,
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 32px ${remaining >= 0 ? theme.palette.success.main : theme.palette.warning.main}30`
                              }
                            }}>
                              {remaining >= 0 ? 
                                <TrendingUpIcon sx={{ 
                                  fontSize: 32, 
                                  color: theme.palette.success.main,
                                  mb: 1
                                }} /> :
                                <WarningIcon sx={{ 
                                  fontSize: 32, 
                                  color: theme.palette.warning.main,
                                  mb: 1
                                }} />
                              }
                              <Typography variant="h5" sx={{ 
                                color: remaining >= 0 ? theme.palette.success.main : theme.palette.warning.main,
                                fontWeight: 'bold',
                                mb: 0.5
                              }}>
                                {formatCurrency(remaining)}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.text.secondary,
                                fontWeight: 'medium'
                              }}>
                                {remaining >= 0 ? 'Remaining' : 'Over Budget'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        {/* Progress Bar */}
                        <Box sx={{ mt: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              Budget Health
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {calculateTotalIncome() > 0 ? ((calculateTotalExpenses() / calculateTotalIncome()) * 100).toFixed(1) : 0}% of income spent
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={calculateTotalIncome() > 0 ? Math.min((calculateTotalExpenses() / calculateTotalIncome()) * 100, 100) : 0}
                            sx={{ 
                              height: 12, 
                              borderRadius: 6,
                              backgroundColor: theme.palette.grey[300],
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 6,
                                backgroundColor: remaining >= 0 ? theme.palette.success.main : theme.palette.error.main
                              }
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Charts Row */}
                  {/* Expense Breakdown Chart */}
                  {expenseChartData && (
                    <Grid item xs={12} md={6}>
                      <Card elevation={3} sx={{ 
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 40px ${theme.palette.primary.main}20`
                        }
                      }}>
                        <CardHeader
                          title={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PieChartIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                              Expense Breakdown
                            </Box>
                          }
                          subheader="Visual breakdown of your monthly expenses"
                        />
                        <CardContent>
                          <Chart
                            type={chartType}
                            data={expenseChartData}
                            options={getChartOptions(chartType)}
                            height={350}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Income Allocation Chart */}
                  {incomeChartData && (
                    <Grid item xs={12} md={6}>
                      <Card elevation={3} sx={{ 
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 40px ${theme.palette.secondary.main}20`
                        }
                      }}>
                        <CardHeader
                          title={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <TrendingUpIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                              Income Allocation
                            </Box>
                          }
                          subheader="How your income is distributed"
                        />
                        <CardContent>
                          <Chart
                            type={chartType}
                            data={incomeChartData}
                            options={getChartOptions(chartType)}
                            height={350}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Fade>
            )}

            {/* Tab Panel 2: Trends */}
            {activeTab === 2 && (
              <Fade in={true} timeout={600}>
                <Grid container spacing={3}>
                  {trendChartData && (
                    <Grid item xs={12}>
                      <Card elevation={3} sx={{ 
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`
                      }}>
                        <CardHeader
                          title={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <TimelineIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                              Budget Trends
                            </Box>
                          }
                          subheader="Track your financial progress over time"
                        />
                        <CardContent>
                          <Chart
                            type="line"
                            data={trendChartData}
                            options={getChartOptions('line')}
                            height={400}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Fade>
            )}

            {/* Tab Panel 3: Analytics */}
            {activeTab === 3 && (
              <Fade in={true} timeout={600}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card elevation={3} sx={{ borderRadius: 3 }}>
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AnalyticsIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                            Budget Analytics
                          </Box>
                        }
                        subheader="Detailed insights into your financial habits"
                      />
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                              Key Metrics
                            </Typography>
                            <Stack spacing={2}>
                              <Box>
                                <Typography variant="subtitle2">Savings Rate</Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={parseFloat(advancedMetrics.savingsRate)}
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="caption" color="textSecondary">
                                  {advancedMetrics.savingsRate}% of income saved
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="subtitle2">Expense Ratio</Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={parseFloat(advancedMetrics.expenseRatio)}
                                  color="secondary"
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="caption" color="textSecondary">
                                  {advancedMetrics.expenseRatio}% of income spent
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                              Budget Health
                            </Typography>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color={advancedMetrics.budgetHealth === 'Healthy' ? 'success.main' : 'warning.main'}>
                                {advancedMetrics.budgetHealth}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Monthly Buffer: {formatCurrency(advancedMetrics.monthlyBuffer)}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Fade>
            )}
          </Box>
        </Box>
      </Fade>

      {/* Settings Sidebar */}
      <Drawer
        anchor="right"
        open={showSidebar}
        onClose={toggleSidebar}
        PaperProps={{
          sx: { width: 350, p: 2 }
        }}
      >
        <Typography variant="h6" gutterBottom>
          Chart Settings
        </Typography>
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={chartSettings.showLegend}
                onChange={(e) => setChartSettings(prev => ({ ...prev, showLegend: e.target.checked }))}
              />
            }
            label="Show Legend"
          />
          <FormControlLabel
            control={
              <Switch
                checked={chartSettings.showLabels}
                onChange={(e) => setChartSettings(prev => ({ ...prev, showLabels: e.target.checked }))}
              />
            }
            label="Show Labels"
          />
          <FormControlLabel
            control={
              <Switch
                checked={chartSettings.showPercentages}
                onChange={(e) => setChartSettings(prev => ({ ...prev, showPercentages: e.target.checked }))}
              />
            }
            label="Show Percentages"
          />
          <FormControlLabel
            control={
              <Switch
                checked={animationEnabled}
                onChange={(e) => setAnimationEnabled(e.target.checked)}
              />
            }
            label="Enable Animations"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showTooltips}
                onChange={(e) => setShowTooltips(e.target.checked)}
              />
            }
            label="Show Tooltips"
          />
        </Stack>
      </Drawer>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem onClick={handleFilterMenuClose}>
          <MoneyIcon sx={{ mr: 1 }} />
          Filter by Amount
        </MenuItem>
      </Menu>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000
        }}
        onClick={() => setActiveTab(0)}
      >
        <AddIcon />
      </Fab>

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
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MonthlyBudgetModern;
