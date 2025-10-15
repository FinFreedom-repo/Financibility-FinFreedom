import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/formatting';

const { width } = Dimensions.get('window');

interface MobileDebtPayoffTimelineGridProps {
  payoffPlan: any;
  outstandingDebts: any[];
  strategy: 'snowball' | 'avalanche';
  months: any[];
  onStrategyChange: (strategy: 'snowball' | 'avalanche') => void;
  onAddDebt: () => void;
  theme: any;
}

const MobileDebtPayoffTimelineGrid: React.FC<MobileDebtPayoffTimelineGridProps> = ({
  payoffPlan,
  outstandingDebts,
  strategy,
  months,
  onStrategyChange,
  onAddDebt,
  theme,
}) => {
  const styles = createStyles(theme);

  // Generate grid data in the same format as Budget Projection
  const generateGridData = () => {
    const currentMonthIdx = months.findIndex(m => m.type === 'current');
    
    // Create grid data in the same format as Budget Projection
    const gridData = [
      {
        category: 'Remaining Debt',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => { 
          const planIdx = idx - currentMonthIdx;
          let value = idx >= currentMonthIdx ? (payoffPlan?.plan?.[planIdx]?.debts?.reduce((sum: number, debt: any) => sum + (debt.balance || 0), 0) || 0) : 0;
          // Keep zero sticky after clearance
          if (idx > currentMonthIdx) {
            const prev = acc[`month_${idx - 1}`];
            if (typeof prev === 'number' && prev <= 0) value = 0;
          }
            return { ...acc, [`month_${idx}`]: value } as any;
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
          
          const totalPaid = payoffPlan?.plan?.[planIdx]?.totalPaid ?? (payoffPlan?.plan?.[planIdx]?.debts?.reduce((sum: number, debt: any) => sum + (debt.paid || 0), 0) || 0);
          const totalInterest = payoffPlan?.plan?.[planIdx]?.totalInterest ?? (payoffPlan?.plan?.[planIdx]?.debts?.reduce((sum: number, debt: any) => sum + (debt.interest || 0), 0) || 0);
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
            ? (payoffPlan?.plan?.[idx - currentMonthIdx]?.totalInterest ?? (payoffPlan?.plan?.[idx - currentMonthIdx]?.debts?.reduce((sum: number, debt: any) => sum + (debt.interest || 0), 0) || 0))
            : 0
        }), {})
      }
    ];

    // Add individual debt rows in the order they are being paid off according to strategy
    if (outstandingDebts.length > 0) {
      // Sort debts by strategy (Snowball: lowest to highest balance, Avalanche: highest to lowest interest rate)
      const sortedDebts = [...outstandingDebts].sort((a, b) => {
        if (strategy === 'snowball') {
          return parseFloat(a.balance.toString()) - parseFloat(b.balance.toString()); // Smallest balance first
        } else {
          return parseFloat(b.interest_rate.toString()) - parseFloat(a.interest_rate.toString()); // Highest rate first
        }
      });

      sortedDebts.forEach(debt => {
        const debtRow = {
          category: debt.name,
          type: 'debt',
          ...months.reduce((acc, _, idx) => { 
            const planIdx = idx - currentMonthIdx;
            let value = idx >= currentMonthIdx ? 
              (payoffPlan?.plan?.[planIdx]?.debts?.find((d: any) => d.name === debt.name)?.balance || 0) : 
              parseFloat(debt.balance.toString()) || 0;
            if (idx > currentMonthIdx) {
              const prev = (acc as any)[`month_${idx - 1}`];
              if (typeof prev === 'number' && prev <= 0) value = 0;
            }
            return { ...acc, [`month_${idx}`]: value } as any;
          }, {})
        };
        gridData.push(debtRow);
      });
    }

    return gridData;
  };

  const gridData = generateGridData();

  const getCellStyle = (month: any, category: string, value: number) => {
    const baseStyle = [styles.cell];
    
    // Time-based styling
    if (month.type === 'historical') {
      baseStyle.push(styles.historicalCell);
    } else if (month.type === 'current') {
      baseStyle.push(styles.currentCell);
    } else if (month.type === 'future') {
      baseStyle.push(styles.futureCell);
    }
    
    // Category-specific styling
    if (category === 'Remaining Debt') {
      baseStyle.push(styles.remainingDebtCell);
    } else if (category === 'Principal Paid Down') {
      baseStyle.push(styles.principalPaidCell);
    } else if (category === 'Interest Paid') {
      baseStyle.push(styles.interestPaidCell);
    } else if (category !== 'Remaining Debt' && category !== 'Principal Paid Down' && category !== 'Interest Paid') {
      baseStyle.push(styles.debtCell);
    }
    
    return baseStyle;
  };

  const getTextColor = (category: string, value: number) => {
    if (category === 'Remaining Debt') {
      return value > 0 ? theme.colors.error : theme.colors.success;
    }
    if (category === 'Principal Paid Down') {
      return theme.colors.success;
    }
    if (category === 'Interest Paid') {
      return theme.colors.warning;
    }
    return theme.colors.text;
  };

  const renderCell = (monthIdx: number, category: string, value: number) => {
    const month = months[monthIdx];
    
    return (
      <View style={getCellStyle(month, category, value)}>
        <Text
          style={[
            styles.cellText,
            { color: getTextColor(category, value) }
          ]}
        >
          {formatCurrency(value)}
        </Text>
      </View>
    );
  };

  const renderCategoryRow = (row: Record<string, any>) => {
    return (
      <View key={row.category} style={styles.row}>
        <View style={styles.categoryCell}>
          <Text
            style={[
              styles.categoryText,
              {
                color: row.category === 'Remaining Debt' ? theme.colors.error :
                       row.category === 'Principal Paid Down' ? theme.colors.success :
                       row.category === 'Interest Paid' ? theme.colors.warning : theme.colors.text,
                fontWeight: row.category === 'Remaining Debt' ? 'bold' : '600',
              }
            ]}
          >
            {row.category === 'Principal Paid Down' ? 'Principal\nPaid Down' : row.category}
          </Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.monthsContainer}>
            {months.map((month, idx) => (
              <View key={idx} style={styles.monthColumn}>
                <Text style={styles.monthHeader}>{month.label}</Text>
                {renderCell(idx, row.category, parseFloat(row[`month_${idx}`]) || 0)}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Strategy Selector */}
      <View style={styles.strategyContainer}>
        <Text style={styles.strategyTitle}>Debt Payoff Strategy</Text>
        <View style={styles.strategyButtons}>
          <TouchableOpacity
            style={[
              styles.strategyButton,
              strategy === 'snowball' && styles.activeStrategyButton
            ]}
            onPress={() => onStrategyChange('snowball')}
          >
            <Text style={[
              styles.strategyButtonText,
              strategy === 'snowball' && styles.activeStrategyButtonText
            ]}>
              Snowball
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.strategyButton,
              strategy === 'avalanche' && styles.activeStrategyButton
            ]}
            onPress={() => onStrategyChange('avalanche')}
          >
            <Text style={[
              styles.strategyButtonText,
              strategy === 'avalanche' && styles.activeStrategyButtonText
            ]}>
              Avalanche
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Debt Button */}
      <TouchableOpacity style={styles.addDebtButton} onPress={onAddDebt}>
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addDebtButtonText}>Add Debt</Text>
      </TouchableOpacity>

      {/* Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={styles.categoryHeader}>
              <Text style={styles.headerText}>Category</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.monthsContainer}>
                {months.map((month, idx) => (
                  <View key={idx} style={styles.monthColumn}>
                    <Text style={styles.monthHeader}>{month.label}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Data rows */}
          {gridData.map(renderCategoryRow)}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    margin: theme.spacing.sm,
  },
  strategyContainer: {
    marginBottom: theme.spacing.md,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  strategyButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  strategyButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  activeStrategyButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  strategyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  activeStrategyButtonText: {
    color: 'white',
  },
  addDebtButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  addDebtButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  grid: {
    minWidth: width * 0.9,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  categoryHeader: {
    width: 120,
    padding: theme.spacing.sm,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  monthsContainer: {
    flexDirection: 'row',
  },
  monthColumn: {
    width: 80,
    alignItems: 'center',
  },
  monthHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
  },
  categoryCell: {
    width: 120,
    padding: theme.spacing.sm,
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  cell: {
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  historicalCell: {
    backgroundColor: theme.colors.background,
    opacity: 0.7,
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  currentCell: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
  },
  futureCell: {
    backgroundColor: theme.colors.surface,
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  remainingDebtCell: {
    backgroundColor: theme.colors.error + '10',
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  principalPaidCell: {
    backgroundColor: theme.colors.success + '10',
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  interestPaidCell: {
    backgroundColor: theme.colors.warning + '10',
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  debtCell: {
    backgroundColor: theme.colors.background,
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MobileDebtPayoffTimelineGrid;
