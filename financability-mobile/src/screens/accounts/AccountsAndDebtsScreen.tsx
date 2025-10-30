import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import accountsDebtsService, {
  Account,
  Debt,
  CreateAccountData,
  CreateDebtData,
} from '../../services/accountsDebtsService';

const { width, height } = Dimensions.get('window');

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <View style={{ display: value === index ? 'flex' : 'none' }}>
      {children}
    </View>
  );
};

const AccountsAndDebtsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');

  // Dialog states
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Delete confirmation dialog states
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteDebtDialogOpen, setDeleteDebtDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);

  // Loading states for CRUD operations
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [debtSubmitting, setDebtSubmitting] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [debtDeleting, setDebtDeleting] = useState(false);

  // Default interest rates
  const defaultAccountRates = {
    checking: 0.01,
    investment: 7.0,
    other: 0.0,
  };

  const defaultDebtRates = {
    'credit-card': 24.99,
    'personal-loan': 12.0,
    'student-loan': 5.5,
    'auto-loan': 7.5,
    mortgage: 6.5,
    other: 15.0,
  };

  // Form states
  const [accountForm, setAccountForm] = useState<CreateAccountData>({
    name: '',
    accountType: 'checking',
    balance: 0,
    interestRate: 0.01,
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const [debtForm, setDebtForm] = useState<CreateDebtData>({
    name: '',
    debtType: 'credit-card',
    balance: 0,
    interestRate: 24.99,
    effectiveDate: new Date().toISOString().split('T')[0],
    payoffDate: '',
  });

  const accountTypes = [
    { value: 'checking', label: 'Checking Account', icon: 'card' },
    { value: 'savings', label: 'Savings Account', icon: 'wallet' },
    { value: 'investment', label: 'Investment Account', icon: 'trending-up' },
    { value: 'retirement', label: 'Retirement Account', icon: 'business' },
    { value: 'other', label: 'Other Account', icon: 'ellipsis-horizontal' },
  ];

  const debtTypes = [
    { value: 'credit-card', label: 'Credit Card', icon: 'card' },
    { value: 'personal-loan', label: 'Personal Loan', icon: 'cash' },
    { value: 'student-loan', label: 'Student Loan', icon: 'school' },
    { value: 'auto-loan', label: 'Auto Loan', icon: 'car' },
    { value: 'mortgage', label: 'Mortgage', icon: 'home' },
    { value: 'other', label: 'Other Debt', icon: 'ellipsis-horizontal' },
  ];

  useEffect(() => {
    fetchAccountsAndDebts();
  }, []);

  // Refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchAccountsAndDebts();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccountsAndDebts();
    setRefreshing(false);
  }, []);

  const fetchAccountsAndDebts = async () => {
    try {
      setLoading(true);
      const [accountsData, debtsData] = await Promise.all([
        accountsDebtsService.getAccounts(),
        accountsDebtsService.getDebts(),
      ]);

      setAccounts(accountsData);
      setDebts(debtsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load accounts and debts');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async () => {
    try {
      setAccountSubmitting(true);

      const data = {
        ...accountForm,
        balance: Number(accountForm.balance),
        interestRate: Number(accountForm.interestRate),
      };

      if (editingAccount) {
        await accountsDebtsService.updateAccount(editingAccount.id, data);
        setSaveMessage('✅ Account updated successfully!');
      } else {
        await accountsDebtsService.createAccount(data);
        setSaveMessage('✅ Account added successfully!');
      }

      setAccountDialogOpen(false);
      setEditingAccount(null);
      resetAccountForm();

      await fetchAccountsAndDebts();
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      Alert.alert('Error', 'Failed to save account. Please try again.');
    } finally {
      setAccountSubmitting(false);
    }
  };

  const handleDebtSubmit = async () => {
    try {
      setDebtSubmitting(true);

      const data = {
        ...debtForm,
        balance: Number(debtForm.balance),
        interestRate: Number(debtForm.interestRate),
      };

      if (editingDebt) {
        await accountsDebtsService.updateDebt(editingDebt.id, data);
        setSaveMessage('✅ Debt updated successfully!');
      } else {
        await accountsDebtsService.createDebt(data);
        setSaveMessage('✅ Debt added successfully!');
      }

      setDebtDialogOpen(false);
      setEditingDebt(null);
      resetDebtForm();

      await fetchAccountsAndDebts();
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      Alert.alert('Error', 'Failed to save debt. Please try again.');
    } finally {
      setDebtSubmitting(false);
    }
  };

  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account);
    setDeleteAccountDialogOpen(true);
  };

  const handleDeleteDebt = (debt: Debt) => {
    setDebtToDelete(debt);
    setDeleteDebtDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      setAccountDeleting(true);
      await accountsDebtsService.deleteAccount(accountToDelete.id);
      setSaveMessage('✅ Account deleted successfully!');
      await fetchAccountsAndDebts();
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setAccountDeleting(false);
      setDeleteAccountDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  const confirmDeleteDebt = async () => {
    if (!debtToDelete) return;

    try {
      setDebtDeleting(true);
      await accountsDebtsService.deleteDebt(debtToDelete.id);
      setSaveMessage('✅ Debt deleted successfully!');
      await fetchAccountsAndDebts();
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete debt. Please try again.');
    } finally {
      setDebtDeleting(false);
      setDeleteDebtDialogOpen(false);
      setDebtToDelete(null);
    }
  };

  const resetAccountForm = () => {
    setAccountForm({
      name: '',
      accountType: 'checking',
      balance: 0,
      interestRate: 0.01,
      effectiveDate: new Date().toISOString().split('T')[0],
    });
  };

  const resetDebtForm = () => {
    setDebtForm({
      name: '',
      debtType: 'credit-card',
      balance: 0,
      interestRate: 24.99,
      effectiveDate: new Date().toISOString().split('T')[0],
      payoffDate: '',
    });
  };

  const openAccountDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setAccountForm({
        name: account.name || '',
        accountType: account.account_type || 'checking',
        balance: account.balance || 0,
        interestRate: account.interest_rate || 0.01,
        effectiveDate:
          account.effective_date || new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingAccount(null);
      resetAccountForm();
    }
    setAccountDialogOpen(true);
  };

  const openDebtDialog = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setDebtForm({
        name: debt.name || '',
        debtType: debt.debt_type || 'credit-card',
        balance: debt.balance || 0,
        interestRate: debt.interest_rate || 24.99,
        effectiveDate:
          debt.effective_date || new Date().toISOString().split('T')[0],
        payoffDate: debt.payoff_date || '',
      });
    } else {
      setEditingDebt(null);
      resetDebtForm();
    }
    setDebtDialogOpen(true);
  };

  const getAccountIcon = (accountType: string) => {
    const type = accountTypes.find(t => t.value === accountType);
    return type?.icon || 'card';
  };

  const getDebtIcon = (debtType: string) => {
    const type = debtTypes.find(t => t.value === debtType);
    return type?.icon || 'card';
  };

  const getAccountTypeLabel = (accountType: string) => {
    const type = accountTypes.find(t => t.value === accountType);
    return type?.label || 'Account';
  };

  const getDebtTypeLabel = (debtType: string) => {
    const type = debtTypes.find(t => t.value === debtType);
    return type?.label || 'Debt';
  };

  const totalAccountBalance = accounts.reduce(
    (sum, acc) => sum + acc.balance,
    0
  );
  const totalDebtBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const netWorth = totalAccountBalance - totalDebtBalance;

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Card style={styles.loadingCard}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingTitle}>
              Loading your accounts and debts...
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Accounts & Debts</Text>
        <Text style={styles.subtitle}>
          Manage your financial accounts and debts
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <LinearGradient
            colors={[theme.colors.primary + '10', theme.colors.primary + '05']}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Ionicons
                  name="wallet"
                  size={24}
                  color={theme.colors.success}
                />
                <Text style={styles.summaryLabel}>Total Assets</Text>
                <Text style={styles.summaryValue}>
                  ${totalAccountBalance.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="card" size={24} color={theme.colors.error} />
                <Text style={styles.summaryLabel}>Total Debts</Text>
                <Text style={styles.summaryValue}>
                  ${totalDebtBalance.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons
                  name="trending-up"
                  size={24}
                  color={
                    netWorth >= 0 ? theme.colors.success : theme.colors.error
                  }
                />
                <Text style={styles.summaryLabel}>Net Worth</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        netWorth >= 0
                          ? theme.colors.success
                          : theme.colors.error,
                    },
                  ]}
                >
                  ${netWorth.toLocaleString()}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Card>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tabValue === 0 && styles.activeTab]}
          onPress={() => setTabValue(0)}
        >
          <Ionicons
            name="wallet"
            size={20}
            color={
              tabValue === 0 ? theme.colors.primary : theme.colors.textSecondary
            }
          />
          <Text
            style={[styles.tabText, tabValue === 0 && styles.activeTabText]}
          >
            Accounts ({accounts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabValue === 1 && styles.activeTab]}
          onPress={() => setTabValue(1)}
        >
          <Ionicons
            name="card"
            size={20}
            color={
              tabValue === 1 ? theme.colors.primary : theme.colors.textSecondary
            }
          />
          <Text
            style={[styles.tabText, tabValue === 1 && styles.activeTabText]}
          >
            Debts ({debts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Accounts Tab */}
        <TabPanel value={tabValue} index={0}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Accounts</Text>
              <Button
                title="Add Account"
                onPress={() => openAccountDialog()}
                icon="add"
                size="small"
              />
            </View>

            {accounts.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons
                  name="wallet-outline"
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>No Accounts Yet</Text>
                <Text style={styles.emptyDescription}>
                  Add your first account to start tracking your finances
                </Text>
                <Button
                  title="Add Your First Account"
                  onPress={() => openAccountDialog()}
                  icon="add"
                  style={styles.emptyButton}
                />
              </Card>
            ) : (
              accounts.map(account => (
                <Card key={account.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemIconContainer}>
                      <Ionicons
                        name={getAccountIcon(account.account_type) as any}
                        size={24}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{account.name}</Text>
                      <Text style={styles.itemSubtitle}>
                        {getAccountTypeLabel(account.account_type)}
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openAccountDialog(account)}
                      >
                        <Ionicons
                          name="create"
                          size={20}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteAccount(account)}
                      >
                        <Ionicons
                          name="trash"
                          size={20}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.itemDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Balance</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: theme.colors.success },
                        ]}
                      >
                        ${account.balance.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Interest Rate</Text>
                      <Text style={styles.detailValue}>
                        {account.interest_rate}%
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Effective Date</Text>
                      <Text style={styles.detailValue}>
                        {account.effective_date}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        </TabPanel>

        {/* Debts Tab */}
        <TabPanel value={tabValue} index={1}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Debts</Text>
              <Button
                title="Add Debt"
                onPress={() => openDebtDialog()}
                icon="add"
                size="small"
              />
            </View>

            {debts.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons
                  name="card-outline"
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>No Debts Yet</Text>
                <Text style={styles.emptyDescription}>
                  Add your first debt to start tracking your financial
                  obligations
                </Text>
                <Button
                  title="Add Your First Debt"
                  onPress={() => openDebtDialog()}
                  icon="add"
                  style={styles.emptyButton}
                />
              </Card>
            ) : (
              debts.map(debt => (
                <Card key={debt.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemIconContainer}>
                      <Ionicons
                        name={getDebtIcon(debt.debt_type) as any}
                        size={24}
                        color={theme.colors.error}
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{debt.name}</Text>
                      <Text style={styles.itemSubtitle}>
                        {getDebtTypeLabel(debt.debt_type)}
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openDebtDialog(debt)}
                      >
                        <Ionicons
                          name="create"
                          size={20}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteDebt(debt)}
                      >
                        <Ionicons
                          name="trash"
                          size={20}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.itemDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Balance</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: theme.colors.error },
                        ]}
                      >
                        ${debt.balance.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Interest Rate</Text>
                      <Text style={styles.detailValue}>
                        {debt.interest_rate}%
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Effective Date</Text>
                      <Text style={styles.detailValue}>
                        {debt.effective_date}
                      </Text>
                    </View>
                    {debt.payoff_date && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payoff Date</Text>
                        <Text style={styles.detailValue}>
                          {debt.payoff_date}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              ))
            )}
          </View>
        </TabPanel>
      </ScrollView>

      {/* Account Dialog */}
      <Modal
        visible={accountDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setAccountDialogOpen(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Account Name"
              value={accountForm.name}
              onChangeText={text =>
                setAccountForm({ ...accountForm, name: text })
              }
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
                        accountForm.accountType === type.value &&
                          styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setAccountForm({
                          ...accountForm,
                          accountType: type.value,
                          interestRate:
                            defaultAccountRates[
                              type.value as keyof typeof defaultAccountRates
                            ],
                        });
                      }}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={20}
                        color={
                          accountForm.accountType === type.value
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.pickerOptionText,
                          accountForm.accountType === type.value &&
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
                  value={(accountForm.balance || 0).toString()}
                  onChangeText={text =>
                    setAccountForm({
                      ...accountForm,
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
                  value={(accountForm.interestRate || 0).toString()}
                  onChangeText={text =>
                    setAccountForm({
                      ...accountForm,
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
              value={accountForm.effectiveDate}
              onChangeText={text =>
                setAccountForm({ ...accountForm, effectiveDate: text })
              }
              placeholder="YYYY-MM-DD"
              leftIcon="calendar"
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              onPress={() => setAccountDialogOpen(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title={editingAccount ? 'Update' : 'Add Account'}
              onPress={handleAccountSubmit}
              loading={accountSubmitting}
              icon={editingAccount ? 'checkmark' : 'add'}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Debt Dialog */}
      <Modal
        visible={debtDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingDebt ? 'Edit Debt' : 'Add New Debt'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setDebtDialogOpen(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Debt Name"
              value={debtForm.name}
              onChangeText={text => setDebtForm({ ...debtForm, name: text })}
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
                        debtForm.debtType === type.value &&
                          styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setDebtForm({
                          ...debtForm,
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
                          debtForm.debtType === type.value
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.pickerOptionText,
                          debtForm.debtType === type.value &&
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
                  value={(debtForm.balance || 0).toString()}
                  onChangeText={text =>
                    setDebtForm({ ...debtForm, balance: parseFloat(text) || 0 })
                  }
                  placeholder="0.00"
                  keyboardType="numeric"
                  leftIcon="cash"
                />
              </View>
              <View style={styles.inputHalf}>
                <Input
                  label="Interest Rate (%)"
                  value={(debtForm.interestRate || 0).toString()}
                  onChangeText={text =>
                    setDebtForm({
                      ...debtForm,
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
                  value={debtForm.effectiveDate}
                  onChangeText={text =>
                    setDebtForm({ ...debtForm, effectiveDate: text })
                  }
                  placeholder="YYYY-MM-DD"
                  leftIcon="calendar"
                />
              </View>
              <View style={styles.inputHalf}>
                <Input
                  label="Payoff Date (Optional)"
                  value={debtForm.payoffDate || ''}
                  onChangeText={text =>
                    setDebtForm({ ...debtForm, payoffDate: text })
                  }
                  placeholder="YYYY-MM-DD"
                  leftIcon="flag"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              onPress={() => setDebtDialogOpen(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title={editingDebt ? 'Update' : 'Add Debt'}
              onPress={handleDebtSubmit}
              loading={debtSubmitting}
              icon={editingDebt ? 'checkmark' : 'add'}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Dialogs */}
      <Modal visible={deleteAccountDialogOpen} transparent animationType="fade">
        <View style={styles.deleteModalOverlay}>
          <Card style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Delete Account</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{accountToDelete?.name}"? This
              action cannot be undone.
            </Text>
            <View style={styles.deleteModalActions}>
              <Button
                title="Cancel"
                onPress={() => setDeleteAccountDialogOpen(false)}
                variant="outline"
                style={styles.deleteModalButton}
              />
              <Button
                title="Delete"
                onPress={confirmDeleteAccount}
                loading={accountDeleting}
                variant="primary"
                style={[
                  styles.deleteModalButton,
                  { backgroundColor: theme.colors.error },
                ]}
              />
            </View>
          </Card>
        </View>
      </Modal>

      <Modal visible={deleteDebtDialogOpen} transparent animationType="fade">
        <View style={styles.deleteModalOverlay}>
          <Card style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Delete Debt</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{debtToDelete?.name}"? This
              action cannot be undone.
            </Text>
            <View style={styles.deleteModalActions}>
              <Button
                title="Cancel"
                onPress={() => setDeleteDebtDialogOpen(false)}
                variant="outline"
                style={styles.deleteModalButton}
              />
              <Button
                title="Delete"
                onPress={confirmDeleteDebt}
                loading={debtDeleting}
                variant="primary"
                style={[
                  styles.deleteModalButton,
                  { backgroundColor: theme.colors.error },
                ]}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Save Message */}
      {saveMessage ? (
        <View style={styles.saveMessageContainer}>
          <Text style={styles.saveMessage}>{saveMessage}</Text>
        </View>
      ) : null}
    </View>
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
      padding: theme.spacing.lg,
    },
    loadingCard: {
      padding: theme.spacing.xl,
      alignItems: 'center',
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
      paddingTop: theme.spacing.xl,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    summaryContainer: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    summaryCard: {
      padding: 0,
      overflow: 'hidden',
    },
    summaryGradient: {
      padding: theme.spacing.lg,
    },
    summaryContent: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryItem: {
      alignItems: 'center',
      flex: 1,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    tabContainer: {
      flexDirection: 'row',
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      marginLeft: theme.spacing.sm,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: theme.colors.surface,
    },
    content: {
      flex: 1,
    },
    section: {
      paddingHorizontal: theme.spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    emptyCard: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    emptyButton: {
      marginTop: theme.spacing.md,
    },
    itemCard: {
      marginBottom: theme.spacing.md,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    itemIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    itemContent: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    itemSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    itemActions: {
      flexDirection: 'row',
    },
    actionButton: {
      padding: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    itemDetails: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    modalContent: {
      flex: 1,
      padding: theme.spacing.lg,
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
    modalFooter: {
      flexDirection: 'row',
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    modalButton: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
    },
    deleteModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    deleteModal: {
      width: '100%',
      maxWidth: 400,
      padding: theme.spacing.lg,
    },
    deleteModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    deleteModalText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
    },
    deleteModalActions: {
      flexDirection: 'row',
    },
    deleteModalButton: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
    },
    saveMessageContainer: {
      position: 'absolute',
      top: 60,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      backgroundColor: theme.colors.success,
      padding: theme.spacing.md,
      borderRadius: 8,
      zIndex: 1000,
    },
    saveMessage: {
      color: theme.colors.surface,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

export default AccountsAndDebtsScreen;
