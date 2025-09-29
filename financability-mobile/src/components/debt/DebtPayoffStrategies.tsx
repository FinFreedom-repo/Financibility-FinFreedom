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

interface DebtPayoffStrategiesProps {
  payoffPlan: DebtPlannerResponse | null;
  calculating: boolean;
  debts: Debt[];
  strategy: 'snowball' | 'avalanche';
}

const DebtPayoffStrategies: React.FC<DebtPayoffStrategiesProps> = ({
  payoffPlan,
  calculating,
  debts,
  strategy,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (calculating) {
    return (
      <Card style={styles.calculatingCard}>
        <View style={styles.calculatingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.calculatingText}>Calculating strategies...</Text>
        </View>
      </Card>
    );
  }

  if (!payoffPlan || !payoffPlan.payoff_plan) {
    return (
      <Card style={styles.noDataCard}>
        <View style={styles.noDataContent}>
          <Ionicons name="analytics-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.noDataTitle}>No Strategy Data Available</Text>
          <Text style={styles.noDataSubtitle}>
            {debts.length === 0 
              ? 'Add some debts to see payoff strategies'
              : 'Unable to calculate strategies. Please check your debt information.'
            }
          </Text>
        </View>
      </Card>
    );
  }

  const { payoff_plan } = payoffPlan;
  const monthlyPayments = payoff_plan.monthly_payments || [];

  // Calculate strategy insights
  const totalDebt = debtPlanningService.calculateTotalDebt(debts);
  const totalInterest = payoff_plan.total_interest_paid;
  const totalPayments = payoff_plan.total_payments;
  const interestSavings = totalDebt - totalInterest;
  const averageMonthlyPayment = totalPayments / payoff_plan.total_months;

  // Get debt priority based on strategy
  const getDebtPriority = (debt: Debt, index: number) => {
    if (strategy === 'snowball') {
      return index + 1; // Smallest balance first
    } else {
      // Highest interest rate first
      return debts
        .sort((a, b) => b.interest_rate - a.interest_rate)
        .findIndex(d => d._id === debt._id) + 1;
    }
  };

  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'snowball') {
      return a.balance - b.balance; // Smallest balance first
    } else {
      return b.interest_rate - a.interest_rate; // Highest interest first
    }
  });

  return (
    <View style={styles.container}>
      {/* Strategy Overview */}
      <Card style={styles.strategyCard}>
        <View style={styles.strategyHeader}>
          <Ionicons 
            name={strategy === 'snowball' ? 'snow' : 'trending-down'} 
            size={24} 
            color={theme.colors.primary} 
          />
          <Text style={styles.strategyTitle}>
            {strategy === 'snowball' ? 'Snowball Method' : 'Avalanche Method'}
          </Text>
        </View>
        <Text style={styles.strategyDescription}>
          {strategy === 'snowball' 
            ? 'Pay off smallest debts first to build momentum and motivation'
            : 'Pay off highest interest debts first to save the most money'
          }
        </Text>
      </Card>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <Card style={styles.metricCard}>
          <View style={styles.metricItem}>
            <Ionicons name="time" size={20} color={theme.colors.info} />
            <Text style={styles.metricLabel}>Payoff Time</Text>
            <Text style={styles.metricValue}>
              {payoff_plan.total_months} months
            </Text>
          </View>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricItem}>
            <Ionicons name="trending-up" size={20} color={theme.colors.warning} />
            <Text style={styles.metricLabel}>Total Interest</Text>
            <Text style={styles.metricValue}>
              {debtPlanningService.formatCurrency(totalInterest)}
            </Text>
          </View>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricItem}>
            <Ionicons name="card" size={20} color={theme.colors.success} />
            <Text style={styles.metricLabel}>Monthly Payment</Text>
            <Text style={styles.metricValue}>
              {debtPlanningService.formatCurrency(averageMonthlyPayment)}
            </Text>
          </View>
        </Card>
      </View>

      {/* Debt Priority List */}
      <Card style={styles.priorityCard}>
        <Text style={styles.priorityTitle}>Debt Payoff Order</Text>
        <ScrollView style={styles.priorityList}>
          {sortedDebts.map((debt, index) => (
            <View key={`priority-${debt._id}-${index}`} style={styles.priorityItem}>
              <View style={styles.priorityNumber}>
                <Text style={styles.priorityNumberText}>
                  {getDebtPriority(debt, index)}
                </Text>
              </View>
              <View style={styles.priorityContent}>
                <Text style={styles.priorityName}>{debt.name}</Text>
                <View style={styles.priorityDetails}>
                  <Text style={styles.priorityBalance}>
                    {debtPlanningService.formatCurrency(debt.balance)}
                  </Text>
                  <Text style={styles.priorityRate}>
                    {debtPlanningService.formatPercentage(debt.interest_rate)}
                  </Text>
                </View>
              </View>
              <View style={styles.priorityIcon}>
                <Ionicons 
                  name={strategy === 'snowball' ? 'snow' : 'trending-down'} 
                  size={16} 
                  color={theme.colors.primary} 
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </Card>

      {/* Strategy Benefits */}
      <Card style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>Strategy Benefits</Text>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>
              {strategy === 'snowball' 
                ? 'Quick wins build motivation and momentum'
                : 'Minimizes total interest paid over time'
              }
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>
              {strategy === 'snowball' 
                ? 'Reduces number of monthly payments faster'
                : 'Mathematically optimal for interest savings'
              }
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>
              {strategy === 'snowball' 
                ? 'Simplifies debt management'
                : 'Faster path to debt freedom'
              }
            </Text>
          </View>
        </View>
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
  strategyCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  strategyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  strategyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  metricsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: theme.spacing.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  priorityCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  priorityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  priorityList: {
    maxHeight: 300,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  priorityNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  priorityNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  priorityContent: {
    flex: 1,
  },
  priorityName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  priorityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  priorityRate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  priorityIcon: {
    marginLeft: theme.spacing.md,
  },
  benefitsCard: {
    padding: theme.spacing.lg,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  benefitsList: {
    gap: theme.spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});

export default DebtPayoffStrategies;
