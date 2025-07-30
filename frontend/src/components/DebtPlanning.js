import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Snackbar,
  Fade,
  useTheme,
  useMediaQuery,
  Stack,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Container,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Grow,
  Slide,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import {
  Save as SaveIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Lightbulb as LightbulbIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonalVideo as PersonalVideoIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  DirectionsCar as CarIcon
} from '@mui/icons-material';
import axios from '../utils/axios';
import accountsDebtsService from '../services/accountsDebtsService';
import Loading from './common/Loading';
import DataTable from './common/DataTable';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { styled } from '@mui/material/styles';

ModuleRegistry.registerModules([AllCommunityModule]);

// Custom styles for Debt Planning dark mode - World Class UI Design
const debtDarkColors = {
  // Primary Colors - Only Red, Light Grey, Blue
  background: '#0a0a0a', // Deep black background
  card: '#1a1a1a', // Dark card background
  border: '#333333', // Subtle borders
  
  // Blue - Primary accent color
  blue: '#2196f3', // Primary blue
  blueLight: '#42a5f5', // Lighter blue for hover states
  blueDark: '#1976d2', // Darker blue for active states
  
  // Red - Secondary accent color
  red: '#f44336', // Primary red
  redLight: '#ef5350', // Lighter red for hover states
  redDark: '#d32f2f', // Darker red for active states
  
  // Light Grey - Text and subtle elements
  lightGrey: '#e0e0e0', // Primary light grey
  lightGreyMedium: '#bdbdbd', // Medium light grey
  lightGreyDark: '#9e9e9e', // Darker light grey
  
  // Text Colors
  text: '#ffffff', // White text
  textSecondary: '#e0e0e0', // Light grey text
  textMuted: '#9e9e9e', // Muted text
};



// Styled Table Head Cell - Blue accent
const DebtTableHeadCell = styled(TableCell)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? debtDarkColors.blue : '#e3f2fd',
  color: theme.palette.mode === 'dark' ? debtDarkColors.text : '#1976d2',
  fontWeight: 600,
  fontSize: '0.875rem',
  borderBottom: `2px solid ${theme.palette.mode === 'dark' ? debtDarkColors.blueDark : '#1976d2'}`,
  borderRight: `1px solid ${theme.palette.mode === 'dark' ? debtDarkColors.blueDark : '#1976d2'}`,
  textAlign: 'center',
}));

// Styled Table Cell for previous month (initial balances) - Blue with red accent
const DebtInitialCell = styled(TableCell)(({ theme }) => ({
  background: debtDarkColors.blue,
  color: debtDarkColors.text,
  fontWeight: 600,
  borderLeft: `3px solid ${debtDarkColors.red}`,
  textAlign: 'center',
}));

// Styled Table Cell for current month - Red
const DebtCurrentCell = styled(TableCell)(({ theme }) => ({
  background: debtDarkColors.red,
  color: debtDarkColors.text,
  fontWeight: 600,
  textAlign: 'center',
}));

// Styled Table Cell for projected months - Light grey
const DebtProjectedCell = styled(TableCell)(({ theme }) => ({
  background: debtDarkColors.card,
  color: debtDarkColors.lightGrey,
  textAlign: 'center',
}));

