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

const { width } = Dimensions.get('window');

interface MobileDebtPlanningProps {
  onNavigate?: (screen: string) => void;
}

// Helper function to normalize category names for case-insensitive matching
const normalizeCategoryName = (name: string): string => {
  // Convert to uppercase for consistency (CV, VA, etc.)
  return name.toUpperCase();
};

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

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Rebuild grid data when backend budgets change
  useEffect(() => {
    if (backendBudgets && backendBudgets.length > 0 && !isInitializingGrid) {
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

  const loadInitialData = async () => {
    try {
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
    }
  };

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
                const normalizedName = normalizeCategoryName(itemName);
                let additionalIncomeRow = gridData.find(
                  row =>
                    normalizeCategoryName(row.category) === normalizedName &&
                    row.type === 'additional_income'
                );

                if (!additionalIncomeRow) {
                  // Create new Additional Income row
                  // Use normalized name for consistency
                  additionalIncomeRow = {
                    category: normalizedName,
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

      // For any month without DB data, inherit values from the current month
      if (currentMonthIdx !== -1) {
        gridData.forEach(row => {
          const currentValue = (row as any)[`month_${currentMonthIdx}`] || 0;
          for (let idx = 0; idx < months.length; idx++) {
            if (months[idx].type === 'historical') {
              (row as any)[`month_${idx}`] = currentValue;
              continue;
            }
            if (
              !dbMonthIndices.has(idx) &&
              (row as any)[`month_${idx}`] === 0
            ) {
              (row as any)[`month_${idx}`] = currentValue;
            }
          }
        });
      }

      // Calculate net savings
      const calculatedData = recalculateNetSavings(gridData);

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
      if (!months[monthIdx] || months[monthIdx].type === 'historical') return;

      if (isInitializingGrid) {
        return;
      }

      setIsUpdatingCell(true);
      setGridUpdating(true);
      setPropagationProgress(0);
      setIsPropagatingChanges(true);

      try {
        // Record user edit for change tracking
        const editKey = `${monthIdx}-${category}`;
        setUserEditedCells(prev => {
          const next = new Map(prev);
          // Use normalized comparison for additional income items
          const findRow = (row: any) => {
            if (row.type === 'additional_income') {
              return normalizeCategoryName(row.category) === normalizeCategoryName(category);
            }
            return row.category === category;
          };
          next.set(editKey, {
            monthIdx,
            category,
            originalValue:
              localGridData.find(findRow)?.[
                `month_${monthIdx}`
              ] || 0,
            newValue: parseFloat(newValue) || 0,
            timestamp: Date.now(),
            isUserEdit: true,
          });
          return next;
        });

        // Mark projected month cells as locked when user edits them
        if (months[monthIdx].type === 'future') {
          setLockedCells(prev => {
            const next = { ...prev };
            const lockedForMonth = next[monthIdx] || [];
            if (!lockedForMonth.includes(category)) {
              next[monthIdx] = [...lockedForMonth, category];
            }
            return next;
          });
        }

        // Update grid data and trigger real-time recalculation
        const updatedGridData = await handleRealTimeGridUpdate(
          monthIdx,
          category,
          newValue,
          months
        );

        // Persist the edited cell itself
        if (months[monthIdx].type === 'current') {
          await saveMonthChangesDirectly(
            months[monthIdx].month,
            months[monthIdx].year,
            category,
            parseFloat(newValue) || 0
          );
        } else if (months[monthIdx].type === 'future') {
          // Save projected month edit so it persists and is protected from later refreshes
          await saveMonthChangesDirectly(
            months[monthIdx].month,
            months[monthIdx].year,
            category,
            parseFloat(newValue) || 0
          );
        }

        // If current month was edited, propagate to future months
        if (
          months[monthIdx].type === 'current' &&
          category !== 'Remaining Debt' &&
          category !== 'Net Savings'
        ) {
          await propagateCurrentMonthChanges(
            monthIdx,
            category,
            newValue,
            months,
            updatedGridData
          );
        }

        // Trigger immediate debt payoff recalculation
        await triggerImmediateDebtRecalculation();

        // Update propagation progress
        setPropagationProgress(100);
      } catch (error) {
        Alert.alert('Error', 'Failed to update cell: ' + error);
      } finally {
        setIsUpdatingCell(false);
        setGridUpdating(false);
        setIsPropagatingChanges(false);
        setPropagationProgress(0);
      }
    },
    [isInitializingGrid, localGridData, generateMonths]
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
            // Use normalized comparison for additional income items
            if (row.type === 'additional_income') {
              if (normalizeCategoryName(row.category) === normalizeCategoryName(category)) {
                return {
                  ...row,
                  [`month_${monthIdx}`]: parseFloat(newValue) || 0,
                } as any;
              }
            } else if (row.category === category) {
              return {
                ...row,
                [`month_${monthIdx}`]: parseFloat(newValue) || 0,
              } as any;
            }
            return row;
          });

          // If this is an Additional Income item and the row doesn't exist, create it
          if (
            category !== 'Primary Income' &&
            category !== 'Net Savings' &&
            category !== 'Remaining Debt' &&
            !updated.find(row => normalizeCategoryName(row.category) === normalizeCategoryName(category))
          ) {
            const additionalIncomeRow = {
              category: normalizeCategoryName(category),
              type: 'additional_income',
              ...months.reduce(
                (acc, _, idx) => ({ ...acc, [`month_${idx}`]: 0 }),
                {}
              ),
            };
            (additionalIncomeRow as any)[`month_${monthIdx}`] =
              parseFloat(newValue) || 0;

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
      const currentVal = parseFloat(newValue) || 0;

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
    } catch (error) {
      throw error;
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
