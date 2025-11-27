import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import budgetService, {
  CreateBudgetData,
} from '../../../services/budgetService';

interface BudgetStepProps {
  onNext: () => void;
  onBack: () => void;
  onBudgetSet: () => void;
}

const BudgetStep: React.FC<BudgetStepProps> = ({
  onNext,
  onBack,
  onBudgetSet,
}) => {
  const { theme } = useTheme();
  const [submitting, setSubmitting] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [form, setForm] = useState<CreateBudgetData>({
    month: currentMonth,
    year: currentYear,
    income: 0,
    additional_income: 0,
    additional_income_items: [],
    expenses: {
      housing: 0,
      debt_payments: 0,
      transportation: 0,
      utilities: 0,
      food: 0,
      healthcare: 0,
      entertainment: 0,
      shopping: 0,
      travel: 0,
      education: 0,
      childcare: 0,
      others: 0,
    },
    additional_items: [],
    savings_items: [],
    manually_edited_categories: [],
  });

  const styles = createStyles(theme);

  const expenseCategories = [
    { key: 'housing', label: 'Housing', icon: 'home' },
    { key: 'food', label: 'Food & Groceries', icon: 'restaurant' },
    { key: 'transportation', label: 'Transportation', icon: 'car' },
    { key: 'utilities', label: 'Utilities', icon: 'flash' },
    { key: 'debt_payments', label: 'Debt Payments', icon: 'card' },
    { key: 'healthcare', label: 'Healthcare', icon: 'medical' },
    { key: 'entertainment', label: 'Entertainment', icon: 'musical-notes' },
    { key: 'shopping', label: 'Shopping', icon: 'bag' },
  ];

  const handleSubmit = async () => {
    if (!form.income || form.income <= 0) {
      Alert.alert('Error', 'Please enter your monthly income');
      return;
    }

    try {
      setSubmitting(true);
      await budgetService.createBudget(form);
      onBudgetSet();
      Alert.alert('Success', 'Budget created successfully!');
      onNext();
    } catch {
      Alert.alert('Error', 'Failed to create budget. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateExpense = (key: string, value: string) => {
    setForm({
      ...form,
      expenses: {
        ...form.expenses,
        [key]: parseFloat(value) || 0,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="pie-chart" size={48} color={theme.colors.primary} />
          <Text style={styles.title}>Set Up Your Budget</Text>
          <Text style={styles.subtitle}>
            Tell us about your monthly income and expenses
          </Text>
        </View>
        <Input
          label="Monthly Income"
          value={form.income.toString()}
          onChangeText={text =>
            setForm({ ...form, income: parseFloat(text) || 0 })
          }
          placeholder="0.00"
          keyboardType="numeric"
        />

        <Text style={styles.sectionTitle}>Monthly Expenses</Text>
        <Text style={styles.sectionSubtitle}>
          Enter your typical monthly spending in each category
        </Text>

        {expenseCategories.map(category => (
          <View key={category.key} style={styles.expenseRow}>
            <View style={styles.expenseLabel}>
              <Ionicons
                name={category.icon as any}
                size={20}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.expenseLabelText}>{category.label}</Text>
            </View>
            <Input
              label=""
              value={
                form.expenses[
                  category.key as keyof typeof form.expenses
                ]?.toString() || '0'
              }
              onChangeText={text => updateExpense(category.key, text)}
              placeholder="0.00"
              keyboardType="numeric"
              style={[styles.expenseInput, styles.expenseInputContainer]}
            />
          </View>
        ))}

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={styles.summaryValue}>
              $
              {Object.values(form.expenses)
                .reduce((sum, val) => sum + (val || 0), 0)
                .toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    form.income -
                      Object.values(form.expenses).reduce(
                        (sum, val) => sum + (val || 0),
                        0
                      ) >=
                    0
                      ? theme.colors.success
                      : theme.colors.error,
                },
              ]}
            >
              $
              {(
                form.income -
                Object.values(form.expenses).reduce(
                  (sum, val) => sum + (val || 0),
                  0
                )
              ).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Create Budget"
            onPress={handleSubmit}
            loading={submitting}
            icon="checkmark-circle"
          />
        </View>

        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={20}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: theme.spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    sectionTitle: {
      ...theme.typography.h4,
      color: theme.colors.text,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xs,
    },
    sectionSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    expenseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    expenseLabel: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    expenseLabelText: {
      ...theme.typography.body1,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    expenseInput: {
      flex: 0,
      width: 120,
    },
    expenseInputContainer: {
      marginBottom: 0,
    },
    summaryContainer: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    summaryLabel: {
      ...theme.typography.body1,
      color: theme.colors.text,
      fontWeight: '600',
    },
    summaryValue: {
      ...theme.typography.h4,
      color: theme.colors.text,
      fontWeight: '600',
    },
    buttonContainer: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    backText: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
  });

export default BudgetStep;
