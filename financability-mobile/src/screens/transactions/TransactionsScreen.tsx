import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import apiClient from '../../services/api';
import { API_CONFIG } from '../../constants';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  account_id?: string;
  tags?: string[];
  notes?: string;
  receipt_photo?: string;
  location?: string;
  is_recurring?: boolean;
  split_with?: string[];
  merchant?: string;
}

const CATEGORIES = [
  'Dining & Food',
  'Groceries',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Subscriptions',
  'Income',
  'Other',
];

const CATEGORY_ICONS: { [key: string]: string } = {
  'Dining & Food': 'restaurant',
  'Groceries': 'cart',
  'Transportation': 'car',
  'Shopping': 'bag',
  'Entertainment': 'game-controller',
  'Bills & Utilities': 'receipt',
  'Healthcare': 'medical',
  'Travel': 'airplane',
  'Education': 'school',
  'Subscriptions': 'reload',
  'Income': 'cash',
  'Other': 'ellipsis-horizontal',
};

const TransactionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    notes: '',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  useEffect(() => {
    filterTransactions();
  }, [searchQuery, selectedCategory, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.TRANSACTIONS.LIST);
      if (response.data) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const addTransaction = async () => {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.TRANSACTIONS.CREATE,
        newTransaction
      );
      if (response.data) {
        Alert.alert('Success', 'Transaction added successfully');
        setShowAddModal(false);
        setNewTransaction({
          description: '',
          amount: 0,
          category: 'Other',
          date: new Date().toISOString().split('T')[0],
          tags: [],
          notes: '',
        });
        fetchTransactions();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.TRANSACTIONS.DELETE(id));
      Alert.alert('Success', 'Transaction deleted');
      fetchTransactions();
      setShowDetailModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setNewTransaction({
        ...newTransaction,
        receipt_photo: `data:image/jpeg;base64,${result.assets[0].base64}`,
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newTransaction.tags?.includes(tagInput.trim())) {
      setNewTransaction({
        ...newTransaction,
        tags: [...(newTransaction.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNewTransaction({
      ...newTransaction,
      tags: newTransaction.tags?.filter((t) => t !== tag),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(value));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const groupTransactionsByDate = () => {
    const grouped: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach((transaction) => {
      const dateKey = formatDate(transaction.date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    return grouped;
  };

  const getTotalSpending = () => {
    return filteredTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getTotalIncome = () => {
    return filteredTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const styles = createStyles(theme);
  const groupedTransactions = groupTransactionsByDate();

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary + 'DD']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={styles.statValue}>{formatCurrency(getTotalSpending())}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statValue}>{formatCurrency(getTotalIncome())}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions, merchants, tags..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Ionicons
              name={CATEGORY_ICONS[category] as any}
              size={16}
              color={
                selectedCategory === category
                  ? '#fff'
                  : theme.colors.textSecondary
              }
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transactions List */}
      <ScrollView
        style={styles.transactionsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.keys(groupedTransactions).map((dateKey) => (
          <View key={dateKey}>
            <Text style={styles.dateHeader}>{dateKey}</Text>
            {groupedTransactions[dateKey].map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onPress={() => {
                  setSelectedTransaction(transaction);
                  setShowDetailModal(true);
                }}
              >
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={CATEGORY_ICONS[transaction.category] as any}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <View style={styles.transactionMeta}>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                    {transaction.tags && transaction.tags.length > 0 && (
                      <View style={styles.tagContainer}>
                        <Ionicons name="pricetag" size={12} color={theme.colors.textSecondary} />
                        <Text style={styles.tagText}>{transaction.tags[0]}</Text>
                        {transaction.tags.length > 1 && (
                          <Text style={styles.tagText}>+{transaction.tags.length - 1}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.amount >= 0 ? '#4caf50' : theme.colors.text },
                  ]}
                >
                  {transaction.amount >= 0 ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {filteredTransactions.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyStateText}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || selectedCategory
                ? 'Try adjusting your filters'
                : 'Add your first transaction to get started'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primary + 'DD']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label="Description"
                value={newTransaction.description || ''}
                onChangeText={(text) =>
                  setNewTransaction({ ...newTransaction, description: text })
                }
                placeholder="e.g., Coffee at Starbucks"
              />

              <Input
                label="Amount"
                value={newTransaction.amount?.toString() || ''}
                onChangeText={(text) =>
                  setNewTransaction({ ...newTransaction, amount: parseFloat(text) || 0 })
                }
                keyboardType="numeric"
                placeholder="0.00"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categorySelectScroll}
              >
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categorySelectChip,
                      newTransaction.category === category &&
                        styles.categorySelectChipActive,
                    ]}
                    onPress={() =>
                      setNewTransaction({ ...newTransaction, category })
                    }
                  >
                    <Ionicons
                      name={CATEGORY_ICONS[category] as any}
                      size={16}
                      color={
                        newTransaction.category === category
                          ? '#fff'
                          : theme.colors.textSecondary
                      }
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.categorySelectChipText,
                        newTransaction.category === category &&
                          styles.categorySelectChipTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Input
                label="Notes (optional)"
                value={newTransaction.notes || ''}
                onChangeText={(text) =>
                  setNewTransaction({ ...newTransaction, notes: text })
                }
                placeholder="Add any additional notes..."
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add tag..."
                  placeholderTextColor={theme.colors.textSecondary}
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity style={styles.tagAddButton} onPress={addTag}>
                  <Ionicons name="add" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.tagsDisplay}>
                {newTransaction.tags?.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagLabel}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Ionicons name="close-circle" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Ionicons name="camera" size={24} color={theme.colors.primary} />
                <Text style={styles.photoButtonText}>
                  {newTransaction.receipt_photo ? 'Change Receipt Photo' : 'Add Receipt Photo'}
                </Text>
              </TouchableOpacity>

              {newTransaction.receipt_photo && (
                <Image
                  source={{ uri: newTransaction.receipt_photo }}
                  style={styles.receiptPreview}
                />
              )}

              <Button
                title="Add Transaction"
                onPress={addTransaction}
                style={styles.addButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.description}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      styles.detailAmount,
                      {
                        color:
                          selectedTransaction.amount >= 0 ? '#4caf50' : theme.colors.error,
                      },
                    ]}
                  >
                    {selectedTransaction.amount >= 0 ? '+' : '-'}
                    {formatCurrency(selectedTransaction.amount)}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <View style={styles.detailCategory}>
                    <Ionicons
                      name={CATEGORY_ICONS[selectedTransaction.category] as any}
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.detailValue}>{selectedTransaction.category}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTransaction.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Tags</Text>
                    <View style={styles.tagsDisplay}>
                      {selectedTransaction.tags.map((tag) => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagLabel}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedTransaction.notes && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.notes}</Text>
                  </View>
                )}

                {selectedTransaction.receipt_photo && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Receipt</Text>
                    <Image
                      source={{ uri: selectedTransaction.receipt_photo }}
                      style={styles.receiptImage}
                    />
                  </View>
                )}

                <Button
                  title="Delete Transaction"
                  onPress={() => {
                    Alert.alert(
                      'Delete Transaction',
                      'Are you sure you want to delete this transaction?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => deleteTransaction(selectedTransaction.id),
                        },
                      ]
                    );
                  }}
                  variant="outline"
                  style={styles.deleteButton}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl * 2,
      paddingBottom: theme.spacing.xl,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: theme.spacing.md,
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 12,
      padding: theme.spacing.md,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: '#fff',
      opacity: 0.9,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
    },
    statDivider: {
      width: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      marginHorizontal: theme.spacing.md,
    },
    searchContainer: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    categoryScroll: {
      maxHeight: 50,
    },
    categoryContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      marginRight: theme.spacing.sm,
    },
    categoryChipActive: {
      backgroundColor: theme.colors.primary,
    },
    categoryChipText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    categoryChipTextActive: {
      color: '#fff',
    },
    transactionsList: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    dateHeader: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    transactionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    transactionCategory: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.sm,
    },
    tagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    tagText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    transactionAmount: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    fab: {
      position: 'absolute',
      bottom: theme.spacing.xl,
      right: theme.spacing.lg,
      width: 64,
      height: 64,
      borderRadius: 32,
      overflow: 'hidden',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    fabGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl * 2,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: theme.spacing.md,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
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
    modalBody: {
      padding: theme.spacing.lg,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    categorySelectScroll: {
      marginBottom: theme.spacing.md,
    },
    categorySelectChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      marginRight: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    categorySelectChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categorySelectChipText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    categorySelectChipTextActive: {
      color: '#fff',
    },
    tagInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    tagInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      paddingVertical: theme.spacing.sm,
    },
    tagAddButton: {
      padding: theme.spacing.xs,
    },
    tagsDisplay: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: 16,
      gap: 4,
    },
    tagLabel: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    photoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    photoButtonText: {
      fontSize: 16,
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
      fontWeight: '600',
    },
    receiptPreview: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginBottom: theme.spacing.md,
    },
    addButton: {
      marginTop: theme.spacing.md,
    },
    detailItem: {
      marginBottom: theme.spacing.lg,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      textTransform: 'uppercase',
    },
    detailValue: {
      fontSize: 16,
      color: theme.colors.text,
    },
    detailAmount: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    detailCategory: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    receiptImage: {
      width: '100%',
      height: 300,
      borderRadius: 12,
      marginTop: theme.spacing.sm,
    },
    deleteButton: {
      marginTop: theme.spacing.lg,
    },
  });

export default TransactionsScreen;
