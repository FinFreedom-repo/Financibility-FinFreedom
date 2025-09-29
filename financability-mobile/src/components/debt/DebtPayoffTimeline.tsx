import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { DebtPlannerResponse, Debt } from '../../services/debtPlanningService';
import debtPlanningService from '../../services/debtPlanningService';
import Card from '../common/Card';

interface DebtPayoffTimelineProps {
  payoffPlan: DebtPlannerResponse | null;
  calculating: boolean;
  debts: Debt[];
}

const DebtPayoffTimeline: React.FC<DebtPayoffTimelineProps> = ({
  payoffPlan,
  calculating,
  debts,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (calculating) {
    return (
      <Card style={styles.calculatingCard}>
        <View style={styles.calculatingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.calculatingText}>Calculating payoff plan...</Text>
        </View>
      </Card>
    );
  }

  if (!payoffPlan || !payoffPlan.payoff_plan) {
    return (
      <Card style={styles.noDataCard}>
        <View style={styles.noDataContent}>
          <Ionicons name="calculator-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.noDataTitle}>No Payoff Plan Available</Text>
          <Text style={styles.noDataSubtitle}>
            {debts.length === 0 
              ? 'Add some debts to see your payoff timeline'
              : 'Unable to calculate payoff plan. Please check your debt information.'
            }
          </Text>
        </View>
      </Card>
    );
  }

  const { payoff_plan } = payoffPlan;
  const totalMonths = payoff_plan.total_months;
  const totalInterest = payoff_plan.total_interest_paid;
  const totalPayments = payoff_plan.total_payments;
  const monthlyPayments = payoff_plan.monthly_payments || [];

  const formatDate = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getProgressPercentage = (index: number) => {
    return ((index + 1) / monthlyPayments.length) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Ionicons name="time" size={24} color={theme.colors.info} />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Payoff Time</Text>
              <Text style={styles.summaryValue}>
                {totalMonths} {totalMonths === 1 ? 'month' : 'months'}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Ionicons name="trending-up" size={24} color={theme.colors.warning} />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total Interest</Text>
              <Text style={styles.summaryValue}>
                {debtPlanningService.formatCurrency(totalInterest)}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Ionicons name="card" size={24} color={theme.colors.success} />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total Payments</Text>
              <Text style={styles.summaryValue}>
                {debtPlanningService.formatCurrency(totalPayments)}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Timeline */}
      <Card style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Payoff Timeline</Text>
        <ScrollView 
          style={styles.timelineScroll}
          showsVerticalScrollIndicator={false}
        >
          {monthlyPayments.map((payment, index) => (
            <View key={`payment-${index}-${payment.month}-${payment.year}`} style={styles.timelineItem}>
              <View style={styles.timelineHeader}>
                <View style={styles.timelineDate}>
                  <Text style={styles.timelineMonth}>
                    {formatDate(payment.month, payment.year)}
                  </Text>
                  <Text style={styles.timelineProgress}>
                    {Math.round(getProgressPercentage(index))}%
                  </Text>
                </View>
                <Text style={styles.timelineAmount}>
                  {debtPlanningService.formatCurrency(payment.total_payment)}
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${getProgressPercentage(index)}%` }
                  ]} 
                />
              </View>
              
              <View style={styles.debtPayments}>
                {payment.debts.map((debt, debtIndex) => (
                  <View key={`debt-${debt.debt_id}-${debtIndex}`} style={styles.debtPayment}>
                    <Text style={styles.debtName}>{debt.debt_name}</Text>
                    <View style={styles.debtPaymentDetails}>
                      <Text style={styles.debtPaymentAmount}>
                        {debtPlanningService.formatCurrency(debt.payment)}
                      </Text>
                      <Text style={styles.debtRemainingBalance}>
                        Remaining: {debtPlanningService.formatCurrency(debt.remaining_balance)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </Card>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  calculatingCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  calculatingContent: {
    alignItems: 'center',
  },
  calculatingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  noDataCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  noDataContent: {
    alignItems: 'center',
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  noDataSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: theme.spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryContent: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  timelineCard: {
    padding: theme.spacing.lg,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  timelineScroll: {
    maxHeight: 400,
  },
  timelineItem: {
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  timelineDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timelineProgress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  timelineAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: theme.spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
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
});

export default DebtPayoffTimeline;
