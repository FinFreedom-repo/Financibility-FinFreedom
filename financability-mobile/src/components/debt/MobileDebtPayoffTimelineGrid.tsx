import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const MobileDebtPayoffTimelineGrid: React.FC<
  MobileDebtPayoffTimelineGridProps
> = ({
  payoffPlan,
  outstandingDebts,
  strategy,
  months,
  onStrategyChange,
  onAddDebt,
  theme,
}) => {
  const styles = createStyles(theme);
  const mainScrollViewRef = useRef<ScrollView>(null);
  const currentMonthIdx = months.findIndex(m => m.type === 'current');

  const calculateScrollPosition = useCallback(() => {
    if (currentMonthIdx < 0) return 0;
    const screenWidth = Dimensions.get('window').width;
    const monthWidth = 80;
    const categoryHeaderWidth = 120;
    return Math.max(
      0,
      currentMonthIdx * monthWidth -
        (screenWidth - categoryHeaderWidth) / 2 +
        monthWidth / 2
    );
  }, [currentMonthIdx]);

  useEffect(() => {
    if (mainScrollViewRef.current && currentMonthIdx >= 0) {
      const scrollPosition = calculateScrollPosition();
      // Use requestAnimationFrame for smoother, immediate scroll
      requestAnimationFrame(() => {
        mainScrollViewRef.current?.scrollTo({
          x: scrollPosition,
          animated: true,
        });
      });
    }
  }, [
    currentMonthIdx,
    months.length,
    calculateScrollPosition,
    payoffPlan,
    strategy,
  ]);

  // Generate grid data in the same format as Budget Projection
  const generateGridData = () => {
    const currentMonthIdx = months.findIndex(m => m.type === 'current');

    // Safety check: if no payoff plan, return empty grid
    if (!payoffPlan || !payoffPlan.plan || payoffPlan.plan.length === 0) {
      return [];
    }

    // Create grid data in the same format as Budget Projection
    const gridData = [
      {
        category: 'Remaining Debt',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => {
          const planIdx = idx - currentMonthIdx;
          if (idx < currentMonthIdx || planIdx < 0) {
            return { ...acc, [`month_${idx}`]: 0 } as any;
          }
          let value =
            payoffPlan?.plan?.[planIdx]?.debts?.reduce(
              (sum: number, debt: any) => sum + (debt.balance || 0),
              0
            ) || 0;
          // Keep zero sticky after clearance
          if (idx > currentMonthIdx) {
            const prev = acc[`month_${idx - 1}`];
            if (typeof prev === 'number' && prev <= 0) value = 0;
          }
          return { ...acc, [`month_${idx}`]: value } as any;
        }, {}),
      },
      {
        category: 'Principal Paid Down',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => {
          const planIdx = idx - currentMonthIdx;
          if (idx < currentMonthIdx) {
            return { ...acc, [`month_${idx}`]: 0 };
          }

          const totalPaid =
            payoffPlan?.plan?.[planIdx]?.totalPaid ??
            (payoffPlan?.plan?.[planIdx]?.debts?.reduce(
              (sum: number, debt: any) => sum + (debt.paid || 0),
              0
            ) ||
              0);
          const totalInterest =
            payoffPlan?.plan?.[planIdx]?.totalInterest ??
            (payoffPlan?.plan?.[planIdx]?.debts?.reduce(
              (sum: number, debt: any) => sum + (debt.interest || 0),
              0
            ) ||
              0);
          const principalPaid = Math.max(0, totalPaid - totalInterest);

          return { ...acc, [`month_${idx}`]: principalPaid };
        }, {}),
      },
      {
        category: 'Interest Paid',
        type: 'calculated',
        ...months.reduce((acc, _, idx) => {
          const planIdx = idx - currentMonthIdx;
          if (idx < currentMonthIdx || planIdx < 0) {
            return { ...acc, [`month_${idx}`]: 0 };
          }
          const value =
            payoffPlan?.plan?.[planIdx]?.totalInterest ??
            (payoffPlan?.plan?.[planIdx]?.debts?.reduce(
              (sum: number, debt: any) => sum + (debt.interest || 0),
              0
            ) ||
              0);
          return { ...acc, [`month_${idx}`]: value };
        }, {}),
      },
    ];

    // Add individual debt rows in the order they are being paid off according to strategy
    if (outstandingDebts.length > 0) {
      // Sort debts by strategy (Snowball: lowest to highest balance, Avalanche: highest to lowest interest rate)
      const sortedDebts = [...outstandingDebts].sort((a, b) => {
        if (strategy === 'snowball') {
          return (
            parseFloat(a.balance.toString()) - parseFloat(b.balance.toString())
          ); // Smallest balance first
        } else {
          return (
            parseFloat(b.interest_rate.toString()) -
            parseFloat(a.interest_rate.toString())
          ); // Highest rate first
        }
      });

      sortedDebts.forEach(debt => {
        const debtRow = {
          category: debt.name,
          type: 'debt',
          ...months.reduce((acc, _, idx) => {
            const planIdx = idx - currentMonthIdx;
            if (idx < currentMonthIdx || planIdx < 0) {
              // Historical months: use initial debt balance
              return {
                ...acc,
                [`month_${idx}`]: parseFloat(debt.balance.toString()) || 0,
              } as any;
            }
            // Current and future months: use plan data
            let value =
              payoffPlan?.plan?.[planIdx]?.debts?.find(
                (d: any) => d.name === debt.name
              )?.balance || 0;
            if (idx > currentMonthIdx) {
              const prev = (acc as any)[`month_${idx - 1}`];
              if (typeof prev === 'number' && prev <= 0) value = 0;
            }
            return { ...acc, [`month_${idx}`]: value } as any;
          }, {}),
        };
        gridData.push(debtRow);
      });
    }

    return gridData;
  };

  const gridData = generateGridData();

  const calculateDebtFreeMonth = () => {
    if (!payoffPlan || !payoffPlan.plan || payoffPlan.plan.length === 0) {
      return -1;
    }

    // Match desktop logic: use remainingDebt directly from plan, or calculate from debts
    for (let i = 0; i < payoffPlan.plan.length; i++) {
      const monthPlan = payoffPlan.plan[i];
      // Use remainingDebt if available (matches desktop), otherwise calculate from debts
      const remainingDebt =
        (monthPlan as any)?.remainingDebt !== undefined
          ? (monthPlan as any).remainingDebt
          : monthPlan?.debts?.reduce(
              (sum: number, debt: any) => sum + (debt.balance || 0),
              0
            ) || 0;

      if (remainingDebt === 0) {
        return currentMonthIdx + i;
      }
    }
    return -1;
  };

  const debtFreeMonthIdx = calculateDebtFreeMonth();

  const getCellStyle = (
    month: any,
    category: string,
    value: number,
    monthIdx: number
  ) => {
    const baseStyle = [styles.cell];

    if (debtFreeMonthIdx === monthIdx && category === 'Remaining Debt') {
      baseStyle.push(styles.debtFreeCell);
      return baseStyle;
    }

    const isHistorical = month.type === 'historical';
    const isCurrent = month.type === 'current';
    const isFuture = month.type === 'future';

    if (category === 'Principal Paid Down') {
      if (isHistorical) {
        baseStyle.push(styles.principalPaidHistoricalCell);
      } else if (isCurrent) {
        baseStyle.push(styles.principalPaidCurrentCell);
      } else if (isFuture) {
        baseStyle.push(styles.principalPaidFutureCell);
      }
    } else if (category === 'Interest Paid') {
      if (isHistorical) {
        baseStyle.push(styles.interestPaidHistoricalCell);
      } else if (isCurrent) {
        baseStyle.push(styles.interestPaidCurrentCell);
      } else if (isFuture) {
        baseStyle.push(styles.interestPaidFutureCell);
      }
    } else if (category === 'Remaining Debt') {
      if (isHistorical) {
        baseStyle.push(styles.remainingDebtHistoricalCell);
      } else if (isCurrent) {
        baseStyle.push(styles.remainingDebtCurrentCell);
      } else if (isFuture) {
        baseStyle.push(styles.remainingDebtFutureCell);
      }
    } else {
      if (isHistorical) {
        baseStyle.push(styles.debtHistoricalCell);
      } else if (isCurrent) {
        baseStyle.push(styles.debtCurrentCell);
      } else if (isFuture) {
        baseStyle.push(styles.debtFutureCell);
      }
    }

    return baseStyle;
  };

  const getTextColor = (month: any, category: string, value: number) => {
    if (category === 'Remaining Debt') {
      return value > 0 ? '#000000' : theme.colors.success;
    }
    if (category === 'Principal Paid Down' || category === 'Interest Paid') {
      return '#FFFFFF';
    }
    if (month.type === 'historical') {
      return '#FFFFFF';
    }
    return '#FFFFFF';
  };

  const renderCell = (monthIdx: number, category: string, value: number) => {
    const month = months[monthIdx];
    const isDebtFree =
      debtFreeMonthIdx === monthIdx && category === 'Remaining Debt';

    return (
      <View style={getCellStyle(month, category, value, monthIdx)}>
        {isDebtFree && (
          <View style={styles.debtFreeBadge}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={theme.colors.success}
            />
          </View>
        )}
        <Text
          style={[
            styles.cellText,
            { color: getTextColor(month, category, value) },
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
                color:
                  row.category === 'Remaining Debt'
                    ? theme.colors.error
                    : row.category === 'Principal Paid Down'
                      ? theme.colors.success
                      : row.category === 'Interest Paid'
                        ? theme.colors.warning
                        : theme.colors.text,
                fontWeight: row.category === 'Remaining Debt' ? 'bold' : '600',
              },
            ]}
          >
            {row.category === 'Principal Paid Down'
              ? 'Principal\nPaid Down'
              : row.category}
          </Text>
        </View>

        <View style={styles.monthsContainer}>
          {months.map((month, idx) => (
            <View key={idx} style={styles.monthColumn}>
              {renderCell(
                idx,
                row.category,
                parseFloat(row[`month_${idx}`]) || 0
              )}
            </View>
          ))}
        </View>
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
              strategy === 'snowball' && styles.activeStrategyButton,
            ]}
            onPress={() => onStrategyChange('snowball')}
          >
            <Text
              style={[
                styles.strategyButtonText,
                strategy === 'snowball' && styles.activeStrategyButtonText,
              ]}
            >
              Snowball
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.strategyButton,
              strategy === 'avalanche' && styles.activeStrategyButton,
            ]}
            onPress={() => onStrategyChange('avalanche')}
          >
            <Text
              style={[
                styles.strategyButtonText,
                strategy === 'avalanche' && styles.activeStrategyButtonText,
              ]}
            >
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

      {/* Debt-Free Month Indicator */}
      {debtFreeMonthIdx >= 0 && (
        <View style={styles.debtFreeIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <View style={styles.debtFreeTextContainer}>
            <Text style={styles.debtFreeTitle}>Debt-Free</Text>
            <Text style={styles.debtFreeDate}>
              {months[debtFreeMonthIdx]?.label}
            </Text>
          </View>
        </View>
      )}

      {/* Grid */}
      <ScrollView
        ref={mainScrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() => {
          // Scroll when content size is known (e.g., when strategy changes and grid updates)
          if (mainScrollViewRef.current && currentMonthIdx >= 0) {
            const scrollPosition = calculateScrollPosition();
            requestAnimationFrame(() => {
              mainScrollViewRef.current?.scrollTo({
                x: scrollPosition,
                animated: true,
              });
            });
          }
        }}
      >
        <View style={styles.grid}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={styles.categoryHeader}>
              <Text style={styles.headerText}>Category</Text>
            </View>
            <View style={styles.monthsContainer}>
              {months.map((month, idx) => (
                <View key={idx} style={styles.monthColumn}>
                  <View style={styles.monthHeaderContainer}>
                    <Text style={styles.monthHeader}>{month.label}</Text>
                    {debtFreeMonthIdx === idx && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={theme.colors.success}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Data rows */}
          {gridData.map(renderCategoryRow)}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
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
      justifyContent: 'center',
    },
    monthHeaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginBottom: theme.spacing.xs,
    },
    monthHeader: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    debtFreeIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1976d2',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: 12,
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
      shadowColor: '#1976d2',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    debtFreeTextContainer: {
      alignItems: 'center',
    },
    debtFreeTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      lineHeight: 22,
    },
    debtFreeDate: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      lineHeight: 20,
    },
    debtFreeBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      zIndex: 1,
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
    debtFreeCell: {
      backgroundColor: '#bbf7d0',
      borderColor: '#16a34a',
      borderWidth: 3,
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      position: 'relative',
    },
    principalPaidHistoricalCell: {
      backgroundColor: 'rgba(25, 118, 210, 0.3)',
      opacity: 0.6,
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    principalPaidCurrentCell: {
      backgroundColor: '#1976d2',
      borderColor: '#374151',
      borderWidth: 3,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
    },
    principalPaidFutureCell: {
      backgroundColor: 'rgba(25, 118, 210, 0.7)',
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    interestPaidHistoricalCell: {
      backgroundColor: 'rgba(66, 165, 245, 0.3)',
      opacity: 0.6,
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    interestPaidCurrentCell: {
      backgroundColor: '#42a5f5',
      borderColor: '#374151',
      borderWidth: 3,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
    },
    interestPaidFutureCell: {
      backgroundColor: 'rgba(66, 165, 245, 0.7)',
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    remainingDebtHistoricalCell: {
      backgroundColor: 'rgba(255, 193, 7, 0.4)',
      opacity: 0.6,
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    remainingDebtCurrentCell: {
      backgroundColor: 'rgba(255, 193, 7, 0.8)',
      borderColor: '#374151',
      borderWidth: 3,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
    },
    remainingDebtFutureCell: {
      backgroundColor: 'rgba(255, 193, 7, 0.6)',
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    debtHistoricalCell: {
      backgroundColor: 'rgba(244, 67, 54, 0.3)',
      opacity: 0.6,
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    debtCurrentCell: {
      backgroundColor: '#f44336',
      borderColor: '#374151',
      borderWidth: 3,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
    },
    debtFutureCell: {
      backgroundColor: 'rgba(244, 67, 54, 0.7)',
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
