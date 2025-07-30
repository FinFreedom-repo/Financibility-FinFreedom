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
      } else {
        // No budget exists yet, initialize with empty values
        console.log('No existing budget found, initializing with empty values');
        setFormData({
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
    
    const totalIncome = parseFloat(formData.income) || 0;
    const totalExpenses = calculateTotalExpenses();
    const totalSavings = calculateTotalSavings();
    
    if (totalIncome > 0) {
      incomeLabels.push('Available Income');
      incomeData.push(totalIncome);
      incomeColors.push(theme.palette.success.main);
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
    return parseFloat(formData.income) || 0;
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
    return savingsItems?.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0) || 0;
  };

  const calculateRemaining = () => {
    return calculateTotalIncome() - calculateTotalExpenses() - calculateTotalSavings();
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
        'income', 'housing', 'debt_payments', 'transportation', 'food', 
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
                      <Input
                        label="Monthly Income"
                        name="income"
                        value={formData.income}
                        onChange={handleInputChange}
                        type="number"
                        startAdornment={<InputAdornment position="start">$</InputAdornment>}
                        fullWidth
                      />
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
                          if (key === 'income') return null;
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
                                  label="Savings Goal"
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
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 2
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

                {/* Charts */}
                {expenseChartData && (
                  <Card elevation={2}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Expense Breakdown
                      </Typography>
                      <Chart
                        type="pie"
                        data={expenseChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                boxWidth: 12,
                                padding: 15,
                                usePointStyle: true
                              }
                            }
                          }
                        }}
                        height={300}
                      />
                    </Box>
                  </Card>
                )}

                {incomeChartData && (
                  <Card elevation={2}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Income Allocation
                      </Typography>
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
                                boxWidth: 12,
                                padding: 15,
                                usePointStyle: true
                              }
                            }
                          }
                        }}
                        height={300}
                      />
                    </Box>
                  </Card>
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
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MonthlyBudget;
