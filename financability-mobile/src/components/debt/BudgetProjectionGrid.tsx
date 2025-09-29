import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface BudgetProjectionGridProps {
  localGridData: any[];
  generateMonths: () => any[];
  onCellValueChanged: (params: any) => void;
  gridUpdating: boolean;
  isPropagatingChanges: boolean;
  propagationStatus: string;
}

const BudgetProjectionGrid: React.FC<BudgetProjectionGridProps> = ({
  localGridData,
  generateMonths,
  onCellValueChanged,
  gridUpdating,
  isPropagatingChanges,
  propagationStatus,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isInitializingGrid, setIsInitializingGrid] = useState(false);
  const [userEditedCells, setUserEditedCells] = useState(new Map());
  const [lockedCells, setLockedCells] = useState<Record<number, string[]>>({});
  
  const months = generateMonths();
  if (!months || months.length === 0) {
    console.error('❌ generateMonths returned empty array in BudgetProjectionGrid');
    return null;
  }

  // Reorder grid data to put Net Savings and Remaining Debt at the top (EXACT website logic)
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isCellEditable = (row: any, colIdx: number): boolean => {
    if (row.category === 'Net Savings') return false;
    if (row.category === 'Remaining Debt') return false;
    const month = months[colIdx];
    return month && month.type !== 'historical'; // Added month && check
  };

  const getCellStyle = (row: any, colIdx: number) => {
    const month = months[colIdx];
    if (!month) return {};
    
    if (row.category === 'Net Savings') {
      return {
        backgroundColor: theme.colors.success + '10',
        borderColor: theme.colors.success + '30',
      };
    } else if (row.category === 'Remaining Debt') {
      return {
        backgroundColor: theme.colors.error + '10',
        borderColor: theme.colors.error + '30',
      };
    } else if (row.type === 'income' || row.type === 'additional_income') {
      return {
        backgroundColor: theme.colors.primary + '05',
        borderColor: theme.colors.primary + '20',
      };
    } else if (row.type === 'expense') {
      return {
        backgroundColor: theme.colors.warning + '05',
        borderColor: theme.colors.warning + '20',
      };
    } else if (row.type === 'savings') {
      return {
        backgroundColor: theme.colors.info + '05',
        borderColor: theme.colors.info + '20',
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
    
    if (row.category === 'Net Savings') {
      return theme.colors.success;
    } else if (row.category === 'Remaining Debt') {
      return theme.colors.error;
    }
    
    return theme.colors.text;
  };

  const handleCellPress = (rowIdx: number, colIdx: number) => {
    const row = reorderedGridData[rowIdx];
    if (!isCellEditable(row, colIdx)) return;
    
    setEditingCell({ row: rowIdx, col: colIdx });
    setEditValue(formatCurrency(row[`month_${colIdx}`] || 0).replace(/[$,]/g, ''));
  };

  const handleCellEdit = (newValue: string) => {
    if (!editingCell) return;
    
    const numericValue = parseFloat(newValue.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericValue)) return;
    
    const row = reorderedGridData[editingCell.row];
    const colIdx = editingCell.col;
    
    // Update the grid data
    row[`month_${colIdx}`] = numericValue;
    
    // Trigger the onCellValueChanged callback (EXACT website logic)
    onCellValueChanged({
      data: row,
      colDef: { field: `month_${colIdx}` },
      newValue: numericValue,
    });
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getCellValue = (row: any, colIdx: number): string => {
    const value = row[`month_${colIdx}`] || 0;
    return formatCurrency(value);
  };

  const isCellLocked = (rowIdx: number, colIdx: number): boolean => {
    const month = months[colIdx];
    if (!month || month.type !== 'future') return false;
    
    const row = reorderedGridData[rowIdx];
    const lockedForMonth = lockedCells[colIdx] || [];
    return lockedForMonth.includes(row.category);
  };

  const getCategoryIcon = (category: string, type: string) => {
    if (category === 'Net Savings') return 'trending-up';
    if (category === 'Remaining Debt') return 'card';
    if (type === 'income' || type === 'additional_income') return 'arrow-up';
    if (type === 'expense') return 'arrow-down';
    if (type === 'savings') return 'wallet';
    return 'list';
  };

  const getCategoryColor = (category: string, type: string) => {
    if (category === 'Net Savings') return theme.colors.success;
    if (category === 'Remaining Debt') return theme.colors.error;
    if (type === 'income' || type === 'additional_income') return theme.colors.primary;
    if (type === 'expense') return theme.colors.warning;
    if (type === 'savings') return theme.colors.info;
    return theme.colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      {/* Loading States - EXACT website logic */}
      {(gridUpdating || isPropagatingChanges) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              {isPropagatingChanges ? 'Propagating changes...' : 'Updating grid...'}
            </Text>
            {propagationStatus && (
              <Text style={styles.propagationStatus}>{propagationStatus}</Text>
            )}
          </View>
        </View>
      )}

      {/* Grid Header */}
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>Budget Projection</Text>
        <Text style={styles.gridSubtitle}>
          {months.length} months • {reorderedGridData.length} categories
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
                <Text style={styles.headerSubtext}>
                  {month.type === 'historical' ? 'Past' : month.type === 'current' ? 'Current' : 'Future'}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid Rows */}
          {reorderedGridData.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {/* Category Column */}
              <View style={[styles.categoryColumn, styles.categoryCell]}>
                <View style={styles.categoryContent}>
                  <Ionicons 
                    name={getCategoryIcon(row.category, row.type) as any} 
                    size={16} 
                    color={getCategoryColor(row.category, row.type)} 
                  />
                  <Text style={[
                    styles.categoryText,
                    row.category === 'Net Savings' && styles.netSavingsText,
                    row.category === 'Remaining Debt' && styles.remainingDebtText,
                    row.type === 'income' && styles.incomeText,
                    row.type === 'additional_income' && styles.additionalIncomeText,
                    row.type === 'expense' && styles.expenseText,
                    row.type === 'savings' && styles.savingsText,
                  ]}>
                    {row.category}
                  </Text>
                </View>
              </View>

              {/* Month Columns */}
              {months.map((month, colIdx) => {
                const isEditable = isCellEditable(row, colIdx);
                const isLocked = isCellLocked(rowIdx, colIdx);
                const cellStyle = getCellStyle(row, colIdx);
                const textColor = getCellTextColor(row, colIdx);
                const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;
                
                return (
                  <TouchableOpacity 
                    key={colIdx} 
                    style={[
                      styles.monthColumn, 
                      styles.dataCell,
                      cellStyle,
                      isLocked && styles.lockedCell,
                      isEditing && styles.editingCell,
                    ]}
                    onPress={() => isEditable && !isLocked && handleCellPress(rowIdx, colIdx)}
                    disabled={!isEditable || isLocked}
                  >
                    {isEditing ? (
                      <TextInput
                        style={[styles.cellInput, { color: textColor }]}
                        value={editValue}
                        onChangeText={setEditValue}
                        onSubmitEditing={() => handleCellEdit(editValue)}
                        onBlur={handleCellCancel}
                        keyboardType="numeric"
                        autoFocus
                        selectTextOnFocus
                      />
                    ) : (
                      <View style={styles.cellContent}>
                        <Text style={[styles.cellText, { color: textColor }]}>
                          {getCellValue(row, colIdx)}
                        </Text>
                        {isLocked && (
                          <Ionicons name="lock-closed" size={12} color={theme.colors.warning} />
                        )}
                        {isEditable && !isLocked && (
                          <Ionicons name="create-outline" size={12} color={theme.colors.textSecondary} />
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Grid Footer with Instructions */}
      <View style={styles.gridFooter}>
        <Text style={styles.footerText}>
          Tap any cell to edit • Future months inherit current month values • Changes propagate automatically
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background + '90',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    fontWeight: '600',
  },
  propagationStatus: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
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
  headerSubtext: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
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
  lockedCell: {
    backgroundColor: theme.colors.warning + '10',
    borderColor: theme.colors.warning + '30',
  },
  editingCell: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary + '50',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  netSavingsText: {
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  remainingDebtText: {
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  incomeText: {
    color: theme.colors.primary,
  },
  additionalIncomeText: {
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  expenseText: {
    color: theme.colors.warning,
  },
  savingsText: {
    color: theme.colors.info,
  },
  cellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  cellInput: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  gridFooter: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.textSecondary + '20',
    backgroundColor: theme.colors.surface,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default BudgetProjectionGrid;