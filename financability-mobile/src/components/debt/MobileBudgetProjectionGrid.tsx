import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/formatting';

const { width } = Dimensions.get('window');

interface MobileBudgetProjectionGridProps {
  gridData: Record<string, any>[];
  months: any[];
  onCellValueChanged: (
    monthIdx: number,
    category: string,
    value: string
  ) => void;
  gridUpdating: boolean;
  isPropagatingChanges: boolean;
  propagationStatus: string;
  theme: any;
}

const MobileBudgetProjectionGrid: React.FC<MobileBudgetProjectionGridProps> = ({
  gridData,
  months,
  onCellValueChanged,
  gridUpdating,
  isPropagatingChanges,
  propagationStatus,
  theme,
}) => {
  const [editingCell, setEditingCell] = useState<{
    monthIdx: number;
    category: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const mainScrollViewRef = useRef<ScrollView>(null);
  const currentMonthIdx = months.findIndex(m => m.type === 'current');

  const styles = createStyles(theme);

  // Reorder grid data to put Remaining Debt and Net Savings at the top (matching web)
  // Order: Remaining Debt first, then Net Savings
  const reorderedGridData = useMemo(() => {
    const reordered = [...gridData];
    const remainingDebtIndex = reordered.findIndex(
      row => row.category === 'Remaining Debt'
    );

    // First, move Remaining Debt to the top
    if (remainingDebtIndex > -1) {
      const remainingDebtRow = reordered.splice(remainingDebtIndex, 1)[0];
      reordered.unshift(remainingDebtRow);
    }

    // Then, move Net Savings to the top (after Remaining Debt)
    const newNetSavingsIndex = reordered.findIndex(
      row => row.category === 'Net Savings'
    );
    if (newNetSavingsIndex > -1) {
      const netSavingsRow = reordered.splice(newNetSavingsIndex, 1)[0];
      reordered.splice(1, 0, netSavingsRow); // Insert at index 1 (after Remaining Debt)
    }

    return reordered;
  }, [gridData]);

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
  }, [currentMonthIdx, months.length, calculateScrollPosition]);

  if (!months || months.length === 0) return null;

  const isCellEditable = (month: any, category: string) => {
    if (category === 'Net Savings' || category === 'Remaining Debt')
      return false;
    if (month.type === 'historical') return false;
    return true;
  };

  const getCellStyle = (month: any, category: string, value: number) => {
    const baseStyle: any[] = [styles.cell];

    const isHistorical = month.type === 'historical';
    const isCurrent = month.type === 'current';
    const isFuture = month.type === 'future';

    if (category === 'Remaining Debt') {
      baseStyle.push(styles.remainingDebtCell);
      if (isCurrent) {
        baseStyle.push(styles.calculatedCurrentBorder);
      }
    } else if (category === 'Net Savings') {
      baseStyle.push(styles.calculatedCell);
      if (isCurrent) {
        baseStyle.push(styles.calculatedCurrentBorder);
      }
    } else if (
      category === 'Primary Income' ||
      category.includes('Additional Income') ||
      category.startsWith('+ ')
    ) {
      baseStyle.push(styles.incomeCell);
      if (isCurrent) {
        baseStyle.push(styles.incomeCurrentBorder);
      }
    } else {
      if (isHistorical) {
        baseStyle.push(styles.expenseHistoricalCell);
      } else if (isCurrent) {
        baseStyle.push(styles.expenseCurrentCell);
      } else if (isFuture) {
        baseStyle.push(styles.expenseFutureCell);
      }
    }

    return baseStyle;
  };

  const getTextColor = (month: any, category: string, value: number) => {
    if (category === 'Remaining Debt' || category === 'Net Savings') {
      return '#FFFFFF';
    }
    if (
      category === 'Primary Income' ||
      category.includes('Additional Income') ||
      category.startsWith('+ ')
    ) {
      return '#FFFFFF';
    }
    if (
      month.type === 'historical' ||
      month.type === 'current' ||
      month.type === 'future'
    ) {
      return '#FFFFFF';
    }
    return theme.colors.text;
  };

  const handleCellPress = (
    monthIdx: number,
    category: string,
    currentValue: number
  ) => {
    if (!isCellEditable(months[monthIdx], category)) return;

    setEditingCell({ monthIdx, category });
    setEditValue(currentValue.toString());
  };

  const handleCellSubmit = () => {
    if (editingCell) {
      onCellValueChanged(editingCell.monthIdx, editingCell.category, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const renderCell = (monthIdx: number, category: string, value: number) => {
    const month = months[monthIdx];
    const isEditable = isCellEditable(month, category);

    if (
      editingCell &&
      editingCell.monthIdx === monthIdx &&
      editingCell.category === category
    ) {
      return (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editValue}
            onChangeText={setEditValue}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
          />
          <View style={styles.editButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleCellSubmit}
            >
              <Ionicons
                name="checkmark"
                size={16}
                color={theme.colors.success}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleCellCancel}
            >
              <Ionicons name="close" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={getCellStyle(month, category, value)}
        onPress={() => handleCellPress(monthIdx, category, value)}
        disabled={!isEditable}
      >
        <Text
          style={[
            styles.cellText,
            { color: getTextColor(month, category, value) },
            isEditable && styles.editableCellText,
          ]}
        >
          {formatCurrency(value)}
        </Text>
      </TouchableOpacity>
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
                  row.category === 'Net Savings'
                    ? theme.colors.primary
                    : row.type === 'income'
                      ? theme.colors.success
                      : theme.colors.text,
                fontWeight:
                  row.category === 'Net Savings' ||
                  row.category === 'Remaining Debt'
                    ? 'bold'
                    : '600',
                fontStyle:
                  row.type === 'additional_income' ? 'italic' : 'normal',
              },
            ]}
          >
            {row.type === 'additional_income'
              ? `+ ${row.category}`
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
      {/* Loading indicators */}
      {gridUpdating && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isPropagatingChanges ? propagationStatus : 'Updating grid...'}
          </Text>
        </View>
      )}

      {/* Grid */}
      <ScrollView
        ref={mainScrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() => {
          // Scroll when content size is known
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
                  <Text style={styles.monthHeader}>{month.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Data rows */}
          {reorderedGridData.map(renderCategoryRow)}
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
    loadingContainer: {
      backgroundColor: theme.colors.primary + '20',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.sm,
    },
    loadingText: {
      color: theme.colors.primary,
      textAlign: 'center',
      fontWeight: '500',
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
    calculatedCell: {
      backgroundColor: '#2196f3',
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
      backgroundColor: '#e67e22',
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    calculatedCurrentBorder: {
      borderColor: '#4a5568',
      borderWidth: 3,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      borderTopWidth: 3,
      borderBottomWidth: 3,
    },
    incomeCell: {
      backgroundColor: '#4caf50',
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    incomeCurrentBorder: {
      borderColor: '#4a5568',
      borderWidth: 3,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      borderTopWidth: 3,
      borderBottomWidth: 3,
    },
    expenseHistoricalCell: {
      backgroundColor: '#0027dbcf',
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    expenseCurrentCell: {
      backgroundColor: '#f44336',
      borderColor: '#4a5568',
      borderWidth: 3,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      borderTopWidth: 3,
      borderBottomWidth: 3,
      width: 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 2,
      borderRadius: theme.borderRadius.sm,
    },
    expenseFutureCell: {
      backgroundColor: '#f44336',
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
    editableCellText: {
      fontWeight: 'bold',
    },
    editContainer: {
      width: 70,
      height: 40,
      backgroundColor: theme.colors.primary + '20',
      borderRadius: theme.borderRadius.sm,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      padding: 2,
    },
    editInput: {
      flex: 1,
      fontSize: 12,
      textAlign: 'center',
      color: theme.colors.text,
    },
    editButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 2,
    },
    editButton: {
      padding: 2,
    },
  });

export default MobileBudgetProjectionGrid;