const DebtPlanning = () => {
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [outstandingDebts, setOutstandingDebts] = useState([]);
  const [debtsLoading, setDebtsLoading] = useState(true);
  const [debtsError, setDebtsError] = useState(null);
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [historicalMonthsShown, setHistoricalMonthsShown] = useState(3);
  const [editedBudgetData, setEditedBudgetData] = useState(null);
  const [localGridData, setLocalGridData] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // CRUD operations state for debt management
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [deleteDebtDialogOpen, setDeleteDebtDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState(null);
  const [debtForm, setDebtForm] = useState({
    name: '',
    balance: '',
    debtType: 'credit-card',
    interestRate: '24.99',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  // Add missing state variables for debt payoff planning
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [payoffPlan, setPayoffPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [strategy, setStrategy] = useState('snowball');
  const [isInitializingGrid, setIsInitializingGrid] = useState(false);

  // Auto-save timeout ref
  const autoSaveTimeoutRef = useRef(null);

  // Debt types configuration
  const debtTypes = [
    { value: 'credit-card', label: 'Credit Card', icon: <CreditCardIcon />, color: debtDarkColors.blue },
    { value: 'personal-loan', label: 'Personal Loan', icon: <PersonalVideoIcon />, color: debtDarkColors.red },
    { value: 'student-loan', label: 'Student Loan', icon: <SchoolIcon />, color: debtDarkColors.blue },
    { value: 'auto-loan', label: 'Auto Loan', icon: <CarIcon />, color: debtDarkColors.blue },
    { value: 'mortgage', label: 'Mortgage', icon: <HomeIcon />, color: debtDarkColors.blue },
    { value: 'other', label: 'Other', icon: <ReceiptIcon />, color: debtDarkColors.lightGrey }
  ];

  const defaultDebtRates = {
    'credit-card': '24.99',
    'personal-loan': '12.5',
    'student-loan': '6.8',
    'auto-loan': '7.5',
    'mortgage': '4.5',
    'other': '10.0'
  };

  // CRUD operation handlers
  const resetDebtForm = () => {
    setDebtForm({
      name: '',
      balance: '',
      debtType: 'credit-card',
      interestRate: '24.99',
      effectiveDate: new Date().toISOString().split('T')[0]
    });
  };

  const openDebtDialog = (debt = null) => {
    console.log('Opening debt dialog with debt:', debt);
    
    if (debt) {
      setEditingDebt(debt);
      
      // Safely extract debt data with fallbacks
      const debtData = {
        name: debt.name || '',
        balance: (debt.balance !== undefined && debt.balance !== null) ? debt.balance.toString() : '',
        debtType: debt.debt_type || 'credit-card',
        interestRate: (debt.interest_rate !== undefined && debt.interest_rate !== null) ? debt.interest_rate.toString() : '24.99',
        effectiveDate: debt.effective_date || new Date().toISOString().split('T')[0]
      };
      
      console.log('Setting debt form with data:', debtData);
      setDebtForm(debtData);
    } else {
      setEditingDebt(null);
      resetDebtForm();
    }
    setDebtDialogOpen(true);
  };

  const handleDebtSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!debtForm.name.trim()) {
      setErrorMessage('Debt name is required.');
      setShowErrorSnackbar(true);
      return;
    }
    
    if (!debtForm.balance || parseFloat(debtForm.balance) <= 0) {
      setErrorMessage('Balance must be greater than zero.');
      setShowErrorSnackbar(true);
      return;
    }
    
    if (!debtForm.interestRate || parseFloat(debtForm.interestRate) < 0) {
      setErrorMessage('Interest rate must be a valid positive number.');
      setShowErrorSnackbar(true);
      return;
    }

    try {
      // Format data to match backend expectations
      const data = {
        name: debtForm.name.trim(),
        balance: parseFloat(debtForm.balance),
        debt_type: debtForm.debtType,
        interest_rate: parseFloat(debtForm.interestRate),
        effective_date: debtForm.effectiveDate
      };

      if (editingDebt) {
        await accountsDebtsService.updateDebt(editingDebt.id, data);
        setSuccessMessage(`Debt "${data.name}" updated successfully!`);
      } else {
        await accountsDebtsService.createDebt(data);
        setSuccessMessage(`Debt "${data.name}" added successfully!`);
      }

      setDebtDialogOpen(false);
      setEditingDebt(null);
      resetDebtForm();
      await loadDebtsData(); // Refresh data
      setShowSuccessSnackbar(true);
    } catch (error) {
      console.error('Error saving debt:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || 'Error saving debt. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorSnackbar(true);
    }
  };

  const handleDeleteDebt = (debt) => {
    if (!debt || !debt.id) {
      setErrorMessage('Invalid debt selected for deletion.');
      setShowErrorSnackbar(true);
      return;
    }
    setDebtToDelete(debt);
    setDeleteDebtDialogOpen(true);
  };

  const confirmDeleteDebt = async () => {
    if (!debtToDelete || !debtToDelete.id) {
      setErrorMessage('No debt selected for deletion.');
      setShowErrorSnackbar(true);
      setDeleteDebtDialogOpen(false);
      setDebtToDelete(null);
      return;
    }

    try {
      await accountsDebtsService.deleteDebt(debtToDelete.id);
      setSuccessMessage(`Debt "${debtToDelete.name}" deleted successfully!`);
      await loadDebtsData(); // Refresh data
      setShowSuccessSnackbar(true);
    } catch (error) {
      console.error('Error deleting debt:', error);
      const errorMsg = error.response?.data?.message || 'Error deleting debt. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorSnackbar(true);
    } finally {
      setDeleteDebtDialogOpen(false);
      setDebtToDelete(null);
    }
  };

  const cancelDeleteDebt = () => {
    setDeleteDebtDialogOpen(false);
    setDebtToDelete(null);
  };

  useEffect(() => {
    loadBudgetData();
    loadDebtsData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/budgets/');
      
      if (response.data && response.data.length > 0) {
        const budget = response.data[0];
        setBudgetData(budget);
        setEditedBudgetData(budget);
        await generateGridData(budget);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      setErrorMessage('Failed to load budget data');
      setShowErrorSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const loadDebtsData = async () => {
    try {
      setDebtsLoading(true);
      setDebtsError(null);
      console.log('Loading debts data...');
      
      const response = await accountsDebtsService.getDebts();
      console.log('Raw debts response:', response);
      
      // Ensure we have valid debt data with proper field mapping
      const debtsData = Array.isArray(response) ? response : [];
      const processedDebts = debtsData.map(debt => ({
        ...debt,
        // Ensure balance is a number
        balance: parseFloat(debt.balance) || 0,
        interest_rate: parseFloat(debt.interest_rate) || 0,
        minimum_payment: parseFloat(debt.minimum_payment) || 0,
        // Ensure required fields exist with proper field names
        name: debt.name || 'Unnamed Debt',
        debt_type: debt.debt_type || 'other',
        effective_date: debt.effective_date || new Date().toISOString().split('T')[0],
        // Add missing fields that the frontend expects
        id: debt.id || null,
        user: debt.user || null,
        created_at: debt.created_at || null,
        updated_at: debt.updated_at || null
      }));
      
      console.log('Processed debts data:', processedDebts);
      setOutstandingDebts(processedDebts);
      
      if (processedDebts.length === 0) {
        console.log('No debts found');
      }
    } catch (error) {
      console.error('Error loading debts:', error);
      setDebtsError('Failed to load debt data. Please try again.');
      setOutstandingDebts([]);
    } finally {
      setDebtsLoading(false);
    }
  };

  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    // Historical months
    for (let i = historicalMonthsShown; i > 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        type: 'historical',
        date: date
      });
    }
    
    // Current month
    months.push({
      label: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      type: 'current',
      date: currentDate
    });
    
    // Future months
    for (let i = 1; i <= projectionMonths; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + i);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        type: 'future',
        date: date
      });
    }
    
    return months;
  };

  const generateGridData = async (budget) => {
    const months = generateMonths();
    const data = [];
    
    // Net savings row (first row)
    const netRow = { category: 'Net Savings', type: 'net', editable: false };
    months.forEach((month, idx) => {
      netRow[`month_${idx}`] = 0; // Will be calculated
    });
    data.push(netRow);
    
    // Income row
    const incomeRow = { category: 'Income', type: 'income', editable: true };
    months.forEach((month, idx) => {
      incomeRow[`month_${idx}`] = budget.income || 0;
    });
    data.push(incomeRow);
    
    // Expense rows
    const baseExpenses = [
      { name: 'Housing', field: 'housing' },
      { name: 'Transportation', field: 'transportation' },
      { name: 'Food', field: 'food' },
      { name: 'Healthcare', field: 'healthcare' },
      { name: 'Entertainment', field: 'entertainment' },
      { name: 'Shopping', field: 'shopping' },
      { name: 'Travel', field: 'travel' },
      { name: 'Education', field: 'education' },
      { name: 'Utilities', field: 'utilities' },
      { name: 'Childcare', field: 'childcare' },
      { name: 'Other', field: 'other' }
    ];
    
    baseExpenses.forEach(expense => {
      const row = { category: expense.name, type: 'expense', editable: true };
      months.forEach((month, idx) => {
        row[`month_${idx}`] = budget[expense.field] || 0;
      });
      data.push(row);
    });
    
    // Additional income items
    if (budget.additional_items) {
      budget.additional_items
        .filter(item => item.type === 'income')
        .forEach(item => {
          const row = { category: item.name, type: 'income', editable: true };
          months.forEach((month, idx) => {
            row[`month_${idx}`] = item.amount || 0;
          });
          data.push(row);
        });
    }
    
    // Additional expense items
    if (budget.additional_items) {
      budget.additional_items
        .filter(item => item.type === 'expense')
        .forEach(item => {
          const row = { category: item.name, type: 'expense', editable: true };
          months.forEach((month, idx) => {
            row[`month_${idx}`] = item.amount || 0;
          });
          data.push(row);
        });
    }
    
    // Savings items
    if (budget.savings_items) {
      budget.savings_items.forEach(item => {
        const row = { category: item.name, type: 'savings', editable: true };
        months.forEach((month, idx) => {
          row[`month_${idx}`] = item.amount || 0;
        });
        data.push(row);
      });
    }
    
    // Load existing budget data for each month - FIXED: Only load for future months, not all months
    for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
      const month = months[monthIdx];
      
      // Only load saved data for future months, not historical or current
      if (month.type === 'future') {
        try {
          const monthNum = month.date.getMonth() + 1;
          const year = month.date.getFullYear();
          
          const response = await axios.get(`/api/budgets/get-month/?month=${monthNum}&year=${year}`);
          const monthBudget = response.data;
          
          if (monthBudget && response.status !== 404) {
            // Update the grid data with the loaded budget for this specific month only
            data.forEach(row => {
              if (row.category === 'Income') {
                row[`month_${monthIdx}`] = monthBudget.income || 0;
              } else if (row.type === 'expense') {
                const fieldMap = {
                  'Housing': 'housing',
                  'Transportation': 'transportation',
                  'Food': 'food',
                  'Healthcare': 'healthcare',
                  'Entertainment': 'entertainment',
                  'Shopping': 'shopping',
                  'Travel': 'travel',
                  'Education': 'education',
                  'Utilities': 'utilities',
                  'Childcare': 'childcare',
                  'Other': 'other'
                };
                
                const field = fieldMap[row.category];
                if (field) {
                  row[`month_${monthIdx}`] = monthBudget[field] || 0;
                }
              } else if (row.type === 'income' && row.category !== 'Income') {
                // Handle additional income items
                if (monthBudget.additional_items) {
                  const additionalItem = monthBudget.additional_items.find(item => 
                    item.name === row.category && item.type === 'income'
                  );
                  if (additionalItem) {
                    row[`month_${monthIdx}`] = additionalItem.amount || 0;
                  }
                }
              } else if (row.type === 'expense' && !['Housing', 'Transportation', 'Food', 'Healthcare', 'Entertainment', 'Shopping', 'Travel', 'Education', 'Utilities', 'Childcare', 'Other'].includes(row.category)) {
                // Handle additional expense items
                if (monthBudget.additional_items) {
                  const additionalItem = monthBudget.additional_items.find(item => 
                    item.name === row.category && item.type === 'expense'
                  );
                  if (additionalItem) {
                    row[`month_${monthIdx}`] = additionalItem.amount || 0;
                  }
                }
              } else if (row.type === 'savings') {
                // Handle savings items
                if (monthBudget.savings_items) {
                  const savingsItem = monthBudget.savings_items.find(item => 
                    item.name === row.category
                  );
                  if (savingsItem) {
                    row[`month_${monthIdx}`] = savingsItem.amount || 0;
                  }
                }
              }
            });
          }
        } catch (error) {
          console.log(`No existing budget found for month ${month.date.getMonth() + 1}/${month.date.getFullYear()}, using current month data as default`);
        }
      }
    }
    
    // Calculate net savings
    const netSavingsRow = data[0];
    months.forEach((month, idx) => {
      let income = 0;
      let expenses = 0;
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.type === 'income') {
          income += parseFloat(row[`month_${idx}`]) || 0;
        } else if (row.type === 'expense') {
          expenses += parseFloat(row[`month_${idx}`]) || 0;
        }
      }
      
      netSavingsRow[`month_${idx}`] = income - expenses;
    });
    
    setLocalGridData(data);
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateDebtPayoffTime = (debt) => {
    if (!debt.balance || !debt.minimum_payment || debt.minimum_payment <= 0) return 'N/A';
    
    const balance = parseFloat(debt.balance);
    const payment = parseFloat(debt.minimum_payment);
    const rate = parseFloat(debt.interest_rate) / 100 / 12;
    
    if (rate === 0) {
      return Math.ceil(balance / payment);
    }
    
    const months = Math.ceil(Math.log(1 + (balance * rate) / payment) / Math.log(1 + rate));
    return months;
  };

  const calculateTotalInterest = (debt) => {
    const payoffTime = calculateDebtPayoffTime(debt);
    if (payoffTime === 'N/A') return 0;
    
    const totalPaid = parseFloat(debt.minimum_payment) * payoffTime;
    return totalPaid - parseFloat(debt.balance);
  };

  const debtColumns = [
    {
      headerName: 'Debt Name',
      field: 'name',
      width: 200,
      cellRenderer: ({ data }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            mr: 1, 
            bgcolor: debtTypes.find(type => type.value === data.debt_type)?.color || theme.palette.error.main 
          }}>
            {debtTypes.find(type => type.value === data.debt_type)?.icon || <AccountBalanceIcon />}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {data.name}
          </Typography>
        </Box>
      )
    },
    {
      headerName: 'Current Balance',
      field: 'balance',
      width: 140,
      cellRenderer: ({ value, data }) => {
        // Handle various data formats
        const balance = parseFloat(value) || parseFloat(data.balance) || 0;
        console.log('Balance cell renderer:', { value, balance, data: data.name });
        return (
          <Typography variant="body2" sx={{ 
            fontWeight: 700, 
            color: balance > 0 ? debtDarkColors.red : '#999',
            fontSize: '0.95rem'
          }}>
            {formatCurrency(balance)}
          </Typography>
        );
      }
    },
    {
      headerName: 'Interest Rate',
      field: 'interest_rate',
      width: 130,
      cellRenderer: ({ value, data }) => {
        const interestRate = parseFloat(value) || parseFloat(data.interest_rate) || 0;
        return (
          <Chip 
            label={`${interestRate.toFixed(2)}%`}
            size="small"
            sx={{ 
              background: interestRate > 20 
                ? debtDarkColors.red
                : interestRate > 15 
                  ? debtDarkColors.red
                  : interestRate > 10
                    ? debtDarkColors.blue
                    : debtDarkColors.blue,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          />
        );
      }
    },
    {
      headerName: 'Debt Type',
      field: 'debt_type',
      width: 150,
      cellRenderer: ({ value }) => {
        const debtType = debtTypes.find(type => type.value === value);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              mr: 1, 
              color: debtType?.color || '#616161',
              display: 'flex',
              alignItems: 'center'
            }}>
              {debtType?.icon || <ReceiptIcon />}
            </Box>
            <Typography variant="body2" sx={{ 
              fontWeight: 500,
              color: debtType?.color || '#616161'
            }}>
              {debtType?.label || 'Other'}
            </Typography>
          </Box>
        );
      }
    },
    {
      headerName: 'Min Payment',
      field: 'minimum_payment',
      width: 130,
      cellRenderer: ({ value, data }) => {
        // Calculate minimum payment if not provided (2% of balance or interest-only payment)
        const minPayment = value || Math.max(data.balance * 0.02, (data.balance * (data.interest_rate / 100 / 12)));
        return (
          <Typography variant="body2" sx={{ 
            fontWeight: 600,
            color: '#42a5f5'
          }}>
            {formatCurrency(minPayment)}
          </Typography>
        );
      }
    },
    {
      headerName: '📅 Monthly Interest',
      field: 'monthly_interest',
      width: 140,
      cellRenderer: ({ data }) => {
        const monthlyInterest = (data.balance * (data.interest_rate / 100 / 12));
        return (
          <Typography variant="body2" sx={{ 
            fontWeight: 600,
            color: '#ff9800'
          }}>
            {formatCurrency(monthlyInterest)}
          </Typography>
        );
      }
    },
    {
      headerName: '⏱️ Payoff Time',
      field: 'payoff_time',
      width: 130,
      cellRenderer: ({ data }) => {
        const months = calculateDebtPayoffTime(data);
        if (months === 'N/A') return (
          <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
            N/A
          </Typography>
        );
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return (
          <Typography variant="body2" sx={{ 
            fontWeight: 600,
            color: months > 60 ? '#f44336' : months > 24 ? '#ff9800' : '#4caf50'
          }}>
            {years > 0 ? `${years}y ` : ''}{remainingMonths}m
          </Typography>
        );
      }
    },
    {
      headerName: '💸 Total Interest',
      field: 'total_interest',
      width: 140,
      cellRenderer: ({ data }) => {
        const totalInterest = calculateTotalInterest(data);
        return (
          <Typography variant="body2" sx={{ 
            fontWeight: 700,
            color: '#e91e63',
            fontSize: '0.95rem'
          }}>
            {formatCurrency(totalInterest)}
          </Typography>
        );
      }
    },
    {
      headerName: '⚙️ Actions',
      field: 'actions',
      width: 120,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'right',
      cellRenderer: ({ data }) => (
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%'
        }}>
          <IconButton
            size="small"
            title={`Edit ${data.name}`}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Edit clicked for debt:', data);
              if (!data) {
                setErrorMessage('No debt data available for editing.');
                setShowErrorSnackbar(true);
                return;
              }
              try {
                openDebtDialog(data);
              } catch (error) {
                console.error('Error opening edit dialog:', error);
                setErrorMessage('Error opening edit dialog. Please try again.');
                setShowErrorSnackbar(true);
              }
            }}
            sx={{
              color: isDarkMode ? '#64b5f6' : '#1976d2',
              background: isDarkMode ? 'rgba(100, 181, 246, 0.1)' : 'rgba(25, 118, 210, 0.1)',
              border: isDarkMode ? '1px solid rgba(100, 181, 246, 0.3)' : '1px solid rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: isDarkMode ? 'rgba(100, 181, 246, 0.2)' : 'rgba(25, 118, 210, 0.2)',
                transform: 'scale(1.1)',
                boxShadow: isDarkMode 
                  ? '0 4px 12px rgba(100, 181, 246, 0.3)' 
                  : '0 4px 12px rgba(25, 118, 210, 0.3)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            title={`Delete ${data.name}`}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Delete clicked for debt:', data);
              if (!data) {
                setErrorMessage('No debt data available for deletion.');
                setShowErrorSnackbar(true);
                return;
              }
              try {
                handleDeleteDebt(data);
              } catch (error) {
                console.error('Error opening delete dialog:', error);
                setErrorMessage('Error opening delete dialog. Please try again.');
                setShowErrorSnackbar(true);
              }
            }}
            sx={{
              color: isDarkMode ? '#ef5350' : '#d32f2f',
              background: isDarkMode ? 'rgba(239, 83, 80, 0.1)' : 'rgba(211, 47, 47, 0.1)',
              border: isDarkMode ? '1px solid rgba(239, 83, 80, 0.3)' : '1px solid rgba(211, 47, 47, 0.3)',
              '&:hover': {
                background: isDarkMode ? 'rgba(239, 83, 80, 0.2)' : 'rgba(211, 47, 47, 0.2)',
                transform: 'scale(1.1)',
                boxShadow: isDarkMode 
                  ? '0 4px 12px rgba(239, 83, 80, 0.3)' 
                  : '0 4px 12px rgba(211, 47, 47, 0.3)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  // Function to recalculate net savings for all months
  const recalculateNetSavings = (gridData) => {
    if (!gridData || gridData.length === 0) return gridData;
    
    const netRow = gridData[0]; // Net Savings is always the first row
    const months = generateMonths();
    
    for (let idx = 0; idx < months.length; idx++) {
      let income = 0;
      let expenses = 0;
      
      for (let i = 1; i < gridData.length; i++) {
        const row = gridData[i];
        if (row.type === 'income') {
          const monthIncome = parseFloat(row[`month_${idx}`]) || 0;
          income += monthIncome;
        }
        if (row.type === 'expense') {
          const monthExpense = parseFloat(row[`month_${idx}`]) || 0;
          expenses += monthExpense;
        }
      }
      
      const netSavings = income - expenses;
      netRow[`month_${idx}`] = netSavings;
      
      console.log(`Recalculated Net Savings for Month ${idx} (${months[idx].label}): Income $${income}, Expenses $${expenses}, Net Savings $${netSavings}`);
    }
    
    return gridData;
  };

  const updateTotalDebtFromPayoffPlan = (gridData, payoffPlan) => {
    if (!gridData || !payoffPlan || !payoffPlan.plan) return gridData;
    
    const totalDebtRow = gridData.find(row => row.category === 'Total Debt');
    if (!totalDebtRow) return gridData;
    
    const months = generateMonths();
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    
    // Clear all total debt values first
    months.forEach((month, idx) => {
      totalDebtRow[`month_${idx}`] = 0;
    });
    
    // Only show total debt for the previous month (current-1)
    if (currentMonthIdx > 0) {
      const previousMonthIdx = currentMonthIdx - 1;
      const payoffPlanIdx = (previousMonthIdx - currentMonthIdx) + 1; // This will be 0 for previous month
      
      if (payoffPlan.plan[payoffPlanIdx] && payoffPlan.plan[payoffPlanIdx].debts) {
        const totalDebt = payoffPlan.plan[payoffPlanIdx].debts.reduce(
          (sum, debt) => sum + (parseFloat(debt.balance) || 0), 
          0
        );
        totalDebtRow[`month_${previousMonthIdx}`] = totalDebt;
        console.log(`Updated Total Debt for ${months[previousMonthIdx].label}: $${totalDebt}`);
      }
    }
    
    return gridData;
  };

  // Function to calculate debt payoff plan
  const calculateDebtPayoffPlan = async (budgetData, debts, strategyType) => {
    if (!budgetData || !debts || debts.length === 0) return;
    
    console.log('=== DEBT PAYOFF DEBUG ===');
    console.log('budgetData:', budgetData);
    console.log('editedBudgetData:', editedBudgetData);
    console.log('debts:', debts);
    console.log('strategyType:', strategyType);
    
    try {
      // Use current grid data to calculate net savings for each month
      const months = generateMonths();
      const monthlyBudgetData = [];
      
      console.log('Using current grid data for debt payoff calculation');
      console.log('localGridData length:', localGridData?.length);
      console.log('localGridData first few rows:', localGridData?.slice(0, 3));
      
      // Show the net savings values for each month
      if (localGridData && localGridData.length > 0) {
        const netSavingsRow = localGridData.find(row => row.category === 'Net Savings');
        if (netSavingsRow) {
          console.log('Net Savings values from grid:');
          months.forEach((month, idx) => {
            const netSavings = parseFloat(netSavingsRow[`month_${idx}`]) || 0;
            console.log(`  Month ${idx} (${month.label}): $${netSavings}`);
          });
        }
      }
      
      // Get net savings directly from the grid data
      if (localGridData && localGridData.length > 0) {
        const netSavingsRow = localGridData.find(row => row.category === 'Net Savings');
        if (netSavingsRow) {
          // Find the current month index
          const currentMonthIdx = months.findIndex(m => m.type === 'current');
          console.log(`Current month index: ${currentMonthIdx} (${months[currentMonthIdx]?.label})`);
          
          // Only use current and future months for debt payoff (skip historical months)
          for (let monthIdx = currentMonthIdx; monthIdx < months.length; monthIdx++) {
            const netSavings = parseFloat(netSavingsRow[`month_${monthIdx}`]) || 0;
            const debtMonthIndex = monthIdx - currentMonthIdx; // Start from 0 for debt payoff
            monthlyBudgetData.push({
              month: debtMonthIndex,
              net_savings: netSavings,
              income: 0, // Not needed for debt calculation
              expenses: 0, // Not needed for debt calculation
              budget_data: null,
              originalMonthIdx: monthIdx,
              monthLabel: months[monthIdx].label
            });
            console.log(`Debt Month ${debtMonthIndex + 1} (${months[monthIdx].label}): Net Savings $${netSavings} from grid`);
          }
        } else {
          console.error('Could not find Net Savings row in grid data');
          return;
        }
      } else {
        console.error('No grid data available for debt payoff calculation');
        return;
      }
      
      console.log('Monthly budget data from grid:', monthlyBudgetData);
      console.log('Net savings by month:');
      monthlyBudgetData.forEach((monthData, idx) => {
        const monthInfo = months[idx];
        const monthLabel = monthInfo ? monthInfo.label : `Month ${idx}`;
        console.log(`  ${monthLabel}: $${monthData.net_savings}`);
      });
      
      // Transform monthly budget data to backend format
      // The backend expects the data in order (index 0 = first month, index 1 = second month, etc.)
      const backendMonthlyData = monthlyBudgetData.map((monthData, idx) => {
        return {
          month: monthData.month + 1, // Use the debt month index (0-based) + 1 for backend
          net_savings: monthData.net_savings || 0 // Allow negative values to be sent
        };
      });
    
      // Transform debts to match backend format - ensure proper field mapping
      const transformedDebts = debts.map(debt => ({
        name: debt.name,
        balance: parseFloat(debt.balance || 0),
        rate: parseFloat(debt.interest_rate || 0) / 100, // Convert percentage to decimal
        debt_type: debt.debt_type || 'other'
      }));
      
      console.log('Final monthlyBudgetData sent to backend:', backendMonthlyData);
      console.log('=== MONTH MAPPING FOR DEBT PAYOFF ===');
      console.log('Current month is:', months.find(m => m.type === 'current')?.label);
      console.log('Months being used for debt payoff:');
      backendMonthlyData.forEach((monthData, idx) => {
        const originalMonth = monthlyBudgetData[idx];
        const monthName = originalMonth.monthLabel;
        const actualMonth = originalMonth.originalMonthIdx !== undefined ? 
          `${months[originalMonth.originalMonthIdx].date.getMonth() + 1}/${months[originalMonth.originalMonthIdx].date.getFullYear()}` : 'N/A';
        console.log(`  ${monthName} (${actualMonth}) → Backend Month ${monthData.month}: Net savings $${monthData.net_savings}`);
        console.log(`    This means: ${monthName}'s net savings of $${monthData.net_savings} will be used for debt payment in Month ${monthData.month} of the payoff plan`);
      });
      console.log('=== END MONTH MAPPING ===');
      console.log('Debts being sent:', transformedDebts);
      console.log('Interest rate details:');
      transformedDebts.forEach(debt => {
        const originalDebt = debts.find(d => d.name === debt.name);
        console.log(`  ${debt.name}: Original rate from DB: ${originalDebt?.interest_rate}, Parsed rate: ${debt.rate * 100}%, Sent as decimal: ${debt.rate}`);
      });
      console.log('Strategy:', strategyType);
      console.log('=== END DEBT PAYOFF DEBUG ===');
    
      setPlanLoading(true);
      const res = await accountsDebtsService.calculateDebtPayoffPlan({
        debts: transformedDebts,
        strategy: strategyType || 'snowball',
        monthly_budget_data: backendMonthlyData
      });
      
      console.log('Backend response:', res);
      console.log('=== DEBT PAYOFF PLAN SUMMARY ===');
      if (res.plan) {
        console.log(`Total plan months: ${res.plan.length}`);
        res.plan.forEach((monthPlan, idx) => {
          // Skip the initial month (idx 0) which has $0 payments
          if (idx === 0) {
            console.log(`\nPrevious Month (Initial Balances):`);
            if (monthPlan.debts) {
              monthPlan.debts.forEach(debt => {
                console.log(`  - ${debt.name}: Balance $${debt.balance}, Paid $${debt.paid}, Interest $${debt.interest}`);
              });
            }
            return;
          }
          
          // Map the plan month index back to the actual month (skip initial month)
          const monthData = monthlyBudgetData[idx - 1]; // Subtract 1 to account for initial month
          const monthName = monthData ? monthData.monthLabel : `Month ${idx}`;
          const actualMonth = monthData && monthData.originalMonthIdx !== undefined ? 
            `${months[monthData.originalMonthIdx].date.getMonth() + 1}/${months[monthData.originalMonthIdx].date.getFullYear()}` : 'N/A';
          console.log(`\n${monthName} (${actualMonth}) - Plan Month ${idx}:`);
          
          if (monthPlan.debts) {
            let totalPaid = 0;
            monthPlan.debts.forEach(debt => {
              console.log(`  - ${debt.name}: Balance $${debt.balance}, Paid $${debt.paid}, Interest $${debt.interest}`);
              totalPaid += debt.paid;
            });
            console.log(`  Total paid this month: $${totalPaid}`);
          }
        });
      }
      console.log('=== END DEBT PAYOFF PLAN SUMMARY ===');
      
      // Update Total Debt row with the new payoff plan
      setLocalGridData(prevData => {
        if (prevData) {
          return updateTotalDebtFromPayoffPlan(prevData, res);
        }
        return prevData;
      });
      
      setPayoffPlan(res);
      setPlanError(null);
    } catch (err) {
      console.error('Debt payoff calculation error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || 'Failed to calculate debt payoff plan';
      setPlanError(errorMsg);
      setErrorMessage(errorMsg);
      setShowErrorSnackbar(true);
    } finally {
      setPlanLoading(false);
    }
  };

  // Helper to get historical balances for each debt for each historical month
  const getHistoricalBalance = (debtName, monthIdx, months, outstandingDebts) => {
    const month = months[monthIdx];
    if (!month || !month.date) return '';
    // Find the closest record for this debt before or at this month
    let closest = null;
    let closestDiff = Infinity;
    outstandingDebts.forEach(debt => {
      if (debt.name === debtName && debt.effective_date) {
        const debtDate = new Date(debt.effective_date);
        const diff = Math.abs(debtDate - month.date);
        if (debtDate <= month.date && diff < closestDiff) {
          closest = debt;
          closestDiff = diff;
        }
      }
    });
    return closest ? `$${parseFloat(closest.balance).toLocaleString()}` : '';
  };

  const findDebtFreeColIdx = (payoffPlan, months) => {
    if (!payoffPlan || !payoffPlan.plan || !months) return null;
    
    // Find the first payoff plan month where all debts are paid off
    let debtFreePlanIdx = null;
    for (let i = 0; i < payoffPlan.plan.length; i++) {
      if (payoffPlan.plan[i].debts.every(d => d.balance === 0)) {
        debtFreePlanIdx = i;
        break;
      }
    }
    
    if (debtFreePlanIdx === null) return null;
    
    // Find the current month index in the months array
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    if (currentMonthIdx === -1) return null;
    
    // Calculate the debt-free month index in the months array
    // debtFreePlanIdx includes the initial month (0), so we need to subtract 1 to get the actual month offset
    const debtFreeMonthIdx = currentMonthIdx + (debtFreePlanIdx - 1);
    
    // Ensure the debt-free month index is within bounds
    if (debtFreeMonthIdx >= months.length) return null;
    
    // Get the debt-free month object
    const debtFreeMonth = months[debtFreeMonthIdx];
    if (!debtFreeMonth) return null;
    
    return { 
      idx: debtFreeMonthIdx, 
      debtFreeDate: debtFreeMonth.date 
    };
  };

  // Helper to calculate payoff summary
  const getPayoffSummary = () => {
    if (!payoffPlan || !outstandingDebts || outstandingDebts.length === 0) {
      // Return zeros when no payoff plan or debts
      return {
        months: 0,
        totalInterest: 0,
        totalPrincipal: 0,
        totalPaid: 0,
        hitMaxMonths: false,
        remainingDebts: 0
      };
    }
    
    // Total principal is the sum of the original debt balances
    const totalPrincipal = outstandingDebts
      .filter(debt => debt.balance > 0 && debt.debt_type !== 'mortgage')
      .reduce((sum, debt) => sum + parseFloat(debt.balance || 0), 0);
    
    // Calculate actual debt-free month by finding when all debts reach zero
    let actualDebtFreeMonth = 0;
    let hitMaxMonths = false;
    let remainingDebts = 0;
    
    if (payoffPlan.plan && Array.isArray(payoffPlan.plan)) {
      for (let i = 0; i < payoffPlan.plan.length; i++) {
        const monthPlan = payoffPlan.plan[i];
        if (monthPlan.debts && Array.isArray(monthPlan.debts)) {
          const allDebtsPaid = monthPlan.debts.every(debt => 
            debt.balance === 0 || debt.balance <= 0.01
          );
          if (allDebtsPaid) {
            actualDebtFreeMonth = i;
            break;
          }
        }
      }
      // If no debt-free month found in the plan, use the last month calculated
      if (actualDebtFreeMonth === 0 && payoffPlan.plan.length > 0) {
        actualDebtFreeMonth = payoffPlan.plan.length - 1;
        // Check if we hit the maximum months limit
        hitMaxMonths = payoffPlan.hit_max_months || false;
        remainingDebts = payoffPlan.remaining_debts || 0;
      }
    }
    
    // Total interest from the payoff plan
    const totalInterest = payoffPlan.total_interest || 0;
    
    // Debug logging
    console.log('=== PAYOFF SUMMARY DEBUG ===');
    console.log('payoffPlan:', payoffPlan);
    console.log('totalPrincipal:', totalPrincipal);
    console.log('totalInterest:', totalInterest);
    console.log('actualDebtFreeMonth:', actualDebtFreeMonth);
    console.log('hitMaxMonths:', hitMaxMonths);
    console.log('remainingDebts:', remainingDebts);
    console.log('=== END PAYOFF SUMMARY DEBUG ===');
    
    // Total paid is principal + interest
    const totalPaid = totalPrincipal + totalInterest;
    
    return {
      months: actualDebtFreeMonth,
      totalInterest,
      totalPrincipal,
      totalPaid,
      hitMaxMonths,
      remainingDebts
    };
  };

  // UseEffect hooks for debt planning
  useEffect(() => {
    if (!editedBudgetData) return;
    
    const initializeGrid = async () => {
      await generateGridData(editedBudgetData);
    };
    
    initializeGrid();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedBudgetData]);

  // Update categories when budgetData changes
  useEffect(() => {
    if (budgetData) {
      // Base income category
      const baseIncome = [{ name: 'Income', value: budgetData.income, type: 'income' }];
      
      // Base expense categories
      const baseExpenses = [
        { name: 'Housing', value: budgetData.housing, type: 'expense' },
        { name: 'Transportation', value: budgetData.transportation, type: 'expense' },
        { name: 'Food', value: budgetData.food, type: 'expense' },
        { name: 'Healthcare', value: budgetData.healthcare, type: 'expense' },
        { name: 'Entertainment', value: budgetData.entertainment, type: 'expense' },
        { name: 'Shopping', value: budgetData.shopping, type: 'expense' },
        { name: 'Travel', value: budgetData.travel, type: 'expense' },
        { name: 'Education', value: budgetData.education, type: 'expense' },
        { name: 'Utilities', value: budgetData.utilities, type: 'expense' },
        { name: 'Childcare', value: budgetData.childcare, type: 'expense' },
        { name: 'Other', value: budgetData.other, type: 'expense' }
      ];

      // Add additional items
      if (budgetData.additional_items) {
        const additionalIncome = budgetData.additional_items
          .filter(item => item.type === 'income')
          .map(item => ({
            name: item.name,
            value: item.amount,
            type: 'income'
          }));

        const additionalExpenses = budgetData.additional_items
          .filter(item => item.type === 'expense')
          .map(item => ({
            name: item.name,
            value: item.amount,
            type: 'expense'
          }));

        setIncomeCategories([...baseIncome, ...additionalIncome]);
        setExpenseCategories([...baseExpenses, ...additionalExpenses]);
      } else {
        setIncomeCategories(baseIncome);
        setExpenseCategories(baseExpenses);
      }
    }
  }, [budgetData]);

  // When budgetData loads, initialize editedBudgetData
  useEffect(() => {
    if (budgetData) {
      setEditedBudgetData({
        ...budgetData,
        additional_items: budgetData.additional_items ? [...budgetData.additional_items] : [],
      });
    }
  }, [budgetData]);

  // Always recalculate payoff plan when editedBudgetData is loaded and valid
  useEffect(() => {
    const recalculatePlan = async () => {
    if (!loading && !debtsLoading && editedBudgetData && outstandingDebts && outstandingDebts.length > 0 && localGridData && localGridData.length > 0) {
      const filteredDebts = outstandingDebts.filter(
        debt => debt.balance > 0 && debt.debt_type !== 'mortgage'
      );
      if (filteredDebts.length > 0) {
          // Use the current grid data instead of editedBudgetData
          const budgetFromGrid = createBudgetFromGridData(localGridData);
          await calculateDebtPayoffPlan(budgetFromGrid, filteredDebts, strategy);
      }
    }
    };
    
    recalculatePlan();
  }, [editedBudgetData, outstandingDebts, strategy, loading, debtsLoading, localGridData]);

  // Render the editable AG Grid table
  const renderGrid = () => {
    const months = generateMonths();
    if (!localGridData || localGridData.length === 0) {
      return <div style={{padding: '2rem', color: 'red'}}>No data to display in the table.</div>;
    }

    // Build AG Grid columns
    const columnDefs = [
      {
        headerName: 'Category',
        field: 'category',
        pinned: 'left',
        editable: false,
        minWidth: 220,
        width: 220,
        cellClass: params => {
          if (params.data.category === 'Net Savings') return 'net-savings-category-cell';
          if (incomeCategories.some(cat => cat.name === params.value)) return 'income-category-cell';
          if (expenseCategories.some(cat => cat.name === params.value)) return 'expense-category-cell';
          return '';
        },
        cellRenderer: params => {
          const { data } = params;
          let color = '';
          
          if (data.category === 'Net Savings') {
            color = 'primary';
          } else if (data.category === 'Total Debt') {
            color = 'warning';
          } else if (data.type === 'income') {
            color = 'success';
          } else if (data.type === 'expense') {
            color = 'error';
          }
          
          return (
            <Typography variant="body2" sx={{ 
              fontWeight: data.category === 'Net Savings' ? 'bold' : '600',
              color: data.category === 'Net Savings' ? theme.palette.primary.main : 'inherit',
              fontSize: '0.95rem',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              letterSpacing: '0.025em',
              textTransform: data.category === 'Net Savings' ? 'uppercase' : 'none'
            }}>
              {data.category}
            </Typography>
          );
        }
      }
    ];

    // Add month columns
    months.forEach((month, idx) => {
      columnDefs.push({
        headerName: month.label,
        field: `month_${idx}`,
        width: 120,
        editable: params => {
          // Don't allow editing Net Savings or historical months
          if (params.data.category === 'Net Savings') return false;
          return month.type !== 'historical';
        },
        cellClass: params => {
          const classes = [];
          if (month.type === 'historical') classes.push('historical-cell');
          if (month.type === 'current') classes.push('current-month-cell');
          if (month.type === 'future') classes.push('future-month-cell');
          if (params.data.category === 'Net Savings') {
            const value = parseFloat(params.value) || 0;
            classes.push(value >= 0 ? 'net-positive-cell' : 'net-negative-cell');
          } else if (params.data.category === 'Total Debt') {
            classes.push('total-debt-cell');
          }
          return classes.join(' ');
        },
        cellRenderer: params => {
          const value = parseFloat(params.value) || 0;
          let color = 'inherit';
          let fontWeight = 'normal';
          
          if (params.data.category === 'Net Savings') {
            color = value >= 0 ? theme.palette.success.main : theme.palette.error.main;
            fontWeight = 'bold';
          } else if (params.data.category === 'Total Debt') {
            color = theme.palette.warning.main;
            fontWeight = 'bold';
          }
          
          return (
            <Typography variant="body2" sx={{ color, fontWeight }}>
              {formatCurrency(value)}
            </Typography>
          );
        },
        valueSetter: params => {
          const numValue = parseFloat(params.newValue) || 0;
          params.data[params.colDef.field] = numValue;
          return true;
        }
      });
    });

    // Handle cell edit: only update the value for the specific month/category - FIXED: Month-specific updates
    const onCellValueChanged = params => {
      const { data, colDef, newValue } = params;
      const colIdx = parseInt(colDef.field.replace('month_', ''));
      if (data.category === 'Net Savings') return;
      if (!months[colIdx] || months[colIdx].type === 'historical') return;
      
      // Don't mark as unsaved during grid initialization
      if (isInitializingGrid) {
        console.log('Cell change ignored during grid initialization');
        return;
      }
      
      console.log('Cell edited:', { category: data.category, month: colIdx, newValue, monthType: months[colIdx].type });
      
      // Update localGridData for this cell only and recalculate net savings
      setLocalGridData(prev => {
        const updated = prev.map(row => {
          if (row.category === data.category) {
            return { ...row, [colDef.field]: parseFloat(newValue) || 0 };
          }
          return row;
        });
        // Recalculate net savings after updating the cell
        const recalculated = recalculateNetSavings(updated);
        
        // Update debt payoff plan with the new monthly budget data
        setTimeout(async () => {
          if (outstandingDebts && outstandingDebts.length > 0) {
            const filteredDebts = outstandingDebts.filter(
              debt => debt.balance > 0 && debt.debt_type !== 'mortgage'
            );
            if (filteredDebts.length > 0) {
              console.log('Updating debt payoff plan after cell change...');
              const updatedBudgetForDebt = createBudgetFromGridData(recalculated);
              await calculateDebtPayoffPlan(updatedBudgetForDebt, filteredDebts, strategy);
            }
          }
        }, 100);
        
        return recalculated;
      });
      
      // Auto-save after a short delay to prevent too many API calls
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        console.log('Auto-saving changes after cell edit...');
        
        // FIXED: Save month-specific data based on which month was edited
        if (months[colIdx].type === 'future') {
          // For future months, save that specific month's data
          saveMonthChanges(colIdx, months[colIdx]);
        } else if (months[colIdx].type === 'current') {
          // For current month, save current month data only
          handleSaveChanges();
        }
        // Historical months are not editable, so no save needed
      }, 1500); // Auto-save after 1.5 seconds of inactivity for faster response
    };

    return (
      <Box sx={{ 
        width: '100%', 
        minWidth: 1200, 
        overflow: 'auto',
        background: isDarkMode 
          ? 'rgba(255, 255, 255, 0.08)' 
          : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        p: 3,
        border: isDarkMode 
          ? '1px solid rgba(255, 255, 255, 0.15)' 
          : '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: isDarkMode 
          ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
          : '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <Fade in={true} timeout={800}>
          <Alert 
            icon={<LightbulbIcon sx={{ color: '#4fc3f7' }} />}
            severity="info" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.15), rgba(66, 165, 245, 0.1))',
              border: '1px solid rgba(79, 195, 247, 0.3)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              '& .MuiAlert-message': {
                color: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(25, 118, 210, 0.9)',
                fontWeight: 500
              },
              '& .MuiAlert-icon': {
                color: '#4fc3f7'
              }
            }}
          >
            <strong>Smart Editing:</strong> Click any cell for current/future months to edit. 
            Your changes automatically update the debt payoff calculations in real-time!
          </Alert>
        </Fade>
        
        {hasUnsavedChanges && (
          <Grow in={true} timeout={600}>
            <Alert 
              severity="warning"
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleSaveChanges}
                  startIcon={<SaveIcon />}
                  sx={{ 
                    fontWeight: 'bold',
                    background: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': { background: 'rgba(255, 255, 255, 0.2)' }
                  }}
                >
                  Save Now
                </Button>
              }
              sx={{ 
                mb: 3,
                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 167, 38, 0.15))',
                border: '1px solid rgba(255, 193, 7, 0.4)',
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                '& .MuiAlert-message': {
                  color: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.95)' 
                    : 'rgba(237, 108, 2, 0.9)',
                  fontWeight: 500
                },
                '& .MuiAlert-icon': {
                  color: '#ffb74d'
                },
                animation: 'glow 2s ease-in-out infinite alternate',
                '@keyframes glow': {
                  from: { boxShadow: '0 0 20px rgba(255, 193, 7, 0.3)' },
                  to: { boxShadow: '0 0 30px rgba(255, 193, 7, 0.5)' }
                }
              }}
            >
              <strong>Unsaved Changes Detected:</strong> You've made {localGridData.length} budget modifications. 
              Changes will auto-save in 2 seconds after editing stops.
            </Alert>
          </Grow>
        )}
        
        <Box 
          className="ag-theme-alpine" 
          sx={{
            width: '100%', 
            minHeight: 450,
            borderRadius: 3,
            overflow: 'hidden',
            background: isDarkMode 
              ? debtDarkColors.background 
              : 'rgba(255, 255, 255, 0.8)',
            border: isDarkMode 
              ? `1px solid ${debtDarkColors.border}` 
              : '1px solid rgba(0, 0, 0, 0.1)',
            '& .ag-header': {
              background: isDarkMode 
                ? debtDarkColors.blue 
                : '#e3f2fd',
              borderBottom: isDarkMode 
                ? `2px solid ${debtDarkColors.blueDark}` 
                : '2px solid #1976d2',
              '& .ag-header-cell': {
                borderRight: isDarkMode 
                  ? `1px solid ${debtDarkColors.blueDark}` 
                  : '1px solid #1976d2',
                color: isDarkMode 
                  ? debtDarkColors.text 
                  : '#1976d2',
                fontWeight: 600,
                fontSize: '0.875rem',
                textAlign: 'center',
                padding: '12px 8px'
              }
            },
            '& .ag-cell': {
              borderRight: isDarkMode 
                ? `1px solid ${debtDarkColors.border}` 
                : '1px solid #1976d2',
              borderBottom: isDarkMode 
                ? `1px solid ${debtDarkColors.border}` 
                : '1px solid #1976d2',
              color: isDarkMode 
                ? debtDarkColors.text 
                : 'rgba(44, 62, 80, 0.9)',
              padding: '8px 12px',
              textAlign: 'center',
              verticalAlign: 'middle',
              '&.ag-cell-editable': {
                background: isDarkMode 
                  ? debtDarkColors.card 
                  : 'rgba(76, 175, 80, 0.05)',
                '&:hover': {
                  background: isDarkMode 
                    ? debtDarkColors.background 
                    : 'rgba(76, 175, 80, 0.1)',
                  cursor: 'pointer'
                }
              }
            },
            '& .ag-row': {
              background: isDarkMode 
                ? debtDarkColors.card 
                : 'rgba(255, 255, 255, 0.5)',
              transition: 'all 0.2s ease',
              minHeight: '48px',
              '&:hover': {
                background: isDarkMode 
                  ? debtDarkColors.background 
                  : 'rgba(25, 118, 210, 0.05)',
                transform: 'translateX(2px)'
              },
              '&.ag-row-even': {
                background: isDarkMode 
                  ? debtDarkColors.background 
                  : 'rgba(248, 249, 250, 0.7)'
              }
            },
            '& .net-savings-category-cell': {
              background: isDarkMode 
                ? debtDarkColors.card 
                : 'white',
              fontWeight: 600,
              color: isDarkMode 
                ? debtDarkColors.text 
                : '#2e7d32',
              borderLeft: isDarkMode 
                ? `4px solid ${debtDarkColors.blueDark}` 
                : '4px solid #4caf50',
              textAlign: 'left',
              paddingLeft: '16px'
            },
            '& .income-category-cell': {
              background: isDarkMode 
                ? debtDarkColors.card 
                : 'white',
              borderLeft: isDarkMode 
                ? `4px solid ${debtDarkColors.blue}` 
                : '4px solid #66bb6a',
              textAlign: 'left',
              paddingLeft: '16px'
            },
            '& .expense-category-cell': {
              background: isDarkMode 
                ? debtDarkColors.card 
                : 'white',
              borderLeft: isDarkMode 
                ? `4px solid ${debtDarkColors.red}` 
                : '4px solid #ff6b6b',
              textAlign: 'left',
              paddingLeft: '16px'
            },
            '& .net-positive-cell': {
              background: isDarkMode 
                ? debtDarkColors.blue 
                : 'rgba(76, 175, 80, 0.15)',
              color: isDarkMode 
                ? debtDarkColors.text 
                : '#2e7d32 !important',
              fontWeight: 600
            },
            '& .net-negative-cell': {
              background: isDarkMode 
                ? debtDarkColors.red 
                : 'rgba(255, 107, 107, 0.15)',
              color: isDarkMode 
                ? debtDarkColors.text 
                : '#d32f2f !important',
              fontWeight: 600
            },
            '& .historical-cell': {
              background: isDarkMode 
                ? debtDarkColors.background 
                : 'rgba(158, 158, 158, 0.1)',
              color: isDarkMode 
                ? debtDarkColors.lightGreyDark 
                : 'rgba(0, 0, 0, 0.5)',
              fontStyle: 'italic'
            },
            '& .current-month-cell': {
              background: isDarkMode 
                ? debtDarkColors.red 
                : 'linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(66, 165, 245, 0.15))',
              fontWeight: 600,
              color: isDarkMode 
                ? debtDarkColors.text 
                : 'inherit',
            },
            '& .future-month-cell': {
              background: 'rgba(156, 39, 176, 0.08)',
              '&:hover': {
                background: 'rgba(156, 39, 176, 0.15)'
              }
            }
          }}
        >
          {localGridData && localGridData.length > 0 ? (
            <AgGridReact
              rowData={localGridData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              onCellValueChanged={onCellValueChanged}
              suppressMovableColumns={true}
              suppressMenuHide={true}
              stopEditingWhenCellsLoseFocus={true}
              singleClickEdit={true}
              defaultColDef={{ resizable: false, suppressSizeToFit: true, suppressAutoSize: true, minWidth: 120, width: 120, maxWidth: 120 }}
              headerHeight={48}
              suppressColumnVirtualisation={false}
              rowHeight={72}
            />
          ) : (
            <div style={{padding: '2rem', color: isDarkMode ? 'white' : '#2c3e50'}}>Grid data not ready.</div>
          )}
        </Box>
      </Box>
    );
  };

  // Render payoff summary table
  const renderPayoffSummaryTable = () => {
    const summary = getPayoffSummary();
    if (!summary) return null;
    
    return (
      <Card sx={{ 
        minWidth: 320, 
        mb: 2,
        background: isDarkMode 
          ? debtDarkColors.card
          : 'white',
        border: isDarkMode 
          ? `1px solid ${debtDarkColors.border}` 
          : '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: isDarkMode 
          ? '0 2px 8px rgba(33, 150, 243, 0.2)' 
          : '0 8px 24px rgba(0, 0, 0, 0.12)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ 
              bgcolor: debtDarkColors.blue,
              mr: 2,
              width: 40,
              height: 40
            }}>
              <AssessmentIcon sx={{ color: 'white' }} />
            </Avatar>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold',
              color: isDarkMode ? 'white' : '#2c3e50'
            }}>
              Payoff Summary
            </Typography>
          </Box>
          
          {/* 2x2 Grid Layout */}
          <Grid container spacing={2}>
            {/* Row 1, Column 1: Timeline */}
            <Grid item xs={6}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2,
                background: isDarkMode 
                  ? debtDarkColors.card
                  : 'white',
                border: `1px solid ${debtDarkColors.blue}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}>
                  Payoff Timeline
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold',
                  color: summary.hitMaxMonths ? '#f44336' : debtDarkColors.blue,
                  textAlign: 'center'
                }}>
                  {summary.months > 0 ? `${summary.months} months` : 'No debt'}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  mt: 0.5
                }}>
                  {summary.months > 0 ? 
                    (summary.hitMaxMonths ? 
                      `⚠️ ${summary.remainingDebts} debts remaining after ${summary.months} months` : 
                      'Time to become debt-free') 
                    : 'You are debt-free!'}
                </Typography>
              </Box>
            </Grid>

            {/* Row 1, Column 2: Principal */}
            <Grid item xs={6}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2,
                background: isDarkMode 
                  ? debtDarkColors.card
                  : 'white',
                border: `1px solid ${debtDarkColors.blue}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}>
                  Total Principal
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold',
                  color: '#2196f3',
                  textAlign: 'center'
                }}>
                  {formatCurrency(summary.totalPrincipal)}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  mt: 0.5
                }}>
                  Original debt amount
                </Typography>
              </Box>
            </Grid>

            {/* Row 2, Column 1: Interest */}
            <Grid item xs={6}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2,
                background: isDarkMode 
                  ? debtDarkColors.card
                  : 'white',
                border: `1px solid ${debtDarkColors.red}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}>
                  Total Interest
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold',
                  color: debtDarkColors.red,
                  textAlign: 'center'
                }}>
                  {formatCurrency(summary.totalInterest)}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  mt: 0.5
                }}>
                  Total interest paid over time
                </Typography>
              </Box>
            </Grid>

            {/* Row 2, Column 2: Total Paid - Highlighted */}
            <Grid item xs={6}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2,
                background: isDarkMode 
                  ? debtDarkColors.card
                  : 'white',
                border: `2px solid ${debtDarkColors.blue}`,
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 700,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}>
                  Total Amount Paid
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold',
                  color: debtDarkColors.blue,
                  textAlign: 'center',
                  textShadow: 'none'
                }}>
                  {formatCurrency(summary.totalPaid)}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#666',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  textAlign: 'center',
                  mt: 0.5
                }}>
                  Principal + Interest (Complete payoff cost)
                </Typography>
                
                {/* Interest percentage indicator */}
                {summary.totalPrincipal > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ 
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666',
                      fontSize: '0.65rem',
                      mr: 0.5
                    }}>
                      Interest adds:
                    </Typography>
                    <Chip 
                      label={`+${((summary.totalInterest / summary.totalPrincipal) * 100).toFixed(1)}%`}
                      size="small"
                      sx={{
                        background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.65rem',
                        height: 18
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderPayoffTable = () => {
    if (planLoading) return <Loading.InlineLoader message="Loading payoff plan..." />;
    if (planError) return <Alert severity="error">{planError}</Alert>;
    if (!payoffPlan || !payoffPlan.debts || !Array.isArray(payoffPlan.debts)) return null;
    
    const months = generateMonths();
    if (!months || months.length === 0) return null;
    
    console.log('Rendering payoff table:');
    console.log('Months:', months.map((m, idx) => `${idx}: ${m.type} - ${m.label}`));
    console.log('Payoff plan:', payoffPlan);
    
    const debtFreeCol = findDebtFreeColIdx(payoffPlan, months);
    const debtFreeColIdx = debtFreeCol ? debtFreeCol.idx : null;
    const debtFreeDate = debtFreeCol ? debtFreeCol.debtFreeDate : null;
    
    console.log('Debt free column:', debtFreeCol);
    console.log('Debt free column index:', debtFreeColIdx);
    console.log('Debt free date:', debtFreeDate);

    return (
      <Box sx={{ mb: 3 }}>
        {debtFreeDate && (
          <Alert severity="success" sx={{ mb: 2 }}>
            🎉 You will be debt-free by <strong>{debtFreeDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</strong>!
          </Alert>
        )}
        
        <Card sx={{
          background: isDarkMode 
            ? debtDarkColors.card
            : 'rgba(255, 255, 255, 0.9)',
          border: isDarkMode 
            ? `1px solid ${debtDarkColors.border}` 
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 3,
          mb: 2
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Debt Payoff Timeline
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, fontSize: '0.875rem' }}>
              <Chip size="small" label="🕰️ Historical" />
              <Chip size="small" label="📅 Current" />
              <Chip size="small" label="🔮 Projected" />
            </Box>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Debt</strong></TableCell>
                    {months?.map((month, idx) => month && (
                      isDarkMode ? (
                        <DebtTableHeadCell
                          key={idx}
                          align="center"
                        >
                          <strong>
                            {(() => {
                              const currentMonthIdx = months.findIndex(m => m.type === 'current');
                              if (idx === currentMonthIdx - 1) {
                                return `${month.label}\n(Initial Balances)`;
                              }
                              return month.label || `Month ${idx}`;
                            })()}
                          </strong>
                        </DebtTableHeadCell>
                      ) : (
                        <TableCell
                          key={idx}
                          align="center"
                          sx={{
                            background: isDarkMode ? debtDarkColors.blue : '#e3f2fd',
                            color: isDarkMode ? 'white' : '#1976d2',
                            fontWeight: 600,
                            borderBottom: `2px solid ${isDarkMode ? debtDarkColors.blueDark : '#1976d2'}`,
                            borderRight: `1px solid ${isDarkMode ? debtDarkColors.blueDark : '#1976d2'}`,
                          }}
                        >
                          <strong>
                            {(() => {
                              const currentMonthIdx = months.findIndex(m => m.type === 'current');
                              if (idx === currentMonthIdx - 1) {
                                return `${month.label}\n(Initial Balances)`;
                              }
                              return month.label || `Month ${idx}`;
                            })()}
                          </strong>
                        </TableCell>
                      )
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoffPlan.debts?.map((debt, debtIdx) => debt && debt.name && (
                    <TableRow key={`debt-${debtIdx}-${debt.name || debtIdx}`}>
                      <TableCell sx={{
                        background: isDarkMode ? debtDarkColors.blue : '#e3f2fd',
                        color: isDarkMode ? 'white' : '#1976d2',
                        fontWeight: 600,
                        borderBottom: `2px solid ${isDarkMode ? debtDarkColors.blueDark : '#1976d2'}`,
                        borderRight: `1px solid ${isDarkMode ? debtDarkColors.blueDark : '#1976d2'}`,
                      }}>
                        <strong>{debt.name || 'Unknown Debt'}</strong>
                      </TableCell>
                      {months?.map((month, monthIdx) => month && (
                        (() => {
                          const currentMonthIdx = months.findIndex(m => m.type === 'current');
                          if (month.type === 'historical') {
                            return (
                              isDarkMode ? (
                                <DebtProjectedCell key={`historical-${monthIdx}`} align="center">
                                  {getHistoricalBalance(debt.name, monthIdx, months, outstandingDebts)}
                                </DebtProjectedCell>
                              ) : (
                                <TableCell key={`historical-${monthIdx}`} align="center" sx={{ 
                                  backgroundColor: isDarkMode ? debtDarkColors.card : 'grey.50',
                                  borderRight: `1px solid ${isDarkMode ? debtDarkColors.border : '#1976d2'}`,
                                  borderBottom: `1px solid ${isDarkMode ? debtDarkColors.border : '#1976d2'}`
                                }}>
                                  {getHistoricalBalance(debt.name, monthIdx, months, outstandingDebts)}
                                </TableCell>
                              )
                            );
                          } else if (monthIdx === currentMonthIdx - 1) {
                            return (
                              isDarkMode ? (
                                <DebtInitialCell key={`initial-${monthIdx}`} align="center">
                                  {(() => {
                                    const initialBalance = debt.balance || 0;
                                    const result = `$${parseFloat(initialBalance).toLocaleString()}`;
                                    return result;
                                  })()}
                                </DebtInitialCell>
                              ) : (
                                <TableCell key={`initial-${monthIdx}`} align="center" sx={{
                                  borderRight: `1px solid ${isDarkMode ? debtDarkColors.border : '#1976d2'}`,
                                  borderBottom: `1px solid ${isDarkMode ? debtDarkColors.border : '#1976d2'}`
                                }}>
                                  {(() => {
                                    const initialBalance = debt.balance || 0;
                                    const result = `$${parseFloat(initialBalance).toLocaleString()}`;
                                    return result;
                                  })()}
                                </TableCell>
                              )
                            );
                          } else if (month.type === 'current') {
                            return (
                              isDarkMode ? (
                                <DebtCurrentCell key={`current-${monthIdx}`} align="center">
                                  {(() => {
                                    const payoffPlanIdx = (monthIdx - currentMonthIdx) + 1;
                                    const payoffRow = payoffPlan.plan && payoffPlan.plan[payoffPlanIdx];
                                    if (payoffRow && payoffRow.debts) {
                                      const debtInPlan = payoffRow.debts.find(d => d.name === debt.name);
                                      if (debtInPlan) {
                                        const balance = debtInPlan.balance;
                                        const result = balance !== undefined && balance !== null ?
                                          `$${parseFloat(balance).toLocaleString()}` :
                                          `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                        return result;
                                      }
                                    }
                                    return `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                  })()}
                                </DebtCurrentCell>
                              ) : (
                                <TableCell key={`current-${monthIdx}`} align="center" sx={{ 
                                  backgroundColor: isDarkMode ? debtDarkColors.red : 'primary.light',
                                  borderRight: `1px solid ${isDarkMode ? debtDarkColors.border : '#1976d2'}`,
                                  borderBottom: `1px solid ${isDarkMode ? debtDarkColors.border : '#1976d2'}`
                                }}>
                                  {(() => {
                                    const payoffPlanIdx = (monthIdx - currentMonthIdx) + 1;
                                    const payoffRow = payoffPlan.plan && payoffPlan.plan[payoffPlanIdx];
                                    if (payoffRow && payoffRow.debts) {
                                      const debtInPlan = payoffRow.debts.find(d => d.name === debt.name);
                                      if (debtInPlan) {
                                        const balance = debtInPlan.balance;
                                        const result = balance !== undefined && balance !== null ?
                                          `$${parseFloat(balance).toLocaleString()}` :
                                          `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                        return result;
                                      }
                                    }
                                    return `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                  })()}
                                </TableCell>
                              )
                            );
                          } else {
                            return (
                              isDarkMode ? (
                                <DebtProjectedCell key={`projected-${monthIdx}`} align="center">
                                  {(() => {
                                    const payoffPlanIdx = (monthIdx - currentMonthIdx) + 1;
                                    const payoffRow = payoffPlan.plan && payoffPlan.plan[payoffPlanIdx];
                                    if (payoffRow && payoffRow.debts) {
                                      const debtInPlan = payoffRow.debts.find(d => d.name === debt.name);
                                      if (debtInPlan) {
                                        const balance = debtInPlan.balance;
                                        const result = balance !== undefined && balance !== null ?
                                          `$${parseFloat(balance).toLocaleString()}` :
                                          `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                        return result;
                                      }
                                    }
                                    return `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                  })()}
                                </DebtProjectedCell>
                              ) : (
                                <TableCell key={`projected-${monthIdx}`} align="center" sx={{ 
                                  backgroundColor: isDarkMode ? debtDarkColors.card : 'info.light',
                                  borderRight: `1px solid ${isDarkMode ? debtDarkColors.border : '#1976d2'}`,
                                  borderBottom: `1px solid ${isDarkMode ? debtDarkColors.border : '#1976d2'}`
                                }}>
                                  {(() => {
                                    const payoffPlanIdx = (monthIdx - currentMonthIdx) + 1;
                                    const payoffRow = payoffPlan.plan && payoffPlan.plan[payoffPlanIdx];
                                    if (payoffRow && payoffRow.debts) {
                                      const debtInPlan = payoffRow.debts.find(d => d.name === debt.name);
                                      if (debtInPlan) {
                                        const balance = debtInPlan.balance;
                                        const result = balance !== undefined && balance !== null ?
                                          `$${parseFloat(balance).toLocaleString()}` :
                                          `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                        return result;
                                      }
                                    }
                                    return `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                  })()}
                                </TableCell>
                              )
                            );
                          }
                        })()
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Helper function to clear unsaved changes flag
  const clearUnsavedChanges = () => {
    console.log('Clearing unsaved changes flag');
    setHasUnsavedChanges(false);
  };

  // Handle saving changes from the grid - FIXED: Only saves current month data
  const handleSaveChanges = async () => {
    if (!localGridData || localGridData.length === 0) {
      setErrorMessage('No data to save');
      setShowErrorSnackbar(true);
      return;
    }
    
    try {
      // Clear any previous error messages
      setErrorMessage('');
      setShowErrorSnackbar(false);
      
      // Show loading state
      setSuccessMessage('Saving changes...');
      setShowSuccessSnackbar(true);
      
      // Extract current month data from localGridData
      const currentMonthIdx = generateMonths().findIndex(m => m.type === 'current');
      if (currentMonthIdx === -1) {
        throw new Error('Current month not found');
      }
      
      // Prepare budget data for backend - ONLY current month data
      const budgetUpdate = {
        income: 0,
        housing: 0,
        transportation: 0,
        food: 0,
        healthcare: 0,
        entertainment: 0,
        shopping: 0,
        travel: 0,
        education: 0,
        utilities: 0,
        childcare: 0,
        other: 0,
        additional_items: [],
        savings_items: [],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      };
      
      // Process each row in the grid data - ONLY for current month
      localGridData.forEach(row => {
        const currentValue = parseFloat(row[`month_${currentMonthIdx}`]) || 0;
        
        if (row.category === 'Income') {
          budgetUpdate.income = currentValue;
        } else if (row.type === 'income' && row.category !== 'Income') {
          // Additional income items
          budgetUpdate.additional_items.push({
            name: row.category,
            amount: currentValue,
            type: 'income'
          });
        } else if (row.type === 'expense') {
          // Map to base expense categories or additional items
          const baseExpenseMap = {
            'Housing': 'housing',
            'Transportation': 'transportation', 
            'Food': 'food',
            'Healthcare': 'healthcare',
            'Entertainment': 'entertainment',
            'Shopping': 'shopping',
            'Travel': 'travel',
            'Education': 'education',
            'Utilities': 'utilities',
            'Childcare': 'childcare',
            'Other': 'other'
          };
          
          if (baseExpenseMap[row.category]) {
            budgetUpdate[baseExpenseMap[row.category]] = currentValue;
          } else {
            // Additional expense items
            budgetUpdate.additional_items.push({
              name: row.category,
              amount: currentValue,
              type: 'expense'
            });
          }
        } else if (row.type === 'savings') {
          // Savings items
          budgetUpdate.savings_items.push({
            name: row.category,
            amount: currentValue
          });
        }
      });
      
      console.log('Saving current month budget update:', budgetUpdate);
      
      // Make API call to save budget - ONLY current month
      let response;
      try {
        console.log('Attempting to save current month budget data...');
        
        // Use the update-current endpoint for current month only
        response = await axios.post('/api/budgets/update-current/', budgetUpdate);
        console.log('Current month budget saved via update-current endpoint');
      } catch (updateError) {
        console.log('Update-current endpoint failed, trying standard endpoints:', updateError);
        
        // Fallback to standard PUT/POST
        if (editedBudgetData && editedBudgetData.id) {
          // Update existing budget
          console.log('Updating existing budget with ID:', editedBudgetData.id);
          response = await axios.put(`/api/budgets/${editedBudgetData.id}/`, budgetUpdate);
          console.log('Budget updated via PUT endpoint');
        } else {
          // Create new budget
          console.log('Creating new budget');
          response = await axios.post('/api/budgets/', budgetUpdate);
          console.log('Budget created via POST endpoint');
        }
      }
      
      console.log('Budget save response:', response.data);
      
      // Update local state with saved data - ONLY current month data
      setBudgetData(response.data);
      setEditedBudgetData(response.data);
      
      // Clear unsaved changes flag
      clearUnsavedChanges();
      
      // Show success message
      setSuccessMessage('Current month budget changes saved successfully!');
      setShowSuccessSnackbar(true);
      
      // Update the debt payoff plan with the new data
      if (outstandingDebts && outstandingDebts.length > 0) {
        const filteredDebts = outstandingDebts.filter(
          debt => debt.balance > 0 && debt.debt_type !== 'mortgage'
        );
        if (filteredDebts.length > 0) {
          console.log('Updating debt payoff plan with new budget data...');
          const updatedBudgetForDebt = createBudgetFromGridData(localGridData);
          await calculateDebtPayoffPlan(updatedBudgetForDebt, filteredDebts, strategy);
        }
      }
      
    } catch (error) {
      console.error('Error saving budget changes:', error);
      setErrorMessage(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        error.message || 
        'Failed to save budget changes'
      );
      setShowErrorSnackbar(true);
    }
  };

  // Helper function to load all monthly budget data from database
  const loadAllMonthlyBudgetData = async () => {
    const months = generateMonths();
    const monthlyBudgetData = [];
    
    for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
      const month = months[monthIdx];
      
      if (month.type === 'historical') {
        // Historical months: try to get saved data, fallback to current month data
        try {
          const monthNum = month.date.getMonth() + 1;
          const year = month.date.getFullYear();
          
          const response = await axios.get(`/api/budgets/get-month/?month=${monthNum}&year=${year}`);
          const monthBudget = response.data;
          
          if (monthBudget && response.status !== 404) {
            // Use saved budget data for historical month
            let income = monthBudget.income || 0;
            let expenses = 0;
            
            // Add base expenses
            expenses += monthBudget.housing || 0;
            expenses += monthBudget.transportation || 0;
            expenses += monthBudget.food || 0;
            expenses += monthBudget.healthcare || 0;
            expenses += monthBudget.entertainment || 0;
            expenses += monthBudget.shopping || 0;
            expenses += monthBudget.travel || 0;
            expenses += monthBudget.education || 0;
            expenses += monthBudget.utilities || 0;
            expenses += monthBudget.childcare || 0;
            expenses += monthBudget.other || 0;
            
            // Add additional income
            if (monthBudget.additional_items) {
              monthBudget.additional_items
                .filter(item => item.type === 'income')
                .forEach(item => {
                  income += item.amount || 0;
                });
            }
            
            // Add additional expenses
            if (monthBudget.additional_items) {
              monthBudget.additional_items
                .filter(item => item.type === 'expense')
                .forEach(item => {
                  expenses += item.amount || 0;
                });
            }
            
            const netSavings = income - expenses;
            
            monthlyBudgetData.push({
              month: monthIdx,
              net_savings: netSavings,
              income: income,
              expenses: expenses,
              budget_data: monthBudget
            });
            
            console.log(`Month ${monthNum}/${year} (HISTORICAL SAVED): Income $${income}, Expenses $${expenses}, Net Savings $${netSavings}`);
          } else {
            // Fallback to current month data for historical months
            let income = editedBudgetData?.income || 0;
            let expenses = 0;
            
            // Add base expenses
            expenses += editedBudgetData?.housing || 0;
            expenses += editedBudgetData?.transportation || 0;
            expenses += editedBudgetData?.food || 0;
            expenses += editedBudgetData?.healthcare || 0;
            expenses += editedBudgetData?.entertainment || 0;
            expenses += editedBudgetData?.shopping || 0;
            expenses += editedBudgetData?.travel || 0;
            expenses += editedBudgetData?.education || 0;
            expenses += editedBudgetData?.utilities || 0;
            expenses += editedBudgetData?.childcare || 0;
            expenses += editedBudgetData?.other || 0;
            
            // Add additional income
            if (editedBudgetData?.additional_items) {
              editedBudgetData.additional_items
                .filter(item => item.type === 'income')
                .forEach(item => {
                  income += item.amount || 0;
                });
            }
            
            // Add additional expenses
            if (editedBudgetData?.additional_items) {
              editedBudgetData.additional_items
                .filter(item => item.type === 'expense')
                .forEach(item => {
                  expenses += item.amount || 0;
                });
            }
            
            const netSavings = income - expenses;
            
            monthlyBudgetData.push({
              month: monthIdx,
              net_savings: netSavings,
              income: income,
              expenses: expenses,
              budget_data: editedBudgetData
            });
            
            console.log(`Month ${monthNum}/${year} (HISTORICAL FALLBACK): Income $${income}, Expenses $${expenses}, Net Savings $${netSavings}`);
          }
        } catch (error) {
          // Error fallback to current month data for historical months
          let income = editedBudgetData?.income || 0;
          let expenses = 0;
          
          // Add base expenses
          expenses += editedBudgetData?.housing || 0;
          expenses += editedBudgetData?.transportation || 0;
          expenses += editedBudgetData?.food || 0;
          expenses += editedBudgetData?.healthcare || 0;
          expenses += editedBudgetData?.entertainment || 0;
          expenses += editedBudgetData?.shopping || 0;
          expenses += editedBudgetData?.travel || 0;
          expenses += editedBudgetData?.education || 0;
          expenses += editedBudgetData?.utilities || 0;
          expenses += editedBudgetData?.childcare || 0;
          expenses += editedBudgetData?.other || 0;
          
          // Add additional income
          if (editedBudgetData?.additional_items) {
            editedBudgetData.additional_items
              .filter(item => item.type === 'income')
              .forEach(item => {
                income += item.amount || 0;
              });
          }
          
          // Add additional expenses
          if (editedBudgetData?.additional_items) {
            editedBudgetData.additional_items
              .filter(item => item.type === 'expense')
              .forEach(item => {
                expenses += item.amount || 0;
              });
          }
          
          const netSavings = income - expenses;
          
          monthlyBudgetData.push({
            month: monthIdx,
            net_savings: netSavings,
            income: income,
            expenses: expenses,
            budget_data: editedBudgetData
          });
          
          console.log(`Month ${month.date.getMonth() + 1}/${month.date.getFullYear()} (HISTORICAL ERROR FALLBACK): Income $${income}, Expenses $${expenses}, Net Savings $${netSavings}`);
        }
      } else if (month.type === 'current') {
        // Current month always uses current budget data
        let income = editedBudgetData?.income || 0;
        let expenses = 0;
        
        // Add base expenses
        expenses += editedBudgetData?.housing || 0;
        expenses += editedBudgetData?.transportation || 0;
        expenses += editedBudgetData?.food || 0;
        expenses += editedBudgetData?.healthcare || 0;
        expenses += editedBudgetData?.entertainment || 0;
        expenses += editedBudgetData?.shopping || 0;
        expenses += editedBudgetData?.travel || 0;
        expenses += editedBudgetData?.education || 0;
        expenses += editedBudgetData?.utilities || 0;
        expenses += editedBudgetData?.childcare || 0;
        expenses += editedBudgetData?.other || 0;
        
        // Add additional income
        if (editedBudgetData?.additional_items) {
          editedBudgetData.additional_items
            .filter(item => item.type === 'income')
            .forEach(item => {
              income += item.amount || 0;
            });
        }
        
        // Add additional expenses
        if (editedBudgetData?.additional_items) {
          editedBudgetData.additional_items
            .filter(item => item.type === 'expense')
            .forEach(item => {
              expenses += item.amount || 0;
            });
        }
        
        const netSavings = income - expenses;
        
        monthlyBudgetData.push({
          month: monthIdx,
          net_savings: netSavings,
          income: income,
          expenses: expenses,
          budget_data: editedBudgetData
        });
        
        console.log(`Month ${month.date.getMonth() + 1}/${month.date.getFullYear()} (CURRENT): Income $${income}, Expenses $${expenses}, Net Savings $${netSavings}`);
      } else {
        // Future months: try to get saved data, fallback to current month data
        try {
          const monthNum = month.date.getMonth() + 1;
          const year = month.date.getFullYear();
          
          const response = await axios.get(`/api/budgets/get-month/?month=${monthNum}&year=${year}`);
          const monthBudget = response.data;
          
          if (monthBudget) {
            // Use saved budget data
            let income = monthBudget.income || 0;
            let expenses = 0;
            
            // Add base expenses
            expenses += monthBudget.housing || 0;
            expenses += monthBudget.transportation || 0;
            expenses += monthBudget.food || 0;
            expenses += monthBudget.healthcare || 0;
            expenses += monthBudget.entertainment || 0;
            expenses += monthBudget.shopping || 0;
            expenses += monthBudget.travel || 0;
            expenses += monthBudget.education || 0;
            expenses += monthBudget.utilities || 0;
            expenses += monthBudget.childcare || 0;
            expenses += monthBudget.other || 0;
            
            // Add additional income
            if (monthBudget.additional_items) {
              monthBudget.additional_items
                .filter(item => item.type === 'income')
                .forEach(item => {
                  income += item.amount || 0;
                });
            }
            
            // Add additional expenses
            if (monthBudget.additional_items) {
              monthBudget.additional_items
                .filter(item => item.type === 'expense')
                .forEach(item => {
                  expenses += item.amount || 0;
                });
            }
            
            const netSavings = income - expenses;
            
            monthlyBudgetData.push({
              month: monthIdx,
              net_savings: netSavings,
              income: income,
              expenses: expenses,
              budget_data: monthBudget
            });
            
            console.log(`Month ${monthNum}/${year} (SAVED DATA): Income $${income}, Expenses $${expenses}, Net Savings $${netSavings}`);
          } else {
            // Fallback to current month data
            let income = editedBudgetData?.income || 0;
            let expenses = 0;
            
            // Add base expenses
            expenses += editedBudgetData?.housing || 0;
            expenses += editedBudgetData?.transportation || 0;
            expenses += editedBudgetData?.food || 0;
            expenses += editedBudgetData?.healthcare || 0;
            expenses += editedBudgetData?.entertainment || 0;
            expenses += editedBudgetData?.shopping || 0;
            expenses += editedBudgetData?.travel || 0;
            expenses += editedBudgetData?.education || 0;
            expenses += editedBudgetData?.utilities || 0;
            expenses += editedBudgetData?.childcare || 0;
            expenses += editedBudgetData?.other || 0;
            
            // Add additional income
            if (editedBudgetData?.additional_items) {
              editedBudgetData.additional_items
                .filter(item => item.type === 'income')
                .forEach(item => {
                  income += item.amount || 0;
                });
            }
            
            // Add additional expenses
            if (editedBudgetData?.additional_items) {
              editedBudgetData.additional_items
                .filter(item => item.type === 'expense')
                .forEach(item => {
                  expenses += item.amount || 0;
                });
            }
            
            const netSavings = income - expenses;
            
            monthlyBudgetData.push({
              month: monthIdx,
              net_savings: netSavings,
              income: income,
              expenses: expenses,
              budget_data: editedBudgetData
            });
            
            console.log(`Month ${monthNum}/${year} (FALLBACK): Income $${income}, Expenses $${expenses}, Net Savings $${netSavings}`);
          }
        } catch (error) {
          // Error fallback to current month data
          let income = editedBudgetData?.income || 0;
          let expenses = 0;
          
          // Add base expenses
          expenses += editedBudgetData?.housing || 0;
          expenses += editedBudgetData?.transportation || 0;
          expenses += editedBudgetData?.food || 0;
          expenses += editedBudgetData?.healthcare || 0;
          expenses += editedBudgetData?.entertainment || 0;
          expenses += editedBudgetData?.shopping || 0;
          expenses += editedBudgetData?.travel || 0;
          expenses += editedBudgetData?.education || 0;
          expenses += editedBudgetData?.utilities || 0;
          expenses += editedBudgetData?.childcare || 0;
          expenses += editedBudgetData?.other || 0;
          
          // Add additional income
          if (editedBudgetData?.additional_items) {
            editedBudgetData.additional_items
              .filter(item => item.type === 'income')
              .forEach(item => {
                income += item.amount || 0;
              });
          }
          
          // Add additional expenses
          if (editedBudgetData?.additional_items) {
            editedBudgetData.additional_items
              .filter(item => item.type === 'expense')
              .forEach(item => {
                expenses += item.amount || 0;
              });
          }
          
          const netSavings = income - expenses;
          
          monthlyBudgetData.push({
            month: monthIdx,
            net_savings: netSavings,
            income: income,
            expenses: expenses,
            budget_data: editedBudgetData
          });
          
          console.log(`Month ${month.date.getMonth() + 1}/${month.date.getFullYear()} (ERROR FALLBACK): Income $${income}, Expenses $${expenses}, Net Savings $${netSavings}`);
        }
      }
    }
    
    return monthlyBudgetData;
  };

  // Helper function to create budget object from grid data for debt calculations
  const createBudgetFromGridData = (gridData) => {
    if (!gridData || gridData.length === 0) {
      return editedBudgetData || {};
    }
    
    const budget = {
      income: 0,
      housing: 0,
      transportation: 0,
      food: 0,
      healthcare: 0,
      entertainment: 0,
      shopping: 0,
      travel: 0,
      education: 0,
      utilities: 0,
      childcare: 0,
      other: 0,
      additional_items: [],
      savings_items: []
    };
    
    // Get current month index
    const months = generateMonths();
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    
    if (currentMonthIdx === -1) {
      return editedBudgetData || {};
    }
    
    // Process each row in the grid data
    gridData.forEach(row => {
      const currentValue = parseFloat(row[`month_${currentMonthIdx}`]) || 0;
      
      if (row.category === 'Income') {
        budget.income = currentValue;
      } else if (row.type === 'income' && row.category !== 'Income') {
        // Additional income items
        budget.additional_items.push({
          name: row.category,
          amount: currentValue,
          type: 'income'
        });
      } else if (row.type === 'expense') {
        // Map to base expense categories or additional items
        const baseExpenseMap = {
          'Housing': 'housing',
          'Transportation': 'transportation', 
          'Food': 'food',
          'Healthcare': 'healthcare',
          'Entertainment': 'entertainment',
          'Shopping': 'shopping',
          'Travel': 'travel',
          'Education': 'education',
          'Utilities': 'utilities',
          'Childcare': 'childcare',
          'Other': 'other'
        };
        
        if (baseExpenseMap[row.category]) {
          budget[baseExpenseMap[row.category]] = currentValue;
        } else {
          // Additional expense items
          budget.additional_items.push({
            name: row.category,
            amount: currentValue,
            type: 'expense'
          });
        }
      } else if (row.type === 'savings') {
        // Savings items
        budget.savings_items.push({
          name: row.category,
          amount: currentValue
        });
      }
    });
    
    return budget;
  };

  // New function to save changes for a specific month - FIXED: Proper month-specific saving
  const saveMonthChanges = async (monthIdx, monthData) => {
    if (!monthData || monthData.type === 'historical') {
      return; // Don't save historical months
    }
    
    try {
      // Calculate the actual month and year for this index
      const months = generateMonths();
      const targetMonth = months[monthIdx];
      if (!targetMonth || targetMonth.type === 'historical') {
        return; // Don't save historical months
      }
      
      const targetDate = targetMonth.date;
      const month = targetDate.getMonth() + 1; // JavaScript months are 0-indexed
      const year = targetDate.getFullYear();
      
      // Prepare budget data for this specific month only
      const budgetUpdate = {
        income: 0,
        housing: 0,
        transportation: 0,
        food: 0,
        healthcare: 0,
        entertainment: 0,
        shopping: 0,
        travel: 0,
        education: 0,
        utilities: 0,
        childcare: 0,
        other: 0,
        additional_items: [],
        savings_items: [],
        month: month,
        year: year
      };
      
      // Process each row in the grid data for this specific month only
      localGridData.forEach(row => {
        const monthValue = parseFloat(row[`month_${monthIdx}`]) || 0;
        
        if (row.category === 'Income') {
          budgetUpdate.income = monthValue;
        } else if (row.type === 'income' && row.category !== 'Income') {
          // Additional income items
          budgetUpdate.additional_items.push({
            name: row.category,
            amount: monthValue,
            type: 'income'
          });
        } else if (row.type === 'expense') {
          // Map to base expense categories or additional items
          const baseExpenseMap = {
            'Housing': 'housing',
            'Transportation': 'transportation', 
            'Food': 'food',
            'Healthcare': 'healthcare',
            'Entertainment': 'entertainment',
            'Shopping': 'shopping',
            'Travel': 'travel',
            'Education': 'education',
            'Utilities': 'utilities',
            'Childcare': 'childcare',
            'Other': 'other'
          };
          
          if (baseExpenseMap[row.category]) {
            budgetUpdate[baseExpenseMap[row.category]] = monthValue;
          } else {
            // Additional expense items
            budgetUpdate.additional_items.push({
              name: row.category,
              amount: monthValue,
              type: 'expense'
            });
          }
        } else if (row.type === 'savings') {
          // Savings items
          budgetUpdate.savings_items.push({
            name: row.category,
            amount: monthValue
          });
        }
      });
      
      console.log(`Saving budget for month ${month}/${year}:`, budgetUpdate);
      
      // Save to database using the month-specific endpoint
      const response = await axios.post('/api/budgets/update-month/', budgetUpdate);
      console.log(`Budget saved for month ${month}/${year}:`, response.data);
      
      // FIXED: Don't update the main editedBudgetData with month-specific data
      // This prevents the current month from being affected by future month changes
      
      // Create a comprehensive budget object from the current grid data for debt calculations
      const updatedBudgetForDebt = createBudgetFromGridData(localGridData);
      
      // Update debt payoff plan with the comprehensive budget data
      if (outstandingDebts && outstandingDebts.length > 0) {
        const filteredDebts = outstandingDebts.filter(
          debt => debt.balance > 0 && debt.debt_type !== 'mortgage'
        );
        if (filteredDebts.length > 0) {
          console.log('Updating debt payoff plan with updated grid data...');
          // Use the current budget data to recalculate the entire plan
          await calculateDebtPayoffPlan(editedBudgetData, filteredDebts, strategy);
        }
      }
      
      // Show success message
      setSuccessMessage(`Budget for ${month}/${year} saved successfully!`);
      setShowSuccessSnackbar(true);
      
    } catch (error) {
      console.error(`Error saving budget for month ${monthIdx}:`, error);
      setErrorMessage(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        error.message || 
        'Failed to save month budget changes'
      );
      setShowErrorSnackbar(true);
    }
  };

  if (loading || debtsLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4
      }}>
        <Card sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 4,
          p: 6,
          textAlign: 'center',
          maxWidth: 400,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <Box sx={{ mb: 3 }}>
            <CircularProgress 
              size={60} 
              thickness={3}
              sx={{ 
                color: '#4fc3f7',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }} 
            />
          </Box>
          <Typography variant="h5" sx={{ 
            color: 'white', 
            fontWeight: 600,
            mb: 2,
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}>
            🧮 Loading Debt Analysis
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.5
          }}>
            {loading && debtsLoading ? 'Loading budget data and debt information...' :
             loading ? 'Loading budget data...' : 
             'Loading debt information...'}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <LinearProgress 
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #4fc3f7, #29b6f6)',
                  borderRadius: 2
                }
              }}
            />
          </Box>
        </Card>
      </Box>
    );
  }

  const totalDebtBalance = outstandingDebts?.reduce((sum, debt) => sum + parseFloat(debt.balance || 0), 0) || 0;
  const totalMinPayments = outstandingDebts?.reduce((sum, debt) => sum + parseFloat(debt.minimum_payment || 0), 0) || 0;
  const totalInterest = outstandingDebts?.reduce((sum, debt) => sum + calculateTotalInterest(debt), 0) || 0;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isDarkMode 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
      p: 0
    }}>
      <Fade in={true}>
        <Box>
          {/* Enhanced Hero Section */}
          <Box sx={{ 
            background: isDarkMode 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            p: 4,
            mb: 3,
            borderBottom: isDarkMode 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(25, 118, 210, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Animated background elements */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            
            <Container maxWidth="xl">
              <Slide direction="down" in={true} timeout={800}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ position: 'relative', mr: 3 }}>
                    <Avatar sx={{ 
                      bgcolor: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(25, 118, 210, 0.1)', 
                      width: 80, 
                      height: 80,
                      backdropFilter: 'blur(10px)',
                      border: isDarkMode 
                        ? '2px solid rgba(255, 255, 255, 0.3)' 
                        : '2px solid rgba(25, 118, 210, 0.2)',
                      boxShadow: isDarkMode 
                        ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                        : '0 8px 32px rgba(25, 118, 210, 0.15)'
                    }}>
                      <TrendingUpIcon sx={{ 
                        fontSize: 36, 
                        color: isDarkMode ? 'white' : '#1976d2' 
                      }} />
                    </Avatar>
                    <Box sx={{
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.5)'
                    }}>
                      <SpeedIcon sx={{ fontSize: 16, color: 'white' }} />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="h2" sx={{ 
                      fontWeight: 'bold', 
                      color: isDarkMode ? 'white' : '#1a237e',
                      textShadow: isDarkMode 
                        ? '2px 2px 4px rgba(0,0,0,0.3)' 
                        : '2px 2px 4px rgba(26, 35, 126, 0.1)',
                      mb: 1,
                      background: isDarkMode 
                        ? 'linear-gradient(45deg, #fff, #f0f0f0)' 
                        : 'linear-gradient(45deg, #1a237e, #3949ab)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: isDarkMode ? 'transparent' : '#1a237e'
                    }}>
                      Smart Debt Planning
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.9)' 
                        : 'rgba(26, 35, 126, 0.8)',
                      fontWeight: 300,
                      maxWidth: '600px',
                      lineHeight: 1.4
                    }}>
                      Take control of your financial future with intelligent debt management, 
                      personalized payoff strategies, and real-time budget projections
                    </Typography>
                  </Box>
                </Box>
              </Slide>
              
              {/* Quick Stats Bar */}
              <Fade in={true} timeout={1200}>
                <Box sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  background: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(25, 118, 210, 0.05)',
                  borderRadius: 3,
                  p: 2,
                  border: isDarkMode 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(25, 118, 210, 0.1)'
                }}>
                  <Chip 
                    icon={<LightbulbIcon />}
                    label="AI-Powered Analysis"
                    sx={{ 
                      background: 'rgba(255, 193, 7, 0.2)',
                      color: isDarkMode ? 'white' : '#e65100',
                      border: '1px solid rgba(255, 193, 7, 0.3)',
                      fontWeight: 500
                    }}
                  />
                  <Chip 
                    icon={<AnalyticsIcon />}
                    label="Real-time Projections"
                    sx={{ 
                      background: 'rgba(33, 150, 243, 0.2)',
                      color: isDarkMode ? 'white' : '#1565c0',
                      border: '1px solid rgba(33, 150, 243, 0.3)',
                      fontWeight: 500
                    }}
                  />
                  <Chip 
                    icon={<SpeedIcon />}
                    label="Optimized Strategies"
                    sx={{ 
                      background: 'rgba(76, 175, 80, 0.2)',
                      color: isDarkMode ? 'white' : '#2e7d32',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      fontWeight: 500
                    }}
                  />
                  {outstandingDebts.length > 0 && (
                    <Chip 
                      icon={<CheckCircleIcon />}
                      label={`${outstandingDebts.length} Active Debts Tracked`}
                      sx={{ 
                        background: 'rgba(156, 39, 176, 0.2)',
                        color: isDarkMode ? 'white' : '#7b1fa2',
                        border: '1px solid rgba(156, 39, 176, 0.3)',
                        fontWeight: 500
                      }}
                    />
                  )}
                </Box>
              </Fade>
            </Container>
          </Box>

          <Container maxWidth="xl" sx={{ pb: 4 }}>
            {/* Enhanced Summary Cards with Glassmorphism and Animations */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <Grid container spacing={3}>
                  {[
                    {
                      title: 'Total Debt Balance',
                      value: totalDebtBalance,
                      icon: AccountBalanceIcon,
                      gradient: ['#ff6b6b', '#ee5a52'],
                      progress: Math.min((totalDebtBalance / 100000) * 100, 100),
                      color: '#ff6b6b',
                      delay: 0
                    },
                    {
                      title: 'Monthly Minimums', 
                      value: totalMinPayments,
                      icon: MoneyIcon,
                      gradient: ['#ffa726', '#ff9800'],
                      progress: Math.min((totalMinPayments / 5000) * 100, 100),
                      color: '#ffa726',
                      delay: 200
                    },
                    {
                      title: 'Total Interest',
                      value: totalInterest,
                      icon: TrendingUpIcon,
                      gradient: ['#42a5f5', '#2196f3'],
                      progress: Math.min((totalInterest / totalDebtBalance) * 100, 100),
                      color: '#42a5f5',
                      delay: 400
                    },
                    {
                      title: 'Active Debts',
                      value: outstandingDebts.length,
                      icon: ScheduleIcon,
                      gradient: ['#66bb6a', '#4caf50'],
                      progress: 75,
                      color: '#66bb6a',
                      delay: 600,
                      isCount: true
                    }
                  ].map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Grow in={true} timeout={800 + card.delay}>
                        <Card sx={{
                          background: isDarkMode 
                            ? debtDarkColors.card
                            : 'rgba(255, 255, 255, 0.9)',
                          border: isDarkMode 
                            ? `1px solid ${debtDarkColors.border}` 
                            : '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: 4,
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: isDarkMode 
                            ? '0 2px 8px rgba(33, 150, 243, 0.2)' 
                            : '0 4px 20px rgba(0, 0, 0, 0.08)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            background: isDarkMode 
                              ? debtDarkColors.card
                              : 'rgba(255, 255, 255, 1)',
                            boxShadow: isDarkMode 
                              ? '0 8px 16px rgba(33, 150, 243, 0.3)' 
                              : '0 20px 40px rgba(0,0,0,0.15)',
                            '& .card-icon': {
                              transform: 'scale(1.05)'
                            }
                          }
                        }}>
                          {/* Animated background glow */}
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`,
                            transition: 'left 0.6s ease-in-out',
                            '.MuiCard-root:hover &': {
                              left: '100%'
                            }
                          }} />
                          
                          <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Box className="card-icon" sx={{
                                background: debtDarkColors.blue,
                                p: 1.5,
                                borderRadius: 3,
                                mr: 2,
                                boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)',
                                transition: 'all 0.3s ease'
                              }}>
                                <card.icon sx={{ color: 'white', fontSize: 24 }} />
                              </Box>
                              <Box>
                                <Typography variant="h4" sx={{ 
                                  fontWeight: 'bold',
                                  color: isDarkMode ? 'white' : '#2c3e50',
                                  textShadow: isDarkMode 
                                    ? '1px 1px 2px rgba(0,0,0,0.5)' 
                                    : '1px 1px 2px rgba(44, 62, 80, 0.1)',
                                  mb: 0.5
                                }}>
                                  {card.isCount ? card.value : formatCurrency(card.value)}
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  color: isDarkMode 
                                    ? 'rgba(255, 255, 255, 0.8)' 
                                    : 'rgba(44, 62, 80, 0.8)',
                                  fontWeight: 500,
                                  fontSize: '0.85rem'
                                }}>
                                  {card.title}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {index === 3 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                                <Box sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%',
                                  backgroundColor: outstandingDebts.length > 0 ? debtDarkColors.red : debtDarkColors.blue,
                                  mr: 1,
                                  animation: outstandingDebts.length > 0 ? 'pulse 2s infinite' : 'none',
                                  '@keyframes pulse': {
                                    '0%': {
                                      transform: 'scale(1)',
                                      opacity: 1,
                                    },
                                    '50%': {
                                      transform: 'scale(1.2)',
                                      opacity: 0.7,
                                    },
                                    '100%': {
                                      transform: 'scale(1)',
                                      opacity: 1,
                                    },
                                  }
                                }} />
                                <Typography variant="caption" sx={{ 
                                  color: isDarkMode 
                                    ? 'rgba(255, 255, 255, 0.7)' 
                                    : 'rgba(44, 62, 80, 0.7)',
                                  fontSize: '0.75rem',
                                  fontWeight: 500
                                }}>
                                  {outstandingDebts.length > 0 ? 'Needs attention' : 'Debt free! 🎉'}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grow>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>

            {/* Enhanced Tabs */}
            <Grid item xs={12}>
              <Card sx={{
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(15px)',
                border: isDarkMode 
                  ? '1px solid rgba(255, 255, 255, 0.2)' 
                  : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 3,
                mb: 3,
                boxShadow: isDarkMode 
                  ? 'none' 
                  : '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <Tabs
                  value={selectedTabIndex}
                  onChange={(e, newValue) => setSelectedTabIndex(newValue)}
                  indicatorColor="primary"
                  textColor="inherit"
                  variant={isMobile ? "scrollable" : "standard"}
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      color: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.7)' 
                        : 'rgba(44, 62, 80, 0.7)',
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      minHeight: 64,
                      '&.Mui-selected': {
                        color: isDarkMode ? 'white' : '#1976d2',
                      }
                    },
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: 2,
                      background: isDarkMode 
                        ? 'linear-gradient(45deg, #667eea, #764ba2)' 
                        : 'linear-gradient(45deg, #1976d2, #42a5f5)'
                    }
                  }}
                >
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimelineIcon sx={{ mr: 1 }} />
                        Budget Projection
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountBalanceIcon sx={{ mr: 1 }} />
                        Debt Overview
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssessmentIcon sx={{ mr: 1 }} />
                        Payoff Strategies
                      </Box>
                    } 
                  />
                </Tabs>
              </Card>
            </Grid>

            {/* Enhanced Tab Content */}
            <Grid item xs={12}>
              {selectedTabIndex === 0 && (
                <Card sx={{
                  background: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(15px)',
                  border: isDarkMode 
                    ? '1px solid rgba(255, 255, 255, 0.2)' 
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: 3,
                  boxShadow: isDarkMode 
                    ? 'none' 
                    : '0 8px 24px rgba(0, 0, 0, 0.12)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          background: 'linear-gradient(45deg, #667eea, #764ba2)',
                          p: 1,
                          borderRadius: 2,
                          mr: 2
                        }}>
                          <TimelineIcon sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 'bold',
                          color: isDarkMode ? 'white' : '#2c3e50',
                          textShadow: isDarkMode 
                            ? '1px 1px 2px rgba(0,0,0,0.5)' 
                            : '1px 1px 2px rgba(44, 62, 80, 0.1)'
                        }}>
                          Monthly Budget Projection
                        </Typography>
                      </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Enhanced Strategy Buttons */}
                      <Box sx={{ 
                        display: 'flex', 
                        border: isDarkMode 
                          ? '1px solid rgba(255, 255, 255, 0.3)' 
                          : '1px solid rgba(0, 0, 0, 0.2)', 
                        borderRadius: 4, 
                        overflow: 'hidden',
                        background: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: isDarkMode 
                          ? '0 4px 20px rgba(0, 0, 0, 0.2)' 
                          : '0 4px 20px rgba(0, 0, 0, 0.1)'
                      }}>
                        <Button
                          variant={strategy === 'snowball' ? 'contained' : 'outlined'}
                          onClick={() => setStrategy('snowball')}
                          size="medium"
                          startIcon={<span>❄️</span>}
                          sx={{ 
                            borderRadius: 0,
                            border: 'none',
                            color: strategy === 'snowball' 
                              ? 'white' 
                              : (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(66, 165, 245, 0.8)'),
                            background: strategy === 'snowball' 
                              ? 'linear-gradient(135deg, #42a5f5, #2196f3)' 
                              : 'transparent',
                            px: 3,
                            py: 1.5,
                            fontWeight: 600,
                            textTransform: 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              background: strategy === 'snowball' 
                                ? 'linear-gradient(135deg, #1e88e5, #1976d2)' 
                                : 'rgba(66, 165, 245, 0.15)',
                              border: 'none',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 6px 20px rgba(66, 165, 245, 0.3)'
                            }
                          }}
                        >
                          Snowball Strategy
                        </Button>
                        <Button
                          variant={strategy === 'avalanche' ? 'contained' : 'outlined'}
                          onClick={() => setStrategy('avalanche')}
                          size="medium"
                          startIcon={<span>🏔️</span>}
                          sx={{ 
                            borderRadius: 0,
                            border: 'none',
                            color: strategy === 'avalanche' 
                              ? 'white' 
                              : (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 107, 107, 0.8)'),
                            background: strategy === 'avalanche' 
                              ? 'linear-gradient(135deg, #ff6b6b, #ee5a52)' 
                              : 'transparent',
                            px: 3,
                            py: 1.5,
                            fontWeight: 600,
                            textTransform: 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              background: strategy === 'avalanche' 
                                ? 'linear-gradient(135deg, #e53e3e, #c53030)' 
                                : 'rgba(255, 107, 107, 0.15)',
                              border: 'none',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 6px 20px rgba(255, 107, 107, 0.3)'
                            }
                          }}
                        >
                          Avalanche Strategy
                        </Button>
                      </Box>
                      
                      {/* Enhanced Save Button */}
                      <Button 
                        variant="contained"
                        onClick={handleSaveChanges}
                        disabled={!hasUnsavedChanges}
                        startIcon={<SaveIcon />}
                        size="medium"
                        sx={{
                          background: hasUnsavedChanges 
                            ? 'linear-gradient(135deg, #ffa726, #ff9800)' 
                            : 'rgba(158, 158, 158, 0.3)',
                          color: hasUnsavedChanges 
                            ? 'white' 
                            : (isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                          borderRadius: 3,
                          textTransform: 'none',
                          boxShadow: hasUnsavedChanges ? '0 4px 20px rgba(255, 167, 38, 0.3)' : 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: hasUnsavedChanges 
                              ? 'linear-gradient(135deg, #ff9800, #f57c00)' 
                              : 'rgba(158, 158, 158, 0.3)',
                            transform: hasUnsavedChanges ? 'translateY(-2px)' : 'none',
                            boxShadow: hasUnsavedChanges ? '0 6px 25px rgba(255, 167, 38, 0.4)' : 'none'
                          },
                          '&:disabled': {
                            background: 'rgba(158, 158, 158, 0.3)',
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                          }
                        }}
                      >
                        {hasUnsavedChanges ? (
                          <>
                            Save Changes
                            <Chip 
                              label="*" 
                              size="small" 
                              sx={{ 
                                ml: 1, 
                                height: 16, 
                                fontSize: '0.7rem',
                                background: 'rgba(255, 255, 255, 0.2)',
                                color: 'white'
                              }} 
                            />
                          </>
                        ) : (
                          'All Saved ✓'
                        )}
                      </Button>
                      
                      {/* Enhanced Input Fields */}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="📅 Historical Months"
                          type="number"
                          value={historicalMonthsShown}
                          onChange={(e) => setHistoricalMonthsShown(parseInt(e.target.value))}
                          size="small"
                          sx={{ 
                            width: 180,
                            '& .MuiOutlinedInput-root': {
                              background: isDarkMode 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(255, 255, 255, 0.9)',
                              backdropFilter: 'blur(10px)',
                              borderRadius: 2,
                              '& fieldset': {
                                borderColor: isDarkMode 
                                  ? 'rgba(255, 255, 255, 0.3)' 
                                  : 'rgba(0, 0, 0, 0.3)'
                              },
                              '&:hover fieldset': {
                                borderColor: isDarkMode 
                                  ? 'rgba(255, 255, 255, 0.5)' 
                                  : 'rgba(0, 0, 0, 0.5)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#66bb6a'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: isDarkMode 
                                ? 'rgba(255, 255, 255, 0.8)' 
                                : 'rgba(0, 0, 0, 0.7)',
                              '&.Mui-focused': {
                                color: '#66bb6a'
                              }
                            },
                            '& .MuiOutlinedInput-input': {
                              color: isDarkMode ? 'white' : '#2c3e50'
                            }
                          }}
                        />
                        <TextField
                          label="🔮 Projection Months"
                          type="number"
                          value={projectionMonths}
                          onChange={(e) => setProjectionMonths(parseInt(e.target.value))}
                          size="small"
                          sx={{ 
                            width: 180,
                            '& .MuiOutlinedInput-root': {
                              background: isDarkMode 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(255, 255, 255, 0.9)',
                              backdropFilter: 'blur(10px)',
                              borderRadius: 2,
                              '& fieldset': {
                                borderColor: isDarkMode 
                                  ? 'rgba(255, 255, 255, 0.3)' 
                                  : 'rgba(0, 0, 0, 0.3)'
                              },
                              '&:hover fieldset': {
                                borderColor: isDarkMode 
                                  ? 'rgba(255, 255, 255, 0.5)' 
                                  : 'rgba(0, 0, 0, 0.5)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#42a5f5'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: isDarkMode 
                                ? 'rgba(255, 255, 255, 0.8)' 
                                : 'rgba(0, 0, 0, 0.7)',
                              '&.Mui-focused': {
                                color: '#42a5f5'
                              }
                            },
                            '& .MuiOutlinedInput-input': {
                              color: isDarkMode ? 'white' : '#2c3e50'
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={3}>
                    {/* Outstanding Debts and Summary */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                        {/* Outstanding Debts Table */}
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            gutterBottom
                            sx={{ 
                              color: isDarkMode ? 'white' : '#2c3e50',
                              fontWeight: 600
                            }}
                          >
                            Outstanding Debts
                          </Typography>
                          {debtsLoading ? (
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              p: 4,
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: 3,
                              backdropFilter: 'blur(10px)'
                            }}>
                              <CircularProgress 
                                size={40} 
                                sx={{ 
                                  color: '#42a5f5',
                                  mr: 2
                                }} 
                              />
                              <Typography variant="body2" sx={{ 
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'
                              }}>
                                Loading debt information...
                              </Typography>
                            </Box>
                          ) : debtsError ? (
                              <Alert 
                              severity="error" 
                              sx={{ 
                                background: 'rgba(244, 67, 54, 0.1)',
                                border: '1px solid rgba(244, 67, 54, 0.3)',
                                color: isDarkMode ? 'white' : '#d32f2f',
                                '& .MuiAlert-icon': { color: '#ef5350' }
                              }}
                            >
                              {debtsError}
                            </Alert>
                          ) : outstandingDebts.length === 0 ? (
                            <Paper sx={{ 
                              p: 4, 
                              textAlign: 'center',
                              background: isDarkMode 
                                ? 'rgba(255, 255, 255, 0.08)' 
                                : 'rgba(255, 255, 255, 0.9)',
                              backdropFilter: 'blur(15px)',
                              border: isDarkMode 
                                ? '1px solid rgba(255, 255, 255, 0.1)' 
                                : '1px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: 3
                            }}>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="h4" sx={{ mb: 2, opacity: 0.7 }}>
                                  🎉
                                </Typography>
                                <Typography variant="h6" sx={{ 
                                  color: isDarkMode ? 'white' : '#2c3e50', 
                                  fontWeight: 600, 
                                  mb: 1 
                                }}>
                                  Congratulations! No Outstanding Debts
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  color: isDarkMode 
                                    ? 'rgba(255, 255, 255, 0.7)' 
                                    : 'rgba(44, 62, 80, 0.7)'
                                }}>
                                  You're debt-free! Add some debts in the Accounts & Debts section 
                                  to see advanced payoff planning features.
                                </Typography>
                              </Box>
                              <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                sx={{
                                  borderColor: isDarkMode 
                                    ? 'rgba(255, 255, 255, 0.3)' 
                                    : 'rgba(25, 118, 210, 0.3)',
                                  color: isDarkMode 
                                    ? 'rgba(255, 255, 255, 0.8)' 
                                    : 'rgba(25, 118, 210, 0.8)',
                                  '&:hover': {
                                    borderColor: isDarkMode 
                                      ? 'rgba(255, 255, 255, 0.5)' 
                                      : 'rgba(25, 118, 210, 0.5)',
                                    background: isDarkMode 
                                      ? 'rgba(255, 255, 255, 0.1)' 
                                      : 'rgba(25, 118, 210, 0.1)'
                                  }
                                }}
                              >
                                Add Your First Debt
                              </Button>
                            </Paper>
                          ) : (
                            <TableContainer 
                              component={Paper} 
                              variant="outlined"
                              sx={{
                                background: isDarkMode 
                                  ? 'rgba(255, 255, 255, 0.08)' 
                                  : 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(15px)',
                                border: isDarkMode 
                                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                                  : '1px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: 3,
                                overflow: 'hidden'
                              }}
                            >
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ 
                                    background: isDarkMode 
                                      ? debtDarkColors.blue
                                      : 'linear-gradient(135deg, rgba(117, 180, 243, 0.1), rgba(25, 118, 210, 0.05))',
                                    '& .MuiTableCell-head': {
                                      color: isDarkMode ? 'white' : '#1976d2',
                                      fontWeight: 600,
                                      fontSize: '0.9rem',
                                      borderBottom: isDarkMode 
                                        ? `2px solid ${debtDarkColors.blue}` 
                                        : '2px solid rgba(25, 118, 210, 0.2)'
                                    }
                                  }}>
                                    <TableCell><strong>Priority</strong></TableCell>
                                    <TableCell><strong>Debt Name</strong></TableCell>
                                    <TableCell align="right"><strong>Balance</strong></TableCell>
                                    <TableCell align="right"><strong>Interest Rate</strong></TableCell>
                                    <TableCell align="right"><strong>Debt Type</strong></TableCell>
                                    <TableCell align="right"><strong>Min Payment</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(() => {
                                    // Sort debts for display based on strategy
                                    const sortedDebts = [...(outstandingDebts || [])].filter(debt => 
                                      debt && debt.balance > 0 && debt.debt_type !== 'mortgage' && debt.name
                                    );
                                    
                                    if (strategy === 'snowball') {
                                      sortedDebts.sort((a, b) => (a.balance || 0) - (b.balance || 0));
                                    } else {
                                      // Avalanche: highest to lowest interest rate
                                      sortedDebts.sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0));
                                    }
                                    
                                    return sortedDebts.map((debt, priorityIndex) => (
                                      <TableRow 
                                        key={`debt-summary-priority-${priorityIndex}-${debt.id || debt.name}`}
                                        sx={{ 
                                          background: isDarkMode ? debtDarkColors.background : 'transparent',
                                          '&:hover': { 
                                            background: isDarkMode 
                                              ? debtDarkColors.card
                                              : 'rgba(25, 118, 210, 0.05)',
                                            transform: 'translateX(4px)',
                                            transition: 'all 0.2s ease'
                                          },
                                          '& .MuiTableCell-root': {
                                            color: isDarkMode 
                                              ? debtDarkColors.text
                                              : 'rgba(44, 62, 80, 0.9)',
                                            borderBottom: isDarkMode 
                                              ? `1px solid ${debtDarkColors.border}` 
                                              : '1px solid rgba(0, 0, 0, 0.1)',
                                            py: 2
                                          }
                                        }}
                                      >
                                        <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ 
                                              width: 32, 
                                              height: 32, 
                                              mr: 1,
                                              background: isDarkMode ? debtDarkColors.blue : 'rgba(0, 0, 0, 0.1)',
                                              color: isDarkMode ? 'white' : '#2c3e50',
                                              fontSize: '0.875rem',
                                              fontWeight: 600
                                            }}>
                                              #{priorityIndex + 1}
                                            </Avatar>
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ 
                                              width: 32, 
                                              height: 32, 
                                              mr: 1.5,
                                              background: debtDarkColors.blue
                                            }}>
                                              <CreditCardIcon sx={{ fontSize: 16 }} />
                                            </Avatar>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                              {debt.name || 'Unknown Debt'}
                                            </Typography>
                                          </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" sx={{ fontWeight: 600, color: debtDarkColors.red }}>
                                            ${(debt.balance || 0).toLocaleString()}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Chip 
                                            label={`${(debt.interest_rate || 0)}%`}
                                            size="small"
                                            sx={{ 
                                              background: debt.interest_rate > 15 
                                                ? 'linear-gradient(45deg, #ff6b6b, #ee5a52)'
                                                : debt.interest_rate > 8 
                                                  ? 'linear-gradient(45deg, #ffa726, #ff9800)'
                                                  : 'linear-gradient(45deg, #66bb6a, #4caf50)',
                                              color: 'white',
                                              fontWeight: 600
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell align="right">
                                          <Chip 
                                            label={debtTypes.find(type => type.value === debt.debt_type)?.label || 'Other'}
                                            size="small"
                                            icon={debtTypes.find(type => type.value === debt.debt_type)?.icon || <ReceiptIcon />}
                                            sx={{ 
                                              background: `${debtTypes.find(type => type.value === debt.debt_type)?.color || '#616161'}20`,
                                              color: debtTypes.find(type => type.value === debt.debt_type)?.color || '#616161',
                                              fontWeight: 500,
                                              border: `1px solid ${debtTypes.find(type => type.value === debt.debt_type)?.color || '#616161'}50`
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#4fc3f7' }}>
                                            ${((debt.balance || 0) * ((debt.interest_rate || 0) / 100 / 12)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    ));
                                  })()}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                        
                        {(() => {
                          const summaryTable = renderPayoffSummaryTable();
                          return summaryTable || <Box></Box>;
                        })()}
                      </Box>
                    </Grid>
                    
                    {(outstandingDebts || []).filter(debt => debt && debt.balance > 0 && debt.debt_type !== 'mortgage').length > 0 && 
                     !planLoading && !planError && payoffPlan && payoffPlan.debts && Array.isArray(payoffPlan.debts) && (
                      <Grid item xs={12}>
                        {(() => {
                          const summary = getPayoffSummary();
                          return (
                            <>
                              {summary.hitMaxMonths && (
                                <Alert 
                                  severity="warning" 
                                  sx={{ mb: 2 }}
                                  action={
                                    <Button 
                                      color="inherit" 
                                      size="small"
                                      onClick={() => {
                                        // Could add logic to increase budget or adjust strategy
                                        setSuccessMessage('Consider increasing your monthly savings to pay off debts faster!');
                                        setShowSuccessSnackbar(true);
                                      }}
                                    >
                                      Get Tips
                                    </Button>
                                  }
                                >
                                  ⚠️ <strong>Extended Payoff Period:</strong> Your debts will take more than {summary.months} months to pay off. 
                                  Consider increasing your monthly savings or adjusting your budget to accelerate debt payoff.
                                </Alert>
                              )}
                        {renderPayoffTable()}
                            </>
                          );
                        })()}
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom sx={{
                        color: isDarkMode ? debtDarkColors.blue : '#2c3e50',
                        fontWeight: 600,
                        fontSize: '1.25rem',
                        mb: 2
                      }}>
                        Editable Budget Projection
                      </Typography>
                      {renderGrid()}
                    </Grid>
                  </Grid>
                  </CardContent>
                </Card>
              )}

              {selectedTabIndex === 1 && (
                <Card sx={{
                  background: isDarkMode 
                    ? debtDarkColors.card
                    : 'rgba(255, 255, 255, 0.9)',
                  border: isDarkMode 
                    ? `1px solid ${debtDarkColors.border}` 
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          background: debtDarkColors.blue,
                          p: 1,
                          borderRadius: 2,
                          mr: 2
                        }}>
                          <AccountBalanceIcon sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 'bold',
                          color: isDarkMode ? 'white' : '#2c3e50',
                          textShadow: isDarkMode 
                            ? '1px 1px 2px rgba(0,0,0,0.5)' 
                            : '1px 1px 2px rgba(44, 62, 80, 0.1)'
                        }}>
                          Outstanding Debts
                        </Typography>
                        {outstandingDebts && outstandingDebts.length > 0 && (
                          <Chip 
                            label={`${outstandingDebts.length} debt${outstandingDebts.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{ 
                              ml: 2,
                              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                              color: isDarkMode ? 'white' : '#2c3e50'
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {debtsLoading && (
                          <CircularProgress 
                            size={20} 
                            sx={{ color: isDarkMode ? 'white' : '#2c3e50' }} 
                          />
                        )}
                        <Button
                          startIcon={<AddIcon />}
                          variant="contained"
                          onClick={() => openDebtDialog()}
                          disabled={debtsLoading}
                          sx={{
                            background: debtDarkColors.blue,
                            color: 'white',
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                            '&:hover': {
                              background: '#42a5f5',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)'
                            },
                            '&:disabled': {
                              background: 'rgba(0, 0, 0, 0.12)',
                              color: 'rgba(0, 0, 0, 0.26)'
                            }
                          }}
                        >
                          Add New Debt
                        </Button>
                      </Box>
                    </Box>
                    
                    {debtsError ? (
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mb: 3,
                          background: 'rgba(244, 67, 54, 0.1)',
                          border: '1px solid rgba(244, 67, 54, 0.3)',
                          color: isDarkMode ? 'white' : '#d32f2f',
                          '& .MuiAlert-icon': { color: '#ef5350' }
                        }}
                        action={
                          <Button 
                            color="inherit" 
                            size="small" 
                            onClick={loadDebtsData}
                          >
                            Retry
                          </Button>
                        }
                      >
                        {debtsError}
                      </Alert>
                    ) : outstandingDebts && outstandingDebts.length === 0 && !debtsLoading ? (
                      <Paper sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        background: isDarkMode 
                          ? debtDarkColors.card
                          : 'rgba(255, 255, 255, 0.9)',
                        border: isDarkMode 
                          ? `1px solid ${debtDarkColors.border}` 
                          : '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: 3,
                        mb: 3
                      }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="h4" sx={{ mb: 2, opacity: 0.7 }}>
                            📊
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            color: isDarkMode ? 'white' : '#2c3e50', 
                            fontWeight: 600, 
                            mb: 1 
                          }}>
                            No Debts Found
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: isDarkMode 
                              ? 'rgba(255, 255, 255, 0.7)' 
                              : 'rgba(44, 62, 80, 0.7)'
                          }}>
                            Start managing your debts by adding your first debt.
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => openDebtDialog()}
                          sx={{
                            borderColor: isDarkMode 
                              ? 'rgba(255, 255, 255, 0.3)' 
                              : 'rgba(25, 118, 210, 0.3)',
                            color: isDarkMode 
                              ? 'rgba(255, 255, 255, 0.8)' 
                              : 'rgba(25, 118, 210, 0.8)',
                            '&:hover': {
                              borderColor: isDarkMode 
                                ? 'rgba(255, 255, 255, 0.5)' 
                                : 'rgba(25, 118, 210, 0.5)',
                              background: isDarkMode 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(25, 118, 210, 0.1)'
                            }
                          }}
                        >
                          Add Your First Debt
                        </Button>
                      </Paper>
                    ) : (
                      <Box sx={{ position: 'relative' }}>
                        {/* Debt Summary Cards */}
                        {outstandingDebts && outstandingDebts.length > 0 && (
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Card sx={{ 
                                background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                                color: 'white',
                                textAlign: 'center',
                                p: 2
                              }}>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  {formatCurrency(outstandingDebts.reduce((sum, debt) => {
                                    const balance = parseFloat(debt.balance) || 0;
                                    return sum + balance;
                                  }, 0))}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                  Total Debt Balance
                                </Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Card sx={{ 
                                background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                                color: 'white',
                                textAlign: 'center',
                                p: 2
                              }}>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  {formatCurrency(outstandingDebts.reduce((sum, debt) => {
                                    const balance = parseFloat(debt.balance) || 0;
                                    const interestRate = parseFloat(debt.interest_rate) || 0;
                                    const monthlyInterest = balance * (interestRate / 100 / 12);
                                    return sum + monthlyInterest;
                                  }, 0))}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                  Monthly Interest
                                </Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Card sx={{ 
                                background: 'linear-gradient(45deg, #2196f3, #1976d2)',
                                color: 'white',
                                textAlign: 'center',
                                p: 2
                              }}>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  {outstandingDebts.length > 0 
                                    ? (outstandingDebts.reduce((sum, debt) => {
                                        const interestRate = parseFloat(debt.interest_rate) || 0;
                                        return sum + interestRate;
                                      }, 0) / outstandingDebts.length).toFixed(1)
                                    : '0.0'
                                  }%
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                  Average Interest Rate
                                </Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Card sx={{ 
                                background: 'linear-gradient(45deg, #4caf50, #388e3c)',
                                color: 'white',
                                textAlign: 'center',
                                p: 2
                              }}>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  {outstandingDebts.length}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                  Active Debts
                                </Typography>
                              </Card>
                            </Grid>
                          </Grid>
                        )}
                        
                        <DataTable
                          data={outstandingDebts}
                          type="debts"
                          columns={debtColumns}
                          rows={outstandingDebts}
                          height={450}
                          loading={debtsLoading}
                        />
                        {debtsLoading && (
                          <Box sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: isDarkMode 
                              ? 'rgba(0, 0, 0, 0.3)' 
                              : 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(2px)',
                            borderRadius: 1
                          }}>
                            <CircularProgress size={40} />
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedTabIndex === 2 && (
                <Card sx={{
                  background: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(15px)',
                  border: isDarkMode 
                    ? '1px solid rgba(255, 255, 255, 0.2)' 
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          background: 'linear-gradient(45deg, #42a5f5, #2196f3)',
                          p: 1,
                          borderRadius: 2,
                          mr: 2
                        }}>
                          <AssessmentIcon sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 'bold',
                          color: isDarkMode ? 'white' : '#2c3e50',
                          textShadow: isDarkMode 
                            ? '1px 1px 2px rgba(0,0,0,0.5)' 
                            : '1px 1px 2px rgba(44, 62, 80, 0.1)'
                        }}>
                          Debt Payoff Strategies
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ 
                          mr: 1,
                          color: isDarkMode 
                            ? 'rgba(255, 255, 255, 0.9)' 
                            : 'rgba(44, 62, 80, 0.9)',
                          fontWeight: 500
                        }}>
                          Strategy:
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          border: isDarkMode 
                            ? '1px solid rgba(255, 255, 255, 0.3)' 
                            : '1px solid rgba(0, 0, 0, 0.3)', 
                          borderRadius: 3, 
                          overflow: 'hidden',
                          background: isDarkMode 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.05)'
                        }}>
                          <Button
                            variant={strategy === 'snowball' ? 'contained' : 'outlined'}
                            onClick={() => setStrategy('snowball')}
                            size="small"
                            startIcon={<span>❄️</span>}
                            sx={{ 
                              borderRadius: 0,
                              border: 'none',
                              color: strategy === 'snowball' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                              bgcolor: strategy === 'snowball' ? 'linear-gradient(45deg, #42a5f5, #2196f3)' : 'transparent',
                              '&:hover': {
                                bgcolor: strategy === 'snowball' ? 'linear-gradient(45deg, #1e88e5, #1976d2)' : 'rgba(255, 255, 255, 0.1)',
                                border: 'none'
                              }
                            }}
                          >
                            Snowball
                          </Button>
                          <Button
                            variant={strategy === 'avalanche' ? 'contained' : 'outlined'}
                            onClick={() => setStrategy('avalanche')}
                            size="small"
                            startIcon={<span>🏔️</span>}
                            sx={{ 
                              borderRadius: 0,
                              border: 'none',
                              color: strategy === 'avalanche' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                              bgcolor: strategy === 'avalanche' ? 'linear-gradient(45deg, #ff6b6b, #ee5a52)' : 'transparent',
                              '&:hover': {
                                bgcolor: strategy === 'avalanche' ? 'linear-gradient(45deg, #e53e3e, #c53030)' : 'rgba(255, 255, 255, 0.1)',
                                border: 'none'
                              }
                            }}
                          >
                            Avalanche
                          </Button>
                        </Box>
                      </Box>
                    </Box>

                    {/* Strategy Explanation */}
                    <Grid container spacing={3}>
                      {/* Enhanced Snowball Strategy Card */}
                      <Grid item xs={12} md={6}>
                        <Paper 
                          elevation={strategy === 'snowball' ? 8 : 2}
                          sx={{ 
                            p: 3, 
                            height: '100%',
                            background: strategy === 'snowball' 
                              ? (isDarkMode 
                                ? 'linear-gradient(135deg, rgba(66, 165, 245, 0.2), rgba(33, 150, 243, 0.1))' 
                                : 'linear-gradient(135deg, rgba(66, 165, 245, 0.1), rgba(33, 150, 243, 0.05))')
                              : (isDarkMode 
                                ? 'rgba(255, 255, 255, 0.08)' 
                                : 'rgba(248, 249, 250, 0.8)'),
                            border: strategy === 'snowball' 
                              ? '2px solid #42a5f5' 
                              : (isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'),
                            borderRadius: 3,
                            backdropFilter: 'blur(10px)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            transform: strategy === 'snowball' ? 'translateY(-4px)' : 'translateY(0)',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(66, 165, 245, 0.2)'
                            }
                          }}
                          onClick={() => setStrategy('snowball')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: strategy === 'snowball' ? '#42a5f5' : 'rgba(66, 165, 245, 0.7)',
                              mr: 2, 
                              width: 40, 
                              height: 40,
                              fontSize: '1.2rem'
                            }}>
                              ❄️
                            </Avatar>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 700,
                              color: isDarkMode ? 'white' : '#2c3e50'
                            }}>
                              Debt Snowball
                            </Typography>
                            {strategy === 'snowball' && (
                              <Chip 
                                label="SELECTED" 
                                size="small" 
                                sx={{ 
                                  ml: 'auto',
                                  background: '#42a5f5',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            )}
                          </Box>
                          
                          <Typography variant="body2" paragraph sx={{ 
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(44, 62, 80, 0.8)',
                            lineHeight: 1.6
                          }}>
                            <strong>Strategy:</strong> Pay off <strong>smallest debt first</strong>, then move to the next smallest.
                          </Typography>
                          
                          <Typography variant="body2" paragraph sx={{ 
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(44, 62, 80, 0.7)',
                            lineHeight: 1.6
                          }}>
                            <strong>📋 Steps:</strong>
                            <br />• List debts from smallest to largest balance
                            <br />• Pay minimum on all, put extra on smallest debt first
                            <br />• Once paid off, roll payment to next smallest debt
                            <br />• Build momentum with quick wins
                          </Typography>
                          
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(66, 165, 245, 0.2)' }}>
                            <Typography variant="body2" sx={{ 
                              color: '#4caf50', 
                              fontWeight: 600 
                            }}>
                              ✅ <strong>Best for:</strong> Motivation & quick psychological wins
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      
                      {/* Enhanced Avalanche Strategy Card */}
                      <Grid item xs={12} md={6}>
                        <Paper 
                          elevation={strategy === 'avalanche' ? 8 : 2}
                          sx={{ 
                            p: 3, 
                            height: '100%',
                            background: strategy === 'avalanche' 
                              ? (isDarkMode 
                                ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(238, 90, 82, 0.1))' 
                                : 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(238, 90, 82, 0.05))')
                              : (isDarkMode 
                                ? 'rgba(255, 255, 255, 0.08)' 
                                : 'rgba(248, 249, 250, 0.8)'),
                            border: strategy === 'avalanche' 
                              ? '2px solid #ff6b6b' 
                              : (isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'),
                            borderRadius: 3,
                            backdropFilter: 'blur(10px)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            transform: strategy === 'avalanche' ? 'translateY(-4px)' : 'translateY(0)',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(255, 107, 107, 0.2)'
                            }
                          }}
                          onClick={() => setStrategy('avalanche')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: strategy === 'avalanche' ? '#ff6b6b' : 'rgba(255, 107, 107, 0.7)',
                              mr: 2, 
                              width: 40, 
                              height: 40,
                              fontSize: '1.2rem'
                            }}>
                              🏔️
                            </Avatar>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 700,
                              color: isDarkMode ? 'white' : '#2c3e50'
                            }}>
                              Debt Avalanche
                            </Typography>
                            {strategy === 'avalanche' && (
                              <Chip 
                                label="SELECTED" 
                                size="small" 
                                sx={{ 
                                  ml: 'auto',
                                  background: '#ff6b6b',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            )}
                          </Box>
                          
                          <Typography variant="body2" paragraph sx={{ 
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(44, 62, 80, 0.8)',
                            lineHeight: 1.6
                          }}>
                            <strong>Strategy:</strong> Pay off the <strong>debt with highest interest rate first</strong>.
                          </Typography>
                          
                          <Typography variant="body2" paragraph sx={{ 
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(44, 62, 80, 0.7)',
                            lineHeight: 1.6
                          }}>
                            <strong>📋 Steps:</strong>
                            <br />• List debts by highest interest rate to lowest interest rate
                            <br />• Pay minimum on all, put extra on highest interest rate debt
                            <br />• Once paid off, target next highest interest rate debt
                            <br />• Minimize total interest paid over time
                          </Typography>
                          
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 107, 107, 0.2)' }}>
                            <Typography variant="body2" sx={{ 
                              color: '#ff9800', 
                              fontWeight: 600 
                            }}>
                              <strong>Best for:</strong> Minimizing total interest paid
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Debt Priority Order Visualization */}
                    {outstandingDebts && outstandingDebts.filter(debt => debt && debt.balance > 0 && debt.debt_type !== 'mortgage').length > 0 && (
                      <Grid item xs={12} sx={{ mt: 3 }}>
                        <Card sx={{
                          background: isDarkMode 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(15px)',
                          border: isDarkMode 
                            ? '1px solid rgba(255, 255, 255, 0.1)' 
                            : '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: 3
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ 
                              color: isDarkMode ? 'white' : '#2c3e50',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              Your {strategy === 'snowball' ? 'Snowball' : 'Avalanche'} Priority Order
                              <Chip 
                                label={strategy === 'snowball' ? 'Smallest → Largest' : 'Highest Rate → Lowest Rate'} 
                                size="small" 
                                sx={{ 
                                  ml: 2,
                                  background: strategy === 'snowball' ? '#42a5f5' : '#ff6b6b',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            </Typography>
                            
                            <Typography variant="body2" sx={{ 
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(44, 62, 80, 0.7)',
                              mb: 3
                            }}>
                              {strategy === 'snowball' 
                                ? 'Debts ordered by balance (smallest to largest) - pay off small debts first!'
                                : 'Debts ordered by interest rate (highest to lowest) - pay off high-interest debts first!'
                              }
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {(() => {
                                // Create a copy and sort debts based on strategy
                                const sortedDebts = [...(outstandingDebts || [])].filter(debt => 
                                  debt && debt.balance > 0 && debt.debt_type !== 'mortgage'
                                );
                                
                                if (strategy === 'snowball') {
                                  sortedDebts.sort((a, b) => (a.balance || 0) - (b.balance || 0));
                                } else {
                                  // Avalanche: highest to lowest interest rate
                                  sortedDebts.sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0));
                                }
                                
                                return sortedDebts.map((debt, index) => (
                                  <Paper
                                    key={`priority-${index}-${debt.id || debt.name}`}
                                    elevation={2}
                                    sx={{
                                      p: 2.5,
                                      background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(248, 249, 250, 0.7)',
                                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                                      borderRadius: 2,
                                      transition: 'all 0.2s ease',
                                      position: 'relative'
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                        <Box sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          width: 40,
                                          height: 40,
                                          borderRadius: '50%',
                                          background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                          color: isDarkMode ? 'white' : '#2c3e50',
                                          fontWeight: 700,
                                          fontSize: '1.1rem',
                                          mr: 2
                                        }}>
                                          {index + 1}
                                        </Box>
                                        
                                        <Box sx={{ flex: 1 }}>
                                          <Typography variant="h6" sx={{ 
                                            color: isDarkMode ? 'white' : '#2c3e50',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}>
                                            💳 {debt.name || 'Unknown Debt'}
                                          </Typography>
                                          <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                                            <Typography variant="body2" sx={{ 
                                              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(44, 62, 80, 0.8)'
                                            }}>
                                              <strong>Balance:</strong> ${(debt.balance || 0).toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" sx={{ 
                                              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(44, 62, 80, 0.8)'
                                            }}>
                                              <strong>Rate:</strong> {(debt.interest_rate || 0)}%
                                            </Typography>
                                            <Typography variant="body2" sx={{ 
                                              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(44, 62, 80, 0.8)'
                                            }}>
                                              <strong>Monthly Interest:</strong> ${((debt.balance || 0) * ((debt.interest_rate || 0) / 100 / 12)).toFixed(2)}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Box>
                                    </Box>
                                  </Paper>
                                ));
                              })()}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* Debt Payoff Plan Results */}
                    {outstandingDebts && outstandingDebts.length > 0 && (
                      <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                          Your {strategy === 'snowball' ? 'Snowball' : 'Avalanche'} Payoff Plan
                        </Typography>
                        
                        {/* Payoff Summary */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                          <Grid item xs={12} md={4}>
                            {renderPayoffSummaryTable()}
                          </Grid>
                          <Grid item xs={12} md={8}>
                            {(() => {
                              const summary = getPayoffSummary();
                              if (!summary) return null;
                              
                              const months = generateMonths();
                              const debtFreeCol = findDebtFreeColIdx(payoffPlan, months);
                              const debtFreeDate = debtFreeCol ? debtFreeCol.debtFreeDate : null;
                              
                              return (
                                <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
                                  {debtFreeDate ? (
                                    <>
                                      <Typography variant="h4" sx={{ color: theme.palette.success.main, fontWeight: 'bold', mb: 1 }}>
                                        🎉
                                      </Typography>
                                      <Typography variant="h6" gutterBottom>
                                        Debt-Free Date
                                      </Typography>
                                      <Typography variant="h4" sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                                        {debtFreeDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                      </Typography>
                                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                        You'll be completely debt-free in {summary.months} months!
                                      </Typography>
                                    </>
                                  ) : (
                                    <>
                                      <Typography variant="h6" gutterBottom>
                                        Debt Payoff in Progress
                                      </Typography>
                                      <Typography variant="body1" color="textSecondary">
                                        Based on your current budget, you're making progress toward becoming debt-free.
                                      </Typography>
                                    </>
                                  )}
                                </Paper>
                              );
                            })()}
                          </Grid>
                        </Grid>

                        {/* Full Payoff Timeline */}
                        {renderPayoffTable()}
                      </Box>
                    )}

                    {(!outstandingDebts || outstandingDebts.length === 0) && (
                      <Paper elevation={1} sx={{ p: 4, textAlign: 'center', mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          No Debts to Plan For
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          You don't have any outstanding debts to create a payoff plan for. 
                          Add some debts in the "Debt Overview" tab to see payoff strategies.
                        </Typography>
                      </Paper>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Container>
        </Box>
      </Fade>

      {/* Enhanced Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success" 
          variant="filled"
          sx={{ 
            width: '100%',
            background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
            color: 'white',
            fontWeight: 600,
            borderRadius: 3,
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowSuccessSnackbar(false)}
            >
              ✕
            </IconButton>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8 }}>✅</span>
            {successMessage}
          </Box>
        </Alert>
      </Snackbar>

      {/* Enhanced Error Snackbar */}
      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={8000}
        onClose={() => setShowErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <Alert 
          onClose={() => setShowErrorSnackbar(false)} 
          severity="error" 
          variant="filled"
          sx={{ 
            width: '100%',
            background: 'linear-gradient(135deg, #f44336, #d32f2f)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(244, 67, 54, 0.3)',
            color: 'white',
            fontWeight: 600,
            borderRadius: 3,
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowErrorSnackbar(false)}
            >
              ✕
            </IconButton>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8 }}>⚠️</span>
            {errorMessage}
          </Box>
        </Alert>
      </Snackbar>

      {/* Add/Edit Debt Dialog */}
      <Dialog 
        open={debtDialogOpen} 
        onClose={() => setDebtDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: isDarkMode 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isDarkMode 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: isDarkMode ? 'white' : '#2c3e50',
          fontWeight: 'bold',
          fontSize: '1.5rem'
        }}>
          {editingDebt ? '✏️ Edit Debt' : '➕ Add New Debt'}
        </DialogTitle>
        <form onSubmit={handleDebtSubmit}>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Debt Name"
                  value={debtForm.name}
                  onChange={(e) => setDebtForm({...debtForm, name: e.target.value})}
                  required
                  placeholder="e.g., Chase Credit Card"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(255, 255, 255, 0.9)',
                      '& fieldset': {
                        borderColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'rgba(0, 0, 0, 0.3)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : 'rgba(0, 0, 0, 0.7)'
                    },
                    '& .MuiOutlinedInput-input': {
                      color: isDarkMode ? 'white' : '#2c3e50'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Debt Type"
                  value={debtForm.debtType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setDebtForm({
                      ...debtForm, 
                      debtType: newType,
                      interestRate: defaultDebtRates[newType].toString()
                    });
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(255, 255, 255, 0.9)',
                      '& fieldset': {
                        borderColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'rgba(0, 0, 0, 0.3)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : 'rgba(0, 0, 0, 0.7)'
                    },
                    '& .MuiOutlinedInput-input': {
                      color: isDarkMode ? 'white' : '#2c3e50'
                    }
                  }}
                >
                  {debtTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Balance"
                  value={debtForm.balance}
                  onChange={(e) => setDebtForm({...debtForm, balance: e.target.value})}
                  required
                  InputProps={{
                    startAdornment: <Typography sx={{ color: isDarkMode ? 'white' : '#2c3e50', mr: 1 }}>$</Typography>
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(255, 255, 255, 0.9)',
                      '& fieldset': {
                        borderColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'rgba(0, 0, 0, 0.3)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : 'rgba(0, 0, 0, 0.7)'
                    },
                    '& .MuiOutlinedInput-input': {
                      color: isDarkMode ? 'white' : '#2c3e50'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Interest Rate (%)"
                  value={debtForm.interestRate}
                  onChange={(e) => setDebtForm({...debtForm, interestRate: e.target.value})}
                  required
                  inputProps={{ step: 0.01 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(255, 255, 255, 0.9)',
                      '& fieldset': {
                        borderColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'rgba(0, 0, 0, 0.3)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : 'rgba(0, 0, 0, 0.7)'
                    },
                    '& .MuiOutlinedInput-input': {
                      color: isDarkMode ? 'white' : '#2c3e50'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Effective Date"
                  value={debtForm.effectiveDate}
                  onChange={(e) => setDebtForm({...debtForm, effectiveDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(255, 255, 255, 0.9)',
                      '& fieldset': {
                        borderColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'rgba(0, 0, 0, 0.3)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : 'rgba(0, 0, 0, 0.7)'
                    },
                    '& .MuiOutlinedInput-input': {
                      color: isDarkMode ? 'white' : '#2c3e50'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={() => setDebtDialogOpen(false)}
              variant="outlined"
              sx={{
                borderColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'rgba(0, 0, 0, 0.3)',
                color: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.8)' 
                  : 'rgba(0, 0, 0, 0.8)',
                '&:hover': {
                  borderColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.5)' 
                    : 'rgba(0, 0, 0, 0.5)',
                  background: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{
                background: editingDebt 
                  ? 'linear-gradient(45deg, #42a5f5, #2196f3)' 
                  : 'linear-gradient(45deg, #4caf50, #66bb6a)',
                color: 'white',
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                '&:hover': {
                  background: editingDebt 
                    ? 'linear-gradient(45deg, #1e88e5, #1976d2)' 
                    : 'linear-gradient(45deg, #388e3c, #4caf50)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {editingDebt ? 'Update Debt' : 'Add Debt'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDebtDialogOpen}
        onClose={cancelDeleteDebt}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: isDarkMode 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isDarkMode 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: isDarkMode ? 'white' : '#2c3e50',
          fontWeight: 'bold'
        }}>
          🗑️ Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#2c3e50' }}>
            Are you sure you want to delete <strong>"{debtToDelete?.name}"</strong>?
            <br /><br />
            This action cannot be undone and will affect your debt planning calculations.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={cancelDeleteDebt}
            variant="outlined"
            sx={{
              borderColor: isDarkMode 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'rgba(0, 0, 0, 0.3)',
              color: isDarkMode 
                ? 'rgba(255, 255, 255, 0.8)' 
                : 'rgba(0, 0, 0, 0.8)'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteDebt}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #f44336, #d32f2f)',
              color: 'white',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(45deg, #d32f2f, #c62828)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Delete Debt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DebtPlanning;
