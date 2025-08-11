import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Snackbar,
  Fade,
  useTheme,
  useMediaQuery,
  Stack,
  InputAdornment,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
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
  Receipt as DebtIcon
} from '@mui/icons-material';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import Card from './common/Card';
import Chart from './common/Chart';
import Loading from './common/Loading';
import Input from './common/Input';
import { Button as CustomButton } from './common/Button';

function MonthlyBudget() {
  const { user } = useAuth();
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [formData, setFormData] = useState({
    income: '',
    additional_income: '',
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);

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

  const colorPalette = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD'
  ];

  useEffect(() => {
    loadBudgetData();
  }, []);

  useEffect(() => {
    updateChartData();
  }, [formData, additionalItems, savingsItems]);

  // Add effect to trigger calculations when data changes
  useEffect(() => {
    console.log('🔍 Data changed, recalculating...');
    console.log('🔍 Current formData:', formData);
    console.log('🔍 Current additionalItems:', additionalItems);
    console.log('🔍 Current savingsItems:', savingsItems);
    
    // Trigger calculations
    const income = calculateTotalIncome();
    const expenses = calculateTotalExpenses();
    const savings = calculateTotalSavings();
    const remaining = calculateRemaining();
    
    console.log('🔍 Final calculations:');
    console.log('  - Income:', income);
    console.log('  - Expenses:', expenses);
    console.log('  - Savings:', savings);
    console.log('  - Remaining:', remaining);
  }, [formData, additionalItems, savingsItems]);

  const loadBudgetData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/budgets/');
      
      console.log('🔍 Budget API response:', response.data);
      
      if (response.data && response.data.length > 0) {
        const budget = response.data[0];
        console.log('🔍 Loading budget data:', budget);
        
        const newFormData = {
          income: budget.income || '',
          additional_income: budget.additional_income || '',
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
        };
        
        console.log('🔍 Setting form data:', newFormData);
        setFormData(newFormData);
        
        console.log('🔍 Setting additional items:', budget.additional_items || []);
        setAdditionalItems(budget.additional_items || []);
        
        console.log('🔍 Setting savings items:', budget.savings_items || []);
        setSavingsItems(budget.savings_items || []);
      } else {
        // No budget exists yet, initialize with empty values
        console.log('No existing budget found, initializing with empty values');
        setFormData({
          income: '',
          additional_income: '',
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
        setAdditionalItems([]);
        setSavingsItems([]);
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
    // Expense Chart Data
    const expenseLabels = [];
    const expenseData = [];
    const expenseColors = [];
    
    const colorPalette = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD'
    ];

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
      if (item.amount && parseFloat(item.amount) > 0) {
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
          borderColor: isDarkMode ? '#1e1e1e' : '#ffffff',
          borderWidth: 2
        }]
      });
    }

    // Income Chart Data
    const incomeLabels = [];
    const incomeData = [];
    const incomeColors = [];
    
    const primaryIncome = parseFloat(formData.income) || 0;
    const additionalIncome = parseFloat(formData.additional_income) || 0;
    const totalIncome = primaryIncome + additionalIncome;
    const totalExpenses = calculateTotalExpenses();
    const totalSavings = calculateTotalSavings();
    
    if (primaryIncome > 0) {
      incomeLabels.push('Primary Income');
      incomeData.push(primaryIncome);
      incomeColors.push(theme.palette.success.main);
    }
    
    if (additionalIncome > 0) {
      incomeLabels.push('Additional Income');
      incomeData.push(additionalIncome);
      incomeColors.push(theme.palette.info.main);
    }
    
    if (totalExpenses > 0) {
      incomeLabels.push('Total Expenses');
      incomeData.push(totalExpenses);
      incomeColors.push(theme.palette.error.main);
    }
    
    if (totalSavings > 0) {
      incomeLabels.push('Total Savings');
      incomeData.push(totalSavings);
      incomeColors.push(theme.palette.primary.main);
    }

    if (incomeData.length > 0) {
      setIncomeChartData({
        labels: incomeLabels,
        datasets: [{
          data: incomeData,
          backgroundColor: incomeColors,
          borderColor: isDarkMode ? '#1e1e1e' : '#ffffff',
          borderWidth: 2
        }]
      });
    }
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

  const calculateTotalIncome = () => {
    const income = parseFloat(formData.income) || 0;
    const additionalIncome = parseFloat(formData.additional_income) || 0;
    const totalIncome = income + additionalIncome;
    console.log('🔍 Total Income calculation:', income, '+', additionalIncome, '=', totalIncome);
    return totalIncome;
  };

  const calculateTotalExpenses = () => {
    let total = 0;
    console.log('🔍 Calculating Total Expenses:');
    
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'income' && value) {
        const amount = parseFloat(value) || 0;
        total += amount;
        console.log(`  - ${key}: $${amount}`);
      }
    });
    
    console.log('🔍 Additional Items:');
    additionalItems.forEach(item => {
      const amount = parseFloat(item.amount) || 0;
      total += amount;
      console.log(`  - ${item.name}: $${amount}`);
    });
    
    console.log('🔍 Total Expenses:', total);
    return total;
  };

  const calculateTotalSavings = () => {
    const savings = savingsItems?.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0) || 0;
    console.log('🔍 Total Savings calculation:', savings);
    console.log('🔍 Savings items:', savingsItems);
    return savings;
  };

  const calculateRemaining = () => {
    const income = calculateTotalIncome();
    const expenses = calculateTotalExpenses();
    const savings = calculateTotalSavings();
    const remaining = income - expenses - savings;
    console.log('🔍 Remaining calculation:', income, '-', expenses, '-', savings, '=', remaining);
    return remaining;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare budget data with current month and year
      const currentDate = new Date();
      
      // Convert all numeric fields to proper numbers, handling empty strings
      const numericFields = [
        'income', 'additional_income', 'housing', 'debt_payments', 'transportation', 'food', 
        'healthcare', 'entertainment', 'shopping', 'travel', 'education', 
        'utilities', 'childcare', 'other'
      ];
      
      const processedFormData = {};
      numericFields.forEach(field => {
        const value = formData[field];
        // Convert empty strings to 0, otherwise parse as float
        processedFormData[field] = value === '' || value === null || value === undefined ? 0 : parseFloat(value) || 0;
      });
      
      // Process additional_items and savings_items to ensure proper format
      const processedAdditionalItems = additionalItems.map(item => ({
        name: item.name || '',
        amount: parseFloat(item.amount) || 0
      }));
      
      const processedSavingsItems = savingsItems.map(item => ({
        name: item.name || '',
        amount: parseFloat(item.amount) || 0
      }));
      
      const budgetData = {
        ...processedFormData,
        additional_items: processedAdditionalItems,
        savings_items: processedSavingsItems,
        month: currentDate.getMonth() + 1, // JavaScript months are 0-indexed
        year: currentDate.getFullYear()
      };

      console.log('Saving budget data:', budgetData);

      // Use the update-current endpoint for better handling
      const response = await axios.post('/api/budgets/update-current/', budgetData);
      
      console.log('Budget saved successfully:', response.data);
      setSuccessMessage('Budget saved successfully!');
      setShowSuccessSnackbar(true);
      
      // Reload the budget data to ensure we have the latest
      await loadBudgetData();
    } catch (error) {
      console.error('Error saving budget:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to save budget';
      
      setError(errorMessage);
      setShowErrorSnackbar(true);
    }
  };

  if (isLoading) {
    return <Loading.PageLoader />;
  }

  const remaining = calculateRemaining();

  return (
    <Box sx={{ p: 3 }}>
      <Fade in={true}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.text.primary,
            mb: 3
          }}>
            Monthly Budget Planner
          </Typography>
          
          <Grid container spacing={3}>
            {/* Budget Form */}
            <Grid item xs={12} lg={8}>
              <Card elevation={2}>
                <Box sx={{ p: 3 }}>
                  <form onSubmit={handleSubmit}>
                    {/* Income Section */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <MoneyIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                        Monthly Income
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Input
                            label="Primary Income"
                            name="income"
                            value={formData.income}
                            onChange={handleInputChange}
                            type="number"
                            startAdornment={<InputAdornment position="start">$</InputAdornment>}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Input
                            label="Additional Income"
                            name="additional_income"
                            value={formData.additional_income}
                            onChange={handleInputChange}
                            type="number"
                            startAdornment={<InputAdornment position="start">$</InputAdornment>}
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Expenses Section */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <TrendingDownIcon sx={{ mr: 1, color: theme.palette.error.main }} />
                        Monthly Expenses
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {Object.entries(formData).map(([key, value]) => {
                          if (key === 'income' || key === 'additional_income') return null;
                          return (
                            <Grid item xs={12} sm={6} md={4} key={key}>
                              <Input
                                label={categoryLabels[key]}
                                name={key}
                                value={value}
                                onChange={handleInputChange}
                                type="number"
                                startAdornment={
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
                                }
                                fullWidth
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
                                <Grid item xs={12} sm={6}>
                                  <Input
                                    label="Expense Name"
                                    value={item.name}
                                    onChange={(e) => updateAdditionalItem(index, 'name', e.target.value)}
                                    fullWidth
                                  />
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                  <Input
                                    label="Amount"
                                    value={item.amount}
                                    onChange={(e) => updateAdditionalItem(index, 'amount', e.target.value)}
                                    type="number"
                                    startAdornment={<InputAdornment position="start">$</InputAdornment>}
                                    fullWidth
                                  />
                                </Grid>
                                <Grid item xs={12} sm={1}>
                                  <IconButton 
                                    onClick={() => removeItem(index)}
                                    color="error"
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
                          sx={{ mt: 1 }}
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
                        mb: 2
                      }}>
                        <SavingsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        Savings & Investments
                      </Typography>
                      
                      <List>
                        {savingsItems.map((item, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={6}>
                                <Input
                                  label="Savings (ex: 401k)"
                                  value={item.name}
                                  onChange={(e) => updateSavingsItem(index, 'name', e.target.value)}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={12} sm={5}>
                                <Input
                                  label="Amount"
                                  value={item.amount}
                                  onChange={(e) => updateSavingsItem(index, 'amount', e.target.value)}
                                  type="number"
                                  startAdornment={<InputAdornment position="start">$</InputAdornment>}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={12} sm={1}>
                                <IconButton 
                                  onClick={() => removeSavingsItem(index)}
                                  color="error"
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
                        sx={{ mt: 1 }}
                      >
                        Add Savings Goal
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <CustomButton
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        type="submit"
                        size="large"
                      >
                        Save Budget
                      </CustomButton>
                    </Box>
                  </form>
                </Box>
              </Card>
            </Grid>

            {/* Budget Summary */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                {/* Financial Overview */}
                <Card elevation={2}>
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 2,
                      pt: 3
                    }}>
                      <PieChartIcon sx={{ mr: 1 }} />
                      Financial Overview
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: theme.palette.success.light + '20',
                        borderRadius: 2
                      }}>
                        <Typography variant="body1">Total Income</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.success.main }}>
                          {formatCurrency(calculateTotalIncome())}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: theme.palette.error.light + '20',
                        borderRadius: 2
                      }}>
                        <Typography variant="body1">Total Expenses</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.error.main }}>
                          {formatCurrency(calculateTotalExpenses())}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: theme.palette.primary.light + '20',
                        borderRadius: 2
                      }}>
                        <Typography variant="body1">Total Savings</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                          {formatCurrency(calculateTotalSavings())}
                        </Typography>
                      </Box>
                      
                      <Divider />
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: remaining >= 0 ? theme.palette.success.light + '20' : theme.palette.error.light + '20',
                        borderRadius: 2
                      }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          Remaining
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: remaining >= 0 ? theme.palette.success.main : theme.palette.error.main,
                          fontWeight: 'bold'
                        }}>
                          {formatCurrency(remaining)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Card>

                {/* Charts Section */}
                <Box sx={{ mt: 4, pt: 0 }}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', pt: 3 }}>
                    Financial Analytics
                  </Typography>
                  
                  <Grid container spacing={4} justifyContent="space-between">
                    {/* Expense Categories Bar Chart - First */}
                    <Grid item xs={12} md={4}>
                      <Card elevation={3} sx={{ height: '100%' }}>
                        <Box sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Expense Categories
                          </Typography>
                          <Box sx={{ height: 400, width: '100%' }}>
                            <Chart
                              type="bar"
                              data={{
                                labels: Object.entries(formData)
                                  .filter(([key, value]) => key !== 'income' && value && parseFloat(value) > 0)
                                  .map(([key]) => categoryLabels[key] || key),
                                datasets: [{
                                  label: 'Amount ($)',
                                  data: Object.entries(formData)
                                    .filter(([key, value]) => key !== 'income' && value && parseFloat(value) > 0)
                                    .map(([, value]) => parseFloat(value)),
                                  backgroundColor: colorPalette.slice(0, 12),
                                  borderColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                                  borderWidth: 1
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    display: false
                                  },
                                  title: {
                                    display: false
                                  }
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: function(value) {
                                        return '$' + value.toLocaleString();
                                      }
                                    }
                                  }
                                }
                              }}
                              height={400}
                            />
                          </Box>
                        </Box>
                      </Card>
                    </Grid>

                    {/* Income Allocation Chart - Second */}
                    {incomeChartData && (
                      <Grid item xs={12} md={4}>
                        <Card elevation={3} sx={{ height: '100%' }}>
                          <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                              Income Allocation
                            </Typography>
                            <Box sx={{ height: 400, width: '100%' }}>
                              <Chart
                                type="pie"
                                data={incomeChartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'bottom',
                                      labels: {
                                        boxWidth: 15,
                                        padding: 20,
                                        usePointStyle: true,
                                        font: {
                                          size: 12
                                        }
                                      }
                                    },
                                    title: {
                                      display: false
                                    }
                                  }
                                }}
                                height={400}
                              />
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    )}

                    {/* Monthly Overview Chart - Third */}
                    <Grid item xs={12} md={4}>
                      <Card elevation={3} sx={{ height: '100%' }}>
                        <Box sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Monthly Overview
                          </Typography>
                          <Box sx={{ height: 400, width: '100%' }}>
                            <Chart
                              type="doughnut"
                              data={{
                                labels: ['Primary Income', 'Additional Income', 'Expenses', 'Savings', 'Remaining'],
                                datasets: [{
                                  data: [
                                    parseFloat(formData.income) || 0,
                                    parseFloat(formData.additional_income) || 0,
                                    calculateTotalExpenses(),
                                    calculateTotalSavings(),
                                    calculateRemaining()
                                  ],
                                  backgroundColor: [
                                    theme.palette.success.main,
                                    theme.palette.info.main,
                                    theme.palette.error.main,
                                    theme.palette.primary.main,
                                    calculateRemaining() >= 0 ? theme.palette.warning.main : theme.palette.error.main
                                  ],
                                  borderColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                                  borderWidth: 2
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'bottom',
                                    labels: {
                                      boxWidth: 15,
                                      padding: 20,
                                      usePointStyle: true,
                                      font: {
                                        size: 12
                                      }
                                    }
                                  },
                                  title: {
                                    display: false
                                  }
                                }
                              }}
                              height={400}
                            />
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
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
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MonthlyBudget;
