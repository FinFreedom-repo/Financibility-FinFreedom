import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import debtPlanningService, {
  Debt,
  BudgetData,
  DebtPlannerResponse,
} from '../../services/debtPlanningService';
import {
  calculateDebtPayoffPlanFrontend as calcDebtPayoffPlan,
  updateTotalDebtFromPayoffPlan,
} from './DebtCalculationUtils';
import Button from '../common/Button';
import Loading from '../common/Loading';
import { formatCurrency } from '../../utils/formatting';
import MobileBudgetProjectionGrid from './MobileBudgetProjectionGrid';
import MobileDebtPayoffTimelineGrid from './MobileDebtPayoffTimelineGrid';
import MobileDebtManagementModal from './MobileDebtManagementModal';
import budgetService from '../../services/budgetService';

const { width } = Dimensions.get('window');

interface MobileDebtPlanningProps {
  onNavigate?: (screen: string) => void;
}

const MobileDebtPlanning: React.FC<MobileDebtPlanningProps> = () => {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [outstandingDebts, setOutstandingDebts] = useState<Debt[]>([]);
  const [backendBudgets, setBackendBudgets] = useState<BudgetData[]>([]);
  const [projectionMonths] = useState(12);
  const [historicalMonthsShown] = useState(3);
  const [localGridData, setLocalGridData] = useState<Record<string, any>[]>([]);
  const [editableMonths, setEditableMonths] = useState<any[]>([]);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const [gridUpdating, setGridUpdating] = useState(false);
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>(
    'snowball'
  );
  const [isInitializingGrid, setIsInitializingGrid] = useState(false);

  const [lockedCells, setLockedCells] = useState<Record<number, string[]>>({});
  const [, setUserEditedCells] = useState(new Map());

  const [, setIsUpdatingCell] = useState(false);
  const [, setPropagationProgress] = useState(0);

  const [isPropagatingChanges, setIsPropagatingChanges] = useState(false);
  const [propagationStatus] = useState('');

  const [payoffPlan, setPayoffPlan] = useState<DebtPlannerResponse | null>(
    null
  );
  const [, setPlanLoading] = useState(false);
  const [debtCalculationInProgress, setDebtCalculationInProgress] =
    useState(false);

  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtFormLoading, setDebtFormLoading] = useState(false);

  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    open: false,
    debt: null as Debt | null,
  });

  const [, setGridForceUpdate] = useState(0);
  const gridUpdateCounter = useRef(0);
  const isUserEditingRef = useRef(false);
  const isLoadingRef = useRef(false);

  const styles = createStyles(theme);

  const generateMonths = useCallback(() => {
    try {
      const months = [];
      const currentDate = new Date();

      // Historical months
      for (let i = historicalMonthsShown; i > 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        months.push({
          label: date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          type: 'historical',
          date: date,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          isGenerated: false,
        });
      }

      // Current month
      months.push({
        label: currentDate.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        type: 'current',
        date: currentDate,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        isGenerated: false,
      });

      // Future months (unlimited generation)
      for (let i = 1; i <= projectionMonths; i++) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() + i);
        months.push({
          label: date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          type: 'future',
          date: date,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          isGenerated: true,
        });
      }

      return months;
    } catch (error) {
      Alert.alert('Error', 'Failed to generate months: ' + error);
      return [];
    }
  }, [historicalMonthsShown, projectionMonths]);

  const loadInitialData = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);

      // Load debts
      const debtsData = await debtPlanningService.getDebts();
      setOutstandingDebts(debtsData || []);

      // Initialize grid data
      await initializeGridData();
    } catch (error) {
      Alert.alert('Error', 'Failed to load initial data: ' + error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Refetch when screen gains focus - reload on navigation, but not during active editing
  useFocusEffect(
    useCallback(() => {
      // Only reload if:
      // 1. Not currently loading
      // 2. User is not actively editing
      // 3. Not initializing
      if (
        !isLoadingRef.current &&
        !isUserEditingRef.current &&
        !isInitializingGrid
      ) {
        loadInitialData();
      }

      // Cleanup: reset editing ref when screen loses focus
      return () => {
        isUserEditingRef.current = false;
      };
    }, [loadInitialData])
  );

  // Rebuild grid data when backend budgets change
  // But ONLY on initial load or when explicitly reloading - NOT after every edit
  // This prevents the terrible UX of reloading the whole page when editing one cell
  useEffect(() => {
    if (
      backendBudgets &&
      backendBudgets.length > 0 &&
      !isInitializingGrid &&
      !gridUpdating &&
      !isUserEditingRef.current &&
      localGridData.length === 0 // Only rebuild if we have no local data yet
    ) {
      // Only rebuild on initial load when we have no local grid data
      // After that, local state updates handle all changes
      const gridData = transformBackendBudgetsToGrid(backendBudgets);
      setLocalGridData(gridData);

      const genMonths = generateMonths();
      const currentIdx = genMonths.findIndex(m => m.type === 'current');
      const monthBudgets = genMonths
        .filter(
          (m, idx) =>
            idx >= currentIdx &&
            idx < currentIdx + Math.max(12, projectionMonths)
        )
        .map(m => {
          const budget = backendBudgets.find(
            b => b.month === m.month && b.year === m.year
          );
          return {
            month: m.month,
            year: m.year,
            actualNetSavings: budget
              ? calculateNetSavingsFromBudget(budget)
              : gridData.find(r => r.category === 'Net Savings')?.[
                  `month_${genMonths.indexOf(m)}`
                ] || 0,
          };
        });
      setEditableMonths(monthBudgets);
    }
  }, [
    projectionMonths,
    historicalMonthsShown,
    backendBudgets,
    generateMonths,
    isInitializingGrid,
    // Don't include gridUpdating - we use isUserEditingRef instead
  ]);

  // Auto-recalculate debt payoff when backend budgets change
  useEffect(() => {
    if (
      outstandingDebts?.length &&
      localGridData?.length &&
      !debtCalculationInProgress &&
      !isInitializingGrid
    ) {
      handleDebtChange();
    }
  }, [backendBudgets]);

  const initializeGridData = async () => {
    try {
      setIsInitializingGrid(true);

      const budgets = await debtPlanningService.getBudgetData();
      setBackendBudgets(budgets);

      if (budgets.length === 0) {
        // No budget data - initialize empty grid
        const genMonths = generateMonths();
        const gridData = transformBackendBudgetsToGrid([]);
        setLocalGridData(gridData);

        const currentIdx = genMonths.findIndex(m => m.type === 'current');
        const monthBudgets = genMonths
          .filter(
            (m, idx) =>
              idx >= currentIdx &&
              idx < currentIdx + Math.max(12, projectionMonths)
          )
          .map(m => ({
            month: m.month,
            year: m.year,
            actualNetSavings: 0,
          }));
        setEditableMonths(monthBudgets);
        return;
      }

      // Transform backend budget data to grid format
      const gridData = transformBackendBudgetsToGrid(budgets);
      setLocalGridData(gridData);

      // Initialize editable months
      const genMonths = generateMonths();
      const currentIdx = genMonths.findIndex(m => m.type === 'current');
      const monthBudgets = genMonths
        .filter(
          (m, idx) =>
            idx >= currentIdx &&
            idx < currentIdx + Math.max(12, projectionMonths)
        )
        .map(m => {
          const budget = budgets.find(
            b => b.month === m.month && b.year === m.year
          );
          return {
            month: m.month,
            year: m.year,
            actualNetSavings: budget
              ? calculateNetSavingsFromBudget(budget)
              : 0,
          };
        });
      setEditableMonths(monthBudgets);
    } catch (error) {
      Alert.alert('Error', 'Failed to load budget data. Please try again.');
      // Initialize empty grid on error
      const gridData = transformBackendBudgetsToGrid([]);
      setLocalGridData(gridData);
      setEditableMonths([]);
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

  const recalculateNetSavings = useCallback(
    (gridData: Record<string, any>[]) => {
      const months = generateMonths();
      if (!months || months.length === 0) return gridData;

      const updatedData = [...gridData];

      months.forEach((_, idx) => {
        // Calculate total income
        const incomeRows = updatedData.filter(
          row => row.type === 'income' || row.type === 'additional_income'
        );
        const totalIncome = incomeRows.reduce(
          (sum: number, row: any) =>
            sum + (parseFloat((row as any)[`month_${idx}`]) || 0),
          0
        );

        // Calculate total expenses
        const expenseRows = updatedData.filter(row => row.type === 'expense');
        const totalExpenses = expenseRows.reduce(
          (sum: number, row: any) =>
            sum + (parseFloat((row as any)[`month_${idx}`]) || 0),
          0
        );

        // Calculate net savings: income - expenses + savings
        const savingsRow = updatedData.find(row => row.category === 'Savings');
        const savings = savingsRow
          ? parseFloat((savingsRow as any)[`month_${idx}`]) || 0
          : 0;
        const netSavings = totalIncome - totalExpenses + savings;

        // Update Net Savings row
        const netSavingsRow = updatedData.find(
          row => row.category === 'Net Savings'
        );
        if (netSavingsRow) {
          (netSavingsRow as any)[`month_${idx}`] = netSavings;
        }
      });

      return updatedData;
    },
    [generateMonths]
  );

  const transformBackendBudgetsToGrid = useCallback(
    (budgets: BudgetData[]) => {
      const months = generateMonths();
      if (!months || months.length === 0) return [];

      const currentMonthIdx = months.findIndex(m => m.type === 'current');

      const gridData = [
        {
          category: 'Primary Income',
          type: 'income',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Housing',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Transportation',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Food',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Healthcare',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Entertainment',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Shopping',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Travel',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Education',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Utilities',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Childcare',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Miscellaneous',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Required Debt Payments',
          type: 'expense',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Savings',
          type: 'savings',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Net Savings',
          type: 'calculated',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
        {
          category: 'Remaining Debt',
          type: 'calculated',
          ...months.reduce(
            (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
            {}
          ),
        },
      ];

      // Populate with actual budget data from database
      const dbMonthIndices = new Set();
      budgets.forEach(budget => {
        const monthIdx = months.findIndex(
          m => m.month === budget.month && m.year === budget.year
        );
        if (monthIdx !== -1) {
          dbMonthIndices.add(monthIdx);

          // Primary Income
          const primaryIncomeRow = gridData.find(
            row => row.category === 'Primary Income'
          );
          if (primaryIncomeRow) {
            (primaryIncomeRow as any)[`month_${monthIdx}`] = budget.income || 0;
          }

          // Additional Income Items - Add as separate rows
          const budgetWithItems = budget as BudgetData & {
            additional_income_items?: { name: string; amount: number }[];
          };
          if (
            budgetWithItems.additional_income_items &&
            Array.isArray(budgetWithItems.additional_income_items)
          ) {
            budgetWithItems.additional_income_items.forEach(
              (incomeItem: any) => {
                const itemName = incomeItem.name || 'Additional Income';
                let additionalIncomeRow = gridData.find(
                  row =>
                    row.category === itemName &&
                    row.type === 'additional_income'
                );

                if (!additionalIncomeRow) {
                  // Create new Additional Income row
                  additionalIncomeRow = {
                    category: itemName,
                    type: 'additional_income',
                    ...months.reduce(
                      (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
                      {}
                    ),
                  };
                  // Insert after Primary Income
                  const primaryIncomeIndex = gridData.findIndex(
                    row => row.category === 'Primary Income'
                  );
                  if (primaryIncomeIndex !== -1) {
                    gridData.splice(
                      primaryIncomeIndex + 1,
                      0,
                      additionalIncomeRow
                    );
                  } else {
                    gridData.push(additionalIncomeRow);
                  }
                }

                (additionalIncomeRow as any)[`month_${monthIdx}`] =
                  incomeItem.amount || 0;
              }
            );
          }

          // Expenses
          if (budget.expenses) {
            Object.entries(budget.expenses).forEach(([category, amount]) => {
              const expenseRow = gridData.find(
                row =>
                  row.category ===
                  category.charAt(0).toUpperCase() + category.slice(1)
              );
              if (expenseRow) {
                (expenseRow as any)[`month_${monthIdx}`] = amount || 0;
              }
            });
          }
        }
      });

      const currentMonthBudget = budgets.find(
        b =>
          b.month === months[currentMonthIdx]?.month &&
          b.year === months[currentMonthIdx]?.year
      );
      const currentMonthAdditionalIncomeNames = new Set<string>();
      if (currentMonthBudget?.additional_income_items) {
        currentMonthBudget.additional_income_items.forEach((item: any) =>
          currentMonthAdditionalIncomeNames.add(
            item.name || 'Additional Income'
          )
        );
      }

      const filteredGridData = gridData.filter(row => {
        if (row.type === 'additional_income') {
          return currentMonthAdditionalIncomeNames.has(row.category);
        }
        return true;
      });

      if (currentMonthIdx !== -1) {
        filteredGridData.forEach(row => {
          const currentValue = (row as any)[`month_${currentMonthIdx}`] || 0;
          for (let idx = 0; idx < months.length; idx++) {
            if (months[idx].type === 'historical') {
              // For historical months, always use current month's value
              (row as any)[`month_${idx}`] = currentValue;
              continue;
            }
            // For future months: only fill with current value if:
            // 1. This month has NO database entry (not in dbMonthIndices)
            // 2. AND the current value is 0 (meaning no data was loaded from backend)
            // This preserves any values that were loaded from the database above
            if (
              !dbMonthIndices.has(idx) &&
              (row as any)[`month_${idx}`] === 0
            ) {
              (row as any)[`month_${idx}`] = currentValue;
            }
            // If dbMonthIndices.has(idx) is true, the value was already set from backend data above
            // and should NOT be overwritten
          }
        });
      }

      const calculatedData = recalculateNetSavings(filteredGridData);

      // Set initial debt amounts
      const totalDebt = outstandingDebts.reduce(
        (sum, debt) => sum + (parseFloat(debt.balance.toString()) || 0),
        0
      );
      const debtRow = calculatedData.find(
        row => row.category === 'Remaining Debt'
      );
      if (debtRow) {
        months.forEach((_, idx) => {
          (debtRow as any)[`month_${idx}`] = totalDebt;
        });
      }

      return calculatedData;
    },
    [generateMonths, outstandingDebts, recalculateNetSavings]
  );

  const calculateNetSavingsFromBudget = (budget: BudgetData) => {
    const primaryIncome = budget.income || 0;
    const additionalIncome = budget.additional_income || 0;
    const totalIncome = primaryIncome + additionalIncome;
    const expenses = Object.values(budget.expenses || {}).reduce(
      (sum, val) => sum + (val || 0),
      0
    );
    return totalIncome - expenses;
  };

  const onCellValueChanged = useCallback(
    async (monthIdx: number, category: string, newValue: string) => {
      const months = generateMonths();
      if (!months[monthIdx]) return;

      // Don't allow editing calculated fields
      if (category === 'Net Savings' || category === 'Remaining Debt') {
        return;
      }

      if (isInitializingGrid) {
        return;
      }

      // Parse the value
      const parsedValue = (() => {
        const trimmed = newValue.trim();
        if (trimmed === '' || trimmed === '-') return 0;
        const num = parseFloat(trimmed);
        return isNaN(num) ? 0 : num;
      })();

      // OPTIMISTIC UPDATE: Update local state immediately (no waiting, no reload)
      setLocalGridData(prev => {
        const updated = prev.map(row => {
          if (row.category === category) {
            return {
              ...row,
              [`month_${monthIdx}`]: parsedValue,
            } as any;
          }
          return row;
        });
        // Recalculate net savings after the update
        // The debt calculation useEffect will automatically trigger when localGridData changes
        return recalculateNetSavings(updated);
      });

      // Save to backend in the background (don't block UI, don't reload)
      const month = months[monthIdx];
      saveMonthChangesDirectly(month.month, month.year, category, parsedValue)
        .then(() => {
          // Success - optimistic update already shown, nothing to do
        })
        .catch(error => {
          // Save failed - show error and offer to reload
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          Alert.alert(
            'Save Failed',
            `Failed to save ${category}: ${errorMessage}\n\nWould you like to reload the data?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Reload',
                onPress: () => {
                  loadInitialData();
                },
              },
            ]
          );
        });
    },
    [isInitializingGrid, generateMonths, recalculateNetSavings, loadInitialData]
  );

  const handleRealTimeGridUpdate = useCallback(
    async (
      monthIdx: number,
      category: string,
      newValue: string,
      months: any[]
    ) => {
      return new Promise<Record<string, any>[]>(resolve => {
        setLocalGridData(prev => {
          let updated = prev.map(row => {
            if (row.category === category) {
              const parsedValue = (() => {
                const trimmed = newValue.trim();
                if (trimmed === '' || trimmed === '-') return 0;
                const num = parseFloat(trimmed);
                return isNaN(num) ? 0 : num;
              })();
              return {
                ...row,
                [`month_${monthIdx}`]: parsedValue,
              } as any;
            }
            return row;
          });

          // If this is an Additional Income item and the row doesn't exist, create it
          if (
            category !== 'Primary Income' &&
            category !== 'Net Savings' &&
            category !== 'Remaining Debt' &&
            !updated.find(row => row.category === category)
          ) {
            const additionalIncomeRow = {
              category: category,
              type: 'additional_income',
              ...months.reduce(
                (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
                {}
              ),
            };
            const parsedValue = (() => {
              const trimmed = newValue.trim();
              if (trimmed === '' || trimmed === '-') return 0;
              const num = parseFloat(trimmed);
              return isNaN(num) ? 0 : num;
            })();
            (additionalIncomeRow as any)[`month_${monthIdx}`] = parsedValue;

            // Insert after Primary Income
            const primaryIncomeIndex = updated.findIndex(
              row => row.category === 'Primary Income'
            );
            if (primaryIncomeIndex !== -1) {
              updated.splice(primaryIncomeIndex + 1, 0, additionalIncomeRow);
            } else {
              updated.push(additionalIncomeRow);
            }
          }

          // Recalculate net savings after updating the cell
          const recalculated = recalculateNetSavings(updated);

          // Update editableMonths with fresh Net Savings from the grid
          const netSavingsRow = recalculated.find(
            row => row.category === 'Net Savings'
          );
          if (netSavingsRow) {
            const currentMonthIdx = months.findIndex(m => m.type === 'current');
            const monthBudgetsForDebtCalc = editableMonths.map(
              (budget, idx) => {
                const gridColumnIdx = currentMonthIdx + idx;
                const netSavingsValue =
                  (netSavingsRow as any)[`month_${gridColumnIdx}`] || 0;
                return {
                  ...budget,
                  actualNetSavings: netSavingsValue,
                };
              }
            );

            setEditableMonths(monthBudgetsForDebtCalc);
          }

          resolve(recalculated);
          return recalculated;
        });
      });
    },
    [editableMonths, recalculateNetSavings]
  );

  const propagateCurrentMonthChanges = useCallback(
    async (
      currentMonthIdx: number,
      category: string,
      newValue: string,
      months: any[],
      updatedGridData: Record<string, any>[]
    ) => {
      const currentVal = (() => {
        const trimmed = newValue.trim();
        if (trimmed === '' || trimmed === '-') return 0;
        const num = parseFloat(trimmed);
        return isNaN(num) ? 0 : num;
      })();

      setIsPropagatingChanges(true);
      setPropagationProgress(0);

      // Immediate frontend propagation (no database calls)
      const changesToSave = [];
      let propagatedCount = 0;
      const totalFutureMonths = months.filter(
        (_, idx) => idx > currentMonthIdx && months[idx]?.type === 'future'
      ).length;

      // Update all future months immediately in frontend state
      for (let i = currentMonthIdx + 1; i < months.length; i++) {
        const futureMonth = months[i];
        if (!futureMonth || futureMonth.type !== 'future') {
          continue;
        }

        // Skip locked (user-edited) cells
        const lockedForMonth = new Set(lockedCells[i] || []);
        if (lockedForMonth.has(category)) {
          continue;
        }

        // Update grid cell immediately in frontend
        setLocalGridData(prev => {
          const updated = prev.map(row => {
            if (row.category === category) {
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
              value: currentVal,
            });
          } else if (
            updatedGridData.find(
              row =>
                row.category === category && row.type === 'additional_income'
            )
          ) {
            changesToSave.push({
              month: futureMonth.month,
              year: futureMonth.year,
              category: category,
              value: currentVal,
              additional_income_item: true,
            });
          } else {
            changesToSave.push({
              month: futureMonth.month,
              year: futureMonth.year,
              category: category,
              value: currentVal,
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
    },
    [lockedCells, recalculateNetSavings]
  );

  const saveMonthChangesDirectly = async (
    month: number,
    year: number,
    category: string,
    value: number
  ) => {
    try {
      console.log(
        `💾 saveMonthChangesDirectly called: ${category} = ${value} for ${month}/${year}`
      );
      // Use static import - budgetService is imported at the top of the file

      // Get existing budget for this month/year or create new one
      const budgets = await budgetService.getBudgets();
      const existingBudget = budgets.find(
        b => b.month === month && b.year === year
      );

      // Map category names to budget structure
      const categoryMap: Record<
        string,
        | 'housing'
        | 'transportation'
        | 'food'
        | 'healthcare'
        | 'entertainment'
        | 'shopping'
        | 'travel'
        | 'education'
        | 'utilities'
        | 'childcare'
        | 'debt_payments'
        | 'others'
        | 'income'
        | 'additional_income'
      > = {
        'Primary Income': 'income',
        Housing: 'housing',
        Transportation: 'transportation',
        Food: 'food',
        Healthcare: 'healthcare',
        Entertainment: 'entertainment',
        Shopping: 'shopping',
        Travel: 'travel',
        Education: 'education',
        Utilities: 'utilities',
        Childcare: 'childcare',
        Miscellaneous: 'others',
        'Required Debt Payments': 'debt_payments',
        // Savings is handled separately below - not in this map
      };

      const budgetField = categoryMap[category];

      // Handle Savings separately - it's stored as savings_items array, not a direct field
      if (category === 'Savings') {
        // For now, Savings is calculated, not directly editable in debt planning
        // If we need to support editing Savings, we'd need to handle savings_items array
        return;
      }

      if (!budgetField) {
        // Handle additional income items
        if (
          category.startsWith('+ ') ||
          category.includes('Additional Income')
        ) {
          const incomeItemName =
            category
              .replace('+ ', '')
              .replace('Additional Income', '')
              .trim() || 'Additional Income';

          if (existingBudget) {
            const updatedAdditionalIncomeItems = [
              ...(existingBudget.additional_income_items || []),
              { name: incomeItemName, amount: value },
            ];

            await budgetService.updateBudget(existingBudget._id!, {
              ...existingBudget,
              additional_income_items: updatedAdditionalIncomeItems,
            });
          } else {
            await budgetService.saveMonthBudget({
              month,
              year,
              income: 0,
              additional_income: 0,
              additional_income_items: [
                { name: incomeItemName, amount: value },
              ],
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
                others: 0,
              },
              additional_items: [],
              savings_items: [],
              manually_edited_categories: [category],
            });
          }
          return;
        }
        console.log('Unknown category:', category);
        return;
      }

      // Handle income
      if (budgetField === 'income') {
        if (existingBudget) {
          console.log(
            `💾 Updating existing budget ${existingBudget._id} with income=${value}`
          );
          const updated = await budgetService.updateBudget(
            existingBudget._id!,
            {
              ...existingBudget,
              income: value,
            }
          );
          console.log(`✅ Budget updated successfully:`, updated);
        } else {
          console.log(
            `💾 Creating new budget for ${month}/${year} with income=${value}`
          );
          await budgetService.saveMonthBudget({
            month,
            year,
            income: value,
            additional_income: 0,
            additional_income_items: [],
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
              others: 0,
            },
            additional_items: [],
            savings_items: [],
            manually_edited_categories: [category],
          });
        }
        return;
      }

      // Handle expenses
      if (existingBudget) {
        const updatedExpenses = {
          ...existingBudget.expenses,
          [budgetField]: value,
        };

        console.log(
          `💾 Updating existing budget ${existingBudget._id} with ${budgetField}=${value}`
        );
        const updated = await budgetService.updateBudget(existingBudget._id!, {
          ...existingBudget,
          expenses: updatedExpenses,
          manually_edited_categories: [
            ...(existingBudget.manually_edited_categories || []),
            ...(existingBudget.manually_edited_categories?.includes(category)
              ? []
              : [category]),
          ],
        });
        console.log(`✅ Budget updated successfully:`, updated);
      } else {
        console.log(
          `💾 Creating new budget for ${month}/${year} with ${budgetField}=${value}`
        );
        const expenses: any = {
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
          others: 0,
        };
        expenses[budgetField] = value;

        await budgetService.saveMonthBudget({
          month,
          year,
          income: 0,
          additional_income: 0,
          additional_income_items: [],
          expenses,
          additional_items: [],
          savings_items: [],
          manually_edited_categories: [category],
        });
      }
    } catch (error) {
      console.error('Error saving month changes:', error);
      // Re-throw the error so the caller knows the save failed
      throw new Error(
        `Failed to save ${category} for ${month}/${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const calculateDebtPayoffPlanFrontend = useCallback(
    (
      netSavingsData: any,
      debts: Debt[],
      strategyType: 'snowball' | 'avalanche',
      months: any[]
    ) => {
      return calcDebtPayoffPlan(netSavingsData, debts, strategyType, months);
    },
    []
  );

  const triggerImmediateDebtRecalculation = useCallback(async () => {
    if (!outstandingDebts?.length || debtCalculationInProgress) return;

    setDebtCalculationInProgress(true);
    setPlanLoading(true);

    try {
      const months = generateMonths();
      const netSavingsRow = localGridData.find(
        row => row.category === 'Net Savings'
      );

      if (!netSavingsRow) {
        return;
      }

      const freshPayoffPlan = calculateDebtPayoffPlanFrontend(
        netSavingsRow,
        outstandingDebts.filter(
          d => d.balance > 0 && d.debt_type !== 'mortgage'
        ),
        strategy,
        months
      );

      if (freshPayoffPlan && freshPayoffPlan.plan) {
        // Set payoffPlan in the format that MobileDebtPayoffTimelineGrid expects
        // The grid expects payoffPlan.plan[].debts[] structure
        setPayoffPlan({
          plan: freshPayoffPlan.plan.map((month: any) => ({
            month: month.month || 0,
            debts: month.debts || [],
            totalPaid: month.totalPaid || 0,
            totalInterest: month.totalInterest || 0,
            remainingDebt: month.remainingDebt || 0,
          })),
          total_months: freshPayoffPlan.plan.length,
          total_interest_paid: freshPayoffPlan.plan.reduce(
            (sum: number, month: any) => sum + (month.totalInterest || 0),
            0
          ),
          total_payments: freshPayoffPlan.plan.reduce(
            (sum: number, month: any) => sum + (month.totalPaid || 0),
            0
          ),
        } as any);

        setLocalGridData(prevData => {
          const updatedData = updateTotalDebtFromPayoffPlan(
            prevData,
            freshPayoffPlan,
            months
          );
          gridUpdateCounter.current++;
          setGridForceUpdate(prev => prev + 1);
          return updatedData;
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate debt payoff plan: ' + error);
    } finally {
      setDebtCalculationInProgress(false);
      setPlanLoading(false);
    }
  }, [
    generateMonths,
    localGridData,
    outstandingDebts,
    strategy,
    calculateDebtPayoffPlanFrontend,
  ]);

  // Recalculate when month window changes
  useEffect(() => {
    if (
      localGridData?.length &&
      outstandingDebts?.length &&
      !debtCalculationInProgress &&
      !isInitializingGrid
    ) {
      triggerImmediateDebtRecalculation();
    }
  }, [projectionMonths, historicalMonthsShown]);

  // Recalculate when strategy changes
  useEffect(() => {
    if (
      localGridData?.length &&
      outstandingDebts?.length &&
      !debtCalculationInProgress &&
      !isInitializingGrid
    ) {
      triggerImmediateDebtRecalculation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy]);

  const handleDebtChange = useCallback(async () => {
    if (debtCalculationInProgress) return;

    setDebtCalculationInProgress(true);

    try {
      await triggerImmediateDebtRecalculation();
    } catch (error) {
      Alert.alert('Error', 'Failed to update debt calculations: ' + error);
    } finally {
      setDebtCalculationInProgress(false);
    }
  }, [triggerImmediateDebtRecalculation, debtCalculationInProgress]);

  // Initial debt calculation after data loads
  const recalculationTriggered = useRef(false);
  useEffect(() => {
    if (
      outstandingDebts?.length > 0 &&
      localGridData?.length > 0 &&
      !loading &&
      !isInitializingGrid &&
      !debtCalculationInProgress &&
      !recalculationTriggered.current
    ) {
      recalculationTriggered.current = true;
      const timeoutId = setTimeout(() => {
        handleDebtChange().finally(() => {
          recalculationTriggered.current = false;
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    outstandingDebts?.length,
    localGridData?.length,
    loading,
    isInitializingGrid,
    debtCalculationInProgress,
  ]);

  const handleDebtSave = async (debtData: Partial<Debt>) => {
    try {
      setDebtFormLoading(true);

      if (editingDebt) {
        await debtPlanningService.updateDebt(editingDebt._id, debtData);
      } else {
        await debtPlanningService.createDebt(debtData);
      }

      await loadInitialData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save debt: ' + error);
    } finally {
      setDebtFormLoading(false);
    }
  };

  const handleDebtDelete = async (debtId: string) => {
    try {
      setDebtFormLoading(true);
      await debtPlanningService.deleteDebt(debtId);
      await loadInitialData();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete debt: ' + error);
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
        <Text style={styles.title}>
          Enhanced Debt Planning with Real-Time Updates
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTabIndex === 0 && styles.activeTab]}
          onPress={() => setSelectedTabIndex(0)}
        >
          <Text
            style={[
              styles.tabText,
              selectedTabIndex === 0 && styles.activeTabText,
            ]}
          >
            Budget Projection
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTabIndex === 1 && styles.activeTab]}
          onPress={() => setSelectedTabIndex(1)}
        >
          <Text
            style={[
              styles.tabText,
              selectedTabIndex === 1 && styles.activeTabText,
            ]}
          >
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
          onRequestClose={() =>
            setDeleteConfirmDialog({ open: false, debt: null })
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Delete Debt</Text>
              <Text style={styles.modalText}>
                Are you sure you want to delete this debt?
              </Text>

              {deleteConfirmDialog.debt && (
                <View style={styles.debtInfo}>
                  <Text style={styles.debtName}>
                    {deleteConfirmDialog.debt.name}
                  </Text>
                  <Text style={styles.debtDetails}>
                    Type:{' '}
                    {deleteConfirmDialog.debt.debt_type
                      ?.replace('_', ' ')
                      .toUpperCase() || 'OTHER'}
                  </Text>
                  <Text style={styles.debtDetails}>
                    Balance:{' '}
                    {formatCurrency(
                      parseFloat(
                        (
                          deleteConfirmDialog.debt.balance ||
                          deleteConfirmDialog.debt.amount
                        ).toString()
                      ) || 0
                    )}
                  </Text>
                  <Text style={styles.debtDetails}>
                    Interest Rate:{' '}
                    {(
                      parseFloat(
                        deleteConfirmDialog.debt.interest_rate.toString()
                      ) || 0
                    ).toFixed(2)}
                    %
                  </Text>
                </View>
              )}

              <Text style={styles.modalWarning}>
                This action cannot be undone.
              </Text>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() =>
                    setDeleteConfirmDialog({ open: false, debt: null })
                  }
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

const createStyles = (theme: any) =>
  StyleSheet.create({
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
