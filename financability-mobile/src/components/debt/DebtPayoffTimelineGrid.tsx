import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Debt, DebtPlannerResponse } from '../../services/debtPlanningService';
import debtPlanningService from '../../services/debtPlanningService';
import Card from '../common/Card';

interface DebtPayoffTimelineGridProps {
  outstandingDebts: Debt[];
  payoffPlan: DebtPlannerResponse | null;
  strategy: 'snowball' | 'avalanche';
  localGridData: any[];
  generateMonths: () => any[];
  planLoading: boolean;
  debtCalculationInProgress: boolean;
  onStrategyChange: (strategy: 'snowball' | 'avalanche') => void;
  onAddDebt: () => void;
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (debt: Debt) => void;
}

const DebtPayoffTimelineGrid: React.FC<DebtPayoffTimelineGridProps> = ({
  outstandingDebts,
  payoffPlan,
  strategy,
  localGridData,
  generateMonths,
  planLoading,
  debtCalculationInProgress,
  onStrategyChange,
  onAddDebt,
  onEditDebt,
  onDeleteDebt,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Generate grid data exactly like the website
  const generateGridData = useCallback(() => {
    const months = generateMonths();
    if (!months || months.length === 0) return [];
    
    const currentMonthIdx = months.findIndex(m => m && m.type === 'current');
    
    // Get net savings from the actual budget grid data
    const netSavingsRow = localGridData.find(row => row.category === 'Net Savings');
    
    // If no payoff plan exists, create a basic one for display (EXACT website logic)
    let displayPayoffPlan = payoffPlan;
    if (!payoffPlan || !payoffPlan.payoff_plan) {
      // Create a basic plan structure for display - matching website structure
      displayPayoffPlan = {
        plan: months.map((_, idx) => ({
          month: idx,
          debts: outstandingDebts.map(debt => ({
            name: debt.name,
            balance: idx >= currentMonthIdx ? (debt.balance || debt.amount || 0) : (debt.balance || debt.amount || 0),
            paid: 0,
            interest: 0
          }))
        }))
      };
    } else {
      // Transform mobile payoff_plan structure to website plan structure
      displayPayoffPlan = {
        plan: payoffPlan.payoff_plan.monthly_payments?.map((payment, idx) => ({
          month: idx,
          debts: payment.debts?.map(debt => ({
            name: debt.debt_name,
            balance: debt.remaining_balance,
            paid: debt.payment,
            interest: debt.interest_paid
          })) || outstandingDebts.map(debt => ({
            name: debt.name,
            balance: debt.balance || debt.amount || 0,
            paid: 0,
            interest: 0
          }))
        })) || months.map((_, idx) => ({
          month: idx,
          debts: outstandingDebts.map(debt => ({
            name: debt.name,
            balance: debt.balance || debt.amount || 0,
            paid: 0,
            interest: 0
          }))
        }))
      };
    }

    // Ensure months beyond DB window inherit current month values for Net Savings
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
    const totalDebt = outstandingDebts.reduce((sum, debt) => sum + (debt.balance || debt.amount || 0), 0);
    
    // Create grid data in the same format as Budget Projection (EXACT website logic)
    const gridData = [
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
      },
      {
        category: 'Principal Paid Down',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => { 
          const planIdx = idx - currentMonthIdx;
          if (idx < currentMonthIdx) {
            return { ...acc, [`month_${idx}`]: 0 };
          }
          
          const totalPaid = displayPayoffPlan.plan[planIdx]?.totalPaid ?? (displayPayoffPlan.plan[planIdx]?.debts?.reduce((sum, debt) => sum + (debt.paid || 0), 0) || 0);
          const totalInterest = displayPayoffPlan.plan[planIdx]?.totalInterest ?? (displayPayoffPlan.plan[planIdx]?.debts?.reduce((sum, debt) => sum + (debt.interest || 0), 0) || 0);
          const principalPaid = Math.max(0, totalPaid - totalInterest);
          
          return { ...acc, [`month_${idx}`]: principalPaid };
        }, {})
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
      }
    ];

    // Add individual debt rows in the order they are being paid off according to strategy
    if (outstandingDebts.length > 0) {
      // Sort debts by strategy (Snowball: lowest to highest balance, Avalanche: highest to lowest interest rate)
      const sortedDebts = [...outstandingDebts].sort((a, b) => {
        if (strategy === 'snowball') {
          return (a.balance || a.amount || 0) - (b.balance || b.amount || 0); // Smallest balance first
        } else {
          return (b.interest_rate || 0) - (a.interest_rate || 0); // Highest rate first
        }
      });

      sortedDebts.forEach(debt => {
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

    return { gridData, months };
  }, [outstandingDebts, payoffPlan, strategy, localGridData, generateMonths]);

  const { gridData, months } = useMemo(() => generateGridData(), [generateGridData]);

  const formatCurrency = (value: number) => {
    return debtPlanningService.formatCurrency(value);
  };

  const getCellStyle = (row: any, colIdx: number) => {
    const month = months[colIdx];
    if (!month) return {};
    
    if (row.category === 'Remaining Debt') {
      return {
        backgroundColor: theme.colors.error + '10',
        borderColor: theme.colors.error + '30',
      };
    } else if (row.category === 'Principal Paid Down') {
      return {
        backgroundColor: theme.colors.success + '10',
        borderColor: theme.colors.success + '30',
      };
    } else if (row.category === 'Interest Paid') {
      return {
        backgroundColor: theme.colors.warning + '10',
        borderColor: theme.colors.warning + '30',
      };
    } else if (row.type === 'debt') {
      return {
        backgroundColor: theme.colors.primary + '05',
        borderColor: theme.colors.primary + '20',
      };
    }
    
    return {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.textSecondary + '20',
    };
  };

  const getCellTextColor = (row: any, colIdx: number) => {
    const month = months[colIdx];
    if (!month) return theme.colors.text;
    
    if (row.category === 'Remaining Debt') {
      return theme.colors.error;
    } else if (row.category === 'Principal Paid Down') {
      return theme.colors.success;
    } else if (row.category === 'Interest Paid') {
      return theme.colors.warning;
    }
    
    return theme.colors.text;
  };

  if (planLoading || debtCalculationInProgress) {
    return (
      <Card style={styles.loadingCard}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Calculating debt payoff timeline...</Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {/* Strategy Selector and Debt Management */}
      <View style={styles.controlsContainer}>
        <View style={styles.strategyContainer}>
          <Text style={styles.controlsLabel}>Payoff Strategy:</Text>
          <View style={styles.strategyButtons}>
            <TouchableOpacity
              style={[
                styles.strategyButton,
                strategy === 'snowball' && styles.strategyButtonActive
              ]}
              onPress={() => onStrategyChange('snowball')}
            >
              <Text style={[
                styles.strategyButtonText,
                strategy === 'snowball' && styles.strategyButtonTextActive
              ]}>
                Snowball
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.strategyButton,
                strategy === 'avalanche' && styles.strategyButtonActive
              ]}
              onPress={() => onStrategyChange('avalanche')}
            >
              <Text style={[
                styles.strategyButtonText,
                strategy === 'avalanche' && styles.strategyButtonTextActive
              ]}>
                Avalanche
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addDebtButton}
          onPress={onAddDebt}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addDebtButtonText}>Add Debt</Text>
        </TouchableOpacity>
      </View>

      {/* Grid Header */}
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>Debt Payoff Timeline</Text>
        <Text style={styles.gridSubtitle}>
          {months.length} months • {outstandingDebts.length} debts
        </Text>
      </View>

      {/* Grid Content */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        style={styles.gridScrollView}
        contentContainerStyle={styles.gridContent}
      >
        <View style={styles.gridContainer}>
          {/* Column Headers */}
          <View style={styles.columnHeaders}>
            <View style={[styles.categoryColumn, styles.headerCell]}>
              <Text style={styles.headerText}>Category</Text>
            </View>
            {months.map((month, idx) => (
              <View key={idx} style={[styles.monthColumn, styles.headerCell]}>
                <Text style={styles.headerText}>{month.label}</Text>
              </View>
            ))}
          </View>

          {/* Grid Rows */}
          {gridData.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {/* Category Column */}
              <View style={[styles.categoryColumn, styles.categoryCell]}>
                <Text style={[
                  styles.categoryText,
                  row.category === 'Remaining Debt' && styles.remainingDebtText,
                  row.category === 'Principal Paid Down' && styles.principalPaidText,
                  row.category === 'Interest Paid' && styles.interestPaidText,
                  row.type === 'debt' && styles.debtText,
                ]}>
                  {row.category}
                </Text>
              </View>

              {/* Month Columns */}
              {months.map((month, colIdx) => {
                const value = row[`month_${colIdx}`] || 0;
                const cellStyle = getCellStyle(row, colIdx);
                const textColor = getCellTextColor(row, colIdx);
                
                return (
                  <View 
                    key={colIdx} 
                    style={[
                      styles.monthColumn, 
                      styles.dataCell,
                      cellStyle
                    ]}
                  >
                    <Text style={[styles.cellText, { color: textColor }]}>
                      {formatCurrency(value)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textSecondary + '20',
  },
  strategyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.md,
  },
  strategyButtons: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    overflow: 'hidden',
  },
  strategyButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  strategyButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  strategyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  strategyButtonTextActive: {
    color: 'white',
  },
  addDebtButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  addDebtButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  loadingCard: {
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  gridHeader: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textSecondary + '20',
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  gridScrollView: {
    flex: 1,
  },
  gridContent: {
    paddingBottom: theme.spacing.md,
  },
  gridContainer: {
    minWidth: 800, // Ensure enough width for all columns
  },
  columnHeaders: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textSecondary + '10',
  },
  categoryColumn: {
    width: 200,
    minWidth: 200,
    padding: theme.spacing.sm,
    justifyContent: 'center',
  },
  monthColumn: {
    width: 120,
    minWidth: 120,
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCell: {
    backgroundColor: theme.colors.primary + '10',
    borderRightWidth: 1,
    borderRightColor: theme.colors.textSecondary + '20',
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  categoryCell: {
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1,
    borderRightColor: theme.colors.textSecondary + '20',
  },
  dataCell: {
    borderRightWidth: 1,
    borderRightColor: theme.colors.textSecondary + '10',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  remainingDebtText: {
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  principalPaidText: {
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  interestPaidText: {
    color: theme.colors.warning,
    fontWeight: 'bold',
  },
  debtText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  cellText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default DebtPayoffTimelineGrid;
