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
  const [editableMonths, setEditableMonths] = useState([]); // Add this state variable
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
  // Loading states for debt operations
  const [debtSubmitting, setDebtSubmitting] = useState(false);
  const [debtDeleting, setDebtDeleting] = useState(false);
  const [debtForm, setDebtForm] = useState({
    name: '',
    balance: '',
    debtType: 'credit-card',
    interestRate: '24.99',
    effectiveDate: new Date().toISOString().split('T')[0],
    payoffDate: ''
  });

  // Add missing state variables for debt payoff planning
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [payoffPlan, setPayoffPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [debtCalculationInProgress, setDebtCalculationInProgress] = useState(false);
  const [planError, setPlanError] = useState(null);
  
  // Enhanced grid state management
  const [gridUpdating, setGridUpdating] = useState(false); // Loading overlay for grid updates
  const [strategy, setStrategy] = useState('snowball');
  const [isInitializingGrid, setIsInitializingGrid] = useState(false);
  // Track user-edited projected cells: { [monthIdx]: Set(categoryName) }
  const [lockedCells, setLockedCells] = useState({});
  // Track debt calculation completion for loading state management
  const [debtCalculationComplete, setDebtCalculationComplete] = useState(false);

  // Auto-save timeout ref
  const autoSaveTimeoutRef = useRef(null);
  // Grid API reference for forcing refresh
  const gridApiRef = useRef(null);
  // Grid update counter to force re-renders
  const [gridUpdateCounter, setGridUpdateCounter] = useState(0);
  // Ref to track if we're currently updating the grid to prevent infinite loops
  const isUpdatingGridRef = useRef(false);

  // Helper function to safely update grid data
  const safeUpdateGridData = (newData) => {
    if (gridApiRef.current && gridApiRef.current.setRowData) {
      try {
        gridApiRef.current.setRowData([...newData]);
        console.log('🔄 Grid refreshed with updated data');
        return true;
      } catch (error) {
        console.error('❌ Error updating grid data:', error);
        return false;
      }
    } else {
      console.log('⚠️ Grid API not ready, skipping grid update');
      return false;
    }
  };

  // Debt types configuration - Using only blue, green, and red theme
  const debtTypes = [
    { value: 'credit-card', label: 'Credit Card', icon: <CreditCardIcon />, color: debtDarkColors.blue },
    { value: 'personal-loan', label: 'Personal Loan', icon: <PersonalVideoIcon />, color: debtDarkColors.red },
    { value: 'student-loan', label: 'Student Loan', icon: <SchoolIcon />, color: debtDarkColors.blue },
    { value: 'auto-loan', label: 'Auto Loan', icon: <CarIcon />, color: debtDarkColors.blue },
    { value: 'mortgage', label: 'Mortgage', icon: <HomeIcon />, color: debtDarkColors.blue },
    { value: 'other', label: 'Other', icon: <ReceiptIcon />, color: '#4caf50' }
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
      effectiveDate: new Date().toISOString().split('T')[0],
      payoffDate: ''
    });
  };

  const openDebtDialog = (debt = null) => {
    
    if (debt) {
      setEditingDebt(debt);
      
      // Safely extract debt data with fallbacks
      const debtData = {
        name: debt.name || '',
        balance: (debt.balance !== undefined && debt.balance !== null) ? debt.balance.toString() : '',
        debtType: debt.debt_type || 'credit-card',
        interestRate: (debt.interest_rate !== undefined && debt.interest_rate !== null) ? debt.interest_rate.toString() : '24.99',
        effectiveDate: debt.effective_date || new Date().toISOString().split('T')[0],
        payoffDate: debt.payoff_date || ''
      };
      

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

    // Set loading state immediately when user clicks Add/Update button
    setDebtSubmitting(true);

    try {
      // Format data to match backend expectations
      const data = {
        name: debtForm.name.trim(),
        balance: parseFloat(debtForm.balance),
        debt_type: debtForm.debtType,
        interest_rate: parseFloat(debtForm.interestRate),
        effective_date: debtForm.effectiveDate,
        payoff_date: debtForm.payoffDate || null
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
    } finally {
      // Always clear loading state whether success or failure
      setDebtSubmitting(false);
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

    // Set loading state for delete operation
    setDebtDeleting(true);

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
      setDebtDeleting(false);
    }
  };

  const cancelDeleteDebt = () => {
    setDeleteDebtDialogOpen(false);
    setDebtToDelete(null);
  };

  // Generate grid data with editable months only (current + 12 projected)
  const generateGridDataWithEditableMonths = async (currentBudget, editableBudgets) => {
    
    const months = generateMonths();
    const gridData = [];
    
    // Create income categories
    const incomeCategories = [
      { name: 'Income', value: currentBudget?.income || 0, type: 'income' }
    ];
    
    // Add additional income items
    if (currentBudget?.additional_items) {
      currentBudget.additional_items
        .filter(item => item.type === 'income')
        .forEach(item => {
          incomeCategories.push({
            name: item.name,
            value: item.amount,
            type: 'income'
          });
        });
    }
    
    // Create expense categories
    const expenseCategories = [];
    
    // Add base expense categories
    if (currentBudget?.expenses) {
      Object.entries(currentBudget.expenses).forEach(([key, value]) => {
        const categoryName = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        expenseCategories.push({
          name: categoryName,
          value: value,
          type: 'expense'
        });
      });
    }
    
    // Add additional expense items
    if (currentBudget?.additional_items) {
      currentBudget.additional_items
        .filter(item => item.type === 'expense')
        .forEach(item => {
          const lname = (item.name || '').toString().toLowerCase();
          if (lname === 'debt payments' || lname === 'debt_payments' || lname === 'other' || lname === 'others') return;
          expenseCategories.push({
            name: item.name,
            value: item.amount,
            type: 'expense'
          });
        });
    }
    
    // Add savings items
    const savingsCategories = [];
    if (currentBudget?.savings_items) {
      currentBudget.savings_items.forEach(item => {
        savingsCategories.push({
          name: item.name,
          value: item.amount,
          type: 'savings'
        });
      });
    }
    
    // Create grid rows
    const allCategories = [...incomeCategories, ...expenseCategories, ...savingsCategories];
    
    // Add Income row
    const incomeRow = {
      category: 'Income',
      type: 'income',
      month_0: 0, month_1: 0, month_2: 0, month_3: 0, month_4: 0, month_5: 0,
      month_6: 0, month_7: 0, month_8: 0, month_9: 0, month_10: 0, month_11: 0,
      month_12: 0, month_13: 0, month_14: 0, month_15: 0
    };
    
    // Add expense rows
    const expenseRows = expenseCategories.map(cat => ({
      category: cat.name,
      type: 'expense',
      month_0: 0, month_1: 0, month_2: 0, month_3: 0, month_4: 0, month_5: 0,
      month_6: 0, month_7: 0, month_8: 0, month_9: 0, month_10: 0, month_11: 0,
      month_12: 0, month_13: 0, month_14: 0, month_15: 0
    }));
    

    
    // Add savings rows
    const savingsRows = savingsCategories.map(cat => ({
      category: cat.name,
      type: 'savings',
      month_0: 0, month_1: 0, month_2: 0, month_3: 0, month_4: 0, month_5: 0,
      month_6: 0, month_7: 0, month_8: 0, month_9: 0, month_10: 0, month_11: 0,
      month_12: 0, month_13: 0, month_14: 0, month_15: 0
    }));
    
    // Populate data for 3 historical months (copied from current), current, and 12 projected months
    const currentMonthIdx = months.findIndex(m => m.type === 'current');

    // 1) Historical months: copy current month values visually (do not save)
    for (let h = 1; h <= historicalMonthsShown; h++) {
      const histIdx = currentMonthIdx - h;
      if (histIdx < 0) continue;
      // Use currentBudget as the source of truth for historical cells
      const totalIncome = (currentBudget?.income || 0) + (currentBudget?.additional_income || 0);
      incomeRow[`month_${histIdx}`] = totalIncome;
      // Base expenses
      if (currentBudget?.expenses) {
        Object.entries(currentBudget.expenses).forEach(([key, value]) => {
          const categoryName = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          const expenseRow = expenseRows.find(row => row.category === categoryName);
          if (expenseRow) expenseRow[`month_${histIdx}`] = value || 0;
        });
      }
      // Additional expenses
      (currentBudget?.additional_items || [])
        .filter(item => item.type === 'expense')
        .forEach(item => {
          const expenseRow = expenseRows.find(row => row.category === item.name);
          if (expenseRow) expenseRow[`month_${histIdx}`] = item.amount || 0;
        });
      // Savings
      (currentBudget?.savings_items || []).forEach(item => {
        const savingsRow = savingsRows.find(row => row.category === item.name);
        if (savingsRow) savingsRow[`month_${histIdx}`] = item.amount || 0;
      });
    }

    // 2) Current + projected months: load from editableBudgets
    for (let offset = 0; offset <= projectionMonths; offset++) {
      const gridIdx = currentMonthIdx + offset;
      const month = months[gridIdx];
      if (!month) continue;
      const monthNum = month.date.getMonth() + 1;
      const yearNum = month.date.getFullYear();
      
      
      
      // Find budget for this month
      const monthBudget = editableBudgets.find(budget => 
        budget.month === monthNum && budget.year === yearNum
      );
      
      
      
      if (monthBudget) {
        if (monthBudget._usesCurrentMonthData) {
  
        } else {
          
        }
        
        // Set income
        const totalIncome = (monthBudget.income || 0) + (monthBudget.additional_income || 0);
        incomeRow[`month_${gridIdx}`] = totalIncome;
        
        // Set expenses
        if (monthBudget.expenses) {
          Object.entries(monthBudget.expenses).forEach(([key, value]) => {
            const categoryName = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            const expenseRow = expenseRows.find(row => row.category === categoryName);
            if (expenseRow) {
              expenseRow[`month_${gridIdx}`] = value || 0;
            }
          });
        }
        
        // Set additional expenses
        if (monthBudget.additional_items) {
          monthBudget.additional_items
            .filter(item => item.type === 'expense')
            .forEach(item => {
              const lname = (item.name || '').toString().toLowerCase();
              if (lname === 'debt payments' || lname === 'debt_payments' || lname === 'other' || lname === 'others') return;
              const expenseRow = expenseRows.find(row => row.category === item.name);
              if (expenseRow) {
                expenseRow[`month_${gridIdx}`] = item.amount || 0;
              }
            });
        }
        
        // Set savings
        if (monthBudget.savings_items) {
          monthBudget.savings_items.forEach(item => {
            const savingsRow = savingsRows.find(row => row.category === item.name);
            if (savingsRow) {
              savingsRow[`month_${gridIdx}`] = item.amount || 0;
            }
          });
        }
      } else {
    
        // Use 0 for months not saved in MongoDB Atlas
        incomeRow[`month_${gridIdx}`] = 0;
        expenseRows.forEach(row => {
          row[`month_${gridIdx}`] = 0;
        });
        savingsRows.forEach(row => {
          row[`month_${gridIdx}`] = 0;
        });
      }
    }
    
    // Calculate net savings for each month
    const netSavingsRow = {
      category: 'Net Savings',
      type: 'net_savings',
      month_0: 0, month_1: 0, month_2: 0, month_3: 0, month_4: 0, month_5: 0,
      month_6: 0, month_7: 0, month_8: 0, month_9: 0, month_10: 0, month_11: 0,
      month_12: 0, month_13: 0, month_14: 0, month_15: 0
    };
    
    // FIXED: Recompute net savings only for current and projected months (not historical)
    const maxCol = currentMonthIdx + projectionMonths;
    const firstCol = Math.max(0, currentMonthIdx - historicalMonthsShown);
    for (let monthIdx = firstCol; monthIdx <= maxCol; monthIdx++) {
      const month = months[monthIdx];
      
      // Skip historical months - do not calculate Net Savings for them
      if (month && month.type === 'historical') {
        netSavingsRow[`month_${monthIdx}`] = 0;
    
        continue;
      }
      
      const income = incomeRow[`month_${monthIdx}`] || 0;
      const expenses = expenseRows.reduce((sum, row) => sum + (row[`month_${monthIdx}`] || 0), 0);
      const savings = savingsRows.reduce((sum, row) => sum + (row[`month_${monthIdx}`] || 0), 0);
      const netSavings = income - expenses + savings;
      
      netSavingsRow[`month_${monthIdx}`] = netSavings;
      
  
    }
    
    // Add Total Debt row (will be populated by debt payoff calculation)
    const totalDebtRow = {
      category: 'Remaining Debt',
      type: 'total_debt',
      month_0: 0, month_1: 0, month_2: 0, month_3: 0, month_4: 0, month_5: 0,
      month_6: 0, month_7: 0, month_8: 0, month_9: 0, month_10: 0, month_11: 0,
      month_12: 0, month_13: 0, month_14: 0, month_15: 0
    };
    
    // Combine all rows with Net Savings and Total Debt at the top before Income
    const allRows = [netSavingsRow, totalDebtRow, incomeRow, ...expenseRows, ...savingsRows];
    
    console.log('✅ Grid data generated successfully');
    
    setLocalGridData(allRows);
    setIncomeCategories(incomeCategories);
    setExpenseCategories(expenseCategories);
  };

  useEffect(() => {
    loadBudgetData();
    loadDebtsData();
  }, []);

  // Force grid refresh when localGridData changes
  useEffect(() => {
    if (localGridData.length > 0 && !isUpdatingGridRef.current) {
      safeUpdateGridData(localGridData);
    }
  }, [localGridData]);

  const loadBudgetData = async (skipLoadingState = false) => {
    try {
      if (!skipLoadingState) {
        setLoading(true);
      }
      // console.log('🔄 Loading Editable Budget Projection data from MongoDB...');
      
      // Get current month and year
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // 1-based month
      const currentYear = currentDate.getFullYear();
      
      // console.log(`📅 Current month: ${currentMonth}/${currentYear}`);
      
      // FIXED: Use authenticated endpoint to ensure proper user isolation
      const response = await axios.get('/api/mongodb/budgets/');
      // Handle MongoDB response format
      const existingBudgets = response.data?.budgets || response.data || [];
      
      // Find current month budget to use as template
      const currentMonthBudget = existingBudgets.find(budget => 
        budget.month === currentMonth && budget.year === currentYear
      );
      
      if (!currentMonthBudget) {
        // console.log(`⚠️ No current month budget found for ${currentMonth}/${currentYear}`);
        setErrorMessage(`No budget found for current month ${currentMonth}/${currentYear}. Please create a budget in Monthly Budget first.`);
        setShowErrorSnackbar(true);
        setLoading(false);
        return;
      }
      
      // console.log('✅ Found current month budget as template');
      setBudgetData(currentMonthBudget);
      setEditedBudgetData(currentMonthBudget);
      
      // Helper function to check if a budget is effectively empty
      const isBudgetEffectivelyEmpty = (budget) => {
        const totalIncome = (budget.income || 0) + (budget.additional_income || 0);
        const totalExpenses = budget.expenses ? Object.values(budget.expenses).reduce((sum, val) => sum + (val || 0), 0) : 0;
        const totalSavings = budget.savings_items ? budget.savings_items.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
        return totalIncome === 0 && totalExpenses === 0 && totalSavings === 0;
      };
      
      // REQUIREMENT: Generate current + 12 projected months (13 months total) for grid display
      const monthBudgets = [];
      
      // console.log('🔄 Generating Editable Budget Projection months (current + 12 projected)...');
      
      for (let i = 0; i < 13; i++) {
        const projectedDate = new Date(currentYear, currentMonth - 1 + i, 1);
        const monthNum = projectedDate.getMonth() + 1;
        const yearNum = projectedDate.getFullYear();
        
        // Find existing budget for this month
        const existingBudget = existingBudgets.find(budget => 
          budget.month === monthNum && budget.year === yearNum
        );
        
        if (existingBudget && !isBudgetEffectivelyEmpty(existingBudget)) {
          monthBudgets.push({
            ...existingBudget,
            _isEmpty: false,
            _usesCurrentMonthData: false
          });
        } else if (existingBudget && isBudgetEffectivelyEmpty(existingBudget)) {
          monthBudgets.push({
            ...currentMonthBudget,
            month: monthNum,
            year: yearNum,
            _isEmpty: false,
            _usesCurrentMonthData: true
          });
        } else {
          // Use current month's data as fallback for any month that doesn't have specific data
          console.log(`⚠️ No budget found for month ${monthNum}/${yearNum}, using current month data as fallback`);
          
          // Create budget using current month's data as template
          const fallbackBudget = {
            ...currentMonthBudget,
            month: monthNum,
            year: yearNum,
            _isEmpty: false,
            _usesCurrentMonthData: true // Flag to indicate this uses current month as fallback
          };
          
          monthBudgets.push(fallbackBudget);
        }
      }
      
      // console.log(`✅ Generated ${monthBudgets.length} months for Editable Budget Projection`);
      
      // Set the editable months state
      setEditableMonths(monthBudgets);
      
      // Restore locked cells from manually_edited_categories in the database
      const restoredLockedCells = {};
      const months = generateMonths();
      monthBudgets.forEach((budget, budgetIdx) => {
        if (budget.manually_edited_categories && budget.manually_edited_categories.length > 0) {
          // Find the corresponding month index in the grid
          const monthIdx = months.findIndex(m => m.month === budget.month && m.year === budget.year);
          if (monthIdx !== -1 && months[monthIdx].type === 'future') {
            restoredLockedCells[monthIdx] = [...budget.manually_edited_categories];
            console.log(`🔒 Restored locked categories for ${budget.month}/${budget.year} (monthIdx ${monthIdx}):`, budget.manually_edited_categories);
          }
        }
      });
      setLockedCells(restoredLockedCells);
      
      // Generate grid data with editable months only
      console.log('Calling generateGridDataWithEditableMonths with:', {
        currentMonthBudget: currentMonthBudget ? `Income: $${currentMonthBudget.income + currentMonthBudget.additional_income}` : 'null',
        editableMonthsCount: monthBudgets.length,
        editableMonths: monthBudgets.map(m => `${m.month}/${m.year}: $${m.income + m.additional_income}`)
      });
      await generateGridDataWithEditableMonths(currentMonthBudget, monthBudgets);
      
    } catch (error) {
      console.error('❌ Error loading budget data:', error);
      setErrorMessage('Failed to load budget data');
      setShowErrorSnackbar(true);
      
      // Initialize with empty budget data on error
      const emptyBudget = {
        income: 0,
        additional_income: 0,
        expenses: {},
        additional_items: [],
        savings_items: []
      };
      setBudgetData(emptyBudget);
      setEditedBudgetData(emptyBudget);
      await generateGridDataWithEditableMonths(emptyBudget, []); // Pass empty array for budgets
    } finally {
      if (!skipLoadingState) {
        setLoading(false);
      }
    }
  };

  const loadDebtsData = async () => {
    try {
      setDebtsLoading(true);
      setDebtsError(null);
      // console.log('Loading debts data...');
      
      const response = await accountsDebtsService.getDebts();

      
      // Ensure we have valid debt data with proper field mapping
      const debtsData = Array.isArray(response) ? response : [];
      const processedDebts = debtsData.map(debt => ({
        ...debt,
        // Ensure balance is a number
        balance: parseFloat(debt.balance) || 0,
        interest_rate: parseFloat(debt.interest_rate) || 0,

        // Ensure required fields exist with proper field names
        name: debt.name || 'Unnamed Debt',
        debt_type: debt.debt_type || 'other',
        effective_date: debt.effective_date || new Date().toISOString().split('T')[0],
        payoff_date: debt.payoff_date || null,
        // Add missing fields that the frontend expects
        id: debt.id || null,
        user: debt.user || null,
        created_at: debt.created_at || null,
        updated_at: debt.updated_at || null
      }));
      
  
      setOutstandingDebts(processedDebts);
      
      if (processedDebts.length === 0) {
        // console.log('No debts found');
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
    
    // Use the first editable month as the "current" month reference
    // This ensures we use the actual budget data, not today's date
    const currentDate = editableMonths.length > 0 
      ? new Date(editableMonths[0].year, editableMonths[0].month - 1, 1)
      : new Date();
    
    // Historical months
    for (let i = historicalMonthsShown; i > 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        type: 'historical',
        date: date,
        month: date.getMonth() + 1,
        year: date.getFullYear()
      });
    }
    
    // Current month (first editable month)
    months.push({
      label: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      type: 'current',
      date: currentDate,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    });
    
    // Future months (remaining editable months)
    for (let i = 1; i <= projectionMonths; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + i);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        type: 'future',
        date: date,
        month: date.getMonth() + 1,
        year: date.getFullYear()
      });
    }
    
    return months;
  };

  // REMOVED: This function was overwriting the correct grid data
  // The generateGridDataWithEditableMonths function is now the single source of truth

  // REMOVED: This function was overwriting the correct grid data
  // The generateGridDataWithEditableMonths function is now the single source of truth

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
    if (!debt.balance) return 'N/A';
    
    // If payoff date is provided, calculate exact time from today
    if (debt.payoff_date) {
      const today = new Date();
      const payoffDate = new Date(debt.payoff_date);
      
      // Calculate the difference in milliseconds
      const timeDiff = payoffDate.getTime() - today.getTime();
      
      // If the date is in the past, return 0
      if (timeDiff <= 0) return 0;
      
      // Calculate years, months, and days
      const years = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 365.25));
      const remainingMs = timeDiff % (1000 * 60 * 60 * 24 * 365.25);
      const months = Math.floor(remainingMs / (1000 * 60 * 60 * 24 * 30.44));
      const remainingDaysMs = remainingMs % (1000 * 60 * 60 * 24 * 30.44);
      const days = Math.floor(remainingDaysMs / (1000 * 60 * 60 * 24));
      
      return { years, months, days, totalMonths: years * 12 + months };
    }
    
    // Fallback to current calculation if no payoff date
    const balance = parseFloat(debt.balance);
    const rate = parseFloat(debt.interest_rate) / 100 / 12;
    
    // Calculate estimated minimum payment (2% of balance or interest-only payment)
    const estimatedPayment = Math.max(balance * 0.02, balance * rate);
    
    if (rate === 0) {
      const months = Math.ceil(balance / estimatedPayment);
      return { years: Math.floor(months / 12), months: months % 12, days: 0, totalMonths: months };
    }
    
    const totalMonths = Math.ceil(Math.log(1 + (balance * rate) / estimatedPayment) / Math.log(1 + rate));
    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, days: 0, totalMonths };
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
      headerName: '📅 Total Monthly Interest',
      field: 'total_monthly_interest',
      width: 140,
      cellRenderer: ({ data }) => {
        // Calculate total monthly interest across all debts
        const totalMonthlyInterest = outstandingDebts?.reduce((sum, debt) => {
          const monthlyInterest = (debt.balance || 0) * ((debt.interest_rate || 0) / 100 / 12);
          return sum + monthlyInterest;
        }, 0) || 0;
        
        return (
          <Typography variant="body2" sx={{ 
            fontWeight: 600,
            color: debtDarkColors.red
          }}>
            {formatCurrency(totalMonthlyInterest)}
          </Typography>
        );
      }
    },
    {
      headerName: '⏱️ Payoff Time',
      field: 'payoff_time',
      width: 130,
      cellRenderer: ({ data }) => {
        const payoffTime = calculateDebtPayoffTime(data);
        if (payoffTime === 'N/A') return (
          <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
            N/A
          </Typography>
        );
        
        if (payoffTime === 0) return (
          <Typography variant="body2" sx={{ 
            color: '#4caf50', 
            fontWeight: 600,
            fontStyle: 'italic'
          }}>
            Paid Off!
          </Typography>
        );
        
        const { years, months, days, totalMonths } = payoffTime;
        return (
          <Typography variant="body2" sx={{ 
            fontWeight: 600,
                          color: data.payoff_date ? '#4caf50' : (totalMonths > 60 ? '#f44336' : totalMonths > 24 ? '#f44336' : '#4caf50')
          }}>
            {years > 0 
              ? `${years}Y ${months}m` 
              : months > 0 
                ? `${months}M ${days}d`
                : `${days}D`
            }
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
    
    const months = generateMonths();
    
    // Find the net savings row (it should be the one with category 'Net Savings')
    const netRow = gridData.find(row => row.category === 'Net Savings');
    if (!netRow) return gridData;
    
    for (let idx = 0; idx < months.length; idx++) {
      const month = months[idx];
      
      // FIXED: Do not calculate Net Savings for historical months
      if (month && month.type === 'historical') {
        netRow[`month_${idx}`] = 0; // Set historical months to 0 or leave as is
        continue;
      }
      
      let income = 0;
      let expenses = 0;
      let savings = 0;
      
      for (let i = 0; i < gridData.length; i++) {
        const row = gridData[i];
        const monthValue = parseFloat(row[`month_${idx}`]) || 0;
        
        if (row.category === 'Income') {
          // Main income row
          income += monthValue;
        } else if (row.type === 'income' && row.category !== 'Income') {
          // Additional income items
          income += monthValue;
        } else if (row.type === 'expense') {
          // Expense items
          expenses += monthValue;
        } else if (row.type === 'savings') {
          // Savings items (these add to net savings)
          savings += monthValue;
        }
      }
      
      const netSavings = income - expenses + savings;
      netRow[`month_${idx}`] = netSavings;
      
  
    }
    
    return gridData;
  };

  const updateTotalDebtFromPayoffPlan = (gridData, payoffPlan) => {
    if (!gridData || !payoffPlan || !Array.isArray(payoffPlan.plan)) return gridData;
    const totalDebtRow = gridData.find(row => row.category === 'Remaining Debt');
    if (!totalDebtRow) return gridData;

    const months = generateMonths();
    const currentMonthIdx = months.findIndex(m => m.type === 'current');

    // Clear all values first
    months.forEach((_, idx) => {
      totalDebtRow[`month_${idx}`] = 0;
    });

    // FIXED: Current month debt calculation
    // plan[0] = previous month (starting balances)
    // plan[1] = current month (balances AFTER first month payments)
    // plan[2] = next month, etc.
    
    // Fill previous month (plan index 0 - starting balances)
    if (currentMonthIdx > 0 && payoffPlan.plan[0]?.debts) {
      const prevIdx = currentMonthIdx - 1;
      const totalPrev = payoffPlan.plan[0].debts.reduce((sum, d) => sum + (parseFloat(d.balance) || 0), 0);
      totalDebtRow[`month_${prevIdx}`] = totalPrev;
      console.log(`💰 Previous month (${prevIdx}) debt total: $${totalPrev}`);
    }

    // Fill current month (plan index 1 - balances after current month payments)
    if (payoffPlan.plan[1]?.debts) {
      const totalCurrent = payoffPlan.plan[1].debts.reduce((sum, d) => sum + (parseFloat(d.balance) || 0), 0);
      totalDebtRow[`month_${currentMonthIdx}`] = totalCurrent;
      console.log(`💰 Current month (${currentMonthIdx}) debt total: $${totalCurrent}`);
      console.log(`💰 Current month debts detail:`, payoffPlan.plan[1].debts.map(d => `${d.name}: $${d.balance}`));
    } else {
      console.log(`❌ No debt data available for current month (plan[1])`);
      console.log(`❌ Available plan data:`, payoffPlan.plan ? payoffPlan.plan.length : 'No plan');
    }

    // Fill future months using plan indices (next = plan[2], etc.)
    for (let idx = currentMonthIdx + 1; idx < months.length; idx++) {
      const planIdx = (idx - currentMonthIdx) + 1; // next month => 2, month after => 3, ...
      const monthPlan = payoffPlan.plan[planIdx];
      if (monthPlan && Array.isArray(monthPlan.debts)) {
        const total = monthPlan.debts.reduce((sum, d) => sum + (parseFloat(d.balance) || 0), 0);
        totalDebtRow[`month_${idx}`] = total;
        console.log(`💰 Future month (${idx}, plan[${planIdx}]) debt total: $${total}`);
      }
    }

          console.log("📊 DEBT CALCULATION SUMMARY:");
      console.log(`  Previous month: $${totalDebtRow[`month_${currentMonthIdx - 1}`] || 0}`);
      console.log(`  Current month: $${totalDebtRow[`month_${currentMonthIdx}`] || 0}`);
      console.log(`  Next month: $${totalDebtRow[`month_${currentMonthIdx + 1}`] || 0}`);
      console.log(`📊 PLAN DATA AVAILABLE:`, payoffPlan.plan ? payoffPlan.plan.length : 0, 'months');
      console.log(`📊 GRID MONTHS GENERATED:`, months.length, 'months');
      console.log(`📊 CURRENT MONTH INDEX:`, currentMonthIdx);

    // Older historical columns (earlier than current-1) remain 0 and are display-only
    return gridData;
  };

  // Enhanced direct save function for month-specific budget changes
  const saveMonthChangesDirectly = async (month, year, category, value, gridSnapshot = null) => {
    try {
      console.log(`💾 Saving: ${month}/${year}, ${category} = ${value}`);
      
      // Get existing budget to preserve other values
      const isDev = process.env.NODE_ENV === 'development' ||
        (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
      // FIXED: Always use authenticated endpoint for proper user isolation
      const getMonthUrl = `${process.env.REACT_APP_API_URL}/api/mongodb/budgets/get-month/`;
      
      let existingBudget = null;
      try {
        const existingResp = await axios.get(`${getMonthUrl}?month=${month}&year=${year}`);
        existingBudget = existingResp.data || null;

      } catch (getError) {
    
        // Use current month budget as template for new budgets
        existingBudget = budgetData ? {
          income: budgetData.income || 0,
          additional_income: budgetData.additional_income || 0,
          expenses: budgetData.expenses || {},
          additional_items: budgetData.additional_items || [],
          savings_items: budgetData.savings_items || []
        } : null;
      }

      // Build the update payload preserving existing data
      const budgetUpdate = {
        month,
        year,
        income: existingBudget?.income || 0,
        additional_income: existingBudget?.additional_income || 0,
        expenses: {
          housing: existingBudget?.expenses?.housing || 0,
          debt_payments: existingBudget?.expenses?.debt_payments || 0,
          transportation: existingBudget?.expenses?.transportation || 0,
          food: existingBudget?.expenses?.food || 0,
          healthcare: existingBudget?.expenses?.healthcare || 0,
          entertainment: existingBudget?.expenses?.entertainment || 0,
          shopping: existingBudget?.expenses?.shopping || 0,
          travel: existingBudget?.expenses?.travel || 0,
          education: existingBudget?.expenses?.education || 0,
          utilities: existingBudget?.expenses?.utilities || 0,
          childcare: existingBudget?.expenses?.childcare || 0,
          other: existingBudget?.expenses?.other || 0
        },
        additional_items: existingBudget?.additional_items || [],
        savings_items: existingBudget?.savings_items || [],
        manually_edited_categories: existingBudget?.manually_edited_categories || []
      };

      // Update the specific category with the new value
      const expenseMap = {
        'Income': null, // Handle separately
        'Housing': 'housing',
        'Debt payments': 'debt_payments', 
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

      if (category === 'Income') {
        // NEW LOGIC: Add the difference to primary income, keep additional income unchanged
        const totalExisting = budgetUpdate.income + budgetUpdate.additional_income;
        const difference = value - totalExisting;
        
        if (difference !== 0) {
          // Add the difference to primary income, keep additional income as is
          budgetUpdate.income = budgetUpdate.income + difference;
          // Ensure primary income doesn't go negative
          if (budgetUpdate.income < 0) {
            budgetUpdate.income = 0;
          }
        }
        // If difference is 0, no change needed
      } else if (expenseMap[category]) {
        budgetUpdate.expenses[expenseMap[category]] = value;
      } else {
        // Handle additional items (expenses and income not in base categories)
        const existingAdditionalItems = budgetUpdate.additional_items || [];
        const itemIndex = existingAdditionalItems.findIndex(item => item.name === category);
        
        if (itemIndex !== -1) {
          // Update existing additional item
          existingAdditionalItems[itemIndex].amount = value;
        } else {
          // Add new additional item (assume expense if not found)
          existingAdditionalItems.push({
            name: category,
            amount: value,
            type: 'expense'
          });
        }
        budgetUpdate.additional_items = existingAdditionalItems;
      }

      // Mark this category as manually edited (for protection from Monthly Budget overwrites)
      if (!budgetUpdate.manually_edited_categories.includes(category)) {
        budgetUpdate.manually_edited_categories.push(category);
      }

      // Save to MongoDB
      // FIXED: Always use authenticated endpoint for proper user isolation
      const saveUrl = `${process.env.REACT_APP_API_URL}/api/mongodb/budgets/save-month/`;
      
      const resp = await axios.post(saveUrl, budgetUpdate);
      console.log(`✅ Saved: ${month}/${year} ${category} = ${value}`);
      
      // Update editableMonths state to trigger recalculations if this month is in the editable range
      setEditableMonths(prev => {
        return prev.map(budget => {
          if (budget.month === month && budget.year === year) {
            return { ...budget, ...budgetUpdate };
          }
          return budget;
        });
      });
      
      return resp.data;
    } catch (error) {
      console.error(`❌ Direct save failed for ${month}/${year}:`, error);
      throw error;
    }
  };

  // Save changes for a specific month to MongoDB Atlas using month/year endpoints
  const saveMonthChanges = async (monthIdx, monthData, silent = true, gridSnapshot = null) => {
    if (!monthData || monthData.type === 'historical') return;
    try {
      const months = generateMonths();
      const targetMonth = months[monthIdx];
      if (!targetMonth || targetMonth.type === 'historical') return;

      // Use month/year directly from targetMonth or monthData to avoid date calculation issues
      const month = targetMonth.month || (targetMonth.date ? targetMonth.date.getMonth() + 1 : monthData.month);
      const year = targetMonth.year || (targetMonth.date ? targetMonth.date.getFullYear() : monthData.year);
      
      console.log(`💾 Saving month: ${month}/${year}`);

      // Build MongoDB schema payload
      const budgetUpdate = {
        income: 0,
        additional_income: 0,
        expenses: {
          housing: 0,
          debt_payments: 0,
          transportation: 0,
          food: 0,
          healthcare: 0,
          entertainment: 0,
          shopping: 0,
          travel: 0,
          education: 0,
          utilities: 0,
          childcare: 0,
          other: 0
        },
        additional_items: [],
        savings_items: [],
        manually_edited_categories: [], // Track categories manually edited by user
        month,
        year
      };

      // Fetch existing budget for this month to preserve income split
      const isDev = process.env.NODE_ENV === 'development' ||
        (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
      // FIXED: Always use authenticated endpoint for proper user isolation
      const getMonthUrl = `${process.env.REACT_APP_API_URL}/api/mongodb/budgets/get-month/`;
      let existingBudget = null;
      try {
        const existingResp = await axios.get(`${getMonthUrl}?month=${month}&year=${year}`);
        existingBudget = existingResp.data || null;
  
      } catch (getError) {
    
        existingBudget = null;
      }

      // Preserve existing manually edited categories and add new ones from current lockedCells
      if (existingBudget && existingBudget.manually_edited_categories) {
        budgetUpdate.manually_edited_categories = [...existingBudget.manually_edited_categories];
      }
      
      // Add categories that are locked for this month (user-edited projected cells)
      const lockedForThisMonth = lockedCells[monthIdx] || [];
      lockedForThisMonth.forEach(category => {
        if (!budgetUpdate.manually_edited_categories.includes(category)) {
          budgetUpdate.manually_edited_categories.push(category);
        }
      });

      // Map grid rows to payload for the specific column monthIdx
      const baseExpenseMap = {
        'Housing': 'housing',
        'Debt payments': 'debt_payments',
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

      const sourceGrid = Array.isArray(gridSnapshot) && gridSnapshot.length > 0 ? gridSnapshot : localGridData;
      
      
      sourceGrid.forEach(row => {
        const value = parseFloat(row[`month_${monthIdx}`]) || 0;
    
        if (row.category === 'Income') {
          const existingPrimary = parseFloat(existingBudget?.income || 0);
          const existingAdditional = parseFloat(existingBudget?.additional_income || 0);
          const totalExisting = existingPrimary + existingAdditional;
          const difference = value - totalExisting;
          
          if (difference !== 0) {
            // Add the difference to primary income, keep additional income as is
            budgetUpdate.income = existingPrimary + difference;
            budgetUpdate.additional_income = existingAdditional;
            // Ensure primary income doesn't go negative
            if (budgetUpdate.income < 0) {
              budgetUpdate.income = 0;
            }
          } else {
            // No change needed
            budgetUpdate.income = existingPrimary;
            budgetUpdate.additional_income = existingAdditional;
          }
        } else if (row.type === 'income') {
          // Additional income items
          if (row.category !== 'Income') {
            budgetUpdate.additional_items.push({ name: row.category, amount: value, type: 'income' });
          }
        } else if (row.type === 'expense') {
          const key = baseExpenseMap[row.category];
          if (key) {
            budgetUpdate.expenses[key] = value;
          } else {
            budgetUpdate.additional_items.push({ name: row.category, amount: value, type: 'expense' });
          }
        } else if (row.type === 'savings') {
          budgetUpdate.savings_items.push({ name: row.category, amount: value });
        }
      });

      // Persist to MongoDB Atlas
      // FIXED: Always use authenticated endpoint for proper user isolation
      const saveUrl = `${process.env.REACT_APP_API_URL}/api/mongodb/budgets/save-month/`;
      let resp;
      try {
        
        resp = await axios.post(saveUrl, budgetUpdate);
    
        
        // Verify the save worked by checking what's in the database
        const verifyUrl = isDev ? `${process.env.REACT_APP_API_URL}/api/mongodb/budgets/get-month-test/` : `${process.env.REACT_APP_API_URL}/api/mongodb/budgets/get-month/`;
        const verifyResp = await axios.get(`${verifyUrl}?month=${month}&year=${year}`);
    
      } catch (e) {
        const status = e?.response?.status;
        console.error(`❌ Save failed for ${month}/${year} (status: ${status}):`, e.message);
        if (!isDev && (status === 401 || status === 403)) {
      
          // FIXED: Use authenticated endpoint for proper user isolation
        const saveUrl = `${process.env.REACT_APP_API_URL}/api/mongodb/budgets/save-month/`;
          resp = await axios.post(saveUrl, budgetUpdate);
      
        } else {
          throw e;
        }
      }

      // Update editableMonths state so payoff plan recalculates via useEffect
      const savedBudget = resp.data?.budget || resp.data || budgetUpdate;
      setEditableMonths(prev => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const idx = next.findIndex(b => b.month === month && b.year === year);
        if (idx !== -1) next[idx] = { ...next[idx], ...savedBudget };
        else next.push(savedBudget);
        return next;
      });

      if (!silent) {
        setSuccessMessage(`Budget for ${month}/${year} saved successfully!`);
        setShowSuccessSnackbar(true);
      }
    } catch (error) {
      console.error('Error saving month changes:', error);
      setErrorMessage(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to save month budget changes'
      );
      setShowErrorSnackbar(true);
    }
  };

  // Function to calculate debt payoff plan using month-specific budgets
  // Helper function that returns the payoff plan result directly for real-time updates
  const calculateDebtPayoffPlanWithResult = async (monthBudgets, debts, strategyType) => {
    if (!monthBudgets || !Array.isArray(monthBudgets) || monthBudgets.length === 0 || !debts || debts.length === 0) {
      return null;
    }
    
    try {
      // Calculate current month index for grid mapping
      const months = generateMonths();
      const currentMonthIdx = months.findIndex(m => m.type === 'current');
      
      // Use the actual net savings from the grid instead of recalculating
      const monthlyBudgetData = monthBudgets.map((budget, idx) => {
        // Use the actualNetSavings that was calculated in the useEffect
        const actualNetSavings = budget.actualNetSavings || 0;
        
        // Calculate total income for reference
        const totalIncome = (budget.income || 0) + (budget.additional_income || 0);
        
        // Calculate total expenses for reference
        const baseExpenses = Object.values(budget.expenses || {}).reduce((sum, val) => sum + (val || 0), 0);
        const additionalExpenses = (budget.additional_items || [])
          .filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + (item.amount || 0), 0);
        const totalExpenses = baseExpenses + additionalExpenses;
        
        // Use the actual net savings from the grid
        const netSavings = actualNetSavings;
        
        return {
          month: idx + 1, // 1-based for backend
          net_savings: netSavings,
          income: totalIncome,
          expenses: totalExpenses,
          budget_data: budget,
          monthLabel: `${budget.month}/${budget.year}`
        };
      });
      
      // Transform monthly budget data to backend format
      const backendMonthlyData = monthlyBudgetData.map((monthData) => {
        return {
          month: monthData.month,
          net_savings: monthData.net_savings || 0
        };
      });
      
      console.log(`💾 DEBT CALCULATION DEBUG (calculateDebtPayoffPlanWithResult):`);
      console.log(`  - monthBudgets input: ${monthBudgets.length} months`);
      console.log(`  - monthlyBudgetData: ${monthlyBudgetData.length} months`);
      console.log(`  - backendMonthlyData: ${backendMonthlyData.length} months`);
      console.log(`  - Months data:`, backendMonthlyData.map(m => `Month ${m.month}: $${m.net_savings}`));
    
      // Transform debts to match backend format - ensure proper field mapping
      const transformedDebts = debts.map(debt => {
        const originalRate = parseFloat(debt.interest_rate || 0);
        const convertedRate = originalRate / 100; // Convert percentage to decimal
        
        return {
          name: debt.name,
          balance: parseFloat(debt.balance || 0),
          rate: convertedRate, // Convert percentage to decimal
          debt_type: debt.debt_type || 'other'
        };
      });
      
      const res = await accountsDebtsService.calculateDebtPayoffPlan({
        debts: transformedDebts,
        strategy: strategyType || 'snowball',
        monthly_budget_data: backendMonthlyData
      });
      
      // Return the result directly without updating state (for real-time updates)
      return res;
      
    } catch (err) {
      console.error('Debt payoff calculation error (real-time):', err);
      return null;
    }
  };

  const calculateDebtPayoffPlan = async (monthBudgets, debts, strategyType) => {
    if (!monthBudgets || !Array.isArray(monthBudgets) || monthBudgets.length === 0 || !debts || debts.length === 0) {
      // console.log('⚠️ Invalid input for debt payoff calculation');
      return;
    }
    
    // console.log('=== DEBT PAYOFF DEBUG ===');
    // console.log('monthBudgets:', monthBudgets);
    // console.log('debts:', debts);
    // console.log('strategyType:', strategyType);
    
    // Debug: Show detailed budget breakdown for first few months
    // console.log('=== DETAILED BUDGET BREAKDOWN ===');
    // monthBudgets.slice(0, 3).forEach((budget, idx) => {
    //   console.log(`Month ${idx + 1} (${budget.month}/${budget.year}):`);
    //   console.log(`  Income: $${budget.income || 0}`);
    //   console.log(`  Additional Income: $${budget.additional_income || 0}`);
    //   console.log(`  Base Expenses:`, budget.expenses || {});
    //   console.log(`  Additional Items:`, budget.additional_items || []);
    //   console.log(`  Savings Items:`, budget.savings_items || []);
    // });
    // console.log('=== END DETAILED BREAKDOWN ===');
    
    try {
      // console.log('Using month-specific budgets for debt payoff calculation');
      // console.log(`Processing ${monthBudgets.length} months of budget data`);
      
      // Calculate current month index for grid mapping
      const months = generateMonths();
      const currentMonthIdx = months.findIndex(m => m.type === 'current');
      
      // Use the actual net savings from the grid instead of recalculating
      const monthlyBudgetData = monthBudgets.map((budget, idx) => {
        // Use the actualNetSavings that was calculated in the useEffect
        const actualNetSavings = budget.actualNetSavings || 0;
        
        // Calculate total income for reference
        const totalIncome = (budget.income || 0) + (budget.additional_income || 0);
        
        // Calculate total expenses for reference
        const baseExpenses = Object.values(budget.expenses || {}).reduce((sum, val) => sum + (val || 0), 0);
        const additionalExpenses = (budget.additional_items || [])
          .filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + (item.amount || 0), 0);
        const totalExpenses = baseExpenses + additionalExpenses;
        
        // Use the actual net savings from the grid
        const netSavings = actualNetSavings;
        
    
        
        return {
          month: idx + 1, // 1-based for backend
          net_savings: netSavings,
          income: totalIncome,
          expenses: totalExpenses,
          budget_data: budget,
          monthLabel: `${budget.month}/${budget.year}`
        };
      });
      
      // console.log('Monthly budget data calculated from month-specific budgets:', monthlyBudgetData);
      
      // Transform monthly budget data to backend format
      const backendMonthlyData = monthlyBudgetData.map((monthData) => {
        return {
          month: monthData.month,
          net_savings: monthData.net_savings || 0
        };
      });
    
      // Transform debts to match backend format - ensure proper field mapping
      const transformedDebts = debts.map(debt => {
        const originalRate = parseFloat(debt.interest_rate || 0);
        const convertedRate = originalRate / 100; // Convert percentage to decimal
        
    
        
        return {
          name: debt.name,
          balance: parseFloat(debt.balance || 0),
          rate: convertedRate, // Convert percentage to decimal
          debt_type: debt.debt_type || 'other'
        };
      });
      
      let totalDebtBalance = 0;
      transformedDebts.forEach(debt => {
        totalDebtBalance += debt.balance;
      });
      
      
    
      setPlanLoading(true);
      const res = await accountsDebtsService.calculateDebtPayoffPlan({
        debts: transformedDebts,
        strategy: strategyType || 'snowball',
        monthly_budget_data: backendMonthlyData
      });
      
  
      if (res.plan) {
        console.log(`🎯 DEBT PAYOFF PLAN RECEIVED: ${res.plan.length} months`);
        console.log(`🎯 Plan structure:`, res.plan.map((month, idx) => `plan[${idx}]: ${month.debts ? month.debts.length : 0} debts`));
    
        res.plan.forEach((monthPlan, idx) => {
          // Skip the initial month (idx 0) which has $0 payments
          if (idx === 0) {
            console.log(`\n🔍 Previous Month (plan[0]):`);
            if (monthPlan.debts) {
              monthPlan.debts.forEach(debt => {
                console.log(`  - ${debt.name}: Balance $${debt.balance}, Paid $${debt.paid}, Interest $${debt.interest}`);
              });
            }
            return;
          }
          
          if (idx === 1) {
            console.log(`\n🔍 Current Month (plan[1]):`);
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
      
          
          if (monthPlan.debts) {
            let totalPaid = 0;
            monthPlan.debts.forEach(debt => {
              console.log(`  - ${debt.name}: Balance $${debt.balance}, Paid $${debt.paid}, Interest $${debt.interest}`);
              totalPaid += debt.paid;
            });
        
          }
        });
      }
  
      
          // Update Total Debt row with the new payoff plan
      setLocalGridData(prevData => {
        if (prevData) {
          const updatedData = updateTotalDebtFromPayoffPlan(prevData, res);
          // Force grid refresh with updated data
          setTimeout(() => {
            safeUpdateGridData(updatedData);
            console.log("✅ Grid refreshed with updated remaining debt values from payoff plan");
          }, 0);
          
          // Force re-render of payoff timeline table
          setGridUpdateCounter(prev => prev + 1);
          
          return updatedData;
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
    // console.log('=== PAYOFF SUMMARY DEBUG ===');
    // console.log('payoffPlan:', payoffPlan);
    // console.log('totalPrincipal:', totalPrincipal);
    // console.log('totalInterest:', totalInterest);
    // console.log('actualDebtFreeMonth:', actualDebtFreeMonth);
    // console.log('hitMaxMonths:', hitMaxMonths);
    // console.log('remainingDebts:', remainingDebts);
    // console.log('=== END PAYOFF SUMMARY DEBUG ===');
    
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

  // REMOVED: This useEffect was calling the deleted generateGridData function
  // The grid is now initialized by generateGridDataWithEditableMonths in loadBudgetData

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

  // Recalculate debt payoff using editableMonths state directly
  useEffect(() => {
    const run = async () => {
      if (!editableMonths || editableMonths.length === 0 || !outstandingDebts || outstandingDebts.length === 0) return;

      // Use editableMonths directly instead of re-parsing localGridData
      const monthBudgets = editableMonths.map(budget => ({
        ...budget,
        actualNetSavings: (budget.income || 0) + (budget.additional_income || 0) - 
                         Object.values(budget.expenses || {}).reduce((sum, val) => sum + (val || 0), 0) + 
                         (budget.savings_items || []).reduce((sum, item) => sum + (item.amount || 0), 0)
      }));

      await calculateDebtPayoffPlan(monthBudgets, outstandingDebts, strategy);
    };
    run();
  }, [editableMonths, outstandingDebts, strategy]);

  // Additional useEffect to trigger debt calculations when localGridData changes
  useEffect(() => {
    const run = async () => {
      if (!localGridData || localGridData.length === 0 || !outstandingDebts || outstandingDebts.length === 0) return;

      // Parse budget data from localGridData
      const months = generateMonths();
      const currentMonthIdx = months.findIndex(m => m.type === 'current');
      
      if (currentMonthIdx === -1) return;

      // Extract current month data from localGridData
      const incomeRow = localGridData.find(r => r.category === 'Income');
      const transportationRow = localGridData.find(r => r.category === 'Transportation');
      const entertainmentRow = localGridData.find(r => r.category === 'Entertainment');
      
      if (incomeRow || transportationRow || entertainmentRow) {
        // Create updated budget data
        const updatedBudget = { ...editableMonths[currentMonthIdx] };
        
        if (incomeRow) {
          const newIncome = parseFloat(incomeRow[`month_${currentMonthIdx}`]) || 0;
          const existingAdditionalIncome = updatedBudget.additional_income || 0;
          updatedBudget.income = Math.max(0, newIncome - existingAdditionalIncome);
        }
        
        if (transportationRow) {
          const newTransportation = parseFloat(transportationRow[`month_${currentMonthIdx}`]) || 0;
          updatedBudget.expenses = {
            ...updatedBudget.expenses,
            transportation: newTransportation
          };
        }
        
        if (entertainmentRow) {
          const newEntertainment = parseFloat(entertainmentRow[`month_${currentMonthIdx}`]) || 0;
          updatedBudget.expenses = {
            ...updatedBudget.expenses,
            entertainment: newEntertainment
          };
        }

        // Calculate net savings
        const netSavings = (updatedBudget.income || 0) + (updatedBudget.additional_income || 0) - 
                          Object.values(updatedBudget.expenses || {}).reduce((sum, val) => sum + (val || 0), 0) + 
                          (updatedBudget.savings_items || []).reduce((sum, item) => sum + (item.amount || 0), 0);

        // Create month budgets array with updated current month and recalculated net savings for all months
        const monthBudgets = editableMonths.map((budget, idx) => {
          if (idx === currentMonthIdx) {
            // For current month, use the updated budget
            return { ...updatedBudget, actualNetSavings: netSavings };
          } else {
            // For other months, recalculate actualNetSavings to ensure consistency
            const monthNetSavings = (budget.income || 0) + (budget.additional_income || 0) - 
                                   Object.values(budget.expenses || {}).reduce((sum, val) => sum + (val || 0), 0) + 
                                   (budget.savings_items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
            return { ...budget, actualNetSavings: monthNetSavings };
          }
        });

        // Update editableMonths state with the recalculated budgets
        setEditableMonths(monthBudgets);
        
        // Trigger debt calculations
        await calculateDebtPayoffPlan(monthBudgets, outstandingDebts, strategy);
      }
    };
    run();
  }, [localGridData, outstandingDebts, strategy]);

  // NEW: Real-time grid update when payoff plan changes
  useEffect(() => {
    if (payoffPlan && localGridData && localGridData.length > 0) {
      console.log("🔄 Real-time update: Payoff plan changed, updating grid with new remaining debt values");
      
      // Update the grid with new remaining debt values
      setLocalGridData(prevData => {
        if (prevData) {
          const updatedData = updateTotalDebtFromPayoffPlan(prevData, payoffPlan);
          
          // Force immediate grid refresh
          setTimeout(() => {
            safeUpdateGridData(updatedData);
            console.log("✅ Grid refreshed with updated remaining debt values");
          }, 0);
          
          return updatedData;
        }
        return prevData;
      });
      
      // Force re-render of payoff timeline table
      setGridUpdateCounter(prev => prev + 1);
    }
  }, [payoffPlan]);

  // Render the editable AG Grid table
  const renderGrid = () => {
    const months = generateMonths();
    if (!localGridData || localGridData.length === 0) {
      return <div style={{padding: '2rem', color: 'red'}}>No data to display in the table.</div>;
    }
    
    // Debug: Log the grid data being rendered
    // console.log('🔍 renderGrid - localGridData:', localGridData);
    // console.log('🔍 renderGrid - months:', months);
    
    // Debug: Check September data specifically
    // const septemberIdx = months.findIndex(m => m.month === 9 && m.year === 2025);
    // if (septemberIdx !== -1) {
    //   const incomeRow = localGridData.find(row => row.category === 'Income');
    //   if (incomeRow) {
    //     const monthField = 'month_' + septemberIdx;
    //     console.log(`🔍 renderGrid - September (index ${septemberIdx}) income: ${incomeRow[monthField]}`);
    //   }
    // }

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
          if (params.data.category === 'Remaining Debt') return false;
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
          } else if (params.data.category === 'Remaining Debt') {
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
          } else if (params.data.category === 'Remaining Debt') {
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

    // Grid ready handler to capture API reference
    const onGridReady = (params) => {
      gridApiRef.current = params.api;
      console.log('✅ AG Grid API captured');
    };

    // ENHANCED: Comprehensive cell edit handler with loading states and recalculations
    const onCellValueChanged = async (params) => {
      const { data, colDef, newValue } = params;
      const colIdx = parseInt(colDef.field.replace('month_', ''));
      if (data.category === 'Net Savings' || data.category === 'Remaining Debt') return;
      
      const months = generateMonths();
      if (!months[colIdx] || months[colIdx].type === 'historical') return;
      
      // Don't mark as unsaved during grid initialization
      if (isInitializingGrid) {
        return;
      }
      
      // ENHANCED: Start comprehensive loading state for all operations
      setGridUpdating(true);
      setLoading(true);
      
      console.log(`🔄 Cell edited: ${data.category} = ${newValue} in ${months[colIdx].label}`);
      
      try {

      // Record locks when a user edits a projected month cell
      if (months[colIdx].type === 'future') {
        setLockedCells(prev => {
          const next = { ...prev };
          const setForMonth = new Set(next[colIdx] || []);
          setForMonth.add(data.category);
          next[colIdx] = Array.from(setForMonth);
          return next;
        });
      }
      
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
        
        // CRITICAL FIX: Update editableMonths with fresh Net Savings from the grid
        let monthBudgetsForDebtCalc = [...editableMonths]; // Initialize with current state
        const netSavingsRow = recalculated.find(row => row.category === 'Net Savings');
        if (netSavingsRow) {
          const currentMonthIdx = months.findIndex(m => m.type === 'current');
          monthBudgetsForDebtCalc = editableMonths.map((budget, idx) => {
            // Map editableMonths index to grid column index
            // editableMonths[0] = current month = months[currentMonthIdx]
            // editableMonths[1] = next month = months[currentMonthIdx + 1], etc.
            const gridColumnIdx = currentMonthIdx + idx;
            const netSavingsValue = netSavingsRow[`month_${gridColumnIdx}`] || 0;
            return {
              ...budget,
              actualNetSavings: netSavingsValue
            };
          });
          console.log(`💾 UPDATED monthBudgetsForDebtCalc with fresh Net Savings:`, monthBudgetsForDebtCalc.map((m, i) => `monthBudgetsForDebtCalc[${i}] = Month ${m.month}/${m.year}: $${m.actualNetSavings}`));
          
          setEditableMonths(monthBudgetsForDebtCalc); // Update state for future renders
        }
        
        // If current month was edited, propagate to historical and future months (respect locks for projected)
        if (months[colIdx].type === 'current' && data.category !== 'Remaining Debt' && data.category !== 'Net Savings') {
          const currentVal = parseFloat(newValue) || 0;
          console.log(`🔥 CURRENT MONTH EDIT: ${data.category} = ${currentVal} from ${months[colIdx].label}`);
          
          // Historical columns: copy visually only (no save)
          for (let h = 1; h <= historicalMonthsShown; h++) {
            const hIdx = colIdx - h;
            if (hIdx < 0) continue;
            const rowIndex = recalculated.findIndex(r => r.category === data.category);
            if (rowIndex !== -1) {
              recalculated[rowIndex][`month_${hIdx}`] = currentVal;
            }
          }
          
          // IMMEDIATE VISUAL UPDATE: Update ALL future months visually (respecting locks)
          for (let i = colIdx + 1; i < months.length; i++) {
            const futureMonth = months[i];
            if (!futureMonth || futureMonth.type !== 'future') continue;
            
            const lockedForMonth = new Set((lockedCells[i] || []));
            if (lockedForMonth.has(data.category)) {
              console.log(`🔒 Skipping locked month ${i} (${futureMonth.label}) for ${data.category}`);
              continue; // skip user-edited cells
            }
            
            // Update grid cell visually for ALL future months
            const rowIndex = recalculated.findIndex(r => r.category === data.category);
            if (rowIndex !== -1) {
              recalculated[rowIndex][`month_${i}`] = currentVal;
              console.log(`📋 IMMEDIATE UPDATE: projected month ${i} (${futureMonth.label}) ${data.category} = ${currentVal}`);
            }
          }
          
          // FORCE GRID REFRESH: Immediately update the grid with new data
          setTimeout(() => {
            safeUpdateGridData(recalculated);
          });
          
          // IMMEDIATE DEBT RECALCULATION - Trigger for ALL cell edits
          setTimeout(async () => {
            if (outstandingDebts && outstandingDebts.length > 0 && !debtCalculationInProgress) {
              const filteredDebts = outstandingDebts.filter(debt => debt.balance > 0 && debt.debt_type !== "mortgage");
              if (filteredDebts.length > 0) {
                console.log("🔄 IMMEDIATE DEBT RECALCULATION: Triggering debt payoff calculation...");
                
                // Prevent multiple simultaneous calculations
                setDebtCalculationInProgress(true);
                setPlanLoading(true);
                
                // Get the fresh payoff plan result directly from the calculation
                // Use the freshly derived monthBudgetsForDebtCalc to ensure latest Net Savings are used
                const freshPayoffPlan = await calculateDebtPayoffPlanWithResult(monthBudgetsForDebtCalc, filteredDebts, strategy);
                console.log("✅ IMMEDIATE DEBT RECALCULATION: Completed");
                
                // ENHANCED: Immediately update remaining debt columns in the grid with fresh plan
                if (freshPayoffPlan) {
                  // Update the payoffPlan state for timeline table real-time updates
                  setPayoffPlan(freshPayoffPlan);
                  
                  setLocalGridData(prevData => {
                    if (prevData) {
                      const updatedData = updateTotalDebtFromPayoffPlan(prevData, freshPayoffPlan);
                      // Force immediate grid refresh with updated remaining debt values
                      safeUpdateGridData(updatedData);
                      console.log("🔥 IMMEDIATE UPDATE: Remaining debt columns AND timeline table refreshed with real-time data");
                      
                      // Force re-render of debt payoff timeline table
                      setGridUpdateCounter(prev => prev + 1);
                      
                      return updatedData;
                    }
                    return prevData;
                  });
                }
                
                // Brief delay to ensure user sees the updated data, then hide loading
                setTimeout(() => {
                  setPlanLoading(false);
                  setDebtCalculationInProgress(false);
                }, 150); // Reduced from 200ms to 150ms for faster response
              }
            }
          }, 100);
          // Persist propagated values immediately to ALL future months
          (async () => {
            console.log(`🔄 Propagating ${data.category} = ${currentVal} to future months`);
            
            let attempted = 0;
            let successful = 0;
            let failed = 0;
            let skipped = 0;
            
            // STEP 1: Save to ALL visible future months in the grid
            for (let i = colIdx + 1; i < months.length; i++) {
              const futureMonth = months[i];
              if (!futureMonth || futureMonth.type !== 'future') continue;
              
              const lockedForMonth = new Set((lockedCells[i] || []));
              if (lockedForMonth.has(data.category)) {
                console.log(`🔒 Skipping locked month ${i} (${futureMonth.label}) for ${data.category}`);
                skipped++;
                continue;
              }
              
              try {
                attempted++;
                
                // Small delay to avoid overwhelming the API
                if (attempted > 1) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                await saveMonthChangesDirectly(futureMonth.month, futureMonth.year, data.category, currentVal, recalculated);
                successful++;
                console.log(`✅ Saved: ${data.category} = ${currentVal} to ${futureMonth.month}/${futureMonth.year}`);
              } catch (e) {
                failed++;
                console.error(`❌ Save failed for ${futureMonth.month}/${futureMonth.year}:`, e.message);
                
                // Retry once
                try {
                  await new Promise(resolve => setTimeout(resolve, 500));
                  await saveMonthChangesDirectly(futureMonth.month, futureMonth.year, data.category, currentVal, recalculated);
                  successful++;
                  failed--; // Remove from failed count since retry succeeded
                  console.log(`✅ Retry successful for ${futureMonth.month}/${futureMonth.year}`);
                } catch (retryError) {
                  console.error(`❌ Retry failed for ${futureMonth.month}/${futureMonth.year}:`, retryError.message);
                }
              }
            }
            
                        // STEP 2: Save to additional future months in database (beyond grid)
            try {
              const currentMonth = months[colIdx].month;
              const currentYear = months[colIdx].year;
              
              // Generate additional future months (up to 12 months total)
              const additionalFutureMonths = [];
              const currentDate = new Date(currentYear, currentMonth - 1, 1);
              
              for (let monthOffset = 1; monthOffset <= 12; monthOffset++) {
                const futureDate = new Date(currentDate);
                futureDate.setMonth(futureDate.getMonth() + monthOffset);
                const futureMonth = futureDate.getMonth() + 1;
                const futureYear = futureDate.getFullYear();
                
                // Skip months already in the grid
                const alreadyInGrid = months.some(m => 
                  m.month === futureMonth && m.year === futureYear
                );
                
                if (!alreadyInGrid) {
                  additionalFutureMonths.push({
                    month: futureMonth,
                    year: futureYear,
                    label: futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  });
                }
              }
              
              console.log(`🔍 Found ${additionalFutureMonths.length} additional future months to update`);
              
              // Check each additional month in the database and update if exists
              let additionalAttempted = 0;
              let additionalSuccessful = 0;
              let additionalSkipped = 0;
              
              for (const futureMonth of additionalFutureMonths) {
                try {
                  // Check if this month exists in the database
                  const isDev = process.env.NODE_ENV === 'development' ||
                    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
                  // FIXED: Always use authenticated endpoint for proper user isolation
      const getMonthUrl = `${process.env.REACT_APP_API_URL}/api/mongodb/budgets/get-month/`;
                  
              
                  
                  const checkResponse = await axios.get(`${getMonthUrl}?month=${futureMonth.month}&year=${futureMonth.year}`);
                  
                  if (checkResponse.status === 200 && checkResponse.data) {
                    // SIMPLIFIED: Only preserve months that are clearly manually edited with unusual values
                    // The grid-based locked cells mechanism handles most cases for visible months
                    // For database-only months, we'll use a more relaxed approach
                    const existingBudget = checkResponse.data;
                    const existingValue = data.category === 'income' || data.category === 'additional_income' 
                      ? existingBudget[data.category] 
                      : existingBudget.expenses?.[data.category];
                    
                    // Only skip if this looks like a very unusual manual edit (not a typical budget value)
                    // This is a pragmatic approach - we'll err on the side of propagation
                    const isUnusualValue = (existingValue !== undefined && (
                      // Very small values that look like manual tests
                      (existingValue > 0 && existingValue < 10) ||
                      // Very specific values that don't look like typical budget amounts
                      (existingValue % 1 !== 0 && existingValue < 100) // Has decimals and is small
                    ));
                    
                    // Only preserve if it's an unusual value AND it's the immediate next month
                    const isImmediateNextMonth = (
                      (futureMonth.month === currentMonth + 1 && futureMonth.year === currentYear) ||
                      (currentMonth === 12 && futureMonth.month === 1 && futureMonth.year === currentYear + 1)
                    );
                    
                    if (isImmediateNextMonth && isUnusualValue) {
                  
                      additionalSkipped++;
                      continue;
                    }
                    
                    // For all other cases, propagate the current month value
                
                    
                    additionalAttempted++;
                    await saveMonthChangesDirectly(futureMonth.month, futureMonth.year, data.category, currentVal, recalculated);
                    additionalSuccessful++;
                    
                    console.log(`✅ Saved: ${data.category} = ${currentVal} to ${futureMonth.month}/${futureMonth.year}`);
                    
                    // Small delay to avoid overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 50));
                  } else {
                    // ENHANCED: Create month if it doesn't exist instead of skipping
                    console.log(`🆕 Creating month ${futureMonth.month}/${futureMonth.year}`);
                    
                    additionalAttempted++;
                    await saveMonthChangesDirectly(futureMonth.month, futureMonth.year, data.category, currentVal, recalculated);
                    additionalSuccessful++;
                    
                    console.log(`✅ Created: ${data.category} = ${currentVal} for ${futureMonth.month}/${futureMonth.year}`);
                    
                    // Small delay to avoid overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 50));
                  }
                } catch (checkError) {
                  if (checkError.response && checkError.response.status === 404) {
                    // ENHANCED: Create month if 404 (not found) instead of skipping
                
                    
                    try {
                      additionalAttempted++;
                      await saveMonthChangesDirectly(futureMonth.month, futureMonth.year, data.category, currentVal, recalculated);
                      additionalSuccessful++;
                      
                      console.log(`✅ ADDITIONAL CREATE ${additionalSuccessful} SUCCESSFUL: ${data.category} = ${currentVal} to NEW month ${futureMonth.month}/${futureMonth.year}`);
                      
                      // Small delay to avoid overwhelming the API
                      await new Promise(resolve => setTimeout(resolve, 50));
                    } catch (createError) {
                      console.error(`❌ Error creating month ${futureMonth.month}/${futureMonth.year}:`, createError.message);
                      additionalSkipped++;
                    }
                  } else {
                    console.error(`❌ Error checking/updating month ${futureMonth.month}/${futureMonth.year}:`, checkError.message);
                    additionalSkipped++;
                  }
                }
              }
              
              

          
              
              attempted += additionalAttempted;
              successful += additionalSuccessful;
              
            } catch (dbError) {
              console.error(`❌ Error during additional database propagation:`, dbError.message);
            }
            
        
        
                        console.log(`📊 Propagation summary: ${attempted} attempted, ${successful} successful, ${failed} failed, ${skipped} skipped`);
            
            // ENHANCED: Recalculate Net Savings for ALL affected months after propagation
        
            setLocalGridData(prevData => {
              const finalRecalculated = recalculateNetSavings(prevData);
              
              // CRITICAL FIX: Update editableMonths with fresh Net Savings after propagation
              let monthBudgetsForDebtCalcFuture = [...editableMonths]; // Initialize with current state
              const netSavingsRow = finalRecalculated.find(row => row.category === 'Net Savings');
              if (netSavingsRow) {
                const currentMonthIdx = months.findIndex(m => m.type === 'current');
                monthBudgetsForDebtCalcFuture = editableMonths.map((budget, idx) => {
                  const gridColumnIdx = currentMonthIdx + idx;
                  const netSavingsValue = netSavingsRow[`month_${gridColumnIdx}`] || 0;
                  return {
                    ...budget,
                    actualNetSavings: netSavingsValue
                  };
                });
                console.log(`💾 UPDATED monthBudgetsForDebtCalcFuture after propagation:`, monthBudgetsForDebtCalcFuture.map((m, i) => `monthBudgetsForDebtCalcFuture[${i}] = Month ${m.month}/${m.year}: $${m.actualNetSavings}`));
                
                setEditableMonths(monthBudgetsForDebtCalcFuture); // Update state for future renders
              }
          
              return finalRecalculated;
            });
          })();
        }
        return recalculated;
      });
      
      // Auto-save after a short delay to prevent too many API calls
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          // ENHANCED: Save month-specific data based on which month was edited
          if (months[colIdx].type === 'future') {
            // For future months, save that specific month's data and mark as locked
            await saveMonthChanges(colIdx, months[colIdx], true);
            
            // ENHANCED: Immediate debt recalculation for future month edits
            if (outstandingDebts && outstandingDebts.length > 0 && !debtCalculationInProgress) {
              const filteredDebts = outstandingDebts.filter(debt => debt.balance > 0 && debt.debt_type !== "mortgage");
              if (filteredDebts.length > 0) {
                console.log("🔄 FUTURE MONTH DEBT RECALCULATION: Triggering debt payoff calculation...");
                
                // Prevent multiple simultaneous calculations
                setDebtCalculationInProgress(true);
                setPlanLoading(true);
                
                // Get the fresh payoff plan result directly from the calculation
                // Use editableMonths which should have the latest Net Savings from the setEditableMonths update
                const freshPayoffPlan = await calculateDebtPayoffPlanWithResult(editableMonths, filteredDebts, strategy);
                console.log("✅ FUTURE MONTH DEBT RECALCULATION: Completed");
                
                // ENHANCED: Immediately update remaining debt columns in the grid with fresh plan
                if (freshPayoffPlan) {
                  // Update the payoffPlan state for timeline table real-time updates
                  setPayoffPlan(freshPayoffPlan);
                  
                  setLocalGridData(prevData => {
                    if (prevData) {
                      const updatedData = updateTotalDebtFromPayoffPlan(prevData, freshPayoffPlan);
                      // Force immediate grid refresh with updated remaining debt values
                      safeUpdateGridData(updatedData);
                      console.log("🔥 FUTURE MONTH UPDATE: Remaining debt columns AND timeline table refreshed with real-time data");
                      
                      // Force re-render of debt payoff timeline table
                      setGridUpdateCounter(prev => prev + 1);
                      
                      return updatedData;
                    }
                    return prevData;
                  });
                }
                
                // Brief delay to ensure user sees the updated data, then hide loading
                setTimeout(() => {
                  setPlanLoading(false);
                  setDebtCalculationInProgress(false);
                }, 150); // Reduced from 200ms to 150ms for faster response
              }
            }
            
            setGridUpdating(false);
            setLoading(false);
            
          } else if (months[colIdx].type === 'current') {
            // For current month, save current month data and trigger comprehensive propagation
            console.log('📝 Saving current month data to MongoDB...');
            await handleSaveChanges();
            
            // Database saving only - visual updates are handled by onCellValueChanged
            
            // ENHANCED: Wait for debt calculations to complete
            await new Promise((resolve) => {
              const checkDebtCalculations = () => {
                if (outstandingDebts && outstandingDebts.length > 0) {
                  resolve();
                } else {
                  console.log('✅ No debts to calculate, resolving immediately');
                  resolve();
                }
              };
              setTimeout(checkDebtCalculations, 1000);
            });
            
            // ENHANCED: End loading states after all operations complete
            console.log('✅ All operations completed - loading state ending');
            setGridUpdating(false);
            setLoading(false);
            
          } else {
            // Historical months are not editable, so no save needed
            console.log('📋 Historical month edit - no save required');
            setGridUpdating(false);
            setLoading(false);
          }
          
        } catch (saveError) {
          console.error('❌ Error during auto-save:', saveError);
          setErrorMessage('Failed to save budget data. Please try again.');
          setShowErrorSnackbar(true);
          
          // ENHANCED: Reset loading states on save error
          console.log('🏁 LOADING STATE: Ending loading due to save error');
          setGridUpdating(false);
          setLoading(false);
        }
      }, 1500); // Auto-save after 1.5 seconds of inactivity for faster response
      
      } catch (error) {
        console.error('❌ Error during cell value change:', error);
        setErrorMessage('Failed to update budget data. Please try again.');
        setShowErrorSnackbar(true);
        
        // ENHANCED: Reset all loading states on error
        console.log('🏁 LOADING STATE: Ending loading due to cell change error');
        setGridUpdating(false);
        setLoading(false);
      }
    };

    return (
      <Box sx={{ 
        width: '100%', 
        minWidth: 1200, 
        overflow: 'auto',
        position: 'relative', // For loading overlay positioning
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
                : '4px solid #f44336',
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
          {/* Grid Loading Overlay */}
          {gridUpdating && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                borderRadius: 1
              }}
            >
              <Box
                sx={{
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  padding: 3,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              >
                <Loading.InlineLoader message="Updating budget projection..." />
              </Box>
            </Box>
          )}
          
          {localGridData && localGridData.length > 0 ? (
            <AgGridReact
              rowData={localGridData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              onGridReady={onGridReady}
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
                                                                      background: debtDarkColors.red,
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
    
    // console.log('Rendering payoff table:');
    // console.log('Months:', months.map((m, idx) => `${idx}: ${m.type} - ${m.label}`));
    // console.log('Payoff plan:', payoffPlan);
    
    const debtFreeCol = findDebtFreeColIdx(payoffPlan, months);
    const debtFreeColIdx = debtFreeCol ? debtFreeCol.idx : null;
    const debtFreeDate = debtFreeCol ? debtFreeCol.debtFreeDate : null;
    
    // console.log('Debt free column:', debtFreeCol);
    // console.log('Debt free column index:', debtFreeColIdx);
    // console.log('Debt free date:', debtFreeDate);

    // Order debts in the timeline according to selected strategy
    const sortedDebts = Array.isArray(outstandingDebts) ? [...outstandingDebts] : [];
    if (strategy === 'snowball') {
      sortedDebts.sort((a, b) => (parseFloat(a.balance) || 0) - (parseFloat(b.balance) || 0));
    } else {
      // avalanche: highest rate first
      sortedDebts.sort((a, b) => (parseFloat(b.interest_rate) || 0) - (parseFloat(a.interest_rate) || 0));
    }

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
                                return `${month.label}\n`;
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
                                return `${month.label}\n`;
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
                  {sortedDebts?.map((debt, debtIdx) => debt && debt.name && (
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
                                    // FIXED: Current month uses plan[1] (after payments), not calculated offset
                                    const payoffRow = payoffPlan.plan && payoffPlan.plan[1];
                                    console.log(`🔍 TIMELINE CURRENT MONTH DEBUG for ${debt.name}:`, {
                                      hasPayoffPlan: !!payoffPlan.plan,
                                      planLength: payoffPlan.plan ? payoffPlan.plan.length : 0,
                                      hasPlan1: !!payoffRow,
                                      plan1HasDebts: payoffRow ? !!payoffRow.debts : false,
                                      plan1DebtsCount: payoffRow?.debts ? payoffRow.debts.length : 0
                                    });
                                    
                                    if (payoffRow && payoffRow.debts) {
                                      const debtInPlan = payoffRow.debts.find(d => d.name === debt.name);
                                      console.log(`🔍 ${debt.name} in plan[1]:`, debtInPlan ? `$${debtInPlan.balance}` : 'NOT FOUND');
                                      if (debtInPlan) {
                                        const balance = debtInPlan.balance;
                                        const result = balance !== undefined && balance !== null ?
                                          `$${parseFloat(balance).toLocaleString()}` :
                                          `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                        return result;
                                      }
                                    }
                                    // FIXED: When debt not found in payoff plan (paid off), show $0
                                    console.log(`🔍 ${debt.name} TIMELINE CURRENT: No data, showing original balance $${debt.balance || 0}`);
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
                                    // FIXED: Current month uses plan[1] (after payments), not calculated offset
                                    const payoffRow = payoffPlan.plan && payoffPlan.plan[1];
                                    console.log(`🔍 TIMELINE CURRENT MONTH (Light) DEBUG for ${debt.name}:`, {
                                      hasPayoffPlan: !!payoffPlan.plan,
                                      planLength: payoffPlan.plan ? payoffPlan.plan.length : 0,
                                      hasPlan1: !!payoffRow,
                                      plan1HasDebts: payoffRow ? !!payoffRow.debts : false,
                                      plan1DebtsCount: payoffRow?.debts ? payoffRow.debts.length : 0
                                    });
                                    
                                    if (payoffRow && payoffRow.debts) {
                                      const debtInPlan = payoffRow.debts.find(d => d.name === debt.name);
                                      console.log(`🔍 ${debt.name} in plan[1] (Light):`, debtInPlan ? `$${debtInPlan.balance}` : 'NOT FOUND');
                                      if (debtInPlan) {
                                        const balance = debtInPlan.balance;
                                        const result = balance !== undefined && balance !== null ?
                                          `$${parseFloat(balance).toLocaleString()}` :
                                          `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                        return result;
                                      }
                                    }
                                    // FIXED: When debt not found in payoff plan (paid off), show $0
                                    console.log(`🔍 ${debt.name} TIMELINE CURRENT (Light): No data, showing original balance $${debt.balance || 0}`);
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
                                    // FIXED: Correct plan index mapping for future months
                                    // monthIdx > currentMonthIdx means future months
                                    // plan[0] = previous, plan[1] = current, plan[2] = next, plan[3] = month after next, etc.
                                    const planIdx = (monthIdx - currentMonthIdx) + 1;
                                    const payoffRow = payoffPlan.plan && payoffPlan.plan[planIdx];
                                    console.log(`🔍 Timeline Future Month ${monthIdx}: plan[${planIdx}], monthIdx=${monthIdx}, currentMonthIdx=${currentMonthIdx}`);
                                    if (payoffRow && payoffRow.debts) {
                                      const debtInPlan = payoffRow.debts.find(d => d.name === debt.name);
                                      if (debtInPlan) {
                                        const balance = debtInPlan.balance;
                                        const result = balance !== undefined && balance !== null ?
                                          `$${parseFloat(balance).toLocaleString()}` :
                                          `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                        console.log(`🔍 ${debt.name} future month ${monthIdx} (plan[${planIdx}]): $${balance}`);
                                        return result;
                                      }
                                    }
                                    // FIXED: When debt not found in payoff plan (paid off), show $0
                                    console.log(`🔍 ${debt.name} future month ${monthIdx}: No data in plan[${planIdx}], showing $0`);
                                    return '$0';
                                  })()}
                                </DebtProjectedCell>
                              ) : (
                                <TableCell key={`projected-${monthIdx}`} align="center" sx={{ 
                                  backgroundColor: isDarkMode ? debtDarkColors.card : 'info.light',
                                  borderRight: `1px solid ${isDarkMode ? debtDarkColors.border : '#1976d2'}`,
                                  borderBottom: `1px solid ${isDarkMode ? debtDarkColors.border : '#1976d2'}`
                                }}>
                                  {(() => {
                                    // FIXED: Correct plan index mapping for future months
                                    // monthIdx > currentMonthIdx means future months  
                                    // plan[0] = previous, plan[1] = current, plan[2] = next, plan[3] = month after next, etc.
                                    const planIdx = (monthIdx - currentMonthIdx) + 1;
                                    const payoffRow = payoffPlan.plan && payoffPlan.plan[planIdx];
                                    console.log(`🔍 Timeline Future Month ${monthIdx} (Light): plan[${planIdx}], monthIdx=${monthIdx}, currentMonthIdx=${currentMonthIdx}`);
                                    if (payoffRow && payoffRow.debts) {
                                      const debtInPlan = payoffRow.debts.find(d => d.name === debt.name);
                                      if (debtInPlan) {
                                        const balance = debtInPlan.balance;
                                        const result = balance !== undefined && balance !== null ?
                                          `$${parseFloat(balance).toLocaleString()}` :
                                          `$${parseFloat(debt.balance || 0).toLocaleString()}`;
                                        console.log(`🔍 ${debt.name} future month ${monthIdx} (Light, plan[${planIdx}]): $${balance}`);
                                        return result;
                                      }
                                    }
                                    // FIXED: When debt not found in payoff plan (paid off), show $0
                                    console.log(`🔍 ${debt.name} future month ${monthIdx} (Light): No data in plan[${planIdx}], showing $0`);
                                    return '$0';
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
    // console.log('Clearing unsaved changes flag');
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
        additional_income: 0,
        expenses: {
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
          debt_payments: 0,
          other: 0
        },
        additional_items: [],
        savings_items: [],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      };
      
      // Process each row in the grid data - ONLY for current month
      localGridData.forEach(row => {
        const currentValue = parseFloat(row[`month_${currentMonthIdx}`]) || 0;
        
        if (row.category === 'Income') {
          // Preserve the existing income split if available
          const existingBudget = editedBudgetData || {};
          const existingAdditionalIncome = existingBudget.additional_income || 0;
          const existingPrimaryIncome = existingBudget.income || 0;
          
          // NEW LOGIC: Add the difference to primary income, keep additional income unchanged
          const totalExisting = existingPrimaryIncome + existingAdditionalIncome;
          const difference = currentValue - totalExisting;
          
          if (difference !== 0) {
            // Add the difference to primary income, keep additional income as is
            budgetUpdate.income = existingPrimaryIncome + difference;
            budgetUpdate.additional_income = existingAdditionalIncome;
            // Ensure primary income doesn't go negative
            if (budgetUpdate.income < 0) {
              budgetUpdate.income = 0;
            }
          } else {
            // No change needed
            budgetUpdate.income = existingPrimaryIncome;
            budgetUpdate.additional_income = existingAdditionalIncome;
          }
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
            'Other': 'other',
            'Others': 'other'
          };
          
          if (baseExpenseMap[row.category]) {
            budgetUpdate.expenses[baseExpenseMap[row.category]] = currentValue;
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
      
      // console.log('Saving current month budget update:', budgetUpdate);
      
      // Make API call to save budget - ONLY current month
      let response;
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const isDev = process.env.NODE_ENV === 'development';
        // FIXED: Always use authenticated endpoint for proper user isolation
      const saveMonthUrl = '/api/mongodb/budgets/save-month/';

        if (editedBudgetData && editedBudgetData.month === currentMonth && editedBudgetData.year === currentYear && editedBudgetData.id) {
          response = await axios.put(`/api/mongodb/budgets/${editedBudgetData.id}/update/`, budgetUpdate);
        } else {
          response = await axios.post(saveMonthUrl, budgetUpdate);
        }
              } catch (updateError) {
          // console.log('Budget save failed, trying fallback:', updateError);
          
          // Fallback to standard PUT/POST
          if (editedBudgetData && editedBudgetData.id) {
            // Update existing budget
            // console.log('Updating existing budget with ID:', editedBudgetData.id);
            response = await axios.put(`/api/mongodb/budgets/${editedBudgetData.id}/update/`, budgetUpdate);
            // console.log('Budget updated via PUT endpoint');
          } else {
            // Create new budget
            // console.log('Creating new budget');
            response = await axios.post('/api/mongodb/budgets/create/', budgetUpdate);
            // console.log('Budget created via POST endpoint');
          }
        }
        
        // console.log('Budget save response:', response.data);
      
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
          // console.log('Updating debt payoff plan with new budget data...');
          // The new useEffect will automatically recalculate debt payoff when localGridData changes
          // No need to call calculateDebtPayoffPlan here
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

  // PERFORMANCE OPTIMIZATION: Use current budget data for all months instead of individual API calls
  const loadAllMonthlyBudgetData = async () => {
    const months = generateMonths();
    const monthlyBudgetData = [];
    
    // Calculate net savings from current budget data
    let income = editedBudgetData?.income || 0;
    let expenses = 0;
    
    // Add base expenses from nested expenses object
    if (editedBudgetData?.expenses) {
      expenses += editedBudgetData.expenses.housing || 0;
      expenses += editedBudgetData.expenses.transportation || 0;
      expenses += editedBudgetData.expenses.food || 0;
      expenses += editedBudgetData.expenses.healthcare || 0;
      expenses += editedBudgetData.expenses.entertainment || 0;
      expenses += editedBudgetData.expenses.shopping || 0;
      expenses += editedBudgetData.expenses.travel || 0;
      expenses += editedBudgetData.expenses.education || 0;
      expenses += editedBudgetData.expenses.utilities || 0;
      expenses += editedBudgetData.expenses.childcare || 0;
      expenses += editedBudgetData.expenses.debt_payments || 0;
      expenses += editedBudgetData.expenses.others || 0;
    }
    
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
    
    // Use the same budget data for all months (performance optimization)
    for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
      monthlyBudgetData.push({
        month: monthIdx,
        net_savings: netSavings,
        income: income,
        expenses: expenses,
        budget_data: editedBudgetData
      });
    }
    
    // console.log(`PERFORMANCE OPTIMIZATION: Using current budget data for all ${months.length} months`);
    // console.log(`Net Savings: $${netSavings}, Income: $${income}, Expenses: $${expenses}`);
    
    return monthlyBudgetData;
  };

  // Helper function to create budget object from grid data for debt calculations
  const createBudgetFromGridData = (gridData) => {
    if (!gridData || gridData.length === 0) {
      return editedBudgetData || {};
    }
    
    const budget = {
      income: 0,
      additional_income: 0,
      expenses: {
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
        debt_payments: 0,
        others: 0
      },
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
        // For the debt planning grid, we show total income
        // We'll preserve the existing split if available, otherwise put all in primary income
        const existingBudget = editedBudgetData || {};
        const existingAdditionalIncome = existingBudget.additional_income || 0;
        const existingPrimaryIncome = existingBudget.income || 0;
        
        if (existingPrimaryIncome > 0 || existingAdditionalIncome > 0) {
          // Preserve the existing ratio
          const totalExisting = existingPrimaryIncome + existingAdditionalIncome;
          if (totalExisting > 0) {
            const ratio = currentValue / totalExisting;
            budget.income = existingPrimaryIncome * ratio;
            budget.additional_income = existingAdditionalIncome * ratio;
          } else {
            budget.income = currentValue;
            budget.additional_income = 0;
          }
        } else {
          // No existing data, put all in primary income
          budget.income = currentValue;
          budget.additional_income = 0;
        }
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
          'Other': 'others'
        };
        
        if (baseExpenseMap[row.category]) {
          budget.expenses[baseExpenseMap[row.category]] = currentValue;
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

  // NEW: Function to build month-specific budgets from grid data for debt payoff calculations
  const buildMonthSpecificBudgetsFromGrid = () => {
    if (!localGridData || localGridData.length === 0) {
      return [];
    }
    
    const months = generateMonths();
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    
    if (currentMonthIdx === -1) {
      return [];
    }
    
    const monthlyBudgets = [];
    
    // Only process current and future months (skip historical)
    for (let monthIdx = currentMonthIdx; monthIdx < months.length; monthIdx++) {
      const month = months[monthIdx];
      const budget = {
        income: 0,
        additional_income: 0,
        expenses: {
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
          debt_payments: 0,
          others: 0
        },
        additional_items: [],
        savings_items: [],
        month: month.date.getMonth() + 1,
        year: month.date.getFullYear()
      };
      
      // Process each row in the grid data for this specific month
      localGridData.forEach(row => {
        const monthValue = parseFloat(row[`month_${monthIdx}`]) || 0;
        
        if (row.category === 'Income') {
          // For the debt planning grid, we show total income
          // Since the grid shows total income, we should use the grid value directly
          budget.income = monthValue;
          budget.additional_income = 0;
        } else if (row.type === 'income' && row.category !== 'Income') {
          // Additional income items
          budget.additional_items.push({
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
            'Other': 'others'
          };
          
          if (baseExpenseMap[row.category]) {
            budget.expenses[baseExpenseMap[row.category]] = monthValue;
          } else {
            // Additional expense items
            budget.additional_items.push({
              name: row.category,
              amount: monthValue,
              type: 'expense'
            });
          }
        } else if (row.type === 'savings') {
          // Savings items
          budget.savings_items.push({
            name: row.category,
            amount: monthValue
          });
        }
      });
      
      monthlyBudgets.push({
        monthIndex: monthIdx - currentMonthIdx, // 0-based for debt payoff
        monthLabel: month.label,
        budget: budget
      });
    }
    
    // console.log('📊 Built month-specific budgets from grid:', monthlyBudgets.map(m => ({
    //   month: m.monthLabel,
    //   income: m.budget.income + m.budget.additional_income,
    //   expenses: Object.values(m.budget.expenses).reduce((sum, val) => sum + val, 0)
    // })));
    
    return monthlyBudgets;
  };

  // New function to save changes for a specific month - ENHANCED: Uses new save-month endpoint
  const saveMonthChanges_DUPLICATE = async (monthIdx, monthData) => {
    // console.log('🔄 Saving Editable Budget Projection changes for month:', { monthIdx, monthData });
    
    if (!monthData || monthData.type === 'historical') {
      // console.log('❌ Not saving - historical month or invalid data');
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
        additional_income: 0,
        expenses: {
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
          debt_payments: 0,
          others: 0
        },
        additional_items: [],
        savings_items: [],
        month: month,
        year: year
      };
      
      // Note: We no longer initialize projected months to empty
      // The grid data already contains the correct values (either from MongoDB or fallback data)
      // We'll build the budgetUpdate directly from the grid data
      
      // Process each row in the grid data for this specific month only
      localGridData.forEach(row => {
        const monthValue = parseFloat(row[`month_${monthIdx}`]) || 0;
        
        if (row.category === 'Income') {
          // Use the grid value directly for both current and projected months
          budgetUpdate.income = monthValue;
          budgetUpdate.additional_income = 0;
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
            'Other': 'others'
          };
          
          if (baseExpenseMap[row.category]) {
            budgetUpdate.expenses[baseExpenseMap[row.category]] = monthValue;
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
      
  
      
      // Use the test endpoint for development, regular endpoint for production
      const endpoint = process.env.NODE_ENV === 'development' 
        ? '/api/mongodb/budgets/save-month-test/'
        : '/api/mongodb/budgets/save-month/';
      
      const response = await axios.post(endpoint, budgetUpdate);
  
      
      // Update debt payoff plan with the new data
      if (outstandingDebts && outstandingDebts.length > 0) {
        const filteredDebts = outstandingDebts.filter(
          debt => debt.balance > 0 && debt.debt_type !== 'mortgage'
        );
        if (filteredDebts.length > 0) {
          // console.log('Updating debt payoff plan with updated grid data...');
          // The new useEffect will automatically recalculate debt payoff when localGridData changes
          // No need to call calculateDebtPayoffPlan here
        }
      }
      
      // Show success message
      setSuccessMessage(`Editable Budget Projection for ${month}/${year} saved successfully!`);
      setShowSuccessSnackbar(true);
      
    } catch (error) {
      // console.error(`❌ Error saving Editable Budget Projection for month ${monthIdx}:`, error);
      setErrorMessage(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        error.message || 
        'Failed to save Editable Budget Projection changes'
      );
      setShowErrorSnackbar(true);
    }
  };

  // Main component render logic
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
  const totalMinPayments = outstandingDebts?.reduce((sum, debt) => {
    const balance = parseFloat(debt.balance || 0);
    const rate = parseFloat(debt.interest_rate || 0) / 100 / 12;
    const estimatedPayment = Math.max(balance * 0.02, balance * rate);
    return sum + estimatedPayment;
  }, 0) || 0;
  const totalMonthlyInterest = outstandingDebts?.reduce((sum, debt) => {
    const monthlyInterest = (debt.balance || 0) * ((debt.interest_rate || 0) / 100 / 12);
    return sum + monthlyInterest;
  }, 0) || 0;

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
                      background: '#4caf50',
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
                      background: 'rgba(33, 150, 243, 0.2)',
                      color: isDarkMode ? 'white' : '#1565c0',
                      border: '1px solid rgba(33, 150, 243, 0.3)',
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
                        background: 'rgba(76, 175, 80, 0.2)',
                        color: isDarkMode ? 'white' : '#2e7d32',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
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
            <Grid container spacing={4} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <Grid container spacing={4} justifyContent="space-between">
                  {[
                    {
                      title: 'Total Debt Balance',
                      value: totalDebtBalance,
                      icon: AccountBalanceIcon,
                      gradient: [debtDarkColors.red, debtDarkColors.redDark],
                      progress: Math.min((totalDebtBalance / 100000) * 100, 100),
                                              color: debtDarkColors.red,
                      delay: 0
                    },
                    {
                      title: 'Monthly Interest', 
                      value: totalMonthlyInterest,
                      icon: MoneyIcon,
                      gradient: [debtDarkColors.red, debtDarkColors.redDark],
                      progress: Math.min((totalMonthlyInterest / 1000) * 100, 100),
                      color: debtDarkColors.red,
                      delay: 200
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
                    <Grid item xs={12} sm={6} md={4} key={index}>
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
                          mx: 1,
                          my: 1,
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
                              ? debtDarkColors.red
                              : 'transparent',
                            px: 3,
                            py: 1.5,
                            fontWeight: 600,
                            textTransform: 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              background: strategy === 'avalanche' 
                                ? debtDarkColors.redDark
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
                            ? debtDarkColors.blue
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
                              ? debtDarkColors.blueDark
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
                                    <TableCell align="right"><strong>Monthly Interest</strong></TableCell>
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
                                                ? debtDarkColors.red
                                                : debt.interest_rate > 8 
                                                  ? debtDarkColors.red
                                                  : debtDarkColors.blue,
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
                                              background: `${debtTypes.find(type => type.value === debt.debt_type)?.color || '#4caf50'}20`,
                                              color: debtTypes.find(type => type.value === debt.debt_type)?.color || '#4caf50',
                                              fontWeight: 500,
                                              border: `1px solid ${debtTypes.find(type => type.value === debt.debt_type)?.color || '#4caf50'}50`
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" sx={{ fontWeight: 500, color: debtDarkColors.red }}>
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
                          <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Card sx={{ 
                                background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                                color: 'white',
                                textAlign: 'center',
                                p: 2,
                                mx: 0.5,
                                my: 0.5
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
                                background: '#f44336',
                                color: 'white',
                                textAlign: 'center',
                                p: 2,
                                mx: 0.5,
                                my: 0.5
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
                                p: 2,
                                mx: 0.5,
                                my: 0.5
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
                                background: '#2196f3',
                                color: 'white',
                                textAlign: 'center',
                                p: 2,
                                mx: 0.5,
                                my: 0.5
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
                        
                        {/* Enhanced Outstanding Debts Grid */}
                        <Card sx={{
                          background: isDarkMode 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(20px)',
                          border: isDarkMode 
                            ? '1px solid rgba(255, 255, 255, 0.1)' 
                            : '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: 3,
                          boxShadow: isDarkMode 
                            ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                            : '0 8px 32px rgba(0, 0, 0, 0.1)',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          {/* Header */}
                          <Box sx={{
                            background: isDarkMode 
                              ? 'linear-gradient(135deg, #1a1a2e, #16213e)' 
                              : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                            p: 3,
                            borderBottom: isDarkMode 
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : '1px solid rgba(0, 0, 0, 0.1)'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ 
                                  bgcolor: debtDarkColors.blue, 
                                  mr: 2,
                                  width: 40,
                                  height: 40
                                }}>
                                  <AccountBalanceIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="h5" sx={{ 
                                    fontWeight: 'bold',
                                    color: isDarkMode ? 'white' : '#2c3e50',
                                    mb: 0.5
                                  }}>
                                    Outstanding Debts
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666',
                                    fontSize: '0.875rem'
                                  }}>
                                    {outstandingDebts.length} active debt{outstandingDebts.length !== 1 ? 's' : ''}
                                  </Typography>
                                </Box>
                              </Box>
                              <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => openDebtDialog()}
                                sx={{
                                  background: '#4caf50',
                                  color: 'white',
                                  fontWeight: 600,
                                  px: 3,
                                  py: 1,
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                                  '&:hover': {
                                    background: '#4caf50',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                                  },
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                Add Debt
                              </Button>
                            </Box>
                          </Box>

                          {/* Loading State */}
                          {debtsLoading && (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              p: 8,
                              background: isDarkMode 
                                ? 'rgba(0, 0, 0, 0.2)' 
                                : 'rgba(255, 255, 255, 0.5)',
                              backdropFilter: 'blur(10px)'
                            }}>
                              <Box sx={{ textAlign: 'center' }}>
                                <CircularProgress size={60} sx={{ color: debtDarkColors.blue, mb: 2 }} />
                                <Typography variant="body1" sx={{ 
                                  color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#666',
                                  fontWeight: 500
                                }}>
                                  Loading your debts...
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Empty State */}
                          {!debtsLoading && (!outstandingDebts || outstandingDebts.length === 0) && (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              p: 8,
                              textAlign: 'center'
                            }}>
                              <Box>
                                <Avatar sx={{ 
                                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(76, 175, 80, 0.1)', 
                                  width: 80, 
                                  height: 80, 
                                  mb: 3,
                                  mx: 'auto'
                                }}>
                                  <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                                </Avatar>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 'bold',
                                  color: isDarkMode ? 'white' : '#2c3e50',
                                  mb: 1
                                }}>
                                  No Debts Found
                                </Typography>
                                <Typography variant="body1" sx={{ 
                                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666',
                                  mb: 3
                                }}>
                                  You're debt-free! Add your first debt to start tracking your financial journey.
                                </Typography>
                                <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={() => openDebtDialog()}
                                  sx={{
                                    background: '#4caf50',
                                    color: 'white',
                                    fontWeight: 600,
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                                    '&:hover': {
                                      background: '#4caf50',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                                    },
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  Add Your First Debt
                                </Button>
                              </Box>
                            </Box>
                          )}

                          {/* Debt Cards Grid */}
                          {!debtsLoading && outstandingDebts && outstandingDebts.length > 0 && (
                                                                                      <Box sx={{ p: 4 }}>
                               <Box sx={{ 
                                 display: 'flex', 
                                 flexWrap: 'wrap', 
                                 gap: 2, 
                                 justifyContent: 'center',
                                 alignItems: 'flex-start'
                               }}>
                                 {outstandingDebts.map((debt, index) => (
                                   <Box sx={{ 
                                     width: { xs: '100%', md: 'calc(33.333% - 16px)' },
                                     minWidth: { md: 300 },
                                     maxWidth: { md: 400 }
                                   }} key={debt.id || index}>
                                    <Grow in={true} timeout={300 + (index * 100)}>
                                                                             <Card sx={{
                                         background: isDarkMode 
                                           ? 'rgba(255, 255, 255, 0.05)' 
                                           : 'white',
                                         border: isDarkMode 
                                           ? '1px solid rgba(255, 255, 255, 0.1)' 
                                           : '1px solid rgba(0, 0, 0, 0.1)',
                                         borderRadius: 3,
                                         boxShadow: isDarkMode 
                                           ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
                                           : '0 4px 16px rgba(0, 0, 0, 0.08)',
                                         transition: 'all 0.3s ease',
                                         mx: 0.5,
                                         my: 0.5,
                                         position: 'relative',
                                         overflow: 'hidden',
                                         aspectRatio: '1',
                                         minHeight: 400,
                                        '&:hover': {
                                          transform: 'translateY(-8px)',
                                          boxShadow: isDarkMode 
                                            ? '0 12px 32px rgba(0, 0, 0, 0.4)' 
                                            : '0 12px 32px rgba(0, 0, 0, 0.15)',
                                          '& .debt-card-actions': {
                                            opacity: 1,
                                            transform: 'translateY(0)'
                                          }
                                        }
                                      }}>
                                        {/* Debt Type Badge */}
                                        <Box sx={{
                                          position: 'absolute',
                                          top: 12,
                                          right: 12,
                                          zIndex: 2
                                        }}>
                                          <Chip
                                            label={debtTypes.find(type => type.value === debt.debt_type)?.label || 'Other'}
                                            size="small"
                                            icon={debtTypes.find(type => type.value === debt.debt_type)?.icon || <ReceiptIcon />}
                                            sx={{
                                              background: debtTypes.find(type => type.value === debt.debt_type)?.color || '#616161',
                                              color: 'white',
                                              fontWeight: 600,
                                              fontSize: '0.75rem',
                                              height: 24
                                            }}
                                          />
                                        </Box>

                                                                                 {/* Card Content */}
                                                                                  <CardContent sx={{ p: 4, pt: 5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                           {/* Top Section */}
                                           <Box>
                                             {/* Debt Name */}
                                             <Typography variant="h6" sx={{ 
                                               fontWeight: 'bold',
                                               color: isDarkMode ? 'white' : '#2c3e50',
                                               mb: 2,
                                               pr: 8
                                             }}>
                                               {debt.name}
                                             </Typography>

                                             {/* Balance */}
                                             <Box sx={{ mb: 2 }}>
                                               <Typography variant="body2" sx={{ 
                                                 color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666',
                                                 mb: 0.5,
                                                 fontSize: '0.875rem'
                                               }}>
                                                 Current Balance
                                               </Typography>
                                               <Typography variant="h5" sx={{ 
                                                 fontWeight: 'bold',
                                                 color: debtDarkColors.red,
                                                 fontSize: '1.5rem'
                                               }}>
                                                 {formatCurrency(parseFloat(debt.balance) || 0)}
                                               </Typography>
                                             </Box>

                                             {/* Interest Rate */}
                                             <Box sx={{ mb: 2 }}>
                                               <Typography variant="body2" sx={{ 
                                                 color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666',
                                                 mb: 0.5,
                                                 fontSize: '0.875rem'
                                               }}>
                                                 Interest Rate
                                               </Typography>
                                               <Chip
                                                 label={`${(parseFloat(debt.interest_rate) || 0).toFixed(2)}%`}
                                                 size="small"
                                                 sx={{
                                                   background: (parseFloat(debt.interest_rate) || 0) > 20 
                                                     ? debtDarkColors.red
                                                     : (parseFloat(debt.interest_rate) || 0) > 15 
                                                       ? debtDarkColors.red
                                                       : debtDarkColors.blue,
                                                   color: 'white',
                                                   fontWeight: 600,
                                                   fontSize: '0.8rem'
                                                 }}
                                               />
                                             </Box>
                                           </Box>

                                           {/* Middle Section */}
                                           <Box>
                                             {/* Monthly Interest */}
                                             <Box sx={{ mb: 2 }}>
                                               <Typography variant="body2" sx={{ 
                                                 color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666',
                                                 mb: 0.5,
                                                 fontSize: '0.875rem'
                                               }}>
                                                 Monthly Interest
                                               </Typography>
                                               <Typography variant="body1" sx={{ 
                                                 fontWeight: 600,
                                                 color: '#f44336',
                                                 fontSize: '1.1rem'
                                               }}>
                                                 {formatCurrency((parseFloat(debt.balance) || 0) * ((parseFloat(debt.interest_rate) || 0) / 100 / 12))}
                                               </Typography>
                                             </Box>

                                             {/* Payoff Time */}
                                             <Box sx={{ mb: 2 }}>
                                               <Typography variant="body2" sx={{ 
                                                 color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666',
                                                 mb: 0.5,
                                                 fontSize: '0.875rem'
                                               }}>
                                                 {debt.payoff_date ? 'Target Payoff' : 'Payoff Time'}
                                               </Typography>
                                               {(() => {
                                                 const payoffTime = calculateDebtPayoffTime(debt);
                                                 if (payoffTime === 'N/A') {
                                                   return (
                                                     <Typography variant="body1" sx={{ 
                                                       color: '#999', 
                                                       fontStyle: 'italic',
                                                       fontSize: '1rem'
                                                     }}>
                                                       N/A
                                                     </Typography>
                                                   );
                                                 }
                                                 
                                                 if (payoffTime === 0) {
                                                   return (
                                                     <Typography variant="body1" sx={{ 
                                                       color: '#4caf50', 
                                                       fontWeight: 600,
                                                       fontSize: '1rem'
                                                     }}>
                                                       Paid Off!
                                                     </Typography>
                                                   );
                                                 }
                                                 
                                                 const { years, months, days, totalMonths } = payoffTime;
                                                 return (
                                                   <Box>
                                                     <Typography variant="body1" sx={{ 
                                                       fontWeight: 600,
                                                       color: debt.payoff_date ? '#4caf50' : (totalMonths > 60 ? '#f44336' : totalMonths > 24 ? '#f44336' : '#4caf50'),
                                                       fontSize: '1rem'
                                                     }}>
                                                       {years > 0 
                                                         ? `${years}Y ${months}m` 
                                                         : months > 0 
                                                           ? `${months}M ${days}d`
                                                           : `${days}D`
                                                       }
                                                     </Typography>
                                                     {debt.payoff_date && (
                                                       <Typography variant="caption" sx={{ 
                                                         color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#888',
                                                         fontSize: '0.75rem',
                                                         fontStyle: 'italic'
                                                       }}>
                                                         Target: {new Date(debt.payoff_date).getDate()}{new Date(debt.payoff_date).toLocaleDateString('en-US', { month: 'short' })}, {new Date(debt.payoff_date).getFullYear()}
                                                       </Typography>
                                                     )}
                                                   </Box>
                                                 );
                                               })()}
                                             </Box>
                                           </Box>

                                           
                                         </CardContent>

                                        {/* Hover Actions */}
                                        <Box className="debt-card-actions" sx={{
                                          position: 'absolute',
                                          bottom: 0,
                                          left: 0,
                                          right: 0,
                                          background: isDarkMode 
                                            ? 'rgba(0, 0, 0, 0.9)' 
                                            : 'rgba(255, 255, 255, 0.95)',
                                          backdropFilter: 'blur(10px)',
                                          p: 2,
                                          display: 'flex',
                                          gap: 1,
                                          justifyContent: 'center',
                                          opacity: 0,
                                          transform: 'translateY(100%)',
                                          transition: 'all 0.3s ease'
                                        }}>
                                          <IconButton
                                            size="small"
                                            onClick={() => openDebtDialog(debt)}
                                            sx={{
                                              color: debtDarkColors.blue,
                                              background: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                              '&:hover': {
                                                background: isDarkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                                                transform: 'scale(1.1)'
                                              }
                                            }}
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() => handleDeleteDebt(debt)}
                                            sx={{
                                              color: debtDarkColors.red,
                                              background: isDarkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                              '&:hover': {
                                                background: isDarkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                                transform: 'scale(1.1)'
                                              }
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      </Card>
                                    </Grow>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Card>
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
                              bgcolor: strategy === 'avalanche' ? debtDarkColors.red : 'transparent',
                              '&:hover': {
                                                                  bgcolor: strategy === 'avalanche' ? debtDarkColors.redDark : 'rgba(255, 255, 255, 0.1)',
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
                              ? '2px solid #f44336' 
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
                              bgcolor: strategy === 'avalanche' ? debtDarkColors.red : 'rgba(255, 107, 107, 0.7)',
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
                                  background: debtDarkColors.red,
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
                              color: debtDarkColors.blue, 
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
                                  background: strategy === 'snowball' ? debtDarkColors.blue : debtDarkColors.red,
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
            background: '#4caf50',
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
            background: debtDarkColors.red,
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
        onClose={debtSubmitting ? null : () => setDebtDialogOpen(false)}
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
                  label="Balance Effective Date"
                  value={debtForm.effectiveDate}
                  onChange={(e) => setDebtForm({...debtForm, effectiveDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  required
                  helperText="When this balance was recorded"
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
                    },
                    '& .MuiFormHelperText-root': {
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#666',
                      fontSize: '0.75rem'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Target Payoff Date (Optional)"
                  value={debtForm.payoffDate}
                  onChange={(e) => setDebtForm({...debtForm, payoffDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  helperText="When you plan to pay this off"
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
                    },
                    '& .MuiFormHelperText-root': {
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#666',
                      fontSize: '0.75rem'
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
              disabled={debtSubmitting}
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
              disabled={debtSubmitting}
              startIcon={debtSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{
                background: editingDebt 
                  ? debtDarkColors.blue
                  : '#4caf50',
                color: 'white',
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                minWidth: 140,
                '&:hover': {
                  background: editingDebt 
                    ? debtDarkColors.blueDark
                    : '#4caf50',
                  transform: debtSubmitting ? 'none' : 'translateY(-1px)'
                },
                '&:disabled': {
                  background: '#666',
                  color: '#ccc'
                }
              }}
            >
              {debtSubmitting 
                ? (editingDebt ? 'Updating...' : 'Adding...') 
                : (editingDebt ? 'Update Debt' : 'Add Debt')
              }
            </Button>
          </DialogActions>
        </form>
        
        {/* Loading Overlay for Debt Dialog */}
        {debtSubmitting && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              borderRadius: 3
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: 4,
              borderRadius: 2,
              gap: 2
            }}>
              <CircularProgress size={40} />
              <Typography variant="h6" sx={{ color: '#333' }}>
                {editingDebt ? 'Updating debt...' : 'Adding debt...'}
              </Typography>
            </Box>
          </Box>
        )}
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
              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#666',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#ccc'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteDebt}
            variant="contained"
            color="error"
            disabled={debtSubmitting}
            startIcon={debtSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ 
              background: '#f44336',
              fontWeight: 600,
              px: 3,
              borderRadius: 2,
              '&:hover': {
                background: '#d32f2f',
                transform: debtSubmitting ? 'none' : 'translateY(-1px)'
              }
            }}
          >
            {debtSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
               </DialogActions>
      </Dialog>
    </Box>
  );
};
export default DebtPlanning;
