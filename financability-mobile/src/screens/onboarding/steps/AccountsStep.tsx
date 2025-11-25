import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
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

  const [form, setForm] = useState<CreateAccountData>({
    name: '',
    accountType: 'checking',
    balance: 0,
    interestRate: 0.01,
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const styles = createStyles(theme);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await accountsDebtsService.getAccounts();
      setAccounts(data);
      if (data.length > 0) {
        onAccountsAdded();
      }
    } catch (_error) {
      // Silently handle error - user can still proceed
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    try {
      setSubmitting(true);
      await accountsDebtsService.createAccount({
        ...form,
        balance: Number(form.balance),
        interestRate: Number(form.interestRate),
      });
      setForm({
        name: '',
        accountType: 'checking',
        balance: 0,
        interestRate: 0.01,
        effectiveDate: new Date().toISOString().split('T')[0],
      });
      setShowForm(false);
      await fetchAccounts();
      Alert.alert('Success', 'Account added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const accountTypes = [
    { value: 'checking', label: 'Checking', icon: 'card' },
    { value: 'savings', label: 'Savings', icon: 'wallet' },
    { value: 'investment', label: 'Investment', icon: 'trending-up' },
    { value: 'retirement', label: 'Retirement', icon: 'business' },
  ];

  return (
    <View style={styles.container}>
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
          <Button
            title={accounts.length > 0 ? 'Add Another Account' : 'Add Account'}
            onPress={() => setShowForm(true)}
            icon="add-circle-outline"
          />
          {accounts.length > 0 && (
            <Button
              title="Continue"
              onPress={onNext}
              style={styles.continueButton}
            />
          )}
        </View>
      ) : (
        <ScrollView style={styles.formContainer}>
          <Input
            label="Account Name"
            value={form.name}
            onChangeText={text => setForm({ ...form, name: text })}
            placeholder="e.g., Chase Checking"
          />

          <Text style={styles.label}>Account Type</Text>
          <View style={styles.typeContainer}>
            {accountTypes.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  form.accountType === type.value && styles.typeButtonActive,
                ]}
                onPress={() => setForm({ ...form, accountType: type.value })}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={
                    form.accountType === type.value
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    form.accountType === type.value &&
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
        </ScrollView>
      )}

      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons
          name="arrow-back"
          size={20}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
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

export default AccountsStep;
