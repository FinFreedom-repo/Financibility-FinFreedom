import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const defaultDebtRates = {
  'credit-card': 24.99,
  'personal-loan': 12.0,
  'student-loan': 5.5,
  'auto-loan': 7.5,
  mortgage: 6.5,
  other: 15.0,
};

const DebtsStep: React.FC<DebtsStepProps> = ({
  onNext,
  onBack,
  onDebtsAdded,
}) => {
  const { theme } = useTheme();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const [form, setForm] = useState<CreateDebtData>({
    name: '',
    debtType: 'credit-card',
    balance: 0,
    interestRate: 24.99,
    effectiveDate: new Date().toISOString().split('T')[0],
    payoffDate: '',
  });

  const styles = createStyles(theme);

  const fetchDebts = useCallback(async () => {
    try {
      const data = await accountsDebtsService.getDebts();
      setDebts(data);
      if (data.length > 0) {
        onDebtsAdded();
      }
    } catch {}
  }, [onDebtsAdded]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter a debt name');
      return;
    }

    if (!form.balance || form.balance <= 0) {
      Alert.alert('Error', 'Please enter a valid balance amount');
      return;
    }

    if (isSubmittingRef.current) {
      return;
    }

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);

      const debtData = {
        ...form,
        balance: Number(form.balance),
        interestRate:
          Number(form.interestRate) ||
          defaultDebtRates[form.debtType as keyof typeof defaultDebtRates] ||
          0,
      };

      await accountsDebtsService.createDebt(debtData);
      await fetchDebts();

      setForm({
        name: '',
        debtType: 'credit-card',
        balance: 0,
        interestRate: 24.99,
        effectiveDate: new Date().toISOString().split('T')[0],
        payoffDate: '',
      });

      setShowForm(false);
    } catch {
      setShowForm(true);
      Alert.alert('Error', 'Failed to add debt. Please try again.');
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const debtTypes = [
    { value: 'credit-card', label: 'Credit Card', icon: 'card' },
    { value: 'personal-loan', label: 'Personal Loan', icon: 'cash' },
    { value: 'student-loan', label: 'Student Loan', icon: 'school' },
    { value: 'auto-loan', label: 'Auto Loan', icon: 'car' },
    { value: 'mortgage', label: 'Mortgage', icon: 'home' },
    { value: 'other', label: 'Other Debt', icon: 'ellipsis-horizontal' },
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
            {debts.length === 0 && (
              <Button
                title="Add Debt"
                onPress={() => setShowForm(true)}
                icon="add-circle-outline"
              />
            )}
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
              placeholder="Enter debt name"
              leftIcon="card"
            />

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Debt Type</Text>
                <View style={styles.pickerContainer}>
                  {debtTypes.map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.pickerOption,
                        form.debtType === type.value &&
                          styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setForm({
                          ...form,
                          debtType: type.value,
                          interestRate:
                            defaultDebtRates[
                              type.value as keyof typeof defaultDebtRates
                            ],
                        });
                      }}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={20}
                        color={
                          form.debtType === type.value
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.pickerOptionText,
                          form.debtType === type.value &&
                            styles.pickerOptionTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Input
                  label="Balance"
                  value={(form.balance || 0).toString()}
                  onChangeText={text =>
                    setForm({ ...form, balance: parseFloat(text) || 0 })
                  }
                  placeholder="0.00"
                  keyboardType="numeric"
                  leftIcon="cash"
                />
              </View>
              <View style={styles.inputHalf}>
                <Input
                  label="Interest Rate (%)"
                  value={(form.interestRate || 0).toString()}
                  onChangeText={text =>
                    setForm({
                      ...form,
                      interestRate: parseFloat(text) || 0,
                    })
                  }
                  placeholder="0.00"
                  keyboardType="numeric"
                  leftIcon="trending-up"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Input
                  label="Effective Date"
                  value={form.effectiveDate}
                  onChangeText={text =>
                    setForm({ ...form, effectiveDate: text })
                  }
                  placeholder="YYYY-MM-DD"
                  leftIcon="calendar"
                />
              </View>
              <View style={styles.inputHalf}>
                <Input
                  label="Payoff Date (Optional)"
                  value={form.payoffDate || ''}
                  onChangeText={text => setForm({ ...form, payoffDate: text })}
                  placeholder="YYYY-MM-DD"
                  leftIcon="flag"
                />
              </View>
            </View>

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
      flexGrow: 1,
    },
    inputRow: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
    },
    inputHalf: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    pickerContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    pickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minWidth: '45%',
    },
    pickerOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    pickerOptionText: {
      marginLeft: theme.spacing.sm,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    pickerOptionTextSelected: {
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
