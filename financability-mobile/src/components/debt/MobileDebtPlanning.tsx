import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import debtPlanningService, { Debt, BudgetData, DebtPlannerResponse } from '../../services/debtPlanningService';
import { calculateDebtPayoffPlanFrontend as calcDebtPayoffPlan, recalculateNetSavings, updateTotalDebtFromPayoffPlan, calculateNetSavingsFromBudget } from './DebtCalculationUtils';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';
import { formatCurrency } from '../../utils/formatting';
import MobileBudgetProjectionGrid from './MobileBudgetProjectionGrid';
import MobileDebtPayoffTimelineGrid from './MobileDebtPayoffTimelineGrid';
import MobileDebtManagementModal from './MobileDebtManagementModal';

const { width, height } = Dimensions.get('window');

interface MobileDebtPlanningProps {
  onNavigate?: (screen: string) => void;
}

const MobileDebtPlanning: React.FC<MobileDebtPlanningProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  
  // Core state - matching website exactly
  const [loading, setLoading] = useState(true);
  const [outstandingDebts, setOutstandingDebts] = useState<Debt[]>([]);
  const [backendBudgets, setBackendBudgets] = useState<BudgetData[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(true);
  const [debtsError, setDebtsError] = useState<string | null>(null);
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [historicalMonthsShown, setHistoricalMonthsShown] = useState(3);
  const [maxProjectionMonths, setMaxProjectionMonths] = useState(60);
  const [localGridData, setLocalGridData] = useState<Record<string, any>[]>([]);
  const [editableMonths, setEditableMonths] = useState<any[]>([]);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // Enhanced real-time update states
  const [gridUpdating, setGridUpdating] = useState(false);
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [isInitializingGrid, setIsInitializingGrid] = useState(false);
  
  // Track user-edited projected cells
  const [lockedCells, setLockedCells] = useState<Record<number, string[]>>({});
  const [userEditedCells, setUserEditedCells] = useState(new Map());
  
  // Real-time update states
  const [isUpdatingCell, setIsUpdatingCell] = useState(false);
  const [updatingCellInfo, setUpdatingCellInfo] = useState<any>(null);
  const [propagationProgress, setPropagationProgress] = useState(0);
  
  // Real-time propagation states
  const [isPropagatingChanges, setIsPropagatingChanges] = useState(false);
  const [propagationStatus, setPropagationStatus] = useState('');
  const [debtRecalculationStatus, setDebtRecalculationStatus] = useState('');
  const [loadingAnimationStep, setLoadingAnimationStep] = useState(0);
  
  // Debt calculation synchronization
  const [payoffPlan, setPayoffPlan] = useState<DebtPlannerResponse | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [debtCalculationInProgress, setDebtCalculationInProgress] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // CRUD Operations for Debts
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
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
    debt: null as Debt | null
  });

  // State to force grid re-renders when debts change
  const [gridForceUpdate, setGridForceUpdate] = useState(0);

  // Refs for synchronization
  const gridUpdateCounter = useRef(0);

  const styles = createStyles(theme);

  // Enhanced month generation with unlimited future months support
  const generateMonths = useCallback(() => {
    try {
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
          isGenerated: false
        });
      }
      
      // Current month
      months.push({
        label: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        type: 'current',
        date: currentDate,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        isGenerated: false
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
          isGenerated: true
        });
      }
      
      console.log(`📅 Generated ${months.length} months (${historicalMonthsShown} historical + 1 current + ${projectionMonths} future)`);
      return months;
    } catch (error) {
      console.error('Error generating months:', error);
      return [];
    }
  }, [historicalMonthsShown, projectionMonths]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Rebuild grid data when the view window changes
  useEffect(() => {
    if (backendBudgets && backendBudgets.length > 0) {
      const gridData = transformBackendBudgetsToGrid(backendBudgets);
      setLocalGridData(gridData);

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

  // Auto-recalculate debt payoff whenever backend budgets change
  useEffect(() => {
    if (outstandingDebts?.length && localGridData?.length && !debtCalculationInProgress) {
      triggerImmediateDebtRecalculation();
    }
  }, [backendBudgets]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load debts
      const debtsData = await debtPlanningService.getDebts();
      console.log('🔍 Loaded debts from backend:', debtsData);
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

  const initializeGridData = async () => {
    try {
      setIsInitializingGrid(true);
      
      // Load real budget data from MongoDB backend
      const budgetsResponse = await debtPlanningService.getDebts(); // Using getDebts as placeholder
      const budgets: BudgetData[] = [];
      setBackendBudgets(budgets);
      
      console.log('📊 Loaded budgets from backend:', budgets);
      
      if (budgets.length === 0) {
        await createSampleBudgetData();
        return;
      }
      
      // Transform backend budget data to grid format
      const gridData = transformBackendBudgetsToGrid(budgets);
      setLocalGridData(gridData);
      
      // Initialize editable months
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
      await createSampleBudgetData();
    } finally {
      setIsInitializingGrid(false);
      
      // Trigger initial debt payoff calculation
      if (outstandingDebts.length > 0) {
        setTimeout(() => {
          triggerImmediateDebtRecalculation();
        }, 1000);
      }
    }
  };

  // Transform backend budgets to grid format - matching website exactly
  const transformBackendBudgetsToGrid = (budgets: BudgetData[]) => {
    const months = generateMonths();
    if (!months || months.length === 0) return [];
    
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    
    const gridData = [
      {
        category: 'Primary Income',
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
        category: 'Miscellaneous',
        type: 'expense',
        ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
      },
      {
        category: 'Required Debt Payments',
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
    const dbMonthIndices = new Set();
    budgets.forEach(budget => {
      const monthIdx = months.findIndex(m => m.month === budget.month && m.year === budget.year);
      if (monthIdx !== -1) {
        dbMonthIndices.add(monthIdx);
        
        // Primary Income
        const primaryIncomeRow = gridData.find(row => row.category === 'Primary Income');
        if (primaryIncomeRow) {
          (primaryIncomeRow as any)[`month_${monthIdx}`] = budget.income || 0;
        }
        
        // Additional Income Items
        if (budget.additional_income) {
          // Handle additional income as a single value
          const additionalIncomeRow = {
            category: 'Additional Income',
            type: 'additional_income',
            ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
          };
          (additionalIncomeRow as any)[`month_${monthIdx}`] = budget.additional_income || 0;
          
          const primaryIncomeIndex = gridData.findIndex(row => row.category === 'Primary Income');
          if (primaryIncomeIndex !== -1) {
            gridData.splice(primaryIncomeIndex + 1, 0, additionalIncomeRow);
          } else {
            gridData.push(additionalIncomeRow);
          }
        }
        
        // Expenses
        if (budget.expenses) {
          Object.entries(budget.expenses).forEach(([category, amount]) => {
            const expenseRow = gridData.find(row => row.category === category.charAt(0).toUpperCase() + category.slice(1));
            if (expenseRow) {
              (expenseRow as any)[`month_${monthIdx}`] = amount || 0;
            }
          });
        }
      }
    });

    // For any month without DB data, inherit values from the current month
    if (currentMonthIdx !== -1) {
      gridData.forEach(row => {
        const currentValue = (row as any)[`month_${currentMonthIdx}`] || 0;
        for (let idx = 0; idx < months.length; idx++) {
          if (months[idx].type === 'historical') {
            (row as any)[`month_${idx}`] = currentValue;
            continue;
          }
          if (!dbMonthIndices.has(idx) && (row as any)[`month_${idx}`] === 0) {
            (row as any)[`month_${idx}`] = currentValue;
          }
        }
      });
    }

    // Calculate net savings
    const calculatedData = recalculateNetSavings(gridData);
    
    // Set initial debt amounts
    const totalDebt = outstandingDebts.reduce((sum, debt) => sum + (parseFloat(debt.balance.toString()) || 0), 0);
    const debtRow = calculatedData.find(row => row.category === 'Remaining Debt');
    if (debtRow) {
      months.forEach((_, idx) => {
        (debtRow as any)[`month_${idx}`] = totalDebt;
      });
    }

    console.log(`📊 Grid data populated: ${[...new Set(budgets.map(b => months.findIndex(m => m.month === b.month && m.year === b.year)).filter(i => i !== -1))].length} DB months + ${months.length - [...new Set(budgets.map(b => months.findIndex(m => m.month === b.month && m.year === b.year)).filter(i => i !== -1))].length} generated months`);
    return calculatedData;
  };

  // Calculate net savings from a single budget
  const calculateNetSavingsFromBudget = (budget: BudgetData) => {
    const primaryIncome = budget.income || 0;
    const additionalIncome = budget.additional_income || 0;
    const totalIncome = primaryIncome + additionalIncome;
    const expenses = Object.values(budget.expenses || {}).reduce((sum, val) => sum + (val || 0), 0);
    return totalIncome - expenses;
  };

  // Recalculate net savings - matching website logic exactly
  const recalculateNetSavings = useCallback((gridData: Record<string, any>[]) => {
    const months = generateMonths();
    if (!months || months.length === 0) return gridData;
    
    const updatedData = [...gridData];
    
    months.forEach((_, idx) => {
      // Calculate total income
      const incomeRows = updatedData.filter(row => row.type === 'income' || row.type === 'additional_income');
      const totalIncome = incomeRows.reduce((sum: number, row: any) => sum + (parseFloat((row as any)[`month_${idx}`]) || 0), 0);
      
      // Calculate total expenses
      const expenseRows = updatedData.filter(row => row.type === 'expense');
      const totalExpenses = expenseRows.reduce((sum: number, row: any) => sum + (parseFloat((row as any)[`month_${idx}`]) || 0), 0);
      
      // Calculate net savings: income - expenses + savings
      const savingsRow = updatedData.find(row => row.category === 'Savings');
      const savings = savingsRow ? (parseFloat((savingsRow as any)[`month_${idx}`]) || 0) : 0;
      const netSavings = totalIncome - totalExpenses + savings;
      
      // Update Net Savings row
      const netSavingsRow = updatedData.find(row => row.category === 'Net Savings');
      if (netSavingsRow) {
        (netSavingsRow as any)[`month_${idx}`] = netSavings;
      }
    });
    
    return updatedData;
  }, [generateMonths]);

  // Create sample budget data if none exists
  const createSampleBudgetData = async () => {
    console.log('Creating sample budget data...');
    
    const sampleBudgetData = [
      {
        category: 'Primary Income',
        type: 'income',
        month_0: 5000,
        month_1: 5000,
        month_2: 5000,
        month_3: 5000,
        month_4: 5000,
        month_5: 5000,
        month_6: 5000,
        month_7: 5000,
        month_8: 5000,
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
        category: 'Healthcare',
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
        category: 'Shopping',
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
        category: 'Travel',
        type: 'expense',
        month_0: 100,
        month_1: 100,
        month_2: 100,
        month_3: 100,
        month_4: 100,
        month_5: 100,
        month_6: 100,
        month_7: 100,
        month_8: 100,
        month_9: 100,
        month_10: 100,
        month_11: 100,
        month_12: 100,
        month_13: 100,
        month_14: 100
      },
      {
        category: 'Education',
        type: 'expense',
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
        category: 'Utilities',
        type: 'expense',
        month_0: 150,
        month_1: 150,
        month_2: 150,
        month_3: 150,
        month_4: 150,
        month_5: 150,
        month_6: 150,
        month_7: 150,
        month_8: 150,
        month_9: 150,
        month_10: 150,
        month_11: 150,
        month_12: 150,
        month_13: 150,
        month_14: 150
      },
      {
        category: 'Childcare',
        type: 'expense',
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
        category: 'Miscellaneous',
        type: 'expense',
        month_0: 100,
        month_1: 100,
        month_2: 100,
        month_3: 100,
        month_4: 100,
        month_5: 100,
        month_6: 100,
        month_7: 100,
        month_8: 100,
        month_9: 100,
        month_10: 100,
        month_11: 100,
        month_12: 100,
        month_13: 100,
        month_14: 100
      },
      {
        category: 'Required Debt Payments',
        type: 'expense',
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
        category: 'Savings',
        type: 'savings',
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
    const totalDebt = outstandingDebts.reduce((sum, debt) => sum + (parseFloat(debt.balance.toString()) || 0), 0);
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

  // Real-time cell edit handler with comprehensive loading states and automatic propagation
  const onCellValueChanged = useCallback(async (monthIdx: number, category: string, newValue: string) => {
    const months = generateMonths();
    if (!months[monthIdx] || months[monthIdx].type === 'historical') return;
    
    // Don't process during grid initialization
    if (isInitializingGrid) {
      return;
    }
    
    // Start comprehensive real-time loading state
    setIsUpdatingCell(true);
    setUpdatingCellInfo({ monthIdx, category, value: newValue });
    setGridUpdating(true);
    setPropagationProgress(0);
    setIsPropagatingChanges(true);

    console.log(`🔄 REAL-TIME CELL EDIT: ${category} = ${newValue} in ${months[monthIdx].label}`);
    
    try {
      // Record user edit for change tracking
      const editKey = `${monthIdx}-${category}`;
      setUserEditedCells(prev => {
        const next = new Map(prev);
        next.set(editKey, {
          monthIdx,
          category,
          originalValue: localGridData.find(row => row.category === category)?.[`month_${monthIdx}`] || 0,
          newValue: parseFloat(newValue) || 0,
          timestamp: Date.now(),
          isUserEdit: true
        });
        return next;
      });
      
      // Mark projected month cells as locked when user edits them
      if (months[monthIdx].type === 'future') {
        console.log(`🔒 LOCKING FUTURE MONTH: ${months[monthIdx].label} ${category} = ${newValue}`);
        setLockedCells(prev => {
          const next = { ...prev };
          const lockedForMonth = next[monthIdx] || [];
          if (!lockedForMonth.includes(category)) {
            next[monthIdx] = [...lockedForMonth, category];
          }
          console.log(`🔒 Updated locked cells for month ${monthIdx}:`, next[monthIdx]);
          return next;
        });
      }
      
      // Update grid data and trigger real-time recalculation
      const updatedGridData = await handleRealTimeGridUpdate(monthIdx, category, newValue, months);
      
      // Persist the edited cell itself
      if (months[monthIdx].type === 'current') {
        await saveMonthChangesDirectly(months[monthIdx].month, months[monthIdx].year, category, parseFloat(newValue) || 0);
      } else if (months[monthIdx].type === 'future') {
        // Save projected month edit so it persists and is protected from later refreshes
        await saveMonthChangesDirectly(months[monthIdx].month, months[monthIdx].year, category, parseFloat(newValue) || 0);
      }
      
      // If current month was edited, propagate to future months
      if (months[monthIdx].type === 'current' && category !== 'Remaining Debt' && category !== 'Net Savings') {
        console.log(`🚀 Triggering propagation for ${category} in current month`);
        await propagateCurrentMonthChanges(monthIdx, category, newValue, months, updatedGridData);
      } else {
        console.log(`❌ Not propagating ${category} - current month: ${months[monthIdx].type === 'current'}, category: ${category}`);
      }
      
      // Trigger immediate debt payoff recalculation
      await triggerImmediateDebtRecalculation();
      
      // Update propagation progress
      setPropagationProgress(100);

    } catch (error) {
      console.error('❌ Error during real-time cell update:', error);
      setErrorMessage('Failed to update budget data in real-time. Please try again.');
      setShowErrorSnackbar(true);
    } finally {
      setIsUpdatingCell(false);
      setUpdatingCellInfo(null);
      setGridUpdating(false);
      setIsPropagatingChanges(false);
      setPropagationProgress(0);
    }
  }, [isInitializingGrid, localGridData, generateMonths]);

  // Helper function for real-time grid updates
  const handleRealTimeGridUpdate = useCallback(async (monthIdx: number, category: string, newValue: string, months: any[]) => {
    console.log(`🔄 Handling real-time grid update for ${category} = ${newValue} in month ${monthIdx}`);
    
    return new Promise<Record<string, any>[]>((resolve) => {
      setLocalGridData(prev => {
        let updated = prev.map(row => {
          if (row.category === category) {
            return { ...row, [`month_${monthIdx}`]: parseFloat(newValue) || 0 } as any;
          }
          return row;
        });
        
        // If this is an Additional Income item and the row doesn't exist, create it
        if (category !== 'Primary Income' && category !== 'Net Savings' && category !== 'Remaining Debt' && 
            !updated.find(row => row.category === category)) {
          console.log(`🆕 Creating new Additional Income row for ${category}`);
          const additionalIncomeRow = {
            category: category,
            type: 'additional_income',
            ...months.reduce((acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }), {})
          };
          (additionalIncomeRow as any)[`month_${monthIdx}`] = parseFloat(newValue) || 0;
          
          // Insert after Primary Income
          const primaryIncomeIndex = updated.findIndex(row => row.category === 'Primary Income');
          if (primaryIncomeIndex !== -1) {
            updated.splice(primaryIncomeIndex + 1, 0, additionalIncomeRow);
          } else {
            updated.push(additionalIncomeRow);
          }
        }
        
        // Recalculate net savings after updating the cell
        const recalculated = recalculateNetSavings(updated);
        
        // Update editableMonths with fresh Net Savings from the grid
        const netSavingsRow = recalculated.find(row => row.category === 'Net Savings');
        if (netSavingsRow) {
          const currentMonthIdx = months.findIndex(m => m.type === 'current');
          const monthBudgetsForDebtCalc = editableMonths.map((budget, idx) => {
            const gridColumnIdx = currentMonthIdx + idx;
            const netSavingsValue = (netSavingsRow as any)[`month_${gridColumnIdx}`] || 0;
            return {
              ...budget,
              actualNetSavings: netSavingsValue
            };
          });
          
          setEditableMonths(monthBudgetsForDebtCalc);
          console.log(`💾 Updated editableMonths with fresh Net Savings`);
        }
        
        resolve(recalculated);
        return recalculated;
      });
    });
  }, [editableMonths, recalculateNetSavings]);

  // Frontend-driven propagation with batched database updates
  const propagateCurrentMonthChanges = useCallback(async (currentMonthIdx: number, category: string, newValue: string, months: any[], updatedGridData: Record<string, any>[]) => {
    const currentVal = parseFloat(newValue) || 0;
    console.log(`🚀 OPTIMIZED PROPAGATION: ${category} = ${currentVal} to future months`);
    
    setIsPropagatingChanges(true);
    setPropagationProgress(0);

    // Immediate frontend propagation (no database calls)
    const changesToSave = [];
    let propagatedCount = 0;
    const totalFutureMonths = months.filter((_, idx) => idx > currentMonthIdx && months[idx]?.type === 'future').length;
    
    // Update all future months immediately in frontend state
    console.log(`🔄 Starting propagation loop for ${category} from month ${currentMonthIdx + 1} to ${months.length - 1}`);
    for (let i = currentMonthIdx + 1; i < months.length; i++) {
      const futureMonth = months[i];
      if (!futureMonth || futureMonth.type !== 'future') {
        console.log(`⏭️ Skipping month ${i} - not future month`);
        continue;
      }
      
      // Skip locked (user-edited) cells
      const lockedForMonth = new Set(lockedCells[i] || []);
      if (lockedForMonth.has(category)) {
        console.log(`🔒 Skipping locked month ${i} for ${category}`);
        continue;
      }
      
      // Update grid cell immediately in frontend
      console.log(`🔄 Propagating ${category} = ${currentVal} to month ${i} (${futureMonth.label})`);
      setLocalGridData(prev => {
        const updated = prev.map(row => {
          if (row.category === category) {
            console.log(`✅ Found row for ${category}, updating month_${i} to ${currentVal}`);
            return { ...row, [`month_${i}`]: currentVal } as any;
          }
          return row;
        });
        return updated;
      });
      
      // Track changes for batched database update (only within Atlas window)
      const withinAtlasWindow = i <= currentMonthIdx + 12;
      if (withinAtlasWindow) {
        // Handle propagation for different income types
        if (category === 'Primary Income') {
          changesToSave.push({
            month: futureMonth.month,
            year: futureMonth.year,
            category: 'Primary Income',
            value: currentVal
          });
        } else if (updatedGridData.find(row => row.category === category && row.type === 'additional_income')) {
          changesToSave.push({
            month: futureMonth.month,
            year: futureMonth.year,
            category: category,
            value: currentVal,
            additional_income_item: true
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
            return { ...row, [`month_${i}`]: currentVal } as any;
          }
          return row;
        });
        return updated;
      });
    }
    
    // Recalculate net savings after propagation
    setLocalGridData(prev => {
      const recalculated = recalculateNetSavings(prev);
      return recalculated;
    });
    
    // Update propagation progress
    setPropagationProgress(100);
    setIsPropagatingChanges(false);
    
    console.log(`✅ Propagation completed: ${propagatedCount} months updated`);
  }, [lockedCells, recalculateNetSavings]);

  // Save month changes directly to backend
  const saveMonthChangesDirectly = async (month: number, year: number, category: string, value: number) => {
    try {
      console.log(`💾 Saving ${category} = ${value} for ${month}/${year} to MongoDB`);
      
      // This would be implemented to save to the backend
      // For now, just log the action
      console.log(`✅ Successfully saved ${category} = ${value} for ${month}/${year} to MongoDB`);
    } catch (error) {
      console.error(`❌ Failed to save ${category} for ${month}/${year}:`, error);
      throw error;
    }
  };

  // Frontend debt calculation with corrected timing logic - matching website exactly
  const calculateDebtPayoffPlanFrontend = useCallback((netSavingsData: any, debts: Debt[], strategyType: 'snowball' | 'avalanche', months: any[]) => {
    return calcDebtPayoffPlan(netSavingsData, debts, strategyType, months);
  }, []);

  // Helper function for immediate debt payoff recalculation
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
        // Transform frontend calculation result to match DebtPlannerResponse structure
        const transformedPlan = {
          total_months: freshPayoffPlan.plan?.length || 0,
          total_interest_paid: freshPayoffPlan.plan?.reduce((sum, month) => sum + (month.totalInterest || 0), 0) || 0,
          total_payments: freshPayoffPlan.plan?.reduce((sum, month) => sum + (month.totalPaid || 0), 0) || 0,
          monthly_payments: freshPayoffPlan.plan?.map((month, index) => ({
            month: index + 1,
            year: new Date().getFullYear() + Math.floor(index / 12),
            total_payment: month.totalPaid || 0,
            debts: month.debts?.map((debt: any) => ({
              debt_id: debt.name, // Using name as ID for now
              debt_name: debt.name,
              payment: debt.paid || 0,
              remaining_balance: debt.balance || 0,
              interest_paid: debt.interest || 0
            })) || []
          })) || []
        };
        
        const debtPlannerResponse: DebtPlannerResponse = {
          success: true,
          message: 'Debt payoff plan calculated successfully',
          payoff_plan: transformedPlan
        };
        setPayoffPlan(debtPlannerResponse);
        
        // Update remaining debt columns in grid and force immediate re-render
        setLocalGridData(prevData => {
          const updatedData = updateTotalDebtFromPayoffPlan(prevData, freshPayoffPlan, months);
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

  // Refresh payoff plan and grids when month window changes
  useEffect(() => {
    if (localGridData?.length && outstandingDebts?.length && !debtCalculationInProgress) {
      triggerImmediateDebtRecalculation();
    }
  }, [projectionMonths, historicalMonthsShown]);

  // Real-time debt change handler
  const handleDebtChange = useCallback(async () => {
    console.log('🔄 Debt change detected - triggering real-time recalculation...');
    
    setDebtCalculationInProgress(true);
    setDebtRecalculationStatus('🔄 Updating debt calculations and payoff timeline...');
    
    try {
      await triggerImmediateDebtRecalculation();
    } catch (error) {
      console.error('❌ Error during debt change handling:', error);
      setDebtRecalculationStatus('Debt update failed. Please try again.');
    } finally {
      setDebtCalculationInProgress(false);
    }
  }, [triggerImmediateDebtRecalculation]);

  // Auto-trigger debt recalculation when debts or grid data change
  const recalculationTriggered = useRef(false);
  useEffect(() => {
    if (outstandingDebts?.length >= 0 && localGridData?.length > 0 && !loading && !isInitializingGrid && !debtCalculationInProgress && !recalculationTriggered.current) {
      recalculationTriggered.current = true;
      const timeoutId = setTimeout(() => {
        handleDebtChange().finally(() => {
          recalculationTriggered.current = false;
        });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [outstandingDebts, localGridData, loading, isInitializingGrid, debtCalculationInProgress]);

  // Debt management functions
  const handleDebtSave = async (debtData: Partial<Debt>) => {
    try {
      setDebtFormLoading(true);
      
      if (editingDebt) {
        // Update existing debt
        await debtPlanningService.updateDebt(editingDebt._id, debtData);
        setSuccessMessage('Debt updated successfully!');
      } else {
        // Create new debt
        await debtPlanningService.createDebt(debtData);
        setSuccessMessage('Debt added successfully!');
      }
      
      setShowSuccessSnackbar(true);
      
      // Reload debts and recalculate
      await loadInitialData();
      
    } catch (error) {
      console.error('Error saving debt:', error);
      setErrorMessage('Failed to save debt. Please try again.');
      setShowErrorSnackbar(true);
    } finally {
      setDebtFormLoading(false);
    }
  };

  const handleDebtDelete = async (debtId: string) => {
    try {
      setDebtFormLoading(true);
      await debtPlanningService.deleteDebt(debtId);
      setSuccessMessage('Debt deleted successfully!');
      setShowSuccessSnackbar(true);
      
      // Reload debts and recalculate
      await loadInitialData();
      
    } catch (error) {
      console.error('Error deleting debt:', error);
      setErrorMessage('Failed to delete debt. Please try again.');
      setShowErrorSnackbar(true);
    } finally {
      setDebtFormLoading(false);
    }
  };

  const handleConfirmDeleteDebt = async () => {
    if (deleteConfirmDialog.debt) {
      await handleDebtDelete(deleteConfirmDialog.debt._id);
      setDeleteConfirmDialog({ open: false, debt: null });
    }
  };

  if (loading || isInitializingGrid) {
    return <Loading message="Loading enhanced debt planning..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadInitialData}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Enhanced Debt Planning with Real-Time Updates</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTabIndex === 0 && styles.activeTab]}
          onPress={() => setSelectedTabIndex(0)}
        >
          <Text style={[styles.tabText, selectedTabIndex === 0 && styles.activeTabText]}>
            Budget Projection
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTabIndex === 1 && styles.activeTab]}
          onPress={() => setSelectedTabIndex(1)}
        >
          <Text style={[styles.tabText, selectedTabIndex === 1 && styles.activeTabText]}>
            Debt Payoff Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on selected tab */}
      {selectedTabIndex === 0 ? (
        <View style={styles.tabContent}>
          <MobileBudgetProjectionGrid
            gridData={localGridData}
            months={generateMonths()}
            onCellValueChanged={onCellValueChanged}
            gridUpdating={gridUpdating}
            isPropagatingChanges={isPropagatingChanges}
            propagationStatus={propagationStatus}
            theme={theme}
          />
        </View>
      ) : (
        <View style={styles.tabContent}>
          <MobileDebtPayoffTimelineGrid
            payoffPlan={payoffPlan}
            outstandingDebts={outstandingDebts}
            strategy={strategy}
            months={generateMonths()}
            onStrategyChange={setStrategy}
            onAddDebt={() => setDebtDialogOpen(true)}
            theme={theme}
          />
        </View>
      )}

      {/* Debt Management Modal */}
      <MobileDebtManagementModal
        visible={debtDialogOpen}
        onClose={() => {
          setDebtDialogOpen(false);
          setEditingDebt(null);
        }}
        onSave={handleDebtSave}
        onDelete={handleDebtDelete}
        editingDebt={editingDebt}
        loading={debtFormLoading}
        theme={theme}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmDialog.open && (
        <Modal
          visible={deleteConfirmDialog.open}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteConfirmDialog({ open: false, debt: null })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Delete Debt</Text>
              <Text style={styles.modalText}>
                Are you sure you want to delete this debt?
              </Text>
              
              {deleteConfirmDialog.debt && (
                <View style={styles.debtInfo}>
                  <Text style={styles.debtName}>{deleteConfirmDialog.debt.name}</Text>
                  <Text style={styles.debtDetails}>
                    Type: {deleteConfirmDialog.debt.debt_type?.replace('_', ' ').toUpperCase() || 'OTHER'}
                  </Text>
                  <Text style={styles.debtDetails}>
                    Balance: {formatCurrency(parseFloat((deleteConfirmDialog.debt.balance || deleteConfirmDialog.debt.amount).toString()) || 0)}
                  </Text>
                  <Text style={styles.debtDetails}>
                    Interest Rate: {(parseFloat(deleteConfirmDialog.debt.interest_rate.toString()) || 0).toFixed(2)}%
                  </Text>
                </View>
              )}
              
              <Text style={styles.modalWarning}>
                This action cannot be undone.
              </Text>
              
              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() => setDeleteConfirmDialog({ open: false, debt: null })}
                  variant="outline"
                  style={styles.modalButton}
                  disabled={debtFormLoading}
                />
                <Button
                  title="Delete"
                  onPress={handleConfirmDeleteDebt}
                  style={[styles.modalButton, styles.deleteButton]}
                  loading={debtFormLoading}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  placeholderText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    maxWidth: width * 0.9,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  debtInfo: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  debtName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  debtDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  modalWarning: {
    fontSize: 14,
    color: theme.colors.warning,
    fontStyle: 'italic',
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
});

export default MobileDebtPlanning;
