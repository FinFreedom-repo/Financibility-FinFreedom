import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Account,
  CreateAccountData,
} from '../../../services/accountsDebtsService';

interface AccountsStepProps {
  onNext: () => void;
  onBack: () => void;
  onAccountsAdded: () => void;
}

const AccountsStep: React.FC<AccountsStepProps> = ({
  onNext,
  onBack,
  onAccountsAdded,
}) => {
  const { theme } = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const [form, setForm] = useState<CreateAccountData>({
    name: '',
    accountType: 'checking',
    balance: 0,
    interestRate: 0.01,
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const styles = createStyles(theme);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await accountsDebtsService.getAccounts();
      setAccounts(data);
      if (data.length > 0) {
        onAccountsAdded();
      }
    } catch {}
  }, [onAccountsAdded]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    if (isSubmittingRef.current) {
      return;
    }

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);

      const accountData = {
        ...form,
        balance: Number(form.balance),
        interestRate: Number(form.interestRate),
      };

      await accountsDebtsService.createAccount(accountData);
      await fetchAccounts();

      setForm({
        name: '',
        accountType: 'checking',
        balance: 0,
        interestRate: 0.01,
        effectiveDate: new Date().toISOString().split('T')[0],
      });

      setShowForm(false);
    } catch {
      setShowForm(true);
      Alert.alert('Error', 'Failed to add account. Please try again.');
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const defaultAccountRates = {
    checking: 0.01,
    investment: 7.0,
    other: 0.0,
  };

  const accountTypes = [
    { value: 'checking', label: 'Checking Account', icon: 'card' },
    { value: 'savings', label: 'Savings Account', icon: 'wallet' },
    { value: 'investment', label: 'Investment Account', icon: 'trending-up' },
    { value: 'retirement', label: 'Retirement Account', icon: 'business' },
    { value: 'other', label: 'Other Account', icon: 'ellipsis-horizontal' },
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
          <Ionicons name="wallet" size={48} color={theme.colors.primary} />
          <Text style={styles.title}>Add Your Accounts</Text>
          <Text style={styles.subtitle}>
            Start by adding at least one account to track your finances
          </Text>
        </View>

        {accounts.length > 0 && (
          <View style={styles.accountsList}>
            <Text style={styles.sectionTitle}>Your Accounts</Text>
            {accounts.map(account => (
              <View key={account.id} style={styles.accountCard}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.success}
                />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountType}>
                    {accountTypes.find(t => t.value === account.account_type)
                      ?.label || account.account_type}
                  </Text>
                </View>
                <Text style={styles.accountBalance}>
                  ${account.balance.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!showForm ? (
          <View style={styles.buttonContainer}>
            {accounts.length === 0 && (
              <Button
                title="Add Account"
                onPress={() => setShowForm(true)}
                icon="add-circle-outline"
              />
            )}
            {accounts.length > 0 && (
              <Button
                title="Continue"
                onPress={onNext}
                style={styles.continueButton}
              />
            )}
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Input
              label="Account Name"
              value={form.name}
              onChangeText={text => setForm({ ...form, name: text })}
              placeholder="Enter account name"
              leftIcon="wallet"
            />

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Account Type</Text>
                <View style={styles.pickerContainer}>
                  {accountTypes.map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.pickerOption,
                        form.accountType === type.value &&
                          styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setForm({
                          ...form,
                          accountType: type.value,
                          interestRate:
                            defaultAccountRates[
                              type.value as keyof typeof defaultAccountRates
                            ] ?? form.interestRate,
                        });
                      }}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={20}
                        color={
                          form.accountType === type.value
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.pickerOptionText,
                          form.accountType === type.value &&
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
                    setForm({
                      ...form,
                      balance: parseFloat(text) || 0,
                    })
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

            <Input
              label="Effective Date"
              value={form.effectiveDate}
              onChangeText={text => setForm({ ...form, effectiveDate: text })}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar"
            />

            <View style={styles.formActions}>
              <Button
                title="Cancel"
                onPress={() => setShowForm(false)}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title="Add Account"
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
    accountsList: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.h4,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    accountInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    accountName: {
      ...theme.typography.body1,
      color: theme.colors.text,
      fontWeight: '600',
    },
    accountType: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    accountBalance: {
      ...theme.typography.h4,
      color: theme.colors.primary,
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

export default AccountsStep;
