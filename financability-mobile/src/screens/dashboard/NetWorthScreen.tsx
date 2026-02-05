import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, AreaChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/common/Card';
import accountsDebtsService from '../../services/accountsDebtsService';

interface NetWorthData {
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  accounts: any[];
  debts: any[];
  monthlyTrend: { month: string; netWorth: number }[];
}

const NetWorthScreen: React.FC = () => {
  const { theme } = useTheme();
  const [data, setData] = useState<NetWorthData>({
    totalAssets: 0,
    totalDebts: 0,
    netWorth: 0,
    accounts: [],
    debts: [],
    monthlyTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M');

  const fetchNetWorthData = async () => {
    try {
      setLoading(true);
      const [accounts, debts] = await Promise.all([
        accountsDebtsService.getAccounts(),
        accountsDebtsService.getDebts(),
      ]);

      const totalAssets = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
      const totalDebts = debts.reduce((sum, debt) => sum + (parseFloat(debt.balance || debt.amount) || 0), 0);
      const netWorth = totalAssets - totalDebts;

      // Generate mock monthly trend data (in production, fetch from API)
      const monthlyTrend = generateMonthlyTrend(netWorth);

      setData({
        totalAssets,
        totalDebts,
        netWorth,
        accounts,
        debts,
        monthlyTrend,
      });
    } catch (error) {
      console.error('Error fetching net worth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrend = (currentNetWorth: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const trend = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const value = currentNetWorth - (i * 500) + (Math.random() * 1000);
      trend.push({
        month: months[monthIndex],
        netWorth: value,
      });
    }
    
    return trend;
  };

  useFocusEffect(
    useCallback(() => {
      fetchNetWorthData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNetWorthData();
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

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#4caf50',
    },
    decimalPlaces: 0,
  };

  const chartData = {
    labels: data.monthlyTrend.map(d => d.month),
    datasets: [
      {
        data: data.monthlyTrend.map(d => d.netWorth),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const netWorthChange = data.monthlyTrend.length > 1 
    ? data.monthlyTrend[data.monthlyTrend.length - 1].netWorth - data.monthlyTrend[0].netWorth 
    : 0;
  const netWorthChangePercent = data.monthlyTrend[0]?.netWorth 
    ? (netWorthChange / data.monthlyTrend[0].netWorth) * 100 
    : 0;

  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Net Worth Header */}
      <LinearGradient
        colors={data.netWorth >= 0 ? ['#4caf50', '#45a049'] : ['#f44336', '#d32f2f']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>Net Worth</Text>
          <Text style={styles.headerAmount}>{formatCurrency(data.netWorth)}</Text>
          <View style={styles.changeContainer}>
            <Ionicons
              name={netWorthChange >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color="#fff"
            />
            <Text style={styles.changeText}>
              {formatCurrency(Math.abs(netWorthChange))} ({Math.abs(netWorthChangePercent).toFixed(1)}%) this period
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Assets vs Debts Summary */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#4caf5020' }]}>
              <Ionicons name="trending-up" size={24} color="#4caf50" />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryLabel}>Total Assets</Text>
              <Text style={[styles.summaryAmount, { color: '#4caf50' }]}>
                {formatCurrency(data.totalAssets)}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#f4433620' }]}>
              <Ionicons name="trending-down" size={24} color="#f44336" />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryLabel}>Total Debts</Text>
              <Text style={[styles.summaryAmount, { color: '#f44336' }]}>
                {formatCurrency(data.totalDebts)}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Chart */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Net Worth Trend</Text>
          <View style={styles.periodSelector}>
            {['1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
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
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {data.monthlyTrend.length > 0 && (
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={false}
            fromZero={false}
          />
        )}
      </Card>

      {/* Accounts Breakdown */}
      <Card style={styles.breakdownCard}>
        <View style={styles.breakdownHeader}>
          <Text style={styles.breakdownTitle}>Assets</Text>
          <Text style={styles.breakdownTotal}>{formatCurrency(data.totalAssets)}</Text>
        </View>
        {data.accounts.map((account) => (
          <View key={account.id} style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <Ionicons
                name={getAccountIcon(account.account_type)}
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownName}>{account.name}</Text>
                <Text style={styles.breakdownType}>{formatAccountType(account.account_type)}</Text>
              </View>
            </View>
            <Text style={[styles.breakdownAmount, { color: '#4caf50' }]}>
              {formatCurrency(parseFloat(account.balance) || 0)}
            </Text>
          </View>
        ))}
      </Card>

      {/* Debts Breakdown */}
      {data.debts.length > 0 && (
        <Card style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownTitle}>Debts</Text>
            <Text style={[styles.breakdownTotal, { color: '#f44336' }]}>
              {formatCurrency(data.totalDebts)}
            </Text>
          </View>
          {data.debts.map((debt) => (
            <View key={debt.id} style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <Ionicons
                  name={getDebtIcon(debt.debt_type)}
                  size={20}
                  color="#f44336"
                />
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownName}>{debt.name}</Text>
                  <Text style={styles.breakdownType}>
                    {formatDebtType(debt.debt_type)} • {debt.interest_rate}% APR
                  </Text>
                </View>
              </View>
              <Text style={[styles.breakdownAmount, { color: '#f44336' }]}>
                {formatCurrency(parseFloat(debt.balance || debt.amount) || 0)}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
};

const getAccountIcon = (type: string): any => {
  switch (type) {
    case 'checking':
      return 'card';
    case 'savings':
      return 'wallet';
    case 'investment':
      return 'trending-up';
    case 'retirement':
      return 'shield-checkmark';
    default:
      return 'cash';
  }
};

const getDebtIcon = (type: string): any => {
  switch (type) {
    case 'credit_card':
      return 'card';
    case 'mortgage':
      return 'home';
    case 'student_loan':
      return 'school';
    case 'loan':
      return 'cash';
    default:
      return 'remove-circle';
  }
};

const formatAccountType = (type: string) => {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatDebtType = (type: string) => {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerGradient: {
      padding: theme.spacing.xl,
      paddingTop: theme.spacing.xl * 2,
      paddingBottom: theme.spacing.xl,
    },
    headerContent: {
      alignItems: 'center',
    },
    headerLabel: {
      fontSize: 16,
      color: '#fff',
      opacity: 0.9,
      marginBottom: theme.spacing.xs,
    },
    headerAmount: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: theme.spacing.sm,
    },
    changeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: 20,
    },
    changeText: {
      fontSize: 14,
      color: '#fff',
      marginLeft: theme.spacing.xs,
      fontWeight: '600',
    },
    summaryContainer: {
      flexDirection: 'row',
      padding: theme.spacing.lg,
      paddingTop: 0,
      marginTop: -theme.spacing.xl,
      gap: theme.spacing.md,
    },
    summaryCard: {
      flex: 1,
      padding: theme.spacing.md,
      marginVertical: 0,
    },
    summaryItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    summaryDetails: {
      flex: 1,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    summaryAmount: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    chartCard: {
      margin: theme.spacing.lg,
      marginTop: 0,
    },
    chartHeader: {
      marginBottom: theme.spacing.md,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    periodSelector: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    periodButton: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    periodButtonText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    periodButtonTextActive: {
      color: '#fff',
    },
    chart: {
      marginVertical: theme.spacing.sm,
      borderRadius: 16,
    },
    breakdownCard: {
      margin: theme.spacing.lg,
      marginTop: 0,
    },
    breakdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    breakdownTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    breakdownTotal: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    breakdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    breakdownLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    breakdownInfo: {
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    breakdownName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    breakdownType: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    breakdownAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default NetWorthScreen;
