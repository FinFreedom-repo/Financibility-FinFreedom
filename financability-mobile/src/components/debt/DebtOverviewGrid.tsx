import React, { useState, useCallback } from 'react';
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
import Button from '../common/Button';
import DebtStrategySelector from './DebtStrategySelector';

interface DebtOverviewGridProps {
  outstandingDebts: Debt[];
  payoffPlan: DebtPlannerResponse | null;
  strategy: 'snowball' | 'avalanche';
  onStrategyChange: (strategy: 'snowball' | 'avalanche') => void;
  onAddDebt: () => void;
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (debt: Debt) => void;
  planLoading: boolean;
  debtCalculationInProgress: boolean;
  showTimelineOnly?: boolean;
}

const DebtOverviewGrid: React.FC<DebtOverviewGridProps> = ({
  outstandingDebts,
  payoffPlan,
  strategy,
  onStrategyChange,
  onAddDebt,
  onEditDebt,
  onDeleteDebt,
  planLoading,
  debtCalculationInProgress,
  showTimelineOnly = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

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

  // Calculate debt statistics
  const calculateDebtStatistics = () => {
    const totalDebt = debtPlanningService.calculateTotalDebt(outstandingDebts);
    const averageRate = debtPlanningService.calculateWeightedAverageRate(outstandingDebts);
    
    let totalInterest = 0;
    let monthsToPayoff = 0;
    let debtFreeDate = null;
    
    if (payoffPlan?.payoff_plan) {
      totalInterest = payoffPlan.payoff_plan.total_interest_paid;
      monthsToPayoff = payoffPlan.payoff_plan.total_months;
      
      if (monthsToPayoff > 0) {
        const currentDate = new Date();
        debtFreeDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthsToPayoff, currentDate.getDate());
      }
    }
    
    return {
      totalDebt,
      averageRate,
      totalInterest,
      monthsToPayoff,
      debtFreeDate
    };
  };

  const stats = calculateDebtStatistics();
  const strategies = debtPlanningService.getDebtStrategies();

  if (outstandingDebts.length === 0 && !showTimelineOnly) {
    return (
      <View style={styles.container}>
        <Card style={styles.emptyCard}>
          <Ionicons name="card-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Debts Found</Text>
          <Text style={styles.emptySubtitle}>
            Add your first debt to start planning your payoff strategy
          </Text>
          <Button
            title="Add Debt"
            onPress={onAddDebt}
            icon="add"
            style={styles.addButton}
          />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Strategy Selector */}
      <Card style={styles.strategyCard}>
        <Text style={styles.cardTitle}>Payoff Strategy</Text>
        <DebtStrategySelector
          strategies={strategies}
          selectedStrategy={strategy}
          onStrategyChange={onStrategyChange}
        />
      </Card>

      {/* Debt Statistics */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="card" size={24} color={theme.colors.error} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Debt</Text>
              <Text style={styles.statValue}>
                {formatCurrency(stats.totalDebt)}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={24} color={theme.colors.warning} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Avg Interest Rate</Text>
              <Text style={styles.statValue}>
                {debtPlanningService.formatPercentage(stats.averageRate)}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="time" size={24} color={theme.colors.info} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Payoff Time</Text>
              <Text style={styles.statValue}>
                {stats.monthsToPayoff > 0 ? `${stats.monthsToPayoff} months` : 'N/A'}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Debt-Free Date */}
      {stats.debtFreeDate && (
        <Card style={styles.debtFreeCard}>
          <View style={styles.debtFreeContent}>
            <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
            <View style={styles.debtFreeText}>
              <Text style={styles.debtFreeTitle}>Debt-Free Date</Text>
              <Text style={styles.debtFreeDate}>
                {stats.debtFreeDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Loading State */}
      {(planLoading || debtCalculationInProgress) && (
        <Card style={styles.loadingCard}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Calculating debt payoff plan...</Text>
          </View>
        </Card>
      )}

      {/* Payoff Timeline */}
      {payoffPlan?.payoff_plan && (
        <Card style={styles.timelineCard}>
          <Text style={styles.cardTitle}>Payoff Timeline</Text>
          <ScrollView style={styles.timelineScroll} showsVerticalScrollIndicator={false}>
            {payoffPlan.payoff_plan.monthly_payments?.slice(0, 12).map((payment, index) => (
              <View key={`payment-${index}`} style={styles.timelineItem}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineMonth}>
                    {formatDate(payment.month, payment.year)}
                  </Text>
                  <Text style={styles.timelineAmount}>
                    {formatCurrency(payment.total_payment)}
                  </Text>
                </View>
                
                <View style={styles.debtPayments}>
                  {payment.debts?.map((debt, debtIndex) => (
                    <View key={`debt-${debtIndex}`} style={styles.debtPayment}>
                      <Text style={styles.debtName}>{debt.debt_name}</Text>
                      <View style={styles.debtPaymentDetails}>
                        <Text style={styles.debtPaymentAmount}>
                          {formatCurrency(debt.payment)}
                        </Text>
                        <Text style={styles.debtRemainingBalance}>
                          Remaining: {formatCurrency(debt.remaining_balance)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </Card>
      )}

      {/* Debt List - Only show in full mode */}
      {!showTimelineOnly && (
        <Card style={styles.debtListCard}>
          <View style={styles.debtListHeader}>
            <Text style={styles.cardTitle}>Manage Debts</Text>
            <Button
              title="Add Debt"
              onPress={onAddDebt}
              variant="outline"
              icon="add"
              style={styles.addButton}
            />
          </View>
          
          <ScrollView style={styles.debtList} showsVerticalScrollIndicator={false}>
            {outstandingDebts.map((debt) => (
              <View key={debt._id} style={styles.debtItem}>
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
                  <View style={styles.debtActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onEditDebt(debt)}
                    >
                      <Ionicons name="create" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => onDeleteDebt(debt)}
                    >
                      <Ionicons name="trash" size={16} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.debtStats}>
                  <View style={styles.debtStatItem}>
                    <Text style={styles.debtStatLabel}>Balance</Text>
                    <Text style={styles.debtStatValue}>
                      {formatCurrency(debt.balance)}
                    </Text>
                  </View>
                  <View style={styles.debtStatItem}>
                    <Text style={styles.debtStatLabel}>Interest Rate</Text>
                    <Text style={styles.debtStatValue}>
                      {debtPlanningService.formatPercentage(debt.interest_rate)}
                    </Text>
                  </View>
                  <View style={styles.debtStatItem}>
                    <Text style={styles.debtStatLabel}>Original Amount</Text>
                    <Text style={styles.debtStatValue}>
                      {formatCurrency(debt.amount)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </Card>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  addButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  strategyCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statContent: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  debtFreeCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.success + '10',
    borderColor: theme.colors.success + '30',
    borderWidth: 1,
  },
  debtFreeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtFreeText: {
    marginLeft: theme.spacing.md,
  },
  debtFreeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },
  debtFreeDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  loadingCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  timelineCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  timelineScroll: {
    maxHeight: 300,
  },
  timelineItem: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  timelineMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timelineAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  debtPayments: {
    gap: theme.spacing.sm,
  },
  debtPayment: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  debtName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  debtPaymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtPaymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  debtRemainingBalance: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  debtListCard: {
    padding: theme.spacing.lg,
  },
  debtListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  debtList: {
    maxHeight: 400,
  },
  debtItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
  debtType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  debtActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  deleteButton: {
    borderColor: theme.colors.error,
  },
  debtStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  debtStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  debtStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  debtStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

export default DebtOverviewGrid;
