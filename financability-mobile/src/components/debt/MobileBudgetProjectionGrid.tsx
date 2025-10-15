import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/formatting';

const { width } = Dimensions.get('window');

interface MobileBudgetProjectionGridProps {
  gridData: Record<string, any>[];
  months: any[];
  onCellValueChanged: (monthIdx: number, category: string, value: string) => void;
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
  const [editingCell, setEditingCell] = useState<{ monthIdx: number; category: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const styles = createStyles(theme);

  if (!months || months.length === 0) return null;

  const isCellEditable = (month: any, category: string) => {
    if (category === 'Net Savings' || category === 'Remaining Debt') return false;
    if (month.type === 'historical') return false;
    return true;
  };

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
    if (category === 'Net Savings') {
      baseStyle.push(value >= 0 ? styles.positiveCell : styles.negativeCell);
    } else if (category === 'Primary Income' || category.includes('Additional Income')) {
      baseStyle.push(styles.incomeCell);
    }
    
    return baseStyle;
  };

  const getTextColor = (month: any, category: string, value: number) => {
    if (category === 'Net Savings') {
      return value >= 0 ? theme.colors.success : theme.colors.error;
    }
    if (category === 'Primary Income' || category.includes('Additional Income')) {
      return theme.colors.success;
    }
    return theme.colors.text;
  };

  const handleCellPress = (monthIdx: number, category: string, currentValue: number) => {
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
    
    if (editingCell && editingCell.monthIdx === monthIdx && editingCell.category === category) {
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
            <TouchableOpacity style={styles.editButton} onPress={handleCellSubmit}>
              <Ionicons name="checkmark" size={16} color={theme.colors.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={handleCellCancel}>
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
            isEditable && styles.editableCellText
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
                color: row.category === 'Net Savings' ? theme.colors.primary : 
                       row.type === 'income' ? theme.colors.success : theme.colors.text,
                fontWeight: row.category === 'Net Savings' || row.category === 'Remaining Debt' ? 'bold' : '600',
                fontStyle: row.type === 'additional_income' ? 'italic' : 'normal'
              }
            ]}
          >
            {row.type === 'additional_income' ? `+ ${row.category}` : row.category}
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
      {/* Loading indicators */}
      {gridUpdating && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isPropagatingChanges ? propagationStatus : 'Updating grid...'}
          </Text>
        </View>
      )}

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
  positiveCell: {
    backgroundColor: theme.colors.success + '20',
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  negativeCell: {
    backgroundColor: theme.colors.error + '20',
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  incomeCell: {
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
