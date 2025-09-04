import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  Alert,
  Snackbar,
  Fade,
  useTheme,
  Container,
  LinearProgress,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Chip,
  TextField,
  Grid,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import {
  CheckCircle as CheckCircleIcon,
  Lightbulb as LightbulbIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  AccountBalance as AccountBalanceIcon,
  Savings as SavingsIcon,
  Timeline as TimelineIcon,
  AttachMoney as AttachMoneyIcon,
  CreditCard as CreditCardIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from '../utils/axios';
import accountsDebtsService from '../services/accountsDebtsService';
import { PageLoader as Loading } from './common/Loading';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

ModuleRegistry.registerModules([AllCommunityModule]);

// Enhanced DebtPlanning Component with Complete Real-Time Updates
const DebtPlanning = () => {
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();

  // Core state
  const [loading, setLoading] = useState(true);
  const [outstandingDebts, setOutstandingDebts] = useState([]);
  const [backendBudgets, setBackendBudgets] = useState([]);
  const [debtsLoading, setDebtsLoading] = useState(true);
  const [debtsError, setDebtsError] = useState(null);
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [historicalMonthsShown, setHistoricalMonthsShown] = useState(3);
  const [maxProjectionMonths, setMaxProjectionMonths] = useState(60); // Support up to 5 years
  const [localGridData, setLocalGridData] = useState([]);
  const [editableMonths, setEditableMonths] = useState([]);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // ENHANCED: Real-time update states for comprehensive loading management
  const [gridUpdating, setGridUpdating] = useState(false);
  const [strategy, setStrategy] = useState('snowball');
  const [isInitializingGrid, setIsInitializingGrid] = useState(false);
  
  // ENHANCED: Track user-edited projected cells with detailed metadata
  const [lockedCells, setLockedCells] = useState({});
  const [userEditedCells, setUserEditedCells] = useState(new Map());
  
  // ENHANCED: Real-time update states
  const [isUpdatingCell, setIsUpdatingCell] = useState(false);
  const [updatingCellInfo, setUpdatingCellInfo] = useState(null);
  const [propagationProgress, setPropagationProgress] = useState(0);
  
  // ENHANCED: Real-time propagation states
  const [isPropagatingChanges, setIsPropagatingChanges] = useState(false);
  const [propagationStatus, setPropagationStatus] = useState('');
  const [debtRecalculationStatus, setDebtRecalculationStatus] = useState('');
  const [loadingAnimationStep, setLoadingAnimationStep] = useState(0);
  
  // Progress-based loading animation effect
  useEffect(() => {
    if (isPropagatingChanges && propagationProgress > 0) {
      let status = '';
      let emoji = '';
      
      if (propagationProgress <= 35) {
        status = 'Processing...';
        emoji = '🏃‍♂️';
      } else if (propagationProgress <= 70) {
        status = 'Updating...';
        emoji = '⚡';
      } else {
        status = 'Loading...';
        emoji = '🔄';
      }
      
      setPropagationStatus(`${emoji} ${status}`);
    } else if (!isPropagatingChanges) {
      setPropagationStatus('');
    }
  }, [isPropagatingChanges, propagationProgress]);
  
  // ENHANCED: Debt calculation synchronization
  const [payoffPlan, setPayoffPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [debtCalculationInProgress, setDebtCalculationInProgress] = useState(false);
  const [planError, setPlanError] = useState(null);

  // CRUD Operations for Debts
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [debtFormData, setDebtFormData] = useState({
    name: '',
    debt_type: 'credit_card',
    balance: '',
    interest_rate: '',
    payoff_date: ''
  });
  const [debtFormLoading, setDebtFormLoading] = useState(false);

  // Delete confirmation dialog state
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    open: false,
    debt: null
  });

  // Refs for synchronization
  const gridApiRef = useRef(null);
  const gridUpdateCounter = useRef(0);
  
  // State to force grid re-renders when debts change
  const [gridForceUpdate, setGridForceUpdate] = useState(0);

  // Debt types for dropdown
  const debtTypes = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'student_loan', label: 'Student Loan' },
    { value: 'auto_loan', label: 'Auto Loan' },
    { value: 'personal_loan', label: 'Personal Loan' },
    { value: 'mortgage', label: 'Mortgage' },
    { value: 'home_equity', label: 'Home Equity' },
    { value: 'business_loan', label: 'Business Loan' },
    { value: 'other', label: 'Other' }
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild grid data when the view window changes (historical/projection months)
  useEffect(() => {
    if (backendBudgets && backendBudgets.length > 0) {
      const gridData = transformBackendBudgetsToGrid(backendBudgets);
      setLocalGridData(gridData);

      // Rebuild editableMonths aligned with current month window
      const genMonths = generateMonths();
      const currentIdx = genMonths.findIndex(m => m.type === 'current');
      const monthBudgets = genMonths
        .filter((m, idx) => idx >= currentIdx && idx < currentIdx + Math.max(12, projectionMonths))
        .map(m => {
          const budget = backendBudgets.find(b => b.month === m.month && b.year === m.year);
          return {
            month: m.month,
            year: m.year,
            actualNetSavings: budget ? calculateNetSavingsFromBudget(budget) : (gridData.find(r => r.category === 'Net Savings')?.[`month_${genMonths.indexOf(m)}`] || 0)
          };
        });
      setEditableMonths(monthBudgets);
    }
  }, [projectionMonths, historicalMonthsShown, backendBudgets]);

  

  // Auto-recalculate debt payoff whenever backend budgets change (initial load and saves)
  useEffect(() => {
    if (outstandingDebts?.length && localGridData?.length && !debtCalculationInProgress) {
      triggerImmediateDebtRecalculation();
    }
  }, [backendBudgets]);

  // Load initial data from backend
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load debts
      const debtsData = await accountsDebtsService.getDebts();
      setOutstandingDebts(debtsData || []);
      setDebtsLoading(false);
      
      // Initialize grid data
      await initializeGridData();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      setErrorMessage('Failed to load initial data. Please try again.');
      setShowErrorSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  // Optimized function to reload only debts and trigger recalculation
  const reloadDebtsAndRecalculate = async () => {
    try {
      console.log('🔄 Reloading debts and triggering recalculation...');
      
      // Load only debts (not full initial data)
      const debtsData = await accountsDebtsService.getDebts();
      setOutstandingDebts(debtsData || []);
      
      // The useEffect watching outstandingDebts will automatically trigger recalculation
      console.log('✅ Debts reloaded, recalculation will be triggered automatically');
      
    } catch (error) {
      console.error('Error reloading debts:', error);
      setErrorMessage('Failed to reload debt data. Please try again.');
      setShowErrorSnackbar(true);
    }
  };

  // Initialize grid data structure
  const initializeGridData = async () => {
    try {
      setIsInitializingGrid(true);
      
      // Load real budget data from MongoDB backend
      const budgetsResponse = await axios.get('/api/mongodb/budgets/');
      const budgets = budgetsResponse.data.budgets || [];
      setBackendBudgets(budgets);
      
      console.log('📊 Loaded budgets from backend:', budgets);
      
      if (budgets.length === 0) {
        // Create sample data if no budgets exist
        await createSampleBudgetData();
        return;
      }
      
      // Transform backend budget data to grid format
      const gridData = transformBackendBudgetsToGrid(budgets);
      setLocalGridData(gridData);
      
      // Initialize editable months from actual budget data
      // Initialize editable months anchored to generated month list (aligns with view selection)
      const genMonths = generateMonths();
      const currentIdx = genMonths.findIndex(m => m.type === 'current');
      const monthBudgets = genMonths
        .filter((m, idx) => idx >= currentIdx && idx < currentIdx + Math.max(12, projectionMonths))
        .map(m => {
          const budget = budgets.find(b => b.month === m.month && b.year === m.year);
          return {
            month: m.month,
            year: m.year,
            actualNetSavings: budget ? calculateNetSavingsFromBudget(budget) : 0
          };
        });
      setEditableMonths(monthBudgets);
      
    } catch (error) {
      console.error('Error loading budget data from backend:', error);
      // Fallback to sample data
      await createSampleBudgetData();
    } finally {
      setIsInitializingGrid(false);
      
      // Trigger initial debt payoff calculation
      if (outstandingDebts.length > 0) {
        setTimeout(() => {
          triggerImmediateDebtRecalculation();
        }, 1000); // Small delay to ensure grid is fully rendered
      }
    }
  };

  // Enhanced month generation with unlimited future months support
  const generateMonths = useCallback(() => {
    const months = [];
    const currentDate = new Date();
    
    // Historical months
    for (let i = historicalMonthsShown; i > 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        type: 'historical',
        date: date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        isGenerated: false // Historical months are loaded from DB
      });
    }
    
    // Current month
    months.push({
      label: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      type: 'current',
      date: currentDate,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      isGenerated: false // Current month is loaded from DB
    });
    
    // Future months (unlimited generation)
    for (let i = 1; i <= projectionMonths; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + i);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        type: 'future',
        date: date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        isGenerated: true // Future months are generated on frontend
      });
    }
    
    console.log(`📅 Generated ${months.length} months (${historicalMonthsShown} historical + 1 current + ${projectionMonths} future)`);
    return months;
  }, [historicalMonthsShown, projectionMonths]);

  // Enhanced transform function with unlimited future months and frontend state
  const transformBackendBudgetsToGrid = (budgets) => {
    const months = generateMonths();
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    
    const gridData = [
      {
        category: 'Income',
        type: 'income',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Housing',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Transportation',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Food',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Healthcare',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Entertainment',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Shopping',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Travel',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Education',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Utilities',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Childcare',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Other',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Savings',
        type: 'savings',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Net Savings',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Remaining Debt',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      }
    ];

    // Populate with actual budget data from database
    // Track which month indices have real data from the backend
    const dbMonthIndices = new Set();
    budgets.forEach(budget => {
      const monthIdx = months.findIndex(m => m.month === budget.month && m.year === budget.year);
      if (monthIdx !== -1) {
        dbMonthIndices.add(monthIdx);
        // Income
        const incomeRow = gridData.find(row => row.category === 'Income');
        if (incomeRow) {
          incomeRow[`month_${monthIdx}`] = (budget.income || 0) + (budget.additional_income || 0);
        }
        
        // Expenses
        if (budget.expenses) {
          Object.entries(budget.expenses).forEach(([category, amount]) => {
            const expenseRow = gridData.find(row => row.category === category.charAt(0).toUpperCase() + category.slice(1));
            if (expenseRow) {
              expenseRow[`month_${monthIdx}`] = amount || 0;
            }
          });
        }
      }
    });

    // For any month (historical or projected) without DB data, inherit values from the current month (frontend-only)
    if (currentMonthIdx !== -1) {
      gridData.forEach(row => {
        const currentValue = row[`month_${currentMonthIdx}`] || 0;
        for (let idx = 0; idx < months.length; idx++) {
          // Always mirror current month for historical months across ALL categories
          if (months[idx].type === 'historical') {
            row[`month_${idx}`] = currentValue;
            continue;
          }
          // For projected months without DB data, inherit current month value if empty
          if (!dbMonthIndices.has(idx) && row[`month_${idx}`] === 0) {
            row[`month_${idx}`] = currentValue;
          }
        }
      });
    }

    // Calculate net savings
    const calculatedData = recalculateNetSavings(gridData);
    
    // Set initial debt amounts
    const totalDebt = outstandingDebts.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
    const debtRow = calculatedData.find(row => row.category === 'Remaining Debt');
    if (debtRow) {
      months.forEach((_, idx) => {
        debtRow[`month_${idx}`] = totalDebt;
      });
    }

    console.log(`📊 Grid data populated: ${[...new Set(budgets.map(b => months.findIndex(m => m.month === b.month && m.year === b.year)).filter(i => i !== -1))].length} DB months + ${months.length - [...new Set(budgets.map(b => months.findIndex(m => m.month === b.month && m.year === b.year)).filter(i => i !== -1))].length} generated months`);
    return calculatedData;
  };

  // Calculate net savings from a single budget
  const calculateNetSavingsFromBudget = (budget) => {
    const income = (budget.income || 0) + (budget.additional_income || 0);
    const expenses = Object.values(budget.expenses || {}).reduce((sum, val) => sum + (val || 0), 0);
    return income - expenses;
  };

  // Create sample budget data if none exists
  const createSampleBudgetData = async () => {
    console.log('Creating sample budget data...');
    
    const sampleBudgetData = [
      {
        category: 'Income',
        type: 'income',
        month_0: 30000, // Current month
        month_1: 30000, // Next month
        month_2: 30000,
        month_3: 30000,
        month_4: 30000,
        month_5: 30000,
        month_6: 30000,
        month_7: 30000,
        month_8: 30000,
        month_9: 30000,
        month_10: 30000,
        month_11: 30000,
        month_12: 30000,
        month_13: 30000,
        month_14: 30000
      },
      {
        category: 'Housing',
        type: 'expense',
        month_0: 1500,
        month_1: 1500,
        month_2: 1500,
        month_3: 1500,
        month_4: 1500,
        month_5: 1500,
        month_6: 1500,
        month_7: 1500,
        month_8: 1500,
        month_9: 1500,
        month_10: 1500,
        month_11: 1500,
        month_12: 1500,
        month_13: 1500,
        month_14: 1500
      },
      {
        category: 'Transportation',
        type: 'expense',
        month_0: 400,
        month_1: 400,
        month_2: 400,
        month_3: 400,
        month_4: 400,
        month_5: 400,
        month_6: 400,
        month_7: 400,
        month_8: 400,
        month_9: 400,
        month_10: 400,
        month_11: 400,
        month_12: 400,
        month_13: 400,
        month_14: 400
      },
      {
        category: 'Food',
        type: 'expense',
        month_0: 600,
        month_1: 600,
        month_2: 600,
        month_3: 600,
        month_4: 600,
        month_5: 600,
        month_6: 600,
        month_7: 600,
        month_8: 600,
        month_9: 600,
        month_10: 600,
        month_11: 600,
        month_12: 600,
        month_13: 600,
        month_14: 600
      },
      {
        category: 'Utilities',
        type: 'expense',
                month_0: 200,
        month_1: 200,
        month_2: 200,
        month_3: 200,
        month_4: 200,
        month_5: 200,
        month_6: 200,
        month_7: 200,
        month_8: 200,
        month_9: 200,
        month_10: 200,
        month_11: 200,
        month_12: 200,
        month_13: 200,
        month_14: 200
      },
      {
        category: 'Entertainment',
        type: 'expense',
        month_0: 300,
        month_1: 300,
        month_2: 300,
        month_3: 300,
        month_4: 300,
        month_5: 300,
        month_6: 300,
        month_7: 300,
        month_8: 300,
        month_9: 300,
        month_10: 300,
        month_11: 300,
        month_12: 300,
        month_13: 300,
        month_14: 300
      },
      {
        category: 'Savings',
        type: 'savings',
        month_0: 500,
        month_1: 500,
        month_2: 500,
        month_3: 500,
        month_4: 500,
        month_5: 500,
        month_6: 500,
        month_7: 500,
        month_8: 500,
        month_9: 500,
        month_10: 500,
        month_11: 500,
        month_12: 500,
        month_13: 500,
        month_14: 500
      },
      {
        category: 'Net Savings',
        type: 'calculated',
        month_0: 0,
        month_1: 0,
        month_2: 0,
        month_3: 0,
        month_4: 0,
        month_5: 0,
        month_6: 0,
        month_7: 0,
        month_8: 0,
        month_9: 0,
        month_10: 0,
        month_11: 0,
        month_12: 0,
        month_13: 0,
        month_14: 0
      },
      {
        category: 'Remaining Debt',
        type: 'calculated',
        month_0: 0,
        month_1: 0,
        month_2: 0,
        month_3: 0,
        month_4: 0,
        month_5: 0,
        month_6: 0,
        month_7: 0,
        month_8: 0,
        month_9: 0,
        month_10: 0,
        month_11: 0,
        month_12: 0,
        month_13: 0,
        month_14: 0
      }
    ];

    // Calculate net savings
    const calculatedData = recalculateNetSavings(sampleBudgetData);
    
    // Set initial debt amounts
    const totalDebt = outstandingDebts.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
    const debtRow = calculatedData.find(row => row.category === 'Remaining Debt');
    if (debtRow) {
      for (let i = 0; i <= 14; i++) {
        debtRow[`month_${i}`] = totalDebt;
      }
    }

    setLocalGridData(calculatedData);
    
    // Initialize editable months
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < projectionMonths; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      months.push({
        month: monthDate.getMonth() + 1,
        year: monthDate.getFullYear(),
        actualNetSavings: calculatedData.find(row => row.category === 'Net Savings')?.[`month_${i}`] || 0
      });
    }
    setEditableMonths(months);
  };

  // ENHANCED: Helper function for real-time grid updates
  const handleRealTimeGridUpdate = useCallback(async (monthIdx, category, newValue, months) => {
    console.log(`🔄 Handling real-time grid update for ${category} = ${newValue} in month ${monthIdx}`);
    
    return new Promise((resolve) => {
      setLocalGridData(prev => {
        const updated = prev.map(row => {
          if (row.category === category) {
            return { ...row, [`month_${monthIdx}`]: parseFloat(newValue) || 0 };
          }
          return row;
        });
        
        // Recalculate net savings after updating the cell
        const recalculated = recalculateNetSavings(updated);
        
        // Update editableMonths with fresh Net Savings from the grid
        const netSavingsRow = recalculated.find(row => row.category === 'Net Savings');
        if (netSavingsRow) {
          const currentMonthIdx = months.findIndex(m => m.type === 'current');
          const monthBudgetsForDebtCalc = editableMonths.map((budget, idx) => {
            const gridColumnIdx = currentMonthIdx + idx;
            const netSavingsValue = netSavingsRow[`month_${gridColumnIdx}`] || 0;
            return {
              ...budget,
              actualNetSavings: netSavingsValue
            };
          });
          
          setEditableMonths(monthBudgetsForDebtCalc);
          console.log(`💾 Updated editableMonths with fresh Net Savings`);
        }
        
        // Ensure any non-DB months still inherit current month value after edit,
        // but never overwrite user-edited (locked) projected cells
        const currentIdx = months.findIndex(m => m.type === 'current');
        if (currentIdx !== -1) {
          const withInheritance = recalculated.map(row => {
            if (row.category !== category) return row;
            const currentValue = row[`month_${currentIdx}`] || 0;
            const cloned = { ...row };
            for (let idx = 0; idx < months.length; idx++) {
              if (!months[idx].isGenerated) continue; // DB months already persisted
              const lockedForMonth = new Set((lockedCells[idx] || []));
              const isLocked = lockedForMonth.has(category);
              // Only fill if not locked and the cell currently has no value
              if (!isLocked && (cloned[`month_${idx}`] === 0 || cloned[`month_${idx}`] == null)) {
                cloned[`month_${idx}`] = currentValue;
              }
            }
            return cloned;
          });
          resolve(withInheritance);
          return withInheritance;
        }

        resolve(recalculated);
        return recalculated;
      });
    });
  }, [editableMonths, lockedCells]);

  // OPTIMIZED: Frontend-driven propagation with batched database updates
  const propagateCurrentMonthChanges = useCallback(async (currentMonthIdx, category, newValue, months, updatedGridData) => {
    const currentVal = parseFloat(newValue) || 0;
    console.log(`🚀 OPTIMIZED PROPAGATION: ${category} = ${currentVal} to future months`);
    
    setIsPropagatingChanges(true);
    setPropagationProgress(0);

    // STEP 1: Immediate frontend propagation (no database calls)
    const changesToSave = [];
    let propagatedCount = 0;
    const totalFutureMonths = months.filter((_, idx) => idx > currentMonthIdx && months[idx]?.type === 'future').length;
    
    // Update all future months immediately in frontend state
    for (let i = currentMonthIdx + 1; i < months.length; i++) {
      const futureMonth = months[i];
      if (!futureMonth || futureMonth.type !== 'future') continue;
      
      // Skip locked (user-edited) cells
      const lockedForMonth = new Set((lockedCells[i] || []));
      if (lockedForMonth.has(category)) {
        console.log(`🔒 Skipping locked month ${i} for ${category}`);
        continue;
      }
      
      // Update grid cell immediately in frontend
      setLocalGridData(prev => {
        const updated = prev.map(row => {
          if (row.category === category) {
            return { ...row, [`month_${i}`]: currentVal };
          }
          return row;
        });
        return updated;
      });
      
      // Track changes for batched database update (only within Atlas window)
      const withinAtlasWindow = i <= currentMonthIdx + 12;
      if (withinAtlasWindow) {
        // For income propagation, we need to preserve the additional income and only adjust primary income
        if (category === 'Income') {
          // Get the current month's additional income to preserve it
          const currentMonthBackend = backendBudgets.find(
            b => b.month === months[currentMonthIdx].month && b.year === months[currentMonthIdx].year
          );
          const currentAdditionalIncome = parseFloat(currentMonthBackend?.additional_income || 0) || 0;
          
          // The currentVal is the total income, so we need to calculate the new primary income
          const newPrimaryIncome = Math.max(0, currentVal - currentAdditionalIncome);
          
          changesToSave.push({
            month: futureMonth.month,
            year: futureMonth.year,
            category: 'Income',
            value: currentVal, // Total income
            additional_income: currentAdditionalIncome // Preserve additional income
          });
        } else {
          changesToSave.push({
            month: futureMonth.month,
            year: futureMonth.year,
            category: category,
            value: currentVal
          });
        }
      }
      
      propagatedCount++;
      const progress = Math.round((propagatedCount / totalFutureMonths) * 35); // 0-35% for frontend updates
      setPropagationProgress(progress);
    }
    
    // Update historical months immediately in frontend
    for (let i = 0; i < currentMonthIdx; i++) {
      const histMonth = months[i];
      if (!histMonth || histMonth.type !== 'historical') continue;
      
      setLocalGridData(prev => {
        const updated = prev.map(row => {
          if (row.category === category) {
            return { ...row, [`month_${i}`]: currentVal };
          }
          return row;
        });
        return updated;
      });
      
      // Track historical changes for database
      if (category === 'Income') {
        // Get the current month's additional income to preserve it
        const currentMonthBackend = backendBudgets.find(
          b => b.month === months[currentMonthIdx].month && b.year === months[currentMonthIdx].year
        );
        const currentAdditionalIncome = parseFloat(currentMonthBackend?.additional_income || 0) || 0;
        
        changesToSave.push({
          month: histMonth.month,
          year: histMonth.year,
          category: 'Income',
          value: currentVal, // Total income
          additional_income: currentAdditionalIncome // Preserve additional income
        });
      } else {
        changesToSave.push({
          month: histMonth.month,
          year: histMonth.year,
          category: category,
          value: currentVal
        });
      }
    }

    // STEP 2: Recalculate derived values immediately (35-70%)
    setPropagationProgress(35);
    setLocalGridData(prev => {
      const next = recalculateNetSavings(prev);
      setEditableMonths(prevMonths => {
        const gen = generateMonths();
        const curIdx = gen.findIndex(m => m.type === 'current');
        const netRow = next.find(r => r.category === 'Net Savings');
        if (!netRow) return prevMonths;
        return prevMonths.map((b, idx) => {
          const gridIdx = curIdx + idx;
          const val = netRow[`month_${gridIdx}`] || 0;
          return { ...b, actualNetSavings: val };
        });
      });
      return next;
    });

    // STEP 3: Batched database update (70-100%)
    setPropagationProgress(70);
    if (changesToSave.length > 0) {
      try {
        console.log(`💾 BATCH SAVING: ${changesToSave.length} changes to database`);
        const response = await axios.post('/api/mongodb/budgets/batch-update/', {
          changes: changesToSave
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Update backendBudgets with only the changed data (no full refetch)
        if (response.data?.updated_budgets) {
          setBackendBudgets(prev => {
            const updated = [...prev];
            response.data.updated_budgets.forEach(updatedBudget => {
              const existingIndex = updated.findIndex(b => 
                b.month === updatedBudget.month && b.year === updatedBudget.year
              );
              if (existingIndex >= 0) {
                updated[existingIndex] = { ...updated[existingIndex], ...updatedBudget };
              } else {
                updated.push(updatedBudget);
              }
            });
            return updated;
          });
        }
        
        console.log('✅ Batch update completed successfully');
      } catch (error) {
        console.error('❌ Batch update failed:', error);
        // Fallback to individual saves if batch fails
        console.log('🔄 Falling back to individual saves...');
        for (const change of changesToSave) {
          try {
            await saveMonthChangesDirectly(change.month, change.year, change.category, change.value);
          } catch (e) {
            console.warn(`⚠️ Failed to save ${change.category} for ${change.month}/${change.year}:`, e?.message);
          }
        }
      }
    }

    setPropagationProgress(100);
    console.log(`✅ OPTIMIZED PROPAGATION COMPLETE: ${category} = ${currentVal} to ${propagatedCount} future months`);
  }, [lockedCells]);

  // Frontend debt calculation with corrected timing logic
  const calculateDebtPayoffPlanFrontend = useCallback((netSavingsData, debts, strategyType, months) => {
    console.log('🔄 Calculating debt payoff plan on frontend with corrected timing...');
    
    if (!debts || debts.length === 0 || !netSavingsData) {
      return null;
    }

    // Initialize debt balances
    const debtBalances = debts.map(debt => ({
      name: debt.name,
      balance: parseFloat(debt.balance) || 0,
      rate: (parseFloat(debt.interest_rate) || 0) / 100,
      minimumPayment: parseFloat(debt.minimum_payment) || 0
    }));

    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    const getNetSavingsForMonth = (idx) => {
      // Historical months do not contribute to payoff
      if (months[idx]?.type === 'historical') return 0;
      const raw = netSavingsData ? netSavingsData[`month_${idx}`] : undefined;
      const num = parseFloat(raw);
      if (Number.isFinite(num)) return num;
      // Fallback: for generated months without DB data, inherit current month's net
      const currentNet = parseFloat(netSavingsData?.[`month_${currentMonthIdx}`]) || 0;
      return currentNet;
    };
    const plan = [];

    // Calculate for each month starting from current month
    for (let monthIdx = currentMonthIdx; monthIdx < months.length; monthIdx++) {
      const netSavings = getNetSavingsForMonth(monthIdx);
      const monthPlan = {
        month: monthIdx,
        net_savings: netSavings,
        debts: [],
        totalPaid: 0,
        totalInterest: 0
      };

      // Calculate interest for this month
      let totalInterest = 0;
      debtBalances.forEach(debt => {
        if (debt.balance > 0) {
          const monthlyInterest = debt.balance * (debt.rate / 12);
          debt.balance += monthlyInterest;
          totalInterest += monthlyInterest;
        }
      });

      // Apply net savings to debt payment in the SAME month
      let availableForDebt = Math.max(0, netSavings);
      let totalPaidToDebt = 0;

      if (availableForDebt > 0 && debtBalances.some(d => d.balance > 0)) {
        // Sort debts by strategy
        const sortedDebts = [...debtBalances].sort((a, b) => {
          if (strategyType === 'snowball') {
            return a.balance - b.balance; // Smallest balance first
          } else {
            return b.rate - a.rate; // Highest rate first
          }
        });

        // Pay minimum payments first
        sortedDebts.forEach(debt => {
          if (debt.balance > 0 && availableForDebt > 0) {
            const payment = Math.min(debt.minimumPayment, debt.balance, availableForDebt);
            debt.balance -= payment;
            availableForDebt -= payment;
            totalPaidToDebt += payment;
          }
        });

        // Apply remaining amount to debts according to strategy
        for (const debt of sortedDebts) {
          if (availableForDebt <= 0 || debt.balance <= 0) continue;
          
          const payment = Math.min(availableForDebt, debt.balance);
          debt.balance -= payment;
          availableForDebt -= payment;
          totalPaidToDebt += payment;
        }
      }

      // Record debt states for this month
      const paidPerDebt = totalPaidToDebt > 0
        ? (() => {
            const count = debtBalances.filter(d => d.balance >= 0).length || debtBalances.length || 1;
            return totalPaidToDebt / count;
          })()
        : 0;
      const interestPerDebt = totalInterest > 0
        ? (() => {
            const count = debtBalances.filter(d => d.balance >= 0).length || debtBalances.length || 1;
            return totalInterest / count;
          })()
        : 0;

      debtBalances.forEach(debt => {
        monthPlan.debts.push({
          name: debt.name,
          balance: Math.max(0, debt.balance),
          paid: paidPerDebt,
          interest: interestPerDebt
        });
      });

      // Store monthly totals for robust timeline rows
      monthPlan.totalPaid = totalPaidToDebt;
      monthPlan.totalInterest = totalInterest;

      plan.push(monthPlan);
    }

    console.log('✅ Frontend debt payoff plan calculated with same-month timing');
    return { plan };
  }, []);

  // ENHANCED: Helper function for immediate debt payoff recalculation
  const triggerImmediateDebtRecalculation = useCallback(async () => {
    if (!outstandingDebts?.length || debtCalculationInProgress) return;
    
    console.log('🔄 Triggering immediate debt payoff recalculation with corrected timing...');
    setDebtCalculationInProgress(true);
    setPlanLoading(true);
    setDebtRecalculationStatus('Recalculating debt payoff timeline with same-month timing...');
    
    try {
      const months = generateMonths();
      const netSavingsRow = localGridData.find(row => row.category === 'Net Savings');
      
      if (!netSavingsRow) {
        console.log('❌ No net savings data available');
        setDebtRecalculationStatus('No net savings data available');
        return;
      }
      
      // Use frontend calculation with corrected timing
      const freshPayoffPlan = calculateDebtPayoffPlanFrontend(
        netSavingsRow, 
        outstandingDebts.filter(d => d.balance > 0 && d.debt_type !== 'mortgage'), 
        strategy,
        months
      );
      
      console.log('💡 Frontend debt payoff plan result:', freshPayoffPlan);
      
      if (freshPayoffPlan) {
        setPayoffPlan(freshPayoffPlan);
        
        // Update remaining debt columns in grid and force immediate re-render
        setLocalGridData(prevData => {
          const updatedData = updateTotalDebtFromPayoffPlan(prevData, freshPayoffPlan);
          console.log('Updated grid data for budget projection:', updatedData);
          
          // Force immediate grid re-render by incrementing counter and state
          gridUpdateCounter.current++;
          setGridForceUpdate(prev => prev + 1);
          console.log('Grid update counter incremented to:', gridUpdateCounter.current);
          console.log('Grid force update triggered');
          
          return updatedData;
        });
        
        setDebtRecalculationStatus('Debt payoff timeline updated with correct timing!');
      }
      
    } catch (error) {
      console.error('❌ Error during debt recalculation:', error);
      setDebtRecalculationStatus('Debt recalculation failed. Please try again.');
    } finally {
      setDebtCalculationInProgress(false);
      setPlanLoading(false);
    }
  }, [generateMonths, localGridData, outstandingDebts, strategy, debtCalculationInProgress, calculateDebtPayoffPlanFrontend]);

  // Refresh payoff plan and grids when month window changes (placed after definition to avoid hoisting issue)
  useEffect(() => {
    if (localGridData?.length && outstandingDebts?.length) {
      triggerImmediateDebtRecalculation();
    }
  }, [projectionMonths, historicalMonthsShown]);

  // Real-time debt change handler - triggers recalculation when debts change
  const handleDebtChange = useCallback(async () => {
    console.log('🔄 Debt change detected - triggering real-time recalculation...');
    console.log('Current outstanding debts:', outstandingDebts);
    console.log('Current local grid data length:', localGridData?.length);
    
    // Set loading state for debt recalculation
    setDebtCalculationInProgress(true);
    setDebtRecalculationStatus('🔄 Updating debt calculations and payoff timeline...');
    
    try {
      // Trigger immediate debt payoff recalculation with current data
      await triggerImmediateDebtRecalculation();
      
      // Update debt statistics and UI
      setDebtRecalculationStatus('✅ Debt calculations updated successfully!');
      
      // Clear status after a short delay
      setTimeout(() => {
        setDebtRecalculationStatus('');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error during debt change recalculation:', error);
      setDebtRecalculationStatus('❌ Failed to update debt calculations');
      
      // Clear error status after delay
      setTimeout(() => {
        setDebtRecalculationStatus('');
      }, 5000);
    } finally {
      setDebtCalculationInProgress(false);
    }
  }, [triggerImmediateDebtRecalculation, outstandingDebts, localGridData]);

  // Watch for changes in outstandingDebts to trigger recalculation
  useEffect(() => {
    // Only trigger if we have both debts and grid data, and we're not in the initial loading phase
    if (outstandingDebts?.length >= 0 && localGridData?.length > 0 && !loading && !isInitializingGrid) {
      // Use a small delay to avoid rapid successive calls
      const timeoutId = setTimeout(() => {
        handleDebtChange();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [outstandingDebts, localGridData, loading, isInitializingGrid, handleDebtChange]);

  // ENHANCED: Helper function to get current net savings from grid
  const getCurrentNetSavingsFromGrid = useCallback(() => {
    const netSavingsRow = localGridData.find(row => row.category === 'Net Savings');
    if (!netSavingsRow) return [];
    
    const months = generateMonths();
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    
    return months.map((_, idx) => ({
      month: idx + 1,
      net_savings: netSavingsRow[`month_${idx}`] || 0
    }));
  }, [localGridData]);

  // ENHANCED: Real-time cell edit handler with comprehensive loading states and automatic propagation
  const onCellValueChanged = useCallback(async (params) => {
    const { data, colDef, newValue } = params;
    const colIdx = parseInt(colDef.field.replace('month_', ''));
    if (data.category === 'Net Savings' || data.category === 'Remaining Debt') return;
    
    const months = generateMonths();
    if (!months[colIdx] || months[colIdx].type === 'historical') return;
    
    // Don't process during grid initialization
    if (isInitializingGrid) {
      return;
    }
    
    // ENHANCED: Start comprehensive real-time loading state
    setIsUpdatingCell(true);
    setUpdatingCellInfo({ monthIdx: colIdx, category: data.category, value: newValue });
    setGridUpdating(true);
    setPropagationProgress(0);
    setIsPropagatingChanges(true);

    
    console.log(`🔄 REAL-TIME CELL EDIT: ${data.category} = ${newValue} in ${months[colIdx].label}`);
    
    try {
      // ENHANCED: Record user edit for change tracking
      const editKey = `${colIdx}-${data.category}`;
      setUserEditedCells(prev => {
        const next = new Map(prev);
        next.set(editKey, {
          monthIdx: colIdx,
          category: data.category,
          originalValue: data[colDef.field] || 0,
          newValue: parseFloat(newValue) || 0,
          timestamp: Date.now(),
          isUserEdit: true
        });
        return next;
      });
      
      // ENHANCED: Mark projected month cells as locked when user edits them
      if (months[colIdx].type === 'future') {
        console.log(`🔒 LOCKING FUTURE MONTH: ${months[colIdx].label} ${data.category} = ${newValue}`);
        setLockedCells(prev => {
          const next = { ...prev };
          const setForMonth = new Set(next[colIdx] || []);
          setForMonth.add(data.category);
          next[colIdx] = Array.from(setForMonth);
          console.log(`🔒 Updated locked cells for month ${colIdx}:`, Array.from(setForMonth));
          return next;
        });
      }
      
      // ENHANCED: Update grid data and trigger real-time recalculation
      const updatedGridData = await handleRealTimeGridUpdate(colIdx, data.category, newValue, months);
      
      // Persist the edited cell itself
      if (months[colIdx].type === 'current') {
        await saveMonthChangesDirectly(months[colIdx].month, months[colIdx].year, data.category, parseFloat(newValue) || 0);
      } else if (months[colIdx].type === 'future') {
        // Save projected month edit so it persists and is protected from later refreshes
        await saveMonthChangesDirectly(months[colIdx].month, months[colIdx].year, data.category, parseFloat(newValue) || 0);
      }
      
      // ENHANCED: If current month was edited, propagate to future months
      if (months[colIdx].type === 'current' && data.category !== 'Remaining Debt' && data.category !== 'Net Savings') {
        await propagateCurrentMonthChanges(colIdx, data.category, newValue, months, updatedGridData);
      }
      
      // ENHANCED: Trigger immediate debt payoff recalculation
      await triggerImmediateDebtRecalculation();
      
      // ENHANCED: Update propagation progress
      setPropagationProgress(100);

      
    } catch (error) {
      console.error('❌ Error during real-time cell update:', error);
      setErrorMessage('Failed to update budget data in real-time. Please try again.');
      setShowErrorSnackbar(true);

    } finally {
      // ENHANCED: End all loading states
      setTimeout(() => {
        setIsUpdatingCell(false);
        setUpdatingCellInfo(null);
        setGridUpdating(false);
        setPropagationProgress(0);
        setIsPropagatingChanges(false);
        setPropagationStatus('');
      }, 1000); // Keep success message visible for 1 second
    }
  }, [isInitializingGrid, editableMonths, historicalMonthsShown, handleRealTimeGridUpdate, propagateCurrentMonthChanges, triggerImmediateDebtRecalculation]);

  // Grid ready handler
  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api;
    console.log('✅ AG Grid API captured');
  }, []);

  // Safe grid update function
  const safeUpdateGridData = useCallback((newData) => {
    if (gridApiRef.current?.setRowData) {
      try {
        gridApiRef.current.setRowData([...newData]);
        return true;
      } catch (error) {
        console.error('❌ Error updating grid data:', error);
        return false;
      }
    }
    return false;
  }, []);

  // Recalculate net savings for all months
  const recalculateNetSavings = useCallback((gridData) => {
    if (!gridData?.length) return gridData;
    
    const months = generateMonths();
    const netRow = gridData.find(row => row.category === 'Net Savings');
    if (!netRow) return gridData;
    
    for (let idx = 0; idx < months.length; idx++) {
      const month = months[idx];
      if (month?.type === 'historical') {
        netRow[`month_${idx}`] = 0;
        continue;
      }
      
      let income = 0;
      let expenses = 0;
      let savings = 0;
      
      gridData.forEach(row => {
        const monthValue = parseFloat(row[`month_${idx}`]) || 0;
        if (row.type === 'income') income += monthValue;
        else if (row.type === 'expense') expenses += monthValue;
        else if (row.type === 'savings') savings += monthValue;
      });
      
      netRow[`month_${idx}`] = income - expenses + savings;
    }
    
    return gridData;
  }, [generateMonths]);

  // Real debt calculation using MongoDB backend (fallback)
  const calculateDebtPayoffPlanWithResult = async (monthBudgets, debts, strategyType) => {
    console.log('🔄 Calculating debt payoff plan using MongoDB backend...');
    
    try {
      // Transform debts to match backend format
      const transformedDebts = debts.map(debt => ({
        name: debt.name,
        balance: parseFloat(debt.balance),
        rate: (parseFloat(debt.interest_rate) || 0) / 100 // Convert percentage to decimal
      }));
      
      // Transform month budgets to match backend format
      const monthlyBudgetData = monthBudgets.map(budget => ({
        month: budget.month,
        net_savings: budget.actualNetSavings || 0
      }));
      
      console.log('📊 Sending to debt planner:', {
        strategy: strategyType,
        months: monthBudgets.length,
        debts: transformedDebts,
        monthly_budget_data: monthlyBudgetData
      });
      
      // Call the MongoDB debt planner endpoint
      const response = await axios.post('/api/mongodb/debt-planner/', {
        strategy: strategyType,
        months: monthBudgets.length,
        debts: transformedDebts,
        monthly_budget_data: monthlyBudgetData
      });
      
      console.log('✅ Debt payoff plan calculated successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error calculating debt payoff plan:', error);
      throw error;
    }
  };

  const updateTotalDebtFromPayoffPlan = (gridData, payoffPlan) => {
    console.log('🔄 Updating total debt from payoff plan...');
    console.log('Payoff plan data:', payoffPlan);
    
    if (!payoffPlan || !payoffPlan.plan) {
      console.log('No payoff plan data available');
      return gridData;
    }
    
    // Find the Remaining Debt row
    const debtRow = gridData.find(row => row.category === 'Remaining Debt');
    if (!debtRow) {
      console.log('❌ Remaining Debt row not found in grid');
      console.log('Available categories:', gridData.map(row => row.category));
      return gridData;
    }
    
    console.log('✅ Found Remaining Debt row:', debtRow);
    console.log('Current debt values before update:', Object.keys(debtRow).filter(key => key.startsWith('month_')).map(key => `${key}: ${debtRow[key]}`));
    
    // Update each month with the corresponding debt balance from the payoff plan
    let hasCleared = false;
    payoffPlan.plan.forEach((monthData, index) => {
      if (!monthData || !Array.isArray(monthData.debts)) {
        console.log(`Month ${index}: No valid month data`);
        return;
      }
      
      const targetIdx = typeof monthData.month === 'number' ? monthData.month : index;
      console.log(`Processing month ${targetIdx}, monthData:`, monthData);

      // Calculate total remaining debt for this month
      const totalRemainingDebt = hasCleared ? 0 : monthData.debts.reduce((sum, debt) => sum + (debt.balance || 0), 0);
      if (totalRemainingDebt <= 0.000001) {
        hasCleared = true;
      }
      
      const finalValue = hasCleared ? 0 : totalRemainingDebt;
      debtRow[`month_${targetIdx}`] = finalValue;
      console.log(`Month ${targetIdx}: Total remaining debt = $${finalValue.toFixed(2)}`);
    });
    
    console.log('✅ Updated grid with debt payoff plan data');
    console.log('Final debt values after update:', Object.keys(debtRow).filter(key => key.startsWith('month_')).map(key => `${key}: ${debtRow[key]}`));
    console.log('Updated debt row:', debtRow);
    return gridData;
  };

  const saveMonthChangesDirectly = async (month, year, category, value) => {
    console.log(`💾 Saving ${category} = ${value} for ${month}/${year} to MongoDB...`);
    
    try {
      // First, get existing budget for this month
      const budgetsResponse = await axios.get('/api/mongodb/budgets/');
      const budgets = budgetsResponse.data.budgets || [];
      
      let existingBudget = budgets.find(b => b.month === month && b.year === year);
      
      if (existingBudget) {
        // Update existing budget
        const updateData = { ...existingBudget };
        
        if (category === 'Income') {
          // Adjust primary income to honor edited TOTAL income while keeping additional income unchanged
          const existingAdditional = parseFloat(updateData.additional_income || 0) || 0;
          const editedTotalIncome = parseFloat(value) || 0;
          const newPrimaryIncome = Math.max(0, editedTotalIncome - existingAdditional);
          updateData.income = newPrimaryIncome;
        } else if (category === 'Additional Income') {
          updateData.additional_income = value;
        } else if (category === 'Savings') {
          if (!updateData.savings_items) updateData.savings_items = [];
          updateData.savings_items = [{ name: 'Savings', amount: value, type: 'savings' }];
        } else {
          // Update expense category
          if (!updateData.expenses) updateData.expenses = {};
          updateData.expenses[category.toLowerCase()] = value;
        }
        
        // Update the budget
        await axios.put(`/api/mongodb/budgets/${existingBudget._id}/update/`, updateData);
        console.log(`✅ Updated existing budget for ${month}/${year}`);
        // Update local cache of backend budgets
        setBackendBudgets(prev => {
          const idx = prev.findIndex(b => b._id === existingBudget._id);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = { ...updateData, _id: existingBudget._id };
          return next;
        });
      } else {
        // Create new budget for this month using current month's values as base
        const genMonths = generateMonths();
        const currentIdx = genMonths.findIndex(m => m.type === 'current');
        const getGridValue = (cat) => {
          const row = localGridData.find(r => r.category === cat);
          return row ? (parseFloat(row[`month_${currentIdx}`]) || 0) : 0;
        };
        // Pull current month's income split from backend if available to preserve additional income
        const currentMonthBackend = backendBudgets.find(
          b => b.month === genMonths[currentIdx].month && b.year === genMonths[currentIdx].year
        );
        const currentPrimaryIncome = parseFloat(currentMonthBackend?.income || 0) || 0;
        const currentAdditionalIncome = parseFloat(currentMonthBackend?.additional_income || 0) || 0;
        const baseBudget = {
          month,
          year,
          income: currentPrimaryIncome || Math.max(0, getGridValue('Income') - currentAdditionalIncome),
          additional_income: currentAdditionalIncome,
          expenses: {
            housing: getGridValue('Housing'),
            transportation: getGridValue('Transportation'),
            food: getGridValue('Food'),
            healthcare: getGridValue('Healthcare'),
            entertainment: getGridValue('Entertainment'),
            shopping: getGridValue('Shopping'),
            travel: getGridValue('Travel'),
            education: getGridValue('Education'),
            utilities: getGridValue('Utilities'),
            childcare: getGridValue('Childcare'),
            other: getGridValue('Other'),
            debt_payments: 0
          },
          savings_items: getGridValue('Savings') ? [{ name: 'Savings', amount: getGridValue('Savings'), type: 'savings' }] : [],
          additional_items: [],
          manually_edited_categories: []
        };
        // Override the edited category with the user's value
        if (category === 'Income') {
          const editedTotalIncome = parseFloat(value) || 0;
          baseBudget.income = Math.max(0, editedTotalIncome - (parseFloat(baseBudget.additional_income) || 0));
        }
        else if (category === 'Savings') baseBudget.savings_items = [{ name: 'Savings', amount: value, type: 'savings' }];
        else baseBudget.expenses[category.toLowerCase()] = value;
        baseBudget.manually_edited_categories = [category];

        const createRes = await axios.post('/api/mongodb/budgets/create/', baseBudget);
        const created = createRes?.data?.budget || baseBudget;
        console.log(`✅ Created new budget for ${month}/${year}`);
        // Update local cache of backend budgets
        setBackendBudgets(prev => [...prev, created]);
      }
      
      console.log(`✅ Successfully saved ${category} = ${value} for ${month}/${year} to MongoDB`);
    } catch (error) {
      console.error(`❌ Failed to save ${category} for ${month}/${year}:`, error);
      throw error;
    }
  };

  // Render the enhanced grid with real-time updates
  const renderEnhancedGrid = () => {
    const months = generateMonths();
    
    if (!localGridData?.length) {
      return <div style={{padding: '2rem', color: 'red'}}>No data to display in the table.</div>;
    }

    // Reorder grid data to put Net Savings and Remaining Debt at the top
    const reorderedGridData = [...localGridData];
    const netSavingsIndex = reorderedGridData.findIndex(row => row.category === 'Net Savings');
    const remainingDebtIndex = reorderedGridData.findIndex(row => row.category === 'Remaining Debt');
    
    if (netSavingsIndex > -1) {
      const netSavingsRow = reorderedGridData.splice(netSavingsIndex, 1)[0];
      reorderedGridData.unshift(netSavingsRow);
    }
    
    if (remainingDebtIndex > -1) {
      const remainingDebtRow = reorderedGridData.splice(remainingDebtIndex, 1)[0];
      reorderedGridData.unshift(remainingDebtRow);
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
          if (params.data.category === 'Remaining Debt') return 'remaining-debt-category-cell';
          if (params.data.type === 'income') return 'income-category-cell';
          if (params.data.type === 'expense') return 'expense-category-cell';
          if (params.data.type === 'savings') return 'savings-category-cell';
          return '';
        },
        cellRenderer: params => {
          const { data } = params;
          return (
            <Typography variant="body2" sx={{ 
              fontWeight: data.category === 'Net Savings' || data.category === 'Remaining Debt' ? 'bold' : '600',
              color: data.category === 'Net Savings' ? theme.palette.primary.main : 
                     data.category === 'Remaining Debt' ? theme.palette.warning.main : 'inherit',
              fontSize: '0.95rem'
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
          if (params.data.category === 'Net Savings') return false;
          if (params.data.category === 'Remaining Debt') return false;
          // Explicitly make current month editable
          if (month.type === 'current') return true;
          // Allow projected months; disallow historical months
          return month.type !== 'historical';
        },
        cellClass: params => {
          const classes = [];
          if (month.type === 'historical') classes.push('historical-month-row');
          if (month.type === 'current') classes.push('current-month-row');
          if (month.type === 'future') classes.push('future-month-row');
          if (params.data.category === 'Net Savings') {
            const value = parseFloat(params.value) || 0;
            classes.push(value >= 0 ? 'net-positive-cell' : 'net-negative-cell');
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
          } else if (params.data.type === 'income') {
            color = theme.palette.success.main;
            fontWeight = '600';
          } else if (params.data.type === 'expense') {
            color = theme.palette.error.main;
            fontWeight = '600';
          } else if (params.data.type === 'savings') {
            color = theme.palette.info.main;
            fontWeight = '600';
          }
          
          return (
            <Typography variant="body2" sx={{ color, fontWeight, textAlign: 'right' }}>
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

    return (
      <Box sx={{ 
        width: '100%', 
        overflow: 'auto',
        position: 'relative',
        background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        p: 3,
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        
        {/* ENHANCED: Real-time update progress indicator */}
        {isUpdatingCell && (
          <Fade in={true} timeout={300}>
            <Alert 
              severity="info" 
              sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(66, 165, 245, 0.1))' }}
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">
                    {updatingCellInfo ? `Updating ${updatingCellInfo.category}...` : 'Updating...'}
                  </Typography>
                </Box>
              }
            >
              <strong>Real-Time Update in Progress:</strong> Your changes are being applied across all months and debt calculations are updating automatically!
            </Alert>
          </Fade>
        )}

        {/* ENHANCED: Animated Propagation progress bar */}
        {isPropagatingChanges && (
          <Box sx={{ 
            mb: 3, 
            p: 3, 
            borderRadius: 3,
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(76, 175, 80, 0.1) 100%)' 
              : 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(76, 175, 80, 0.05) 100%)',
            border: isDarkMode 
              ? '1px solid rgba(33, 150, 243, 0.2)' 
              : '1px solid rgba(33, 150, 243, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Animated background */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isDarkMode 
                ? 'linear-gradient(90deg, transparent 0%, rgba(33, 150, 243, 0.1) 50%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(33, 150, 243, 0.05) 50%, transparent 100%)',
              animation: 'shimmer 2s infinite',
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              },
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 }
              },
              '@keyframes bounce': {
                '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                '40%': { transform: 'translateY(-10px)' },
                '60%': { transform: 'translateY(-5px)' }
              },
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
                '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
              },
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              },
              '@keyframes glow': {
                '0%': { textShadow: '0 0 5px rgba(76, 175, 80, 0.5)' },
                '100%': { textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 0 0 30px rgba(76, 175, 80, 0.6)' }
              }
            }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 700,
                  color: isDarkMode ? 'white' : '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '1.1rem',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}
              >
                <Box sx={{
                  animation: propagationProgress <= 35 
                    ? 'bounce 1s ease-in-out infinite' 
                    : propagationProgress <= 70 
                    ? 'shake 0.5s ease-in-out infinite' 
                    : 'spin 2s linear infinite',
                  display: 'inline-block'
                }}>
                  {propagationStatus}
                </Box>
                <Box sx={{
                  ml: 'auto',
                  fontWeight: 600,
                  color: isDarkMode ? '#4caf50' : '#2e7d32',
                  fontSize: '1.2rem',
                  animation: 'glow 2s ease-in-out infinite alternate'
                }}>
                  {propagationProgress}%
                </Box>
              </Typography>
              
              <Box sx={{ position: 'relative' }}>
                <LinearProgress 
                  variant="determinate" 
                  value={propagationProgress} 
                  sx={{ 
                    height: 12, 
                    borderRadius: 6,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      background: propagationProgress <= 35 
                        ? 'linear-gradient(90deg, #ff9800 0%, #ffc107 100%)' // Orange for Processing
                        : propagationProgress <= 70 
                        ? 'linear-gradient(90deg, #2196f3 0%, #03a9f4 100%)' // Blue for Updating
                        : 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)', // Green for Loading
                      transition: 'all 0.3s ease'
                    }
                  }}
                />
                
                {/* Progress indicators */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 1,
                  px: 1
                }}>
                  <Typography variant="caption" sx={{ 
                    color: propagationProgress >= 35 ? (isDarkMode ? '#4caf50' : '#2e7d32') : (isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    fontWeight: propagationProgress >= 35 ? 600 : 400,
                    transition: 'all 0.3s ease'
                  }}>
                    🏃‍♂️ Processing
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: propagationProgress >= 70 ? (isDarkMode ? '#4caf50' : '#2e7d32') : (isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    fontWeight: propagationProgress >= 70 ? 600 : 400,
                    transition: 'all 0.3s ease'
                  }}>
                    ⚡ Updating
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: propagationProgress >= 100 ? (isDarkMode ? '#4caf50' : '#2e7d32') : (isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    fontWeight: propagationProgress >= 100 ? 600 : 400,
                    transition: 'all 0.3s ease'
                  }}>
                    🔄 Loading
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* ENHANCED: Debt recalculation status */}
        {debtRecalculationStatus && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {planLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              <Typography variant="body2">
                {debtRecalculationStatus}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Smart editing info */}
        <Fade in={true} timeout={800}>
          <Alert 
            icon={<LightbulbIcon sx={{ color: '#4fc3f7' }} />}
            severity="info" 
            sx={{ mb: 3 }}
          >
            <strong>Smart Real-Time Editing:</strong> Edit any cell and watch your changes automatically propagate to future months while updating debt payoff calculations instantly!
          </Alert>
        </Fade>

        {/* Enhanced AG Grid */}
        
        {/* Enhanced AG Grid */}
        <Box 
          sx={{
            width: '100%', 
            borderRadius: 3,
            overflow: 'visible',
            background: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            position: 'relative',
            '& .ag-theme-alpine': {
              '& .ag-header': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '& .ag-header-cell': {
                  borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '12px 8px',
                  fontWeight: 'bold'
                }
              },
              '& .ag-row': {
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                '& .ag-cell': {
                  borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end'
                },
                '&.historical-month-row': {
                  backgroundColor: '#424242 !important',
                  color: 'white !important',
                  '& .ag-cell': {
                    backgroundColor: '#424242 !important',
                    color: 'white !important',
                    borderRight: '1px solid rgba(255, 255, 255, 0.2) !important'
                  }
                },
                '&.current-month-row': {
                  backgroundColor: '#d32f2f !important',
                  color: 'white !important',
                  '& .ag-cell': {
                    backgroundColor: '#d32f2f !important',
                    color: 'white !important',
                    borderRight: '1px solid rgba(255, 255, 255, 0.2) !important'
                  }
                },
                '&.future-month-row': {
                  backgroundColor: '#2e7d32 !important',
                  color: 'white !important',
                  '& .ag-cell': {
                    backgroundColor: '#2e7d32 !important',
                    color: 'white !important',
                    borderRight: '1px solid rgba(255, 255, 255, 0.2) !important'
                  }
                }
              },
              '& .ag-pinned-left': {
                backgroundColor: theme.palette.grey[100],
                '& .ag-cell': {
                  backgroundColor: theme.palette.grey[100],
                  fontWeight: 'bold',
                  justifyContent: 'flex-start'
                }
              },
              // Enhanced horizontal scrolling styles
              '& .ag-body-horizontal-scroll': {
                backgroundColor: theme.palette.grey[200],
                '& .ag-body-horizontal-scroll-viewport': {
                  backgroundColor: theme.palette.grey[200]
                }
              },
              '& .ag-body-horizontal-scroll-minimum': {
                backgroundColor: theme.palette.grey[200]
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
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  padding: 3,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              >
                <CircularProgress size={40} />
                <Typography variant="h6">
                  Updating budget projection in real-time...
                </Typography>
              </Box>
            </Box>
          )}
          
          <div className="ag-theme-alpine" style={{ width: '100%', overflowX: 'auto' }}>
            <AgGridReact
              key={`budget-grid-${historicalMonthsShown}-${projectionMonths}-${gridUpdateCounter.current}-${gridForceUpdate}`}
              rowData={reorderedGridData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              onGridReady={onGridReady}
              onCellValueChanged={onCellValueChanged}
              suppressMovableColumns={true}
              suppressMenuHide={true}
              stopEditingWhenCellsLoseFocus={true}
              singleClickEdit={true}
              defaultColDef={{ 
                resizable: false, 
                suppressSizeToFit: true, 
                suppressAutoSize: true, 
                minWidth: 120, 
                width: 120, 
                maxWidth: 120 
              }}
              headerHeight={48}
              suppressColumnVirtualisation={false}
              rowHeight={72}
              cellSelection={false}
              rowSelection={{ enableClickSelection: false }}
              theme="legacy"
              // Enable horizontal scrolling
              suppressHorizontalScroll={false}
              // Pin the category column for better readability
              suppressColumnMoveAnimation={true}
            />
          </div>
        </Box>
      </Box>
    );
  };

  // Utility functions
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate debt statistics from real-time grid data
  const calculateDebtStatistics = () => {
    if (!localGridData || localGridData.length === 0) {
      return {
        totalDebt: 0,
        totalInterest: 0,
        debtFreeDate: null,
        monthsToPayoff: 0,
        avgInterestRate: 0,
        totalMonthlyPayments: 0,
        debtCount: 0
      };
    }

    // Get current month index
    const months = generateMonths();
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    
    // Get current total debt from grid
    const remainingDebtRow = localGridData.find(row => row.category === 'Remaining Debt');
    const currentTotalDebt = currentMonthIdx !== -1 ? (remainingDebtRow?.[`month_${currentMonthIdx}`] || 0) : 0;
    
    // Calculate total interest from payoff plan
    let totalInterest = 0;
    let debtFreeDate = null;
    let monthsToPayoff = 0;
    
    if (payoffPlan && payoffPlan.length > 0) {
      // Sum all interest paid across the payoff plan
      totalInterest = payoffPlan.reduce((sum, month) => {
        return sum + (month.interestPaid || 0);
      }, 0);
      
      // Find when debt becomes 0
      const lastDebtMonth = payoffPlan[payoffPlan.length - 1];
      if (lastDebtMonth && lastDebtMonth.remainingDebt === 0) {
        monthsToPayoff = payoffPlan.length;
        const currentDate = new Date();
        debtFreeDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthsToPayoff, 1);
      }
    }

    // Calculate average interest rate from outstanding debts
    const avgInterestRate = outstandingDebts.length > 0 
      ? outstandingDebts.reduce((sum, debt) => {
          const rate = parseFloat(debt.interest_rate || debt.rate) || 0;
          return sum + rate;
        }, 0) / outstandingDebts.length
      : 0;

    // Calculate total monthly payments from grid net savings
    const netSavingsRow = localGridData.find(row => row.category === 'Net Savings');
    const currentNetSavings = currentMonthIdx !== -1 ? (netSavingsRow?.[`month_${currentMonthIdx}`] || 0) : 0;
    
    // Estimate monthly payments as net savings (since that's what goes toward debt)
    const totalMonthlyPayments = Math.max(0, currentNetSavings);

    return {
      totalDebt: currentTotalDebt,
      totalInterest,
      debtFreeDate,
      monthsToPayoff,
      avgInterestRate,
      totalMonthlyPayments,
      debtCount: outstandingDebts.length
    };
  };

  // Calculate potential savings with different strategies using real grid data
  const calculateStrategySavings = () => {
    const stats = calculateDebtStatistics();
    const currentTotalInterest = stats.totalInterest;
    
    // If no interest calculated, return zeros
    if (currentTotalInterest === 0) {
      return {
        snowball: 0,
        avalanche: 0,
        snowballSavings: 0,
        avalancheSavings: 0
      };
    }
    
    // Calculate actual strategy differences based on current payoff plan
    // If we have a payoff plan, use it to determine current strategy effectiveness
    let snowballSavings = 0;
    let avalancheSavings = 0;
    
    if (payoffPlan && payoffPlan.length > 0) {
      // Current strategy is likely snowball (smallest debts first)
      // Calculate potential avalanche savings by comparing interest rates
      const highInterestDebts = outstandingDebts.filter(debt => {
        const rate = parseFloat(debt.interest_rate || debt.rate) || 0;
        return rate > stats.avgInterestRate;
      });
      
      const lowInterestDebts = outstandingDebts.filter(debt => {
        const rate = parseFloat(debt.interest_rate || debt.rate) || 0;
        return rate <= stats.avgInterestRate;
      });
      
      // Estimate savings from paying high-interest debts first
      if (highInterestDebts.length > 0 && lowInterestDebts.length > 0) {
        avalancheSavings = currentTotalInterest * 0.15; // Conservative estimate
        snowballSavings = currentTotalInterest * 0.05; // Minimal savings
      } else {
        avalancheSavings = currentTotalInterest * 0.10;
        snowballSavings = currentTotalInterest * 0.05;
      }
    } else {
      // Fallback estimates
      avalancheSavings = currentTotalInterest * 0.15;
      snowballSavings = currentTotalInterest * 0.05;
    }
    
    return {
      snowball: currentTotalInterest - snowballSavings,
      avalanche: currentTotalInterest - avalancheSavings,
      snowballSavings,
      avalancheSavings
        };
  };

  // CRUD Operations for Debts
  const openDebtDialog = (debt = null) => {
    if (debt) {
      setEditingDebt(debt);
      setDebtFormData({
        name: debt.name || '',
        debt_type: debt.debt_type || 'credit_card',
        balance: debt.balance || debt.amount || '',
        interest_rate: debt.interest_rate || debt.rate || '',
        payoff_date: debt.payoff_date || ''
      });
    } else {
      setEditingDebt(null);
      setDebtFormData({
        name: '',
        debt_type: 'credit_card',
        balance: '',
        interest_rate: '',
        payoff_date: ''
      });
    }
    setDebtDialogOpen(true);
  };

  const closeDebtDialog = () => {
    setDebtDialogOpen(false);
    setEditingDebt(null);
    setDebtFormData({
      name: '',
      debt_type: 'credit_card',
      balance: '',
      interest_rate: '',
      payoff_date: ''
    });
  };

  const handleDebtFormChange = (field, value) => {
    setDebtFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveDebt = async () => {
    try {
      setDebtFormLoading(true);
      
      const debtData = {
        name: debtFormData.name,
        debt_type: debtFormData.debt_type,
        amount: parseFloat(debtFormData.balance) || 0,
        balance: parseFloat(debtFormData.balance) || 0,
        interest_rate: parseFloat(debtFormData.interest_rate) || 0,
        rate: parseFloat(debtFormData.interest_rate) || 0,
        minimum_payment: 0, // Default minimum payment
        payoff_date: debtFormData.payoff_date || null,
        effective_date: new Date().toISOString().split('T')[0]
      };

      console.log('Sending debt data:', debtData);
      console.log('Auth token:', localStorage.getItem('access_token'));
      console.log('API URL:', process.env.REACT_APP_API_URL || 'http://localhost:8000');
      
      // Check if user is authenticated
      const token = localStorage.getItem('access_token');
      if (!token) {
        setErrorMessage('Please log in to manage debts. Go to the login page and sign in with your credentials.');
        setShowErrorSnackbar(true);
        return;
      }

      if (editingDebt) {
        // Update existing debt
        const response = await axios.put(`/api/mongodb/debts/${editingDebt.id || editingDebt._id}/update/`, debtData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Update response:', response.data);
        setSuccessMessage('Debt updated successfully!');
      } else {
        // Create new debt
        const response = await axios.post('/api/mongodb/debts/create/', debtData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Create response:', response.data);
        setSuccessMessage('Debt added successfully!');
      }

      setShowSuccessSnackbar(true);
      closeDebtDialog();
      
      // Reload the page to ensure both grids show updated values
      console.log('Reloading page after debt operation...');
      window.location.reload();
      
    } catch (error) {
      console.error('Error saving debt:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = editingDebt ? 'Failed to update debt' : 'Failed to add debt';
      if (error.response?.data?.error) {
        errorMessage += `: ${error.response.data.error}`;
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data. Please check your input.';
      }
      
      setErrorMessage(errorMessage);
      setShowErrorSnackbar(true);
    } finally {
      setDebtFormLoading(false);
    }
  };

  const deleteDebt = async (debt) => {
    setDeleteConfirmDialog({
      open: true,
      debt: debt
    });
  };

  const confirmDeleteDebt = async () => {
    const debt = deleteConfirmDialog.debt;
    if (!debt) return;

    try {
      setDebtFormLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('access_token');
      if (!token) {
        setErrorMessage('Please log in to manage debts. Go to the login page and sign in with your credentials.');
        setShowErrorSnackbar(true);
        return;
      }
      
      console.log('Deleting debt with ID:', debt.id || debt._id);
      const response = await axios.delete(`/api/mongodb/debts/${debt.id || debt._id}/delete/`);
      console.log('Delete response:', response.data);
      
      setSuccessMessage('Debt deleted successfully!');
      setShowSuccessSnackbar(true);
      
      // Close dialog
      setDeleteConfirmDialog({ open: false, debt: null });
      
      // Reload the page to ensure both grids show updated values
      console.log('Reloading page after debt deletion...');
      window.location.reload();
      
    } catch (error) {
      console.error('Error deleting debt:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to delete debt';
      if (error.response?.data?.error) {
        errorMessage += `: ${error.response.data.error}`;
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Debt not found. It may have already been deleted.';
      }
      
      setErrorMessage(errorMessage);
      setShowErrorSnackbar(true);
    } finally {
      setDebtFormLoading(false);
    }
  };

  const cancelDeleteDebt = () => {
    setDeleteConfirmDialog({ open: false, debt: null });
  };

  // Render Debt Payoff Timeline Grid
  const renderDebtPayoffTimeline = () => {
    // Always show the timeline, even if no payoff plan exists yet
    const months = generateMonths();
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    
    // Get net savings from the actual budget grid data
    const netSavingsRow = localGridData.find(row => row.category === 'Net Savings');
    
    // If no payoff plan exists, create a basic one for display
    let displayPayoffPlan = payoffPlan;
    if (!payoffPlan || !payoffPlan.plan) {
      // Create a basic plan structure for display
      displayPayoffPlan = {
        plan: months.map((_, idx) => ({
          month: idx,
          debts: outstandingDebts.map(debt => ({
            name: debt.name,
            balance: idx >= currentMonthIdx ? parseFloat(debt.balance) || 0 : parseFloat(debt.balance) || 0,
            paid: 0,
            interest: 0
          }))
        }))
      };
    }

    // Ensure months beyond DB window inherit current month values for Net Savings and propagate into payoff plan display
    if (netSavingsRow && currentMonthIdx !== -1) {
      const currentNet = netSavingsRow[`month_${currentMonthIdx}`] || 0;
      months.forEach((_, idx) => {
        const val = netSavingsRow[`month_${idx}`];
        if (typeof val !== 'number' || isNaN(val)) {
          netSavingsRow[`month_${idx}`] = currentNet;
        }
      });
    }
    
    // Calculate total debt for historical months
    const totalDebt = outstandingDebts.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
    
    // Create grid data in the same format as Budget Projection
    const gridData = [
      {
        category: 'Net Savings',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => ({ 
          ...acc, 
          [`month_${idx}`]: netSavingsRow ? (netSavingsRow[`month_${idx}`] || 0) : 0
        }), {})
      },
      {
        category: 'Total Paid to Debt',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => ({ 
          ...acc, 
          [`month_${idx}`]: idx >= currentMonthIdx 
            ? (displayPayoffPlan.plan[idx - currentMonthIdx]?.totalPaid ?? (displayPayoffPlan.plan[idx - currentMonthIdx]?.debts?.reduce((sum, debt) => sum + (debt.paid || 0), 0) || 0))
            : 0
        }), {})
      },
      {
        category: 'Interest Paid',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => ({ 
          ...acc, 
          [`month_${idx}`]: idx >= currentMonthIdx 
            ? (displayPayoffPlan.plan[idx - currentMonthIdx]?.totalInterest ?? (displayPayoffPlan.plan[idx - currentMonthIdx]?.debts?.reduce((sum, debt) => sum + (debt.interest || 0), 0) || 0))
            : 0
        }), {})
      },
      {
        category: 'Remaining Debt',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => { 
          const planIdx = idx - currentMonthIdx;
          let value = idx >= currentMonthIdx ? (displayPayoffPlan.plan[planIdx]?.debts?.reduce((sum, debt) => sum + (debt.balance || 0), 0) || 0) : parseFloat(totalDebt) || 0;
          // Keep zero sticky after clearance
          if (idx > currentMonthIdx) {
            const prev = acc[`month_${idx - 1}`];
            if (typeof prev === 'number' && prev <= 0) value = 0;
          }
          return { ...acc, [`month_${idx}`]: value };
        }, {})
      }
    ];

    // Add individual debt rows starting from current month
    if (outstandingDebts.length > 0) {
      outstandingDebts.forEach(debt => {
        const debtRow = {
          category: debt.name,
          type: 'debt',
          ...months.reduce((acc, _, idx) => { 
            const planIdx = idx - currentMonthIdx;
            let value = idx >= currentMonthIdx ? 
              (displayPayoffPlan.plan[planIdx]?.debts?.find(d => d.name === debt.name)?.balance || 0) : 
              parseFloat(debt.balance) || 0;
            if (idx > currentMonthIdx) {
              const prev = acc[`month_${idx - 1}`];
              if (typeof prev === 'number' && prev <= 0) value = 0;
            }
            return { ...acc, [`month_${idx}`]: value };
          }, {})
        };
        gridData.push(debtRow);
      });
    }

    // Build AG Grid columns for Debt Payoff Timeline (same as Budget Projection)
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
          if (params.data.category === 'Remaining Debt') return 'remaining-debt-category-cell';
          if (params.data.type === 'calculated') return 'calculated-category-cell';
          if (params.data.type === 'debt') return 'debt-category-cell';
          return '';
        },
        cellRenderer: params => {
          const { data } = params;
          return (
            <Typography variant="body2" sx={{ 
              fontWeight: data.category === 'Net Savings' || data.category === 'Remaining Debt' ? 'bold' : '600',
              color: data.category === 'Net Savings' ? theme.palette.success.main : 
                     data.category === 'Remaining Debt' ? theme.palette.warning.main :
                     data.type === 'debt' ? theme.palette.error.main : 'inherit',
              fontSize: '0.95rem'
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
        editable: false, // Timeline grid is read-only
        cellClass: params => {
          const classes = [];
          if (month.type === 'historical') classes.push('historical-month-row');
          if (month.type === 'current') classes.push('current-month-row');
          if (month.type === 'future') classes.push('future-month-row');
          if (params.data.category === 'Net Savings') {
            const value = parseFloat(params.value) || 0;
            classes.push(value >= 0 ? 'net-positive-cell' : 'net-negative-cell');
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
          } else if (params.data.type === 'calculated') {
            color = theme.palette.info.main;
            fontWeight = '600';
          } else if (params.data.type === 'debt') {
            color = theme.palette.error.main;
            fontWeight = '600';
          }
          
          return (
            <Typography variant="body2" sx={{ color, fontWeight, textAlign: 'right' }}>
              {formatCurrency(value)}
            </Typography>
          );
        }
      });
    });

    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" color="primary">
            Strategy: {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => setStrategy(strategy === 'snowball' ? 'avalanche' : 'snowball')}
              disabled={debtCalculationInProgress}
            >
              Switch to {strategy === 'snowball' ? 'Avalanche' : 'Snowball'} Strategy
            </Button>
          </Box>
        </Box>
        
        {/* Status and Progress Display */}
        {debtRecalculationStatus && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.contrastText">
              {debtRecalculationStatus}
            </Typography>
          </Box>
        )}
        
        {/* Debt Payoff Timeline AG-Grid - Same format as Budget Projection */}
        <Box 
          sx={{
            width: '100%', 
            borderRadius: 3,
            overflow: 'visible',
            background: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            position: 'relative',
            '& .ag-theme-alpine': {
              '& .ag-header': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '& .ag-header-cell': {
                  borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '12px 8px',
                  fontWeight: 'bold'
                }
              },
              '& .ag-row': {
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                '& .ag-cell': {
                  borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end'
                },
                '&.historical-month-row': {
                  backgroundColor: '#424242 !important',
                  color: 'white !important',
                  '& .ag-cell': {
                    backgroundColor: '#424242 !important',
                    color: 'white !important',
                    borderRight: '1px solid rgba(255, 255, 255, 0.2) !important'
                  }
                },
                '&.current-month-row': {
                  backgroundColor: '#d32f2f !important',
                  color: 'white !important',
                  '& .ag-cell': {
                    backgroundColor: '#d32f2f !important',
                    color: 'white !important',
                    borderRight: '1px solid rgba(255, 255, 255, 0.2) !important'
                  }
                },
                '&.future-month-row': {
                  backgroundColor: '#2e7d32 !important',
                  color: 'white !important',
                  '& .ag-cell': {
                    backgroundColor: '#2e7d32 !important',
                    color: 'white !important',
                    borderRight: '1px solid rgba(255, 255, 255, 0.2) !important'
                  }
                }
              },
              '& .ag-pinned-left': {
                backgroundColor: theme.palette.grey[100],
                '& .ag-cell': {
                  backgroundColor: theme.palette.grey[100],
                  fontWeight: 'bold',
                  justifyContent: 'flex-start'
                }
              },
              // Enhanced horizontal scrolling styles
              '& .ag-body-horizontal-scroll': {
                backgroundColor: theme.palette.grey[200],
                '& .ag-body-horizontal-scroll-viewport': {
                  backgroundColor: theme.palette.grey[200]
                }
              },
              '& .ag-body-horizontal-scroll-minimum': {
                backgroundColor: theme.palette.grey[200]
              }
            }
          }}
        >
          <div className="ag-theme-alpine" style={{ width: '100%', overflowX: 'auto' }}>
            <AgGridReact
              key={`timeline-grid-${historicalMonthsShown}-${projectionMonths}-${gridUpdateCounter.current}-${gridForceUpdate}`}
              rowData={gridData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              suppressMovableColumns={true}
              suppressMenuHide={true}
              defaultColDef={{ 
                resizable: false, 
                suppressSizeToFit: true, 
                suppressAutoSize: true, 
                minWidth: 120, 
                width: 120, 
                maxWidth: 120 
              }}
              headerHeight={48}
              suppressColumnVirtualisation={false}
              rowHeight={72}
              cellSelection={false}
              rowSelection={{ enableClickSelection: false }}
              theme="legacy"
              // Enable horizontal scrolling
              suppressHorizontalScroll={false}
              // Pin the category column for better readability
              suppressColumnMoveAnimation={true}
            />
          </div>
        </Box>
        
        {debtCalculationInProgress && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2" color="textSecondary">
              Calculating debt payoff plan...
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Show loading while initializing
  if (loading || isInitializingGrid) {
    return <Loading message="Loading enhanced debt planning..." />;
  }

  // Main render
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Enhanced Debt Planning with Real-Time Updates
      </Typography>
      
      <Tabs value={selectedTabIndex} onChange={(_, newValue) => setSelectedTabIndex(newValue)} sx={{ mb: 3 }}>
        <Tab label="Budget Projection" />
        <Tab label="Debt Overview" />
        <Tab label="Payoff Strategies" />
      </Tabs>

      {selectedTabIndex === 0 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Editable Budget Projection with Real-Time Updates
          </Typography>
          
          {/* Month Range Controls */}
          <Box sx={{ mb: 3, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: '120px' }}>
                Historical Months:
              </Typography>
              <TextField
                type="number"
                size="small"
                value={historicalMonthsShown}
                onChange={(e) => setHistoricalMonthsShown(Math.max(0, parseInt(e.target.value) || 0))}
                inputProps={{ min: 0, max: 12, style: { width: '60px' } }}
                sx={{ width: '80px' }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: '120px' }}>
                Projected Months:
              </Typography>
              <TextField
                type="number"
                size="small"
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(Math.max(1, Math.min(maxProjectionMonths, parseInt(e.target.value) || 12)))}
                inputProps={{ min: 1, max: maxProjectionMonths, style: { width: '60px' } }}
                sx={{ width: '80px' }}
              />
            </Box>
            
            <Typography variant="caption" color="textSecondary">
              Total: {historicalMonthsShown + 1 + projectionMonths} months 
              ({historicalMonthsShown} past + 1 current + {projectionMonths} future)
            </Typography>
          </Box>
          
          {renderEnhancedGrid()}
        </Card>
      )}

      {selectedTabIndex === 1 && (
        <Card sx={{
          background: isDarkMode 
            ? 'rgba(26, 26, 26, 0.9)'
            : 'rgba(255, 255, 255, 0.9)',
          border: isDarkMode 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 3
        }}>
          <Card sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  background: '#2196f3',
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
                    onClick={loadInitialData}
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
                  ? 'rgba(26, 26, 26, 0.9)'
                  : 'rgba(255, 255, 255, 0.9)',
                border: isDarkMode 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
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
              </Paper>
            ) : !localStorage.getItem('access_token') ? (
              <Paper sx={{ 
                p: 4, 
                textAlign: 'center',
                background: isDarkMode 
                  ? 'rgba(26, 26, 26, 0.9)'
                  : 'rgba(255, 255, 255, 0.9)',
                border: isDarkMode 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 3,
                mb: 3
              }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" sx={{ mb: 2, opacity: 0.7 }}>
                    🔐
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: isDarkMode ? 'white' : '#2c3e50', 
                    fontWeight: 600, 
                    mb: 1 
                  }}>
                    Authentication Required
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.7)' 
                      : 'rgba(44, 62, 80, 0.7)'
                  }}>
                    Please log in to manage your debts. Use the login page to sign in with your credentials.
                  </Typography>
                </Box>
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
                            const balance = parseFloat(debt.balance || debt.amount) || 0;
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
                            const balance = parseFloat(debt.balance || debt.amount) || 0;
                            const interestRate = parseFloat(debt.interest_rate || debt.rate) || 0;
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
                                const interestRate = parseFloat(debt.interest_rate || debt.rate) || 0;
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
                
                {/* Debt Recalculation Status */}
                {debtRecalculationStatus && (
                  <Alert 
                    severity={debtRecalculationStatus.includes('✅') ? 'success' : debtRecalculationStatus.includes('❌') ? 'error' : 'info'}
                    sx={{ 
                      mb: 3,
                      background: debtRecalculationStatus.includes('✅') 
                        ? 'rgba(76, 175, 80, 0.1)' 
                        : debtRecalculationStatus.includes('❌') 
                        ? 'rgba(244, 67, 54, 0.1)' 
                        : 'rgba(33, 150, 243, 0.1)',
                      border: debtRecalculationStatus.includes('✅') 
                        ? '1px solid rgba(76, 175, 80, 0.3)' 
                        : debtRecalculationStatus.includes('❌') 
                        ? '1px solid rgba(244, 67, 54, 0.3)' 
                        : '1px solid rgba(33, 150, 243, 0.3)',
                      color: isDarkMode ? 'white' : '#2c3e50'
                    }}
                    action={
                      debtCalculationInProgress && (
                        <CircularProgress size={20} />
                      )
                    }
                  >
                    {debtRecalculationStatus}
                  </Alert>
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
                        <Box sx={{ 
                          bgcolor: '#2196f3', 
                          mr: 2,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <AccountBalanceIcon sx={{ color: 'white' }} />
                        </Box>
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
                        <CircularProgress size={60} sx={{ color: '#2196f3', mb: 2 }} />
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
                        <Box sx={{ 
                          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(76, 175, 80, 0.1)', 
                          width: 80, 
                          height: 80, 
                          mb: 3,
                          mx: 'auto',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                        </Box>
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
                                  : '0 12px 32px rgba(0, 0, 0, 0.15)'
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
                                  label={debt.debt_type?.replace('_', ' ').toUpperCase() || 'OTHER'}
                                  size="small"
                                  sx={{
                                    background: '#616161',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    height: 24
                                  }}
                                />
                              </Box>

                              {/* Card Content */}
                              <Box sx={{ p: 4, pt: 5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                                      color: '#f44336',
                                      fontSize: '1.5rem'
                                    }}>
                                      {formatCurrency(parseFloat(debt.balance || debt.amount) || 0)}
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
                                      label={`${(parseFloat(debt.interest_rate || debt.rate) || 0).toFixed(2)}%`}
                                      size="small"
                                      sx={{
                                        background: (parseFloat(debt.interest_rate || debt.rate) || 0) > 20 
                                          ? '#f44336'
                                          : (parseFloat(debt.interest_rate || debt.rate) || 0) > 15 
                                            ? '#f44336'
                                            : '#2196f3',
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
                                      {formatCurrency((parseFloat(debt.balance || debt.amount) || 0) * ((parseFloat(debt.interest_rate || debt.rate) || 0) / 100 / 12))}
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Action Buttons */}
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: 1, 
                                  justifyContent: 'center',
                                  mt: 2
                                }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => openDebtDialog(debt)}
                                    sx={{
                                      color: '#2196f3',
                                      background: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                      '&:hover': {
                                        background: isDarkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                                        transform: 'scale(1.1)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => deleteDebt(debt)}
                                    sx={{
                                      color: '#f44336',
                                      background: isDarkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                      '&:hover': {
                                        background: isDarkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                        transform: 'scale(1.1)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Card>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Card>
              </Box>
            )}
          </Card>
        </Card>
      )}

      {selectedTabIndex === 2 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Debt Payoff Timeline & Strategies
          </Typography>
          
          {/* Month Range Controls - Same as Budget Projection */}
          <Box sx={{ mb: 3, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: '120px' }}>
                Historical Months:
              </Typography>
              <TextField
                type="number"
                size="small"
                value={historicalMonthsShown}
                onChange={(e) => setHistoricalMonthsShown(Math.max(0, parseInt(e.target.value) || 0))}
                inputProps={{ min: 0, max: 12, style: { width: '60px' } }}
                sx={{ width: '80px' }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: '120px' }}>
                Projected Months:
              </Typography>
              <TextField
                type="number"
                size="small"
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(Math.max(1, Math.min(maxProjectionMonths, parseInt(e.target.value) || 12)))}
                inputProps={{ min: 1, max: maxProjectionMonths, style: { width: '60px' } }}
                sx={{ width: '80px' }}
              />
            </Box>
            
            <Typography variant="caption" color="textSecondary">
              Total: {historicalMonthsShown + 1 + projectionMonths} months 
              ({historicalMonthsShown} past + 1 current + {projectionMonths} future)
            </Typography>
          </Box>
          
          {renderDebtPayoffTimeline()}
        </Card>
      )}

      {/* Success/Error Snackbars */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccessSnackbar(false)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={8000}
        onClose={() => setShowErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowErrorSnackbar(false)} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Debt Form Dialog */}
      <Dialog 
        open={debtDialogOpen} 
        onClose={closeDebtDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: isDarkMode ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          color: isDarkMode ? 'white' : '#2c3e50',
          fontWeight: 'bold',
          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          pb: 2
        }}>
          {editingDebt ? 'Edit Debt' : 'Add New Debt'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Debt Name */}
            <TextField
              label="Debt Name"
              value={debtFormData.name}
              onChange={(e) => handleDebtFormChange('name', e.target.value)}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196f3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? 'white' : '#2c3e50',
                },
              }}
            />

            {/* Debt Type */}
            <FormControl fullWidth required>
              <InputLabel sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&.Mui-focused': {
                  color: '#2196f3',
                },
              }}>
                Debt Type
              </InputLabel>
              <Select
                value={debtFormData.debt_type}
                onChange={(e) => handleDebtFormChange('debt_type', e.target.value)}
                label="Debt Type"
                sx={{
                  color: isDarkMode ? 'white' : '#2c3e50',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2196f3',
                  },
                  '& .MuiSvgIcon-root': {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  },
                }}
              >
                {debtTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Balance */}
            <TextField
              label="Current Balance"
              type="number"
              value={debtFormData.balance}
              onChange={(e) => handleDebtFormChange('balance', e.target.value)}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196f3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? 'white' : '#2c3e50',
                },
              }}
            />

            {/* Interest Rate */}
            <TextField
              label="Interest Rate (%)"
              type="number"
              value={debtFormData.interest_rate}
              onChange={(e) => handleDebtFormChange('interest_rate', e.target.value)}
              fullWidth
              required
              inputProps={{ min: 0, max: 100, step: 0.01 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196f3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? 'white' : '#2c3e50',
                },
              }}
            />



            {/* Payoff Date */}
            <TextField
              label="Target Payoff Date (Optional)"
              type="date"
              value={debtFormData.payoff_date}
              onChange={(e) => handleDebtFormChange('payoff_date', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196f3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? 'white' : '#2c3e50',
                },
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          gap: 2
        }}>
          <Button 
            onClick={closeDebtDialog}
            disabled={debtFormLoading}
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              '&:hover': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={saveDebt}
            variant="contained"
            disabled={debtFormLoading || !debtFormData.name || !debtFormData.balance || !debtFormData.interest_rate}
            sx={{
              background: '#2196f3',
              color: 'white',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
              '&:hover': {
                background: '#1976d2',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
                transform: 'none',
                boxShadow: 'none'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {debtFormLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                {editingDebt ? 'Updating...' : 'Adding...'}
              </Box>
            ) : (
              editingDebt ? 'Update Debt' : 'Add Debt'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmDialog.open} 
        onClose={cancelDeleteDebt}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: isDarkMode ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          color: isDarkMode ? 'white' : '#2c3e50',
          fontWeight: 'bold',
          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{
            p: 1,
            borderRadius: '50%',
            bgcolor: 'error.light',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DeleteIcon />
          </Box>
          Confirm Delete
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ 
            color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            mb: 2
          }}>
            Are you sure you want to delete this debt?
          </Typography>
          
          {deleteConfirmDialog.debt && (
            <Box sx={{ 
              p: 2, 
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: 2,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
            }}>
              <Typography variant="h6" sx={{ 
                color: isDarkMode ? 'white' : '#2c3e50',
                fontWeight: 'bold',
                mb: 1
              }}>
                {deleteConfirmDialog.debt.name}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                mb: 0.5
              }}>
                Type: {deleteConfirmDialog.debt.debt_type?.replace('_', ' ').toUpperCase() || 'OTHER'}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                mb: 0.5
              }}>
                Balance: {formatCurrency(parseFloat(deleteConfirmDialog.debt.balance || deleteConfirmDialog.debt.amount) || 0)}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
              }}>
                Interest Rate: {(parseFloat(deleteConfirmDialog.debt.interest_rate || deleteConfirmDialog.debt.rate) || 0).toFixed(2)}%
              </Typography>
            </Box>
          )}
          
          <Typography variant="body2" sx={{ 
            color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
            mt: 2,
            fontStyle: 'italic'
          }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          gap: 2
        }}>
          <Button 
            onClick={cancelDeleteDebt}
            disabled={debtFormLoading}
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              '&:hover': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteDebt}
            variant="contained"
            disabled={debtFormLoading}
            sx={{
              background: '#f44336',
              color: 'white',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
              '&:hover': {
                background: '#d32f2f',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
                transform: 'none',
                boxShadow: 'none'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {debtFormLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                Deleting...
              </Box>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DebtPlanning; 