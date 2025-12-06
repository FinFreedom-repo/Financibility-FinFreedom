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
  updateRemainingDebtFromDebts,
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

  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>(
    'snowball'
  );
  const [isInitializingGrid, setIsInitializingGrid] = useState(false);
  const [isPropagatingChanges, setIsPropagatingChanges] = useState(false);

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

  const isUserEditingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const localGridDataRef = useRef<Record<string, any>[]>([]);

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
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);

      const debtsData = await debtPlanningService.getDebts();
      setOutstandingDebts(debtsData || []);
      await initializeGridData(debtsData || []);
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
      !isUserEditingRef.current &&
      localGridData.length === 0
    ) {
      // Only rebuild on initial load when we have no local grid data
      // After that, local state updates handle all changes
      const gridData = transformBackendBudgetsToGrid(backendBudgets);
      setLocalGridData(gridData);
      localGridDataRef.current = gridData;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectionMonths,
    historicalMonthsShown,
    backendBudgets,
    generateMonths,
    isInitializingGrid,
    localGridData.length,
    // transformBackendBudgetsToGrid is stable via useCallback and has deps: generateMonths, recalculateNetSavings
    // Both are implicitly covered: generateMonths is listed above, recalculateNetSavings has dep: generateMonths
    // Adding it here would cause ordering issues (defined later at line 419)
  ]);

  const initializeGridData = async (debtsToUse?: Debt[]) => {
    try {
      setIsInitializingGrid(true);

      const budgets = await debtPlanningService.getBudgetData();
      setBackendBudgets(budgets);

      const genMonths = generateMonths();
      let gridData: Record<string, any>[];

      if (budgets.length === 0) {
        // No budget data - initialize empty gridWe check localGridDataRef.current for empt
        gridData = transformBackendBudgetsToGrid([]);
        setLocalGridData(gridData);
        localGridDataRef.current = gridData;

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
      } else {
        // Transform backend budget data to grid format
        gridData = transformBackendBudgetsToGrid(budgets);
        setLocalGridData(gridData);
        localGridDataRef.current = gridData;

        // Initialize editable months
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
      }

      const debts = debtsToUse || outstandingDebts;
      if (debts && debts.length > 0) {
        const filteredDebts = debts.filter(d => {
          const balance = parseFloat(d.balance?.toString() || '0');
          const debtType = d.debt_type || '';
          return balance > 0 && debtType !== 'mortgage';
        });

        if (filteredDebts.length > 0) {
          const netSavingsRow = gridData.find(
            row => row.category === 'Net Savings'
          );

          if (netSavingsRow) {
            const freshPayoffPlan = calculateDebtPayoffPlanFrontend(
              netSavingsRow,
              filteredDebts,
              strategy,
              genMonths
            );

            if (freshPayoffPlan && freshPayoffPlan.plan) {
              const updatedWithPayoff = updateTotalDebtFromPayoffPlan(
                gridData,
                freshPayoffPlan,
                genMonths
              );
              setLocalGridData(updatedWithPayoff);
              localGridDataRef.current = updatedWithPayoff;

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
            } else {
              const updatedGridData = updateRemainingDebtFromDebts(
                gridData,
                filteredDebts,
                genMonths
              );
              setLocalGridData(updatedGridData);
              localGridDataRef.current = updatedGridData;
            }
          } else {
            const updatedGridData = updateRemainingDebtFromDebts(
              gridData,
              filteredDebts,
              genMonths
            );
            setLocalGridData(updatedGridData);
            localGridDataRef.current = updatedGridData;
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load budget data. Please try again.');
      const gridData = transformBackendBudgetsToGrid([]);
      setLocalGridData(gridData);
      localGridDataRef.current = gridData;
      setEditableMonths([]);
    } finally {
      setIsInitializingGrid(false);
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

          // Populate Remaining Debt from stored snapshot for historical months
          if (months[monthIdx]?.type === 'historical') {
            const remainingDebtRow = gridData.find(
              row => row.category === 'Remaining Debt'
            );
            if (
              remainingDebtRow &&
              (budget as any).total_remaining_debt !== undefined
            ) {
              (remainingDebtRow as any)[`month_${monthIdx}`] =
                (budget as any).total_remaining_debt || 0;
            }
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

      // Propagate current month values to future months only (not historical months)
      // Historical months are "freeze frames" - they should only show data from their actual database entries
      if (currentMonthIdx !== -1) {
        filteredGridData.forEach(row => {
          const currentValue = (row as any)[`month_${currentMonthIdx}`] || 0;
          for (let idx = 0; idx < months.length; idx++) {
            // Skip historical months - they are freeze frames and should never be propagated
            if (months[idx].type === 'historical') {
              continue;
            }
            // Only propagate to future months that don't have database entries and are currently 0
            if (
              months[idx].type === 'future' &&
              !dbMonthIndices.has(idx) &&
              (row as any)[`month_${idx}`] === 0
            ) {
              (row as any)[`month_${idx}`] = currentValue;
            }
          }
        });
      }

      const calculatedData = recalculateNetSavings(filteredGridData);

      // Don't set remaining debt here - let the debt payoff calculation handle it
      // This ensures it's always calculated from the current budget data
      return calculatedData;
    },
    [generateMonths, recalculateNetSavings]
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
  // Helper function to calculate total debt for a given month/year
  const calculateTotalDebtForMonth = useCallback(
    (month: number, year: number, debts: Debt[]): number => {
      if (!debts || debts.length === 0) return 0;

      const targetDate = new Date(year, month - 1, 1);

      const totalDebt = debts
        .filter(d => {
          const debtType = d.debt_type || '';
          if (debtType === 'mortgage') return false;

          const effectiveDate = d.effective_date;
          if (!effectiveDate) return false;

          const debtDate = new Date(effectiveDate);
          if (isNaN(debtDate.getTime())) return false;

          // Debt existed if effective_date is on or before the target month
          return debtDate <= targetDate;
        })
        .reduce((sum, debt) => {
          // For historical months, use original amount; for current/future, use balance
          const currentDate = new Date();
          const isHistorical =
            targetDate <
            new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const amount = isHistorical
            ? parseFloat(
                debt.amount?.toString() || debt.balance?.toString() || '0'
              )
            : parseFloat(
                debt.balance?.toString() || debt.amount?.toString() || '0'
              );
          return sum + (amount || 0);
        }, 0);

      return totalDebt;
    },
    []
  );

  const saveMonthChangesDirectly = useCallback(
    async (month: number, year: number, category: string, value: number) => {
      try {
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
          return;
        }

        // Handle income
        if (budgetField === 'income') {
          const totalDebt = calculateTotalDebtForMonth(
            month,
            year,
            outstandingDebts || []
          );
          if (existingBudget) {
            await budgetService.updateBudget(existingBudget._id!, {
              ...existingBudget,
              income: value,
              total_remaining_debt: totalDebt,
            });
          } else {
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
              total_remaining_debt: totalDebt,
            });
          }
          return;
        }

        // Handle expenses
        const totalDebt = calculateTotalDebtForMonth(
          month,
          year,
          outstandingDebts || []
        );
        if (existingBudget) {
          const updatedExpenses = {
            ...existingBudget.expenses,
            [budgetField]: value,
          };

          await budgetService.updateBudget(existingBudget._id!, {
            ...existingBudget,
            expenses: updatedExpenses,
            manually_edited_categories: [
              ...(existingBudget.manually_edited_categories || []),
              ...(existingBudget.manually_edited_categories?.includes(category)
                ? []
                : [category]),
            ],
            total_remaining_debt: totalDebt,
          });
        } else {
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
            total_remaining_debt: totalDebt,
          });
        }
      } catch (error) {
        // Re-throw the error so the caller knows the save failed
        throw new Error(
          `Failed to save ${category} for ${month}/${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [outstandingDebts, calculateTotalDebtForMonth]
  );

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

      const parsedValue = (() => {
        const trimmed = newValue.trim();
        if (trimmed === '' || trimmed === '-') return 0;
        const num = parseFloat(trimmed);
        return isNaN(num) ? 0 : num;
      })();

      const currentMonthIdx = months.findIndex(m => m.type === 'current');
      const isEditingCurrentMonth = monthIdx === currentMonthIdx;

      const monthsToPropagate: number[] = [];
      if (isEditingCurrentMonth) {
        const currentRow = localGridData.find(r => r.category === category);
        if (currentRow) {
          for (let i = monthIdx + 1; i < months.length; i++) {
            if (
              months[i]?.type === 'future' &&
              (currentRow[`month_${i}`] || 0) === 0
            ) {
              monthsToPropagate.push(i);
            }
          }
        }
      }

      setLocalGridData(prev => {
        const updated = prev.map(row => {
          if (row.category === category) {
            const updatedRow = { ...row };
            updatedRow[`month_${monthIdx}`] = parsedValue;

            monthsToPropagate.forEach(i => {
              updatedRow[`month_${i}`] = parsedValue;
            });

            return updatedRow as any;
          }
          return row;
        });

        const recalculated = recalculateNetSavings(updated);
        localGridDataRef.current = recalculated;
        return recalculated;
      });

      const month = months[monthIdx];
      const savePromises: Promise<void>[] = [
        saveMonthChangesDirectly(
          month.month,
          month.year,
          category,
          parsedValue
        ),
      ];

      monthsToPropagate.forEach(i => {
        const futureMonth = months[i];
        savePromises.push(
          saveMonthChangesDirectly(
            futureMonth.month,
            futureMonth.year,
            category,
            parsedValue
          )
        );
      });

      Promise.all(savePromises)
        .then(() => {})
        .catch(error => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          Alert.alert(
            'Save Failed',
            `Failed to save ${category}: ${errorMessage}\n\nWould you like to reload the data?`,
            [
              { text: 'Cancel', style: 'cancel' },
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
    [
      isInitializingGrid,
      generateMonths,
      recalculateNetSavings,
      loadInitialData,
      localGridData,
      saveMonthChangesDirectly,
    ]
  );

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
      const currentGridData = localGridDataRef.current;
      const netSavingsRow = currentGridData.find(
        row => row.category === 'Net Savings'
      );

      if (!netSavingsRow) {
        return;
      }

      const filteredDebts = outstandingDebts.filter(d => {
        const balance = parseFloat(d.balance?.toString() || '0');
        const debtType = d.debt_type || '';
        return balance > 0 && debtType !== 'mortgage';
      });

      if (filteredDebts.length === 0) {
        setLocalGridData(prevData => {
          const updated = updateRemainingDebtFromDebts(
            prevData,
            outstandingDebts,
            months
          );
          localGridDataRef.current = updated;
          return updated;
        });
        return;
      }

      const freshPayoffPlan = calculateDebtPayoffPlanFrontend(
        netSavingsRow,
        filteredDebts,
        strategy,
        months
      );

      if (freshPayoffPlan && freshPayoffPlan.plan) {
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
          localGridDataRef.current = updatedData;
          return updatedData;
        });
      } else {
        setLocalGridData(prevData => {
          const updated = updateRemainingDebtFromDebts(
            prevData,
            filteredDebts,
            months
          );
          localGridDataRef.current = updated;
          return updated;
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
    outstandingDebts,
    strategy,
    calculateDebtPayoffPlanFrontend,
    debtCalculationInProgress,
  ]);

  const lastRecalcTrigger = useRef({
    debtsLength: 0,
    strategy: 'snowball' as 'snowball' | 'avalanche',
    netSavings: '',
  });
  const debtRecalculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debtRecalculationTimeoutRef.current) {
      clearTimeout(debtRecalculationTimeoutRef.current);
      debtRecalculationTimeoutRef.current = null;
    }

    if (
      !outstandingDebts?.length ||
      !localGridData?.length ||
      loading ||
      debtCalculationInProgress ||
      isUserEditingRef.current ||
      isLoadingRef.current
    ) {
      return;
    }

    const netSavingsRow = localGridData.find(
      row => row.category === 'Net Savings'
    );
    if (!netSavingsRow) return;

    const months = generateMonths();
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    const netSavingsString = months
      .slice(currentMonthIdx)
      .map(
        (_, idx) =>
          Math.round(
            (netSavingsRow[`month_${currentMonthIdx + idx}`] || 0) * 100
          ) / 100
      )
      .join(',');

    const currentTrigger = {
      debtsLength: outstandingDebts.length,
      strategy,
      netSavings: netSavingsString,
    };

    const hasChanged =
      currentTrigger.debtsLength !== lastRecalcTrigger.current.debtsLength ||
      currentTrigger.strategy !== lastRecalcTrigger.current.strategy ||
      currentTrigger.netSavings !== lastRecalcTrigger.current.netSavings;

    if (hasChanged || !isInitializingGrid) {
      lastRecalcTrigger.current = currentTrigger;

      debtRecalculationTimeoutRef.current = setTimeout(
        () => {
          if (
            !debtCalculationInProgress &&
            !isUserEditingRef.current &&
            !isLoadingRef.current
          ) {
            triggerImmediateDebtRecalculation();
          }
          debtRecalculationTimeoutRef.current = null;
        },
        isInitializingGrid ? 0 : 300
      );
    }

    return () => {
      if (debtRecalculationTimeoutRef.current) {
        clearTimeout(debtRecalculationTimeoutRef.current);
        debtRecalculationTimeoutRef.current = null;
      }
    };
  }, [
    localGridData,
    outstandingDebts,
    strategy,
    loading,
    isInitializingGrid,
    debtCalculationInProgress,
    generateMonths,
    triggerImmediateDebtRecalculation,
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
            gridUpdating={false}
            isPropagatingChanges={isPropagatingChanges}
            propagationStatus=""
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
