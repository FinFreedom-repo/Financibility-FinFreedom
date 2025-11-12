import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
  NotificationBadge,
  NotificationModal,
} from '../../components/notifications';
import { API_CONFIG } from '../../constants';
import apiClient from '../../services/api';
import accountsDebtsService from '../../services/accountsDebtsService';

interface FinancialSteps {
  current_step: number;
  step_progress: any;
  steps: Record<string, any>;
}

const DashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const { refreshNotifications } = useNotifications();
  const navigation = useNavigation();
  const [financialSteps, setFinancialSteps] = useState<FinancialSteps | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [debts, setDebts] = useState<any[]>([]);

  // Baby Steps data matching website
  const babySteps = [
    {
      id: 1,
      title: 'Save $2,000 for your starter emergency fund',
      description: 'This is your first step to financial security.',
      icon: 'wallet',
      color: '#2e7d32',
    },
    {
      id: 2,
      title: 'Pay off all debt (except the house) using the debt snowball',
      description:
        'List your debts from smallest to largest and attack them one by one.',
      icon: 'card',
      color: '#d32f2f',
    },
    {
      id: 3,
      title: 'Save 3-6 months of expenses in a fully funded emergency fund',
      description: 'This is your complete emergency fund.',
      icon: 'business',
      color: '#1976d2',
    },
    {
      id: 4,
      title: 'Invest 15% of your household income in retirement',
      description: 'Focus on tax-advantaged retirement accounts.',
      icon: 'trending-up',
      color: '#7b1fa2',
    },
    {
      id: 5,
      title: "Save for your children's college fund",
      description: "Start saving for your children's education.",
      icon: 'school',
      color: '#f57c00',
    },
    {
      id: 6,
      title: 'Pay off your home early',
      description: 'Work on becoming completely debt-free.',
      icon: 'home',
      color: '#388e3c',
    },
  ];

  // Features data matching website
  const features = [
    {
      title: 'Track Accounts & Debts',
      description: 'Get a complete picture of your financial situation',
      icon: 'business',
      color: '#2e7d32',
      screen: 'Accounts',
    },
    {
      title: 'Monthly Budgeting',
      description: 'Create and stick to realistic spending plans',
      icon: 'receipt',
      color: '#ed6c02',
      screen: 'Budget',
    },
    {
      title: 'Expense Analysis',
      description: 'Understand where your money goes',
      icon: 'bar-chart',
      color: '#7b1fa2',
      screen: 'Budget', // For now, navigate to Budget since we don't have a separate Expense Analysis screen
    },
    {
      title: 'Debt Planning',
      description: 'Create strategies to eliminate debt faster',
      icon: 'card',
      color: '#d32f2f',
      screen: 'DebtPlanning',
    },
    {
      title: 'Wealth Projection',
      description: 'See your financial future with different scenarios',
      icon: 'trending-up',
      color: '#1565c0',
      screen: 'WealthProjection',
    },
  ];

  useEffect(() => {
    fetchFinancialSteps();
    fetchDebts();
  }, []);

  // Refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchFinancialSteps();
      fetchDebts();
      refreshNotifications();
    }, [refreshNotifications])
  );

  // Handle feature navigation
  const handleFeaturePress = (screen: string) => {
    try {
      (navigation as any).navigate(screen);
    } catch {
      Alert.alert(
        'Navigation Error',
        'Unable to navigate to the selected feature.'
      );
    }
  };

  const fetchDebts = async () => {
    try {
      const debtsData = await accountsDebtsService.getDebts();
      setDebts(debtsData || []);
    } catch {
      setDebts([]);
    }
  };

  const fetchFinancialSteps = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.DASHBOARD.FINANCIAL_STEPS
      );

      if (response.data) {
        // Sanitize the data to ensure no text rendering issues
        const data = response.data as any;
        const sanitizedData = {
          ...data,
          current_step: Number(data.current_step) || 0,
          step_progress: data.step_progress
            ? {
                ...data.step_progress,
                progress: Number(data.step_progress.progress) || 0,
                current_amount: Number(data.step_progress.current_amount) || 0,
                goal_amount: Number(data.step_progress.goal_amount) || 0,
                message: data.step_progress.message
                  ? String(data.step_progress.message)
                  : null,
              }
            : null,
          steps: data.steps
            ? Object.keys(data.steps).reduce((acc: any, key) => {
                const step = data.steps[key];
                acc[key] = {
                  ...step,
                  completed: Boolean(step.completed),
                  progress: Number(step.progress) || 0,
                  message: step.message ? String(step.message) : null,
                };
                return acc;
              }, {})
            : {},
        };

        setFinancialSteps(sanitizedData as FinancialSteps);
      } else if (response.error) {
        Alert.alert('Error', response.error);
      }
    } catch {
      Alert.alert('Error', 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchFinancialSteps(),
        fetchDebts(),
        refreshNotifications(),
      ]);
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to check if all previous steps are completed
  const arePreviousStepsCompleted = (stepId: number): boolean => {
    if (!financialSteps || stepId <= 1) return true; // Step 1 has no previous steps

    for (let i = 1; i < stepId; i++) {
      const prevStepData = financialSteps.steps?.[`step_${i}`];
      if (!prevStepData || !prevStepData.completed) {
        return false;
      }
    }
    return true;
  };

  const getStepStatus = (stepId: number) => {
    if (!financialSteps) return 'pending';

    const currentStep = financialSteps.current_step;
    const stepProgress = financialSteps.step_progress;
    const stepData = financialSteps.steps?.[`step_${stepId}`];

    if (stepId === 2) {
      const hasNonMortgageDebts = debts.some(
        debt =>
          debt.debt_type !== 'mortgage' &&
          parseFloat(
            debt.balance?.toString() || debt.amount?.toString() || '0'
          ) > 0
      );

      if (hasNonMortgageDebts) {
        return 'in-progress';
      }
    }

    // Check if step is completed AND all previous steps are completed
    if (stepData && stepData.completed && arePreviousStepsCompleted(stepId)) {
      return 'completed';
    }

    if (currentStep === stepId && stepProgress && !stepProgress.completed) {
      return 'in-progress';
    }

    if (stepData && stepData.progress > 0) {
      return 'in-progress';
    }

    if (stepId === 1 && stepData && !stepData.completed) {
      return 'in-progress';
    }

    if (stepId <= currentStep && stepData && !stepData.completed) {
      return 'in-progress';
    }
    return 'pending';
  };

  const getStepProgress = (stepId: number) => {
    try {
      if (!financialSteps || financialSteps.current_step !== stepId)
        return null;

      const progress = financialSteps.step_progress;
      if (!progress || progress.completed) return null;

      const safeProgress = Number(progress.progress) || 0;
      const safeCurrent = Number(
        progress.current_amount ||
          progress.current_debt ||
          progress.current_percent ||
          0
      );
      const safeGoal = Number(
        progress.goal_amount ||
          progress.goal_percent ||
          progress.max_total_debt ||
          0
      );
      const safeAmountPaidOff = Number(progress.amount_paid_off) || 0;
      const safeMessage = progress.message ? String(progress.message) : null;

      return {
        progress: safeProgress,
        current: safeCurrent,
        goal: safeGoal,
        amount_paid_off: safeAmountPaidOff,
        message: safeMessage,
      };
    } catch {
      return null;
    }
  };

  const renderStepIcon = (stepId: number) => {
    const status = getStepStatus(stepId);
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />;
      case 'in-progress':
        return <Ionicons name="refresh" size={20} color="#ed6c02" />;
      default:
        return (
          <Ionicons
            name="radio-button-off"
            size={20}
            color={theme.colors.textSecondary}
          />
        );
    }
  };

  const renderStepProgress = (stepId: number) => {
    try {
      const progress = getStepProgress(stepId);
      if (
        !progress ||
        progress.progress === undefined ||
        progress.progress === null
      )
        return null;

      const progressPercent = Math.round(Number(progress.progress) || 0);
      const progressWidth = (progressPercent + '%') as any;

      const progressMessage = progress.message
        ? String(progress.message)
        : progressPercent + '% complete';

      const stepColor = babySteps[stepId - 1]?.color || '#666';

      return (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                  backgroundColor: stepColor,
                },
              ]}
            />
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressText}>{progressMessage}</Text>
          </View>
        </View>
      );
    } catch {
      return null;
    }
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Card style={styles.loadingCard}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingTitle}>
              Loading your financial progress...
            </Text>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
              style={styles.loadingSpinner}
            />
          </View>
        </Card>
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
      {/* Welcome Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeTitle}>Welcome to FinFreedom! 👋</Text>
          <NotificationBadge
            onPress={() => setShowNotificationModal(true)}
            style={styles.notificationBadge}
          />
        </View>
      </View>

      {/* Main Dashboard Section */}
      <Card style={styles.dashboardCard}>
        <View style={styles.dashboardContent}>
          {/* Dashboard Title */}
          <View style={styles.dashboardTitleContainer}>
            <Ionicons name="grid" size={24} color={theme.colors.primary} />
            <Text style={styles.dashboardTitle}>Your Financial Dashboard</Text>
          </View>

          <Text style={styles.dashboardDescription}>
            Your personal financial management dashboard is here to help you
            take control of your money and build a secure financial future. This
            is your command center for tracking accounts, managing debts,
            creating budgets, and planning your path to financial freedom.
          </Text>

          <Text style={styles.featuresTitle}>What you can do here:</Text>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={() => handleFeaturePress(feature.screen)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: feature.color + '20' },
                  ]}
                >
                  <Ionicons
                    name={feature.icon as any}
                    size={24}
                    color={feature.color}
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Ready to Get Started Section */}
          <LinearGradient
            colors={[theme.colors.primary + '10', theme.colors.primary + '05']}
            style={styles.readySection}
          >
            <Text style={styles.readyTitle}>🚀 Ready to get started?</Text>
            <Text style={styles.readyDescription}>
              The best way to begin your financial journey is to input your
              current accounts and debts. This gives us the foundation we need
              to provide personalized insights and recommendations.
            </Text>
            <LinearGradient
              colors={['#ff0000', '#0066ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.readyButton}
            >
              <Button
                title="📝 Add Your Accounts & Debts"
                onPress={() => handleFeaturePress('Accounts')}
                style={styles.readyButtonInner}
                icon="add-circle"
              />
            </LinearGradient>
            <Text style={styles.readyCaption}>
              This takes just a few minutes and will unlock all the dashboard
              features!
            </Text>
          </LinearGradient>
        </View>
      </Card>

      {/* Financial Planning Checklist */}
      <Card style={styles.checklistCard}>
        <View style={styles.checklistContent}>
          <View style={styles.checklistHeader}>
            <View style={styles.checklistTitleContainer}>
              <Ionicons name="list" size={24} color={theme.colors.primary} />
              <Text style={styles.checklistTitle}>
                Financial Planning Checklist
              </Text>
            </View>
            <TouchableOpacity
              onPress={fetchFinancialSteps}
              disabled={loading}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh" size={20} color={theme.colors.primary} />
              <Text style={styles.refreshText}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Baby Steps List */}
          <View style={styles.stepsList}>
            {babySteps.map(step => {
              const status = getStepStatus(step.id);

              return (
                <View key={step.id} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCard,
                      {
                        borderColor: step.color + '40',
                        backgroundColor:
                          status === 'completed'
                            ? step.color + '10'
                            : 'transparent',
                      },
                    ]}
                  >
                    <View style={styles.stepContent}>
                      <View
                        style={[
                          styles.stepIconContainer,
                          { backgroundColor: step.color + '20' },
                        ]}
                      >
                        <Ionicons
                          name={step.icon as any}
                          size={20}
                          color={step.color}
                        />
                      </View>
                      <View style={styles.stepDetails}>
                        <View style={styles.stepHeader}>
                          <View
                            style={[
                              styles.stepChip,
                              { backgroundColor: step.color + '20' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.stepChipText,
                                { color: step.color },
                              ]}
                            >
                              {'Step ' + step.id}
                            </Text>
                          </View>
                          {renderStepIcon(step.id)}
                        </View>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepDescription}>
                          {step.description}
                        </Text>

                        {renderStepProgress(step.id)}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Card>

      {/* Notification Modal */}
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNotificationPress={notification => {}}
      />
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
      padding: theme.spacing.lg,
    },
    loadingCard: {
      padding: theme.spacing.xl,
    },
    loadingContent: {
      alignItems: 'center',
    },
    loadingTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    loadingSpinner: {
      marginTop: theme.spacing.md,
    },
    header: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    notificationBadge: {
      marginLeft: theme.spacing.md,
    },
    dashboardCard: {
      margin: theme.spacing.lg,
      marginTop: 0,
    },
    dashboardContent: {
      padding: theme.spacing.lg,
    },
    dashboardTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    dashboardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    dashboardDescription: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
      marginBottom: theme.spacing.lg,
    },
    featuresTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    featuresGrid: {
      marginBottom: theme.spacing.xl,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.textSecondary + '20',
      backgroundColor: theme.colors.surface,
    },
    featureIconContainer: {
      padding: theme.spacing.sm,
      borderRadius: 8,
      marginRight: theme.spacing.md,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    readySection: {
      padding: theme.spacing.lg,
      borderRadius: 12,
      marginTop: theme.spacing.lg,
    },
    readyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    readyDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
    },
    readyButton: {
      borderRadius: 12,
      marginBottom: theme.spacing.sm,
    },
    readyButtonInner: {
      backgroundColor: 'transparent',
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    readyCaption: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    checklistCard: {
      margin: theme.spacing.lg,
      marginTop: 0,
    },
    checklistContent: {
      padding: theme.spacing.lg,
    },
    checklistHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    checklistTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    checklistTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    refreshText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: theme.spacing.xs,
    },
    stepsList: {
      marginTop: theme.spacing.md,
    },
    stepItem: {
      marginBottom: theme.spacing.sm,
    },
    stepCard: {
      padding: theme.spacing.md,
      borderRadius: 12,
      borderWidth: 1,
    },
    stepContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    stepIconContainer: {
      padding: theme.spacing.sm,
      borderRadius: 8,
      marginRight: theme.spacing.md,
    },
    stepDetails: {
      flex: 1,
    },
    stepHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    stepChip: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
    },
    stepChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    stepTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    stepDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    progressContainer: {
      marginTop: theme.spacing.sm,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressTextContainer: {
      flexDirection: 'column',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xs,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });

export default DashboardScreen;
