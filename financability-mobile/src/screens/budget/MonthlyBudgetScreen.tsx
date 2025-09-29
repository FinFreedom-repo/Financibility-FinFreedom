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
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import budgetService, { Budget, BudgetItem, BudgetExpenses, CreateBudgetData, BudgetSummary } from '../../services/budgetService';

const { width, height } = Dimensions.get('window');

type TabType = 'overview' | 'income' | 'expenses' | 'savings' | 'stats';

const MonthlyBudgetScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    income: '',
    additional_income: ''
  });
  
  const [expenses, setExpenses] = useState<BudgetExpenses>({
    housing: 0,
    transportation: 0,
    food: 0,
    healthcare: 0,
    entertainment: 0,
    shopping: 0,
    travel: 0,
    education: 0,
    utilities: 0,
    childcare: 0,
    debt_payments: 0,
    others: 0
  });
  
  const [additionalIncomeItems, setAdditionalIncomeItems] = useState<BudgetItem[]>([]);
  const [additionalExpenses, setAdditionalExpenses] = useState<BudgetItem[]>([]);
  const [savingsItems, setSavingsItems] = useState<BudgetItem[]>([]);
  
  // Modal states
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddSavingsModal, setShowAddSavingsModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', amount: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<'income' | 'expense' | 'savings' | null>(null);
  
  // Savings modal states
  const [selectedSavingsOption, setSelectedSavingsOption] = useState<string>('');
  const [customSavingsName, setCustomSavingsName] = useState<string>('');
  const [showCustomSavingsInput, setShowCustomSavingsInput] = useState<boolean>(false);
  
  // Success message
  const [successMessage, setSuccessMessage] = useState('');
  
  // Get styles
  const styles = createStyles(theme);
  
  // Get current month/year
  const { month, year } = budgetService.getCurrentMonthYear();
  const monthName = budgetService.getMonthName(month);
  
  // Get expense categories
  const expenseCategories = budgetService.getExpenseCategories();
  const savingsOptions = budgetService.getSavingsOptions();

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      console.log(`🔄 Loading budget data for ${month}/${year}...`);
      const budget = await budgetService.getMonthBudget(month, year);
      console.log('📊 Loaded budget:', budget);
      
      if (budget) {
        console.log('📊 Budget found, setting state...');
        console.log('📊 Budget income:', budget.income);
        console.log('📊 Budget expenses:', budget.expenses);
        console.log('📊 Budget additional_income_items:', budget.additional_income_items);
        console.log('📊 Budget additional_items:', budget.additional_items);
        console.log('📊 Budget savings_items:', budget.savings_items);
        
        setCurrentBudget(budget);
        setFormData({
          income: budget.income.toString(),
          additional_income: budget.additional_income.toString()
        });
        setExpenses(budget.expenses);
        setAdditionalIncomeItems(budget.additional_income_items);
        setAdditionalExpenses(budget.additional_items);
        setSavingsItems(budget.savings_items);
        
        // Calculate summary
        const summary = budgetService.calculateBudgetSummary(budget);
        setBudgetSummary(summary);
        console.log('📊 Budget summary calculated:', summary);
      } else {
        console.log('📊 No budget found, initializing with empty values...');
        // Initialize with empty values
        setFormData({ income: '', additional_income: '' });
        setExpenses({
          housing: 0, transportation: 0, food: 0, healthcare: 0,
          entertainment: 0, shopping: 0, travel: 0, education: 0,
          utilities: 0, childcare: 0, debt_payments: 0, others: 0
        });
        setAdditionalIncomeItems([]);
        setAdditionalExpenses([]);
        setSavingsItems([]);
        setCurrentBudget(null);
        setBudgetSummary(null);
      }
    } catch (error) {
      console.error('❌ Error loading budget data:', error);
      Alert.alert('Error', 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBudgetData();
    setRefreshing(false);
  }, []);

  const saveBudget = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving budget...');
      
      const budgetData: CreateBudgetData = {
        month,
        year,
        income: parseFloat(formData.income) || 0,
        additional_income: parseFloat(formData.additional_income) || 0, // Keep this for backend compatibility
        additional_income_items: additionalIncomeItems,
        expenses,
        additional_items: additionalExpenses,
        savings_items: savingsItems,
        manually_edited_categories: []
      };
      
      console.log('💾 Budget data to save:', budgetData);
      console.log('💾 Current budget exists:', !!currentBudget);
      console.log('💾 Current budget ID:', currentBudget?._id);
      
      let savedBudget: Budget;
      if (currentBudget && currentBudget._id) {
        console.log('💾 Updating existing budget with ID:', currentBudget._id);
        savedBudget = await budgetService.updateBudget(currentBudget._id, budgetData);
      } else {
        console.log('💾 Creating new budget...');
        savedBudget = await budgetService.saveMonthBudget(budgetData);
      }
      
      console.log('✅ Budget saved successfully:', savedBudget);
      console.log('✅ Saved budget ID:', savedBudget._id);
      console.log('✅ Saved budget income:', savedBudget.income);
      console.log('✅ Saved budget expenses:', savedBudget.expenses);
      console.log('✅ Saved budget additional_income_items:', savedBudget.additional_income_items);
      console.log('✅ Saved budget additional_items:', savedBudget.additional_items);
      console.log('✅ Saved budget savings_items:', savedBudget.savings_items);
      
      setCurrentBudget(savedBudget);
      const summary = budgetService.calculateBudgetSummary(savedBudget);
      setBudgetSummary(summary);
      
      setSuccessMessage('Budget saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reload data to verify persistence
      console.log('🔄 Reloading budget data to verify persistence...');
      setTimeout(async () => {
        await loadBudgetData();
      }, 1000);
    } catch (error) {
      console.error('❌ Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleIncomeChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExpenseChange = (category: keyof BudgetExpenses, value: string) => {
    setExpenses(prev => ({ ...prev, [category]: parseFloat(value) || 0 }));
  };

  const addItem = (type: 'income' | 'expense' | 'savings') => {
    if (type === 'savings') {
      // Handle savings with predefined options
      if (!selectedSavingsOption && !customSavingsName.trim()) {
        Alert.alert('Error', 'Please select a savings option or enter a custom name');
        return;
      }
      
      if (!newItem.amount.trim()) {
        Alert.alert('Error', 'Please enter an amount');
        return;
      }
      
      const itemName = showCustomSavingsInput ? customSavingsName.trim() : selectedSavingsOption;
      const item: BudgetItem = {
        name: itemName,
        amount: parseFloat(newItem.amount) || 0
      };
      
      if (editingIndex !== null && editingType === type) {
        // Update existing item
        const updated = [...savingsItems];
        updated[editingIndex] = item;
        setSavingsItems(updated);
      } else {
        // Add new item
        setSavingsItems(prev => [...prev, item]);
      }
      
      // Reset savings modal states
      setSelectedSavingsOption('');
      setCustomSavingsName('');
      setShowCustomSavingsInput(false);
    } else {
      // Handle income and expense (existing logic)
      if (!newItem.name.trim() || !newItem.amount.trim()) {
        Alert.alert('Error', 'Please fill in both name and amount');
        return;
      }
      
      const item: BudgetItem = {
        name: newItem.name.trim(),
        amount: parseFloat(newItem.amount) || 0
      };
      
      if (editingIndex !== null && editingType === type) {
        // Update existing item
        if (type === 'income') {
          const updated = [...additionalIncomeItems];
          updated[editingIndex] = item;
          setAdditionalIncomeItems(updated);
        } else if (type === 'expense') {
          const updated = [...additionalExpenses];
          updated[editingIndex] = item;
          setAdditionalExpenses(updated);
        }
      } else {
        // Add new item
        if (type === 'income') {
          setAdditionalIncomeItems(prev => [...prev, item]);
        } else if (type === 'expense') {
          setAdditionalExpenses(prev => [...prev, item]);
        }
      }
    }
    
    setNewItem({ name: '', amount: '' });
    setEditingIndex(null);
    setEditingType(null);
    closeModal();
  };

  const editItem = (index: number, type: 'income' | 'expense' | 'savings') => {
    let item: BudgetItem;
    if (type === 'income') {
      item = additionalIncomeItems[index];
    } else if (type === 'expense') {
      item = additionalExpenses[index];
    } else {
      item = savingsItems[index];
    }
    
    setNewItem({ name: item.name, amount: item.amount.toString() });
    setEditingIndex(index);
    setEditingType(type);
    
    if (type === 'income') setShowAddIncomeModal(true);
    else if (type === 'expense') setShowAddExpenseModal(true);
    else setShowAddSavingsModal(true);
  };

  const deleteItem = (index: number, type: 'income' | 'expense' | 'savings') => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (type === 'income') {
              setAdditionalIncomeItems(prev => prev.filter((_, i) => i !== index));
            } else if (type === 'expense') {
              setAdditionalExpenses(prev => prev.filter((_, i) => i !== index));
            } else if (type === 'savings') {
              setSavingsItems(prev => prev.filter((_, i) => i !== index));
            }
          }
        }
      ]
    );
  };

  const closeModal = () => {
    setShowAddIncomeModal(false);
    setShowAddExpenseModal(false);
    setShowAddSavingsModal(false);
    setNewItem({ name: '', amount: '' });
    setEditingIndex(null);
    setEditingType(null);
    
    // Reset savings modal states
    setSelectedSavingsOption('');
    setCustomSavingsName('');
    setShowCustomSavingsInput(false);
  };

  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tabButton,
        {
          backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.surface,
          borderColor: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary,
        }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === tab ? '#fff' : theme.colors.text} 
      />
      <Text style={[
        styles.tabButtonText,
        { color: activeTab === tab ? '#fff' : theme.colors.text }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => {
    if (!budgetSummary) {
      return (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="calculator" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Budget Data</Text>
            <Text style={styles.emptyDescription}>
              Start by adding your income and expenses to see your financial overview.
            </Text>
          </View>
        </Card>
      );
    }

    return (
      <View style={styles.overviewContainer}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={[styles.summaryCard, { backgroundColor: '#2E7D32' }]}>
            <View style={styles.summaryContent}>
              <Ionicons name="trending-up" size={24} color="#fff" />
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={styles.summaryValue}>
                ${budgetSummary.totalIncome.toLocaleString()}
              </Text>
            </View>
          </Card>
          
          <Card style={[styles.summaryCard, { backgroundColor: '#D32F2F' }]}>
            <View style={styles.summaryContent}>
              <Ionicons name="trending-down" size={24} color="#fff" />
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryValue}>
                ${budgetSummary.totalExpenses.toLocaleString()}
              </Text>
            </View>
          </Card>
          
          <Card style={[styles.summaryCard, { backgroundColor: '#1976D2' }]}>
            <View style={styles.summaryContent}>
              <Ionicons name="wallet" size={24} color="#fff" />
              <Text style={styles.summaryLabel}>Total Savings</Text>
              <Text style={styles.summaryValue}>
                ${budgetSummary.totalSavings.toLocaleString()}
              </Text>
            </View>
          </Card>
          
          <Card style={[
            styles.summaryCard, 
            { backgroundColor: budgetSummary.netBalance >= 0 ? '#FF9800' : '#F44336' }
          ]}>
            <View style={styles.summaryContent}>
              <Ionicons 
                name={budgetSummary.netBalance >= 0 ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color="#fff" 
              />
              <Text style={styles.summaryLabel}>Net Balance</Text>
              <Text style={styles.summaryValue}>
                ${budgetSummary.netBalance.toLocaleString()}
              </Text>
            </View>
          </Card>
        </View>

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Fixed Expenses</Text>
              <Text style={styles.statValue}>
                ${budgetSummary.totalFixedExpenses.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Additional Expenses</Text>
              <Text style={styles.statValue}>
                ${budgetSummary.totalAdditionalExpenses.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Savings Rate</Text>
              <Text style={styles.statValue}>
                {budgetSummary.totalIncome > 0 
                  ? ((budgetSummary.totalSavings / budgetSummary.totalIncome) * 100).toFixed(1) + '%'
                  : '0%'
                }
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Expense Rate</Text>
              <Text style={styles.statValue}>
                {budgetSummary.totalIncome > 0 
                  ? ((budgetSummary.totalExpenses / budgetSummary.totalIncome) * 100).toFixed(1) + '%'
                  : '0%'
                }
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  const renderIncomeTab = () => (
    <View style={styles.tabContainer}>
      {/* Primary Income */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Primary Income</Text>
        <Input
          label="Monthly Income"
          value={formData.income}
          onChangeText={(text) => handleIncomeChange('income', text)}
          placeholder="0.00"
          keyboardType="numeric"
          leftIcon="cash"
        />
      </Card>

      {/* Additional Income Items */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Additional Income</Text>
          <Button
            title="Add"
            onPress={() => setShowAddIncomeModal(true)}
            icon="add"
            style={styles.compactButton}
          />
        </View>
        
        {additionalIncomeItems.length === 0 ? (
          <View style={styles.emptyList}>
            <Ionicons name="receipt" size={32} color={theme.colors.textSecondary} />
            <Text style={styles.emptyListText}>No additional income sources</Text>
          </View>
        ) : (
          additionalIncomeItems.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>{item.name}</Text>
                <Text style={styles.listItemAmount}>${item.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity
                  onPress={() => editItem(index, 'income')}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteItem(index, 'income')}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={16} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </Card>
    </View>
  );

  const renderExpensesTab = () => (
    <View style={styles.tabContainer}>
      {/* Fixed Expenses */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Fixed Expenses</Text>
        <View style={styles.expensesGrid}>
          {Object.entries(expenseCategories).map(([key, category]) => (
            <View key={key} style={styles.expenseItem}>
              <View style={styles.expenseHeader}>
                <View style={[styles.expenseIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon as any} size={20} color={category.color} />
                </View>
                <Text style={styles.expenseLabel}>{category.label}</Text>
              </View>
              <Input
                label=""
                value={expenses[key as keyof BudgetExpenses].toString()}
                onChangeText={(text) => handleExpenseChange(key as keyof BudgetExpenses, text)}
                placeholder="0.00"
                keyboardType="numeric"
                style={styles.expenseInput}
              />
            </View>
          ))}
        </View>
      </Card>

      {/* Additional Expenses */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Additional Expenses</Text>
          <Button
            title="Add"
            onPress={() => setShowAddExpenseModal(true)}
            icon="add"
            style={styles.compactButton}
          />
        </View>
        
        {additionalExpenses.length === 0 ? (
          <View style={styles.emptyList}>
            <Ionicons name="receipt" size={32} color={theme.colors.textSecondary} />
            <Text style={styles.emptyListText}>No additional expenses</Text>
          </View>
        ) : (
          additionalExpenses.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>{item.name}</Text>
                <Text style={styles.listItemAmount}>${item.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity
                  onPress={() => editItem(index, 'expense')}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteItem(index, 'expense')}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={16} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </Card>
    </View>
  );

  const renderSavingsTab = () => (
    <View style={styles.tabContainer}>
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <Button
            title="Add"
            onPress={() => setShowAddSavingsModal(true)}
            icon="add"
            style={styles.compactButton}
          />
        </View>
        
        {savingsItems.length === 0 ? (
          <View style={styles.emptyList}>
            <Ionicons name="wallet" size={32} color={theme.colors.textSecondary} />
            <Text style={styles.emptyListText}>No savings goals set</Text>
          </View>
        ) : (
          savingsItems.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>{item.name}</Text>
                <Text style={styles.listItemAmount}>${item.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity
                  onPress={() => editItem(index, 'savings')}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteItem(index, 'savings')}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={16} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </Card>
    </View>
  );

  const renderStatsTab = () => {
    if (!budgetSummary) {
      return (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="bar-chart" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptyDescription}>
              Add income and expenses to see detailed statistics.
            </Text>
          </View>
        </Card>
      );
    }

    // Prepare data for charts
    const expenseCategories = Object.entries(expenses).map(([key, value]) => ({
      name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value || 0,
      color: getExpenseColor(key)
    })).filter(item => item.value > 0);

    const pieData = [
      { name: 'Income', value: budgetSummary.totalIncome, color: '#2E7D32' },
      { name: 'Expenses', value: budgetSummary.totalExpenses, color: '#D32F2F' },
      { name: 'Savings', value: budgetSummary.totalSavings, color: '#1976D2' }
    ].filter(item => item.value > 0);

    const barData = [
      { category: 'Income', amount: budgetSummary.totalIncome, color: '#2E7D32' },
      { category: 'Expenses', amount: budgetSummary.totalExpenses, color: '#D32F2F' },
      { category: 'Savings', amount: budgetSummary.totalSavings, color: '#1976D2' }
    ];

    const chartConfig = {
      backgroundColor: theme.colors.surface,
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => isDark 
        ? `rgba(255, 255, 255, ${opacity})` 
        : `rgba(0, 0, 0, ${opacity})`,
      labelColor: (opacity = 1) => isDark 
        ? `rgba(255, 255, 255, ${opacity})` 
        : `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#ffa726"
      },
      barPercentage: 0.7,
      fillShadowGradient: '#2E7D32',
      fillShadowGradientOpacity: 0.8,
      propsForLabels: {
        fontSize: 12,
        fill: isDark ? '#ffffff' : '#000000',
        fontWeight: '500'
      },
      propsForVerticalLabels: {
        fontSize: 12,
        fill: isDark ? '#ffffff' : '#000000',
        fontWeight: '500'
      },
      propsForHorizontalLabels: {
        fontSize: 12,
        fill: isDark ? '#ffffff' : '#000000',
        fontWeight: '500'
      },
      formatYLabel: (value: any) => `$${value}`,
      formatXLabel: (value: any) => value
    };

    const barChartData = {
      labels: ['Income', 'Expenses', 'Savings'],
      datasets: [{
        data: [
          budgetSummary.totalIncome,
          budgetSummary.totalExpenses,
          budgetSummary.totalSavings
        ],
        colors: [
          (opacity = 1) => `rgba(46, 125, 50, ${opacity})`, // Green for Income
          (opacity = 1) => `rgba(211, 47, 47, ${opacity})`, // Red for Expenses
          (opacity = 1) => `rgba(25, 118, 210, ${opacity})`  // Blue for Savings
        ]
      }]
    };

    return (
      <View style={styles.statsContainer}>
        {/* Financial Overview Bar Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Financial Overview</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={barChartData}
              width={width - 80}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars={true}
              fromZero={true}
              segments={4}
              withInnerLines={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
            />
          </View>
          <View style={styles.barChartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2E7D32' }]} />
              <Text style={styles.legendText}>Income: ${budgetSummary.totalIncome.toLocaleString()}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#D32F2F' }]} />
              <Text style={styles.legendText}>Expenses: ${budgetSummary.totalExpenses.toLocaleString()}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#1976D2' }]} />
              <Text style={styles.legendText}>Savings: ${budgetSummary.totalSavings.toLocaleString()}</Text>
            </View>
          </View>
        </Card>

        {/* Expense Breakdown Pie Chart */}
        {expenseCategories.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Expense Breakdown</Text>
            <View style={styles.pieChartContainer}>
              <PieChart
                data={expenseCategories}
                width={width - 80}
                height={220}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 10]}
                absolute
                hasLegend={false}
              />
            </View>
            <View style={styles.pieChartLegend}>
              {expenseCategories.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.legendItem}
                  onPress={() => {
                    Alert.alert(
                      item.name,
                      `Amount: $${item.value.toLocaleString()}\nPercentage: ${((item.value / budgetSummary.totalExpenses) * 100).toFixed(1)}%`,
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>
                    {item.name}: ${item.value.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Income Distribution Pie Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Income Distribution</Text>
          <View style={styles.pieChartContainer}>
            <PieChart
              data={pieData}
              width={width - 80}
              height={220}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 10]}
              absolute
              hasLegend={false}
            />
          </View>
          <View style={styles.pieChartLegend}>
            {pieData.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.legendItem}
                onPress={() => {
                  const percentage = budgetSummary.totalIncome > 0 
                    ? ((item.value / budgetSummary.totalIncome) * 100).toFixed(1)
                    : '0';
                  Alert.alert(
                    item.name,
                    `Amount: $${item.value.toLocaleString()}\nPercentage: ${percentage}%`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>
                  {item.name}: ${item.value.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Financial Metrics */}
        <Card style={styles.metricsCard}>
          <Text style={styles.chartTitle}>Financial Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Savings Rate</Text>
              <Text style={styles.metricValue}>
                {budgetSummary.totalIncome > 0 
                  ? ((budgetSummary.totalSavings / budgetSummary.totalIncome) * 100).toFixed(1) + '%'
                  : '0%'
                }
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Expense Rate</Text>
              <Text style={styles.metricValue}>
                {budgetSummary.totalIncome > 0 
                  ? ((budgetSummary.totalExpenses / budgetSummary.totalIncome) * 100).toFixed(1) + '%'
                  : '0%'
                }
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Net Balance</Text>
              <Text style={[
                styles.metricValue,
                { color: budgetSummary.netBalance >= 0 ? '#2E7D32' : '#D32F2F' }
              ]}>
                ${budgetSummary.netBalance.toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Fixed Expenses</Text>
              <Text style={styles.metricValue}>
                ${budgetSummary.totalFixedExpenses.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  const getExpenseColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      housing: '#FF6B6B',
      transportation: '#4ECDC4',
      food: '#45B7D1',
      healthcare: '#96CEB4',
      entertainment: '#FFEAA7',
      shopping: '#DDA0DD',
      travel: '#98D8C8',
      education: '#F7DC6F',
      utilities: '#BB8FCE',
      childcare: '#85C1E9',
      debt_payments: '#F8C471',
      others: '#82E0AA'
    };
    return colors[category] || '#82E0AA';
  };

  const renderModal = () => {
    const isOpen = showAddIncomeModal || showAddExpenseModal || showAddSavingsModal;
    const type = showAddIncomeModal ? 'income' : showAddExpenseModal ? 'expense' : 'savings';
    const title = editingIndex !== null ? `Edit ${type}` : `Add ${type}`;
    const savingsOptions = budgetService.getSavingsOptions();
    
    return (
      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {type === 'savings' ? (
                <>
                  {/* Predefined Savings Options */}
                  <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                    Select Savings Type
                  </Text>
                  <View style={styles.savingsOptionsGrid}>
                    {savingsOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.savingsOption,
                          {
                            backgroundColor: selectedSavingsOption === option.name 
                              ? option.color + '20' 
                              : theme.colors.surface,
                            borderColor: selectedSavingsOption === option.name 
                              ? option.color 
                              : theme.colors.textSecondary,
                          }
                        ]}
                        onPress={() => {
                          setSelectedSavingsOption(option.name);
                          setShowCustomSavingsInput(false);
                          setCustomSavingsName('');
                        }}
                      >
                        <Ionicons 
                          name={option.icon as any} 
                          size={20} 
                          color={selectedSavingsOption === option.name ? option.color : theme.colors.textSecondary} 
                        />
                        <Text style={[
                          styles.savingsOptionText,
                          { 
                            color: selectedSavingsOption === option.name 
                              ? option.color 
                              : theme.colors.text 
                          }
                        ]}>
                          {option.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {/* Custom Savings Option */}
                  <TouchableOpacity
                    style={[
                      styles.customSavingsButton,
                      {
                        backgroundColor: showCustomSavingsInput 
                          ? theme.colors.primary + '20' 
                          : theme.colors.surface,
                        borderColor: showCustomSavingsInput 
                          ? theme.colors.primary 
                          : theme.colors.textSecondary,
                      }
                    ]}
                    onPress={() => {
                      setShowCustomSavingsInput(true);
                      setSelectedSavingsOption('');
                    }}
                  >
                    <Ionicons 
                      name="add-circle" 
                      size={20} 
                      color={showCustomSavingsInput ? theme.colors.primary : theme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.customSavingsText,
                      { 
                        color: showCustomSavingsInput ? theme.colors.primary : theme.colors.text 
                      }
                    ]}>
                      Custom Savings Name
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Custom Input */}
                  {showCustomSavingsInput && (
                    <Input
                      label="Custom Savings Name"
                      value={customSavingsName}
                      onChangeText={setCustomSavingsName}
                      placeholder="Enter custom savings name"
                      leftIcon="pencil"
                    />
                  )}
                </>
              ) : (
                <Input
                  label="Name"
                  value={newItem.name}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, name: text }))}
                  placeholder={`Enter ${type} name`}
                  leftIcon="pencil"
                />
              )}
              
              <Input
                label="Amount"
                value={newItem.amount}
                onChangeText={(text) => setNewItem(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                keyboardType="numeric"
                leftIcon="cash"
              />
            </View>
            
            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={closeModal}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={editingIndex !== null ? "Update" : "Add"}
                onPress={() => addItem(type)}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Card style={styles.loadingCard}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingTitle}>Loading your budget...</Text>
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loadingSpinner} />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Budget</Text>
        <Text style={styles.subtitle}>{monthName} {year}</Text>
        {successMessage ? (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {renderTabButton('overview', 'Overview', 'grid')}
          {renderTabButton('income', 'Income', 'cash')}
          {renderTabButton('expenses', 'Expenses', 'trending-down')}
          {renderTabButton('savings', 'Savings', 'wallet')}
          {renderTabButton('stats', 'Stats', 'bar-chart')}
        </ScrollView>
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
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'income' && renderIncomeTab()}
        {activeTab === 'expenses' && renderExpensesTab()}
        {activeTab === 'savings' && renderSavingsTab()}
        {activeTab === 'stats' && renderStatsTab()}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <LinearGradient
          colors={['#ff0000', '#0066ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.saveButton}
        >
          <Button
            title={saving ? "Saving..." : "Save Budget"}
            onPress={saveBudget}
            disabled={saving}
            style={styles.saveButtonInner}
            icon={saving ? undefined : "save"}
          />
        </LinearGradient>
      </View>

      {renderModal()}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  successText: {
    marginLeft: theme.spacing.xs,
    color: '#2E7D32',
    fontWeight: '600',
  },
  tabContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tabScroll: {
    paddingHorizontal: theme.spacing.xs,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
  },
  tabButtonText: {
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  overviewContainer: {
    paddingBottom: theme.spacing.xl,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 16,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  statsCard: {
    padding: theme.spacing.lg,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  compactButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingRight: 5,
    minWidth: 60,
  },
  expensesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  expenseItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  expenseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  expenseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  expenseInput: {
    marginTop: 0,
  },
  emptyList: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyListText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  listItemAmount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  listItemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  statsContainer: {
    paddingBottom: theme.spacing.xl,
  },
  breakdownChart: {
    marginTop: theme.spacing.md,
  },
  chartItem: {
    marginBottom: theme.spacing.md,
  },
  chartBar: {
    height: 20,
    borderRadius: 10,
    marginBottom: theme.spacing.xs,
  },
  chartLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  saveContainer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  saveButton: {
    borderRadius: 16,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonInner: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    padding: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  modalBody: {
    marginBottom: theme.spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  savingsOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  savingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    width: '48%',
    minHeight: 50,
  },
  savingsOptionText: {
    marginLeft: theme.spacing.xs,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  customSavingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  customSavingsText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingCard: {
    padding: theme.spacing.xl,
    borderRadius: 24,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  loadingSpinner: {
    marginTop: theme.spacing.md,
  },
  chartCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  barChartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  pieChartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.xs,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  metricsCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
});

export default MonthlyBudgetScreen;
