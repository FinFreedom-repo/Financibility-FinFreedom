import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/common/Card';
import apiClient from '../../services/api';
import { API_CONFIG } from '../../constants';

interface ScoreBreakdown {
  net_worth: { score: number; max_score: number; rating: string; net_worth?: number };
  savings_rate: { score: number; max_score: number; rating: string; savings_rate?: number };
  debt_ratio: { score: number; max_score: number; rating: string; debt_ratio?: number };
  emergency_fund: { score: number; max_score: number; rating: string; months_covered?: number };
  budget_adherence: { score: number; max_score: number; rating: string };
  spending_trends: { score: number; max_score: number; rating: string; trend?: string };
}

interface HealthScore {
  total_score: number;
  grade: string;
  breakdown: ScoreBreakdown;
  recommendations: string[];
  calculated_at: string;
}

const FinancialHealthScreen: React.FC = () => {
  const { theme } = useTheme();
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHealthScore();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHealthScore();
    }, [])
  );

  const fetchHealthScore = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/mongodb/health-score/');
      if (response.data) {
        setHealthScore(response.data);
      }
    } catch (error) {
      console.error('Error fetching health score:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHealthScore();
    setRefreshing(false);
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#4caf50';
    if (grade.startsWith('B')) return '#8bc34a';
    if (grade.startsWith('C')) return '#ff9800';
    if (grade.startsWith('D')) return '#ff5722';
    return '#f44336';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return '#4caf50';
      case 'good':
        return '#8bc34a';
      case 'fair':
        return '#ff9800';
      case 'needs improvement':
        return '#ff5722';
      case 'poor':
      case 'critical':
        return '#f44336';
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const styles = createStyles(theme);

  if (loading && !healthScore) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Calculating your financial health...</Text>
      </View>
    );
  }

  if (!healthScore) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Unable to calculate score</Text>
      </View>
    );
  }

  const gradeColor = getGradeColor(healthScore.grade);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Score Header */}
      <LinearGradient
        colors={[gradeColor, gradeColor + 'DD']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Financial Health Score</Text>
        <View style={styles.scoreContainer}>
          <AnimatedCircularProgress
            size={180}
            width={15}
            fill={healthScore.total_score}
            tintColor="#fff"
            backgroundColor="rgba(255, 255, 255, 0.3)"
            rotation={0}
            lineCap="round"
          >
            {() => (
              <View style={styles.scoreInner}>
                <Text style={styles.scoreValue}>{Math.round(healthScore.total_score)}</Text>
                <Text style={styles.scoreGrade}>{healthScore.grade}</Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>
        <Text style={styles.scoreDescription}>
          {healthScore.total_score >= 90 ? 'Excellent!' :
           healthScore.total_score >= 75 ? 'Great job!' :
           healthScore.total_score >= 60 ? 'You\'re doing well' :
           healthScore.total_score >= 45 ? 'Room for improvement' :
           'Let\'s work on this together'}
        </Text>
      </LinearGradient>

      {/* Score Breakdown */}
      <View style={styles.breakdownContainer}>
        <Text style={styles.sectionTitle}>Score Breakdown</Text>

        {/* Net Worth */}
        <Card style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <View style={styles.breakdownLeft}>
              <Ionicons name="trending-up" size={24} color="#4caf50" />
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownTitle}>Net Worth</Text>
                <Text style={styles.breakdownSubtitle}>
                  {healthScore.breakdown.net_worth.net_worth !== undefined &&
                    formatCurrency(healthScore.breakdown.net_worth.net_worth)}
                </Text>
              </View>
            </View>
            <View style={styles.breakdownScore}>
              <Text style={styles.breakdownScoreText}>
                {Math.round(healthScore.breakdown.net_worth.score)}/
                {healthScore.breakdown.net_worth.max_score}
              </Text>
              <Text
                style={[
                  styles.breakdownRating,
                  { color: getRatingColor(healthScore.breakdown.net_worth.rating) },
                ]}
              >
                {healthScore.breakdown.net_worth.rating}
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(healthScore.breakdown.net_worth.score / healthScore.breakdown.net_worth.max_score) * 100}%`,
                  backgroundColor: getRatingColor(healthScore.breakdown.net_worth.rating),
                },
              ]}
            />
          </View>
        </Card>

        {/* Savings Rate */}
        <Card style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <View style={styles.breakdownLeft}>
              <Ionicons name="wallet" size={24} color="#2196f3" />
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownTitle}>Savings Rate</Text>
                <Text style={styles.breakdownSubtitle}>
                  {healthScore.breakdown.savings_rate.savings_rate !== undefined &&
                    `${healthScore.breakdown.savings_rate.savings_rate}%`}
                </Text>
              </View>
            </View>
            <View style={styles.breakdownScore}>
              <Text style={styles.breakdownScoreText}>
                {Math.round(healthScore.breakdown.savings_rate.score)}/
                {healthScore.breakdown.savings_rate.max_score}
              </Text>
              <Text
                style={[
                  styles.breakdownRating,
                  { color: getRatingColor(healthScore.breakdown.savings_rate.rating) },
                ]}
              >
                {healthScore.breakdown.savings_rate.rating}
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(healthScore.breakdown.savings_rate.score / healthScore.breakdown.savings_rate.max_score) * 100}%`,
                  backgroundColor: getRatingColor(healthScore.breakdown.savings_rate.rating),
                },
              ]}
            />
          </View>
        </Card>

        {/* Debt-to-Income Ratio */}
        <Card style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <View style={styles.breakdownLeft}>
              <Ionicons name="card" size={24} color="#f44336" />
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownTitle}>Debt-to-Income</Text>
                <Text style={styles.breakdownSubtitle}>
                  {healthScore.breakdown.debt_ratio.debt_ratio !== undefined &&
                    `${healthScore.breakdown.debt_ratio.debt_ratio}%`}
                </Text>
              </View>
            </View>
            <View style={styles.breakdownScore}>
              <Text style={styles.breakdownScoreText}>
                {Math.round(healthScore.breakdown.debt_ratio.score)}/
                {healthScore.breakdown.debt_ratio.max_score}
              </Text>
              <Text
                style={[
                  styles.breakdownRating,
                  { color: getRatingColor(healthScore.breakdown.debt_ratio.rating) },
                ]}
              >
                {healthScore.breakdown.debt_ratio.rating}
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(healthScore.breakdown.debt_ratio.score / healthScore.breakdown.debt_ratio.max_score) * 100}%`,
                  backgroundColor: getRatingColor(healthScore.breakdown.debt_ratio.rating),
                },
              ]}
            />
          </View>
        </Card>

        {/* Emergency Fund */}
        <Card style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <View style={styles.breakdownLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#ff9800" />
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownTitle}>Emergency Fund</Text>
                <Text style={styles.breakdownSubtitle}>
                  {healthScore.breakdown.emergency_fund.months_covered !== undefined &&
                    `${healthScore.breakdown.emergency_fund.months_covered} months`}
                </Text>
              </View>
            </View>
            <View style={styles.breakdownScore}>
              <Text style={styles.breakdownScoreText}>
                {Math.round(healthScore.breakdown.emergency_fund.score)}/
                {healthScore.breakdown.emergency_fund.max_score}
              </Text>
              <Text
                style={[
                  styles.breakdownRating,
                  { color: getRatingColor(healthScore.breakdown.emergency_fund.rating) },
                ]}
              >
                {healthScore.breakdown.emergency_fund.rating}
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(healthScore.breakdown.emergency_fund.score / healthScore.breakdown.emergency_fund.max_score) * 100}%`,
                  backgroundColor: getRatingColor(healthScore.breakdown.emergency_fund.rating),
                },
              ]}
            />
          </View>
        </Card>

        {/* Spending Trends */}
        <Card style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <View style={styles.breakdownLeft}>
              <Ionicons name="analytics" size={24} color="#9c27b0" />
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownTitle}>Spending Trends</Text>
                <Text style={styles.breakdownSubtitle}>
                  {healthScore.breakdown.spending_trends.trend || 'neutral'}
                </Text>
              </View>
            </View>
            <View style={styles.breakdownScore}>
              <Text style={styles.breakdownScoreText}>
                {Math.round(healthScore.breakdown.spending_trends.score)}/
                {healthScore.breakdown.spending_trends.max_score}
              </Text>
              <Text
                style={[
                  styles.breakdownRating,
                  { color: getRatingColor(healthScore.breakdown.spending_trends.rating) },
                ]}
              >
                {healthScore.breakdown.spending_trends.rating}
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(healthScore.breakdown.spending_trends.score / healthScore.breakdown.spending_trends.max_score) * 100}%`,
                  backgroundColor: getRatingColor(healthScore.breakdown.spending_trends.rating),
                },
              ]}
            />
          </View>
        </Card>
      </View>

      {/* Recommendations */}
      {healthScore.recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {healthScore.recommendations.map((recommendation, index) => (
            <Card key={index} style={styles.recommendationCard}>
              <View style={styles.recommendationContent}>
                <Ionicons name="bulb" size={24} color="#ffc107" />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            </Card>
          ))}
        </View>
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
    header: {
      padding: theme.spacing.xl,
      paddingTop: theme.spacing.xl * 2,
      paddingBottom: theme.spacing.xl,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: theme.spacing.lg,
    },
    scoreContainer: {
      marginVertical: theme.spacing.lg,
    },
    scoreInner: {
      alignItems: 'center',
    },
    scoreValue: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#fff',
    },
    scoreGrade: {
      fontSize: 24,
      fontWeight: '600',
      color: '#fff',
      marginTop: theme.spacing.xs,
    },
    scoreDescription: {
      fontSize: 18,
      color: '#fff',
      opacity: 0.9,
      textAlign: 'center',
    },
    breakdownContainer: {
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    breakdownCard: {
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    breakdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
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
    breakdownTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    breakdownSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    breakdownScore: {
      alignItems: 'flex-end',
    },
    breakdownScoreText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    breakdownRating: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    recommendationsContainer: {
      padding: theme.spacing.lg,
      paddingTop: 0,
    },
    recommendationCard: {
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    recommendationContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    recommendationText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
  });

export default FinancialHealthScreen;
