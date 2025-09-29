import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Debt } from '../../services/debtPlanningService';
import debtPlanningService from '../../services/debtPlanningService';

interface DebtListProps {
  debts: Debt[];
  onEdit: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
}

const DebtList: React.FC<DebtListProps> = ({ debts, onEdit, onDelete }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getDebtTypeIcon = (debtType: string) => {
    switch (debtType) {
      case 'credit_card':
        return 'card';
      case 'student_loan':
        return 'school';
      case 'auto-loan':
        return 'car';
      case 'mortgage':
        return 'home';
      case 'personal_loan':
        return 'cash';
      default:
        return 'card';
    }
  };

  const getDebtTypeColor = (debtType: string) => {
    switch (debtType) {
      case 'credit_card':
        return theme.colors.error;
      case 'student_loan':
        return theme.colors.info;
      case 'auto-loan':
        return theme.colors.warning;
      case 'mortgage':
        return theme.colors.success;
      case 'personal_loan':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatDebtType = (debtType: string) => {
    return debtType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (debts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="card-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Debts Found</Text>
        <Text style={styles.emptySubtitle}>
          Add your first debt to start planning your payoff strategy
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {debts.map((debt) => (
        <TouchableOpacity
          key={debt._id}
          style={styles.debtItem}
          onPress={() => onEdit(debt)}
        >
          <View style={styles.debtHeader}>
            <View style={styles.debtInfo}>
              <View style={styles.debtIconContainer}>
                <Ionicons
                  name={getDebtTypeIcon(debt.debt_type)}
                  size={24}
                  color={getDebtTypeColor(debt.debt_type)}
                />
              </View>
              <View style={styles.debtDetails}>
                <Text style={styles.debtName}>{debt.name}</Text>
                <Text style={styles.debtType}>{formatDebtType(debt.debt_type)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(debt)}
            >
              <Ionicons name="create" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.debtStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Balance</Text>
              <Text style={styles.statValue}>
                {debtPlanningService.formatCurrency(debt.balance)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Interest Rate</Text>
              <Text style={styles.statValue}>
                {debtPlanningService.formatPercentage(debt.interest_rate)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Original Amount</Text>
              <Text style={styles.statValue}>
                {debtPlanningService.formatCurrency(debt.amount)}
              </Text>
            </View>
          </View>
          
          <View style={styles.debtActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(debt)}
            >
              <Ionicons name="create" size={16} color={theme.colors.primary} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(debt._id)}
            >
              <Ionicons name="trash" size={16} color={theme.colors.error} />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  debtItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  debtInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  debtIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  debtDetails: {
    flex: 1,
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  debtType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  editButton: {
    padding: theme.spacing.sm,
  },
  debtStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  debtActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  deleteButton: {
    borderColor: theme.colors.error,
  },
  actionText: {
    marginLeft: theme.spacing.xs,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  deleteText: {
    color: theme.colors.error,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DebtList;
