import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/common/Card';
import apiClient from '../../services/api';
import { API_CONFIG } from '../../constants';

interface SpendingInsights {
  total_spent: number;
  total_income: number;
  net: number;
  by_category: { [key: string]: number };
  top_categories: [string, number][];
  top_merchants: [string, number][];
  comparisons: {
    overall?: {
      change_percent: number;
      change_amount: number;
      direction: 'up' | 'down';
    };
    by_category?: { [key: string]: any };
  };
  alerts: { type: string; message: string }[];
}

const SpendingInsightsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchInsights();
    fetchRecurringTransactions();
  }, [selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      fetchInsights();
      fetchRecurringTransactions();
    }, [selectedPeriod])
  );

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/mongodb/insights/spending/', {
        params: {
          period: selectedPeriod,
          compare: true,
        },
      });
      if (response.data?.insights) {
        setInsights(response.data.insights);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecurringTransactions = async () => {
    try {
      const response = await apiClient.get('/api/mongodb/insights/recurring/');
      if (response.data?.recurring_transactions) {
        setRecurringTransactions(response.data.recurring_transactions);
      }
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchInsights(), fetchRecurringTransactions()]);
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
    ];
    return colors[index % colors.length];
  };

  const getPieChartData = () => {
    if (!insights || !insights.top_categories.length) return [];

    return insights.top_categories.slice(0, 5).map(([category, amount], index) => ({
      name: category,
      amount: amount,
      color: getCategoryColor(index),
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    }));
  };

  const getBarChartData = () => {
    if (!insights || !insights.top_categories.length) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }

    const top5 = insights.top_categories.slice(0, 5);
    return {
      labels: top5.map(([category]) => category.split(' ')[0]),
      datasets: [
        {
          data: top5.map(([_, amount]) => amount),
        },
      ],
    };
  };

  const styles = createStyles(theme);

  if (loading && !insights) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Period Selector */}
      <View style={styles.periodContainer}>
        {['week', 'month', 'year'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period as any)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alerts */}
      {insights?.alerts && insights.alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          {insights.alerts.map((alert, index) => (
            <Card key={index} style={styles.alertCard}>
              <View style={styles.alertContent}>
                <Ionicons
                  name={alert.type === 'warning' ? 'warning' : 'information-circle'}
                  size={24}
                  color={alert.type === 'warning' ? '#ff9800' : '#2196f3'}
                />
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="trending-down" size={24} color="#f44336" />
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
          <Text style={[styles.summaryAmount, { color: '#f44336' }]}>
            {formatCurrency(insights?.total_spent || 0)}
          </Text>
          {insights?.comparisons?.overall && (
            <View style={styles.comparisonBadge}>
              <Ionicons
                name={insights.comparisons.overall.direction === 'up' ? 'trending-up' : 'trending-down'}
                size={14}
                color={insights.comparisons.overall.direction === 'up' ? '#f44336' : '#4caf50'}
              />
              <Text
                style={[
                  styles.comparisonText,
                  { color: insights.comparisons.overall.direction === 'up' ? '#f44336' : '#4caf50' },
                ]}
              >
                {Math.abs(insights.comparisons.overall.change_percent)}% vs last period
              </Text>
            </View>
          )}
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="trending-up" size={24} color="#4caf50" />
            <Text style={styles.summaryLabel}>Total Income</Text>
          </View>
          <Text style={[styles.summaryAmount, { color: '#4caf50' }]}>
            {formatCurrency(insights?.total_income || 0)}
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics" size={24} color={theme.colors.primary} />
            <Text style={styles.summaryLabel}>Net</Text>
          </View>
          <Text
            style={[
              styles.summaryAmount,
              { color: (insights?.net || 0) >= 0 ? '#4caf50' : '#f44336' },
            ]}
          >
            {formatCurrency(insights?.net || 0)}
          </Text>
        </Card>
      </View>

      {/* Spending by Category - Pie Chart */}
      {getPieChartData().length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <PieChart
            data={getPieChartData()}
            width={Dimensions.get('window').width - 48}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card>
      )}

      {/* Top Categories - Bar Chart */}
      {insights?.top_categories && insights.top_categories.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top Spending Categories</Text>
          <BarChart
            data={getBarChartData()}
            width={Dimensions.get('window').width - 48}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => theme.colors.text,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.barChart}
            showValuesOnTopOfBars
            fromZero
          />
        </Card>
      )}

      {/* Top Merchants */}
      {insights?.top_merchants && insights.top_merchants.length > 0 && (
        <Card style={styles.merchantsCard}>
          <Text style={styles.sectionTitle}>Top Merchants</Text>
          {insights.top_merchants.map(([merchant, amount], index) => (
            <View key={index} style={styles.merchantItem}>
              <View style={styles.merchantLeft}>
                <View
                  style={[
                    styles.merchantRank,
                    { backgroundColor: getCategoryColor(index) + '30' },
                  ]}
                >
                  <Text
                    style={[
                      styles.merchantRankText,
                      { color: getCategoryColor(index) },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text style={styles.merchantName}>{merchant}</Text>
              </View>
              <Text style={styles.merchantAmount}>{formatCurrency(amount)}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Recurring Transactions */}
      {recurringTransactions.length > 0 && (
        <Card style={styles.recurringCard}>
          <View style={styles.recurringHeader}>
            <Ionicons name="reload-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Recurring Transactions</Text>
          </View>
          <Text style={styles.recurringSubtitle}>
            We detected {recurringTransactions.length} recurring transactions
          </Text>
          {recurringTransactions.slice(0, 5).map((transaction, index) => (
            <View key={index} style={styles.recurringItem}>
              <View style={styles.recurringDetails}>
                <Text style={styles.recurringDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.recurringFrequency}>
                  {transaction.frequency} • {transaction.category}
                </Text>
                {transaction.next_estimated_date && (
                  <Text style={styles.recurringNext}>
                    Next: {new Date(transaction.next_estimated_date).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <Text style={styles.recurringAmount}>
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Category Comparisons */}
      {insights?.comparisons?.by_category &&
        Object.keys(insights.comparisons.by_category).length > 0 && (
          <Card style={styles.comparisonsCard}>
            <Text style={styles.sectionTitle}>Category Trends</Text>
            {Object.entries(insights.comparisons.by_category)
              .slice(0, 5)
              .map(([category, comparison]: [string, any]) => (
                <View key={category} style={styles.comparisonItem}>
                  <View style={styles.comparisonLeft}>
                    <Text style={styles.comparisonCategory}>{category}</Text>
                    <View style={styles.comparisonChange}>
                      <Ionicons
                        name={comparison.direction === 'up' ? 'arrow-up' : 'arrow-down'}
                        size={14}
                        color={comparison.direction === 'up' ? '#f44336' : '#4caf50'}
                      />
                      <Text
                        style={[
                          styles.comparisonPercent,
                          { color: comparison.direction === 'up' ? '#f44336' : '#4caf50' },
                        ]}
                      >
                        {Math.abs(comparison.change_percent)}%
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.comparisonAmount,
                      { color: comparison.direction === 'up' ? '#f44336' : '#4caf50' },
                    ]}
                  >
                    {comparison.direction === 'up' ? '+' : '-'}
                    {formatCurrency(Math.abs(comparison.change_amount))}
                  </Text>
                </View>
              ))}
          </Card>
        )}
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    periodContainer: {
      flexDirection: 'row',
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    periodButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    periodButtonTextActive: {
      color: '#fff',
    },
    alertsContainer: {
      paddingHorizontal: theme.spacing.lg,
    },
    alertCard: {
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    alertContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    alertText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
    },
    summaryContainer: {
      padding: theme.spacing.lg,
      paddingTop: 0,
      gap: theme.spacing.md,
    },
    summaryCard: {
      padding: theme.spacing.md,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    summaryAmount: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
    },
    comparisonBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    comparisonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    chartCard: {
      margin: theme.spacing.lg,
      marginTop: 0,
      padding: theme.spacing.lg,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    barChart: {
      marginVertical: theme.spacing.sm,
      borderRadius: 16,
    },
    merchantsCard: {
      margin: theme.spacing.lg,
      marginTop: 0,
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    merchantItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    merchantLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    merchantRank: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    merchantRankText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    merchantName: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    merchantAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    recurringCard: {
      margin: theme.spacing.lg,
      marginTop: 0,
      padding: theme.spacing.lg,
    },
    recurringHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    recurringSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    recurringItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    recurringDetails: {
      flex: 1,
    },
    recurringDescription: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    recurringFrequency: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    recurringNext: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    recurringAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    comparisonsCard: {
      margin: theme.spacing.lg,
      marginTop: 0,
      padding: theme.spacing.lg,
    },
    comparisonItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    comparisonLeft: {
      flex: 1,
    },
    comparisonCategory: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    comparisonChange: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    comparisonPercent: {
      fontSize: 12,
      fontWeight: '600',
    },
    comparisonAmount: {
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

export default SpendingInsightsScreen;
