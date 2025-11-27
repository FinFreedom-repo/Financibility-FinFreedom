import React, { useState, useEffect } from 'react';
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
import accountsDebtsService, {
  Debt,
  CreateDebtData,
} from '../../../services/accountsDebtsService';

interface DebtsStepProps {
  onNext: () => void;
  onBack: () => void;
  onDebtsAdded: () => void;
}

const DebtsStep: React.FC<DebtsStepProps> = ({
  onNext,
  onBack,
  onDebtsAdded,
}) => {
  const { theme } = useTheme();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateDebtData>({
    name: '',
    debtType: 'credit_card',
    balance: 0,
    interestRate: 0,
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const styles = createStyles(theme);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const data = await accountsDebtsService.getDebts();
      setDebts(data);
      if (data.length > 0) {
        onDebtsAdded();
      }
    } catch (_error) {
      // Silently handle error - user can still proceed
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter a debt name');
      return;
    }

    if (!form.balance || form.balance <= 0) {
      Alert.alert('Error', 'Please enter a valid balance amount');
      return;
    }

    try {
      setSubmitting(true);
      await accountsDebtsService.createDebt({
        ...form,
        balance: Number(form.balance),
        interestRate: Number(form.interestRate),
      });
      setForm({
        name: '',
        debtType: 'credit_card',
        balance: 0,
        interestRate: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
      });
      setShowForm(false);
      await fetchDebts();
      Alert.alert('Success', 'Debt added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add debt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const debtTypes = [
    { value: 'credit_card', label: 'Credit Card', icon: 'card' },
    { value: 'student_loan', label: 'Student Loan', icon: 'school' },
    { value: 'auto_loan', label: 'Auto Loan', icon: 'car' },
    { value: 'personal_loan', label: 'Personal Loan', icon: 'cash' },
    { value: 'mortgage', label: 'Mortgage', icon: 'home' },
    { value: 'home_equity', label: 'Home Equity', icon: 'business' },
    { value: 'business_loan', label: 'Business Loan', icon: 'briefcase' },
    { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
  ];

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
          <Ionicons name="card" size={48} color={theme.colors.primary} />
          <Text style={styles.title}>Add Your Debts</Text>
          <Text style={styles.subtitle}>
            Track your debts to get a complete picture of your financial health
          </Text>
        </View>

        {debts.length > 0 && (
          <View style={styles.debtsList}>
            <Text style={styles.sectionTitle}>Your Debts</Text>
            {debts.map(debt => (
              <View key={debt.id} style={styles.debtCard}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.success}
                />
                <View style={styles.debtInfo}>
                  <Text style={styles.debtName}>{debt.name}</Text>
                  <Text style={styles.debtType}>
                    {debtTypes.find(t => t.value === debt.debt_type)?.label ||
                      debt.debt_type}
                  </Text>
                </View>
                <Text style={styles.debtBalance}>
                  ${debt.balance.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!showForm ? (
          <View style={styles.buttonContainer}>
            <Button
              title={debts.length > 0 ? 'Add Another Debt' : 'Add Debt'}
              onPress={() => setShowForm(true)}
              icon="add-circle-outline"
            />
            <Button
              title={debts.length > 0 ? 'Continue' : 'Skip for Now'}
              onPress={onNext}
              style={styles.continueButton}
              variant={debts.length === 0 ? 'outline' : undefined}
            />
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Input
              label="Debt Name"
              value={form.name}
              onChangeText={text => setForm({ ...form, name: text })}
              placeholder="e.g., Chase Credit Card"
            />

            <Text style={styles.label}>Debt Type</Text>
            <View style={styles.typeContainer}>
              {debtTypes.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    form.debtType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setForm({ ...form, debtType: type.value })}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={
                      form.debtType === type.value
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      form.debtType === type.value &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Current Balance"
              value={form.balance.toString()}
              onChangeText={text =>
                setForm({ ...form, balance: parseFloat(text) || 0 })
              }
              placeholder="0.00"
              keyboardType="numeric"
            />

            <Input
              label="Interest Rate (%)"
              value={form.interestRate.toString()}
              onChangeText={text =>
                setForm({ ...form, interestRate: parseFloat(text) || 0 })
              }
              placeholder="0.00"
              keyboardType="numeric"
            />

            <Input
              label="Effective Date"
              value={form.effectiveDate}
              onChangeText={text => setForm({ ...form, effectiveDate: text })}
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.formActions}>
              <Button
                title="Cancel"
                onPress={() => setShowForm(false)}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title="Add Debt"
                onPress={handleSubmit}
                loading={submitting}
                style={styles.submitButton}
              />
            </View>
          </View>
        )}

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
    debtsList: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.h4,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    debtCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    debtInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    debtName: {
      ...theme.typography.body1,
      color: theme.colors.text,
      fontWeight: '600',
    },
    debtType: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    debtBalance: {
      ...theme.typography.h4,
      color: theme.colors.error,
      fontWeight: '600',
    },
    buttonContainer: {
      marginTop: theme.spacing.lg,
    },
    continueButton: {
      marginTop: theme.spacing.md,
    },
    formContainer: {
      marginTop: theme.spacing.lg,
    },
    label: {
      ...theme.typography.body1,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      fontWeight: '600',
    },
    typeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.md,
    },
    typeButton: {
      width: '48%',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginRight: '2%',
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    typeButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    typeButtonText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    typeButtonTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    formActions: {
      flexDirection: 'row',
      marginTop: theme.spacing.lg,
    },
    cancelButton: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    submitButton: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    backText: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
  });

export default DebtsStep;
