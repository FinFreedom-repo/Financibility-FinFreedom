import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import Chart from '../../components/common/Chart';
import wealthProjectionService, {
  WealthProjectionData,
  WealthProjectionPoint,

} from '../../services/wealthProjectionService';
import { useFocusEffect } from '@react-navigation/native';
import { formatCurrencyAbbreviated } from '../../utils/formatting';

const WealthProjectionScreen: React.FC = () => {
  const { theme } = useTheme();

  // State management
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [projectionData, setProjectionData] = useState<WealthProjectionPoint[]>(
    []
  );
  const [formData, setFormData] = useState<WealthProjectionData>(
    wealthProjectionService.getDefaultData()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    loadSavedSettings();
  }, []);

  // Refetch saved settings when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadSavedSettings();
    }, [])
  );

  const loadSavedSettings = async () => {
    try {
      setLoading(true);
      const savedSettings = await wealthProjectionService.getSavedSettings();
      if (savedSettings) {
        const sanitizedSettings =
          wealthProjectionService.sanitizeData(savedSettings);
        setFormData(sanitizedSettings);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load saved settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof WealthProjectionData,
    value: string
  ) => {
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numericValue }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getFormValue = (field: keyof WealthProjectionData): string => {
    const value = formData[field];
    return value !== undefined && value !== null && !isNaN(value)
      ? value.toString()
      : '0';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.age < 18 || formData.age > 100) {
      newErrors.age = 'Age must be between 18 and 100';
    }

    if (formData.maxAge <= formData.age) {
      newErrors.maxAge = 'Max age must be greater than current age';
    }

    if (formData.startWealth < 0) {
      newErrors.startWealth = 'Starting wealth cannot be negative';
    }

    if (formData.debt < 0) {
      newErrors.debt = 'Debt cannot be negative';
    }

    if (formData.annualContributions < 0) {
      newErrors.annualContributions = 'Annual contributions cannot be negative';
    }

    if (formData.assetInterest < 0 || formData.assetInterest > 50) {
      newErrors.assetInterest =
        'Asset interest rate must be between 0% and 50%';
    }

    if (formData.debtInterest < 0 || formData.debtInterest > 50) {
      newErrors.debtInterest = 'Debt interest rate must be between 0% and 50%';
    }

    if (formData.inflation < 0 || formData.inflation > 20) {
      newErrors.inflation = 'Inflation rate must be between 0% and 20%';
    }

    if (formData.taxRate < 0 || formData.taxRate > 50) {
      newErrors.taxRate = 'Tax rate must be between 0% and 50%';
    }

    if (formData.checkingInterest < 0 || formData.checkingInterest > 20) {
      newErrors.checkingInterest =
        'Checking interest rate must be between 0% and 20%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateProjection = async () => {
    if (!validateForm()) {
      setErrorMessage('Please fix the validation errors before calculating');
      return;
    }

    try {
      setLoading(true);
      console.log('💰 Calculating wealth projection...');

      const response =
        await wealthProjectionService.calculateWealthProjection(formData);

      if (response && response.projections) {
        console.log(
          '💰 Setting projection data:',
          response.projections.length,
          'points'
        );
        setProjectionData(response.projections);
        setShowChart(true);
        setShowSummary(true);
        setSuccessMessage('Wealth projection calculated successfully!');
        console.log('💰 Projection calculated successfully');
      } else {
        console.log('💰 Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('💰 Error calculating projection:', error);
      setErrorMessage(
        'Failed to calculate wealth projection. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const importFinancialData = async () => {
    try {
      setLoading(true);
      const importedData = await wealthProjectionService.importFinancialData();

      if (importedData) {
        const sanitizedData =
          wealthProjectionService.sanitizeData(importedData);
        setFormData(prev => ({ ...prev, ...sanitizedData }));
        setSuccessMessage('Financial data imported successfully!');
        console.log('💰 Financial data imported:', sanitizedData);
      } else {
        setErrorMessage('No financial data found to import');
      }
    } catch (error) {
      console.error('💰 Error importing financial data:', error);
      setErrorMessage('Failed to import financial data');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const success = await wealthProjectionService.saveSettings(formData);
      if (success) {
        setSuccessMessage('Settings saved successfully!');
      } else {
        setErrorMessage('Failed to save settings');
      }
    } catch (error) {
      console.error('💰 Error saving settings:', error);
      setErrorMessage('Failed to save settings');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedSettings();
    setRefreshing(false);
  };

  // Chart data preparation
  const chartData = useMemo(() => {
    console.log(
      '💰 Preparing chart data, projectionData length:',
      projectionData?.length
    );
    if (!projectionData || projectionData.length === 0) return null;

    try {
      // Filter data to match 10-year intervals first
      const startAge = projectionData[0]?.age || 0;
      const endAge = projectionData[projectionData.length - 1]?.age || 0;

      const filteredData = projectionData.filter(item => {
        const age = item.age;
        return age % 10 === 0 || age === startAge || age === endAge;
      });

      // Create labels from the filtered data
      const labels = filteredData.map(item => item.age.toString());

      console.log(
        '💰 Filtered data length:',
        filteredData.length,
        'Labels length:',
        labels.length
      );
      console.log('💰 Chart labels prepared:', labels);

      // Calculate Net Worth for each scenario with safety checks
      const netWorthData = filteredData.map(
        item => (item.scenario_1 || 0) - (item.debt_line || 0)
      );
      const netWorthInflAdjData = filteredData.map(
        item => (item.scenario_2 || 0) - (item.debt_line || 0)
      );
      const netWorthCheckingData = filteredData.map(
        item => (item.scenario_3 || 0) - (item.debt_line || 0)
      );
      const netWorthCheckingInflAdjData = filteredData.map(
        item => (item.scenario_4 || 0) - (item.debt_line || 0)
      );
      const assetsData = filteredData.map(item => item.scenario_1 || 0);
      const debtData = filteredData.map(item => item.debt_line || 0);

      // Validate that all data arrays have the same length as filtered data
      const dataLength = filteredData.length;
      const allDataArrays = [
        netWorthData,
        netWorthInflAdjData,
        netWorthCheckingData,
        netWorthCheckingInflAdjData,
        assetsData,
        debtData,
      ];

      console.log(
        '💰 Data validation - Labels:',
        labels.length,
        'Filtered data:',
        dataLength,
        'Arrays:',
        allDataArrays.map(arr => arr.length)
      );

      const isValidData = allDataArrays.every(
        dataArray => dataArray.length === dataLength
      );

      if (!isValidData) {
        console.error(
          '💰 Chart data validation failed: data arrays have different lengths'
        );
        console.error(
          '💰 Expected length:',
          dataLength,
          'Actual lengths:',
          allDataArrays.map(arr => arr.length)
        );
        return null;
      }

      return {
        labels,
        datasets: [
          {
            label: 'Assets',
            data: assetsData,
            color: '#800080', // Purple - matches website
            fill: false,
          },
          {
            label: 'Debt',
            data: debtData,
            color: '#FF1493', // Deep Pink - matches website
            fill: false,
          },
          {
            label: 'Net Worth (Investment)',
            data: netWorthData,
            color: '#2196F3', // Blue
            fill: false,
          },
          {
            label: 'Net Worth (Investment + Inflation)',
            data: netWorthInflAdjData,
            color: '#FF9800', // Orange
            fill: false,
          },
          {
            label: 'Net Worth (Checking)',
            data: netWorthCheckingData,
            color: '#4CAF50', // Green
            fill: false,
          },
          {
            label: 'Net Worth (Checking + Inflation)',
            data: netWorthCheckingInflAdjData,
            color: '#00BCD4', // Cyan
            fill: false,
          },
        ],
      };
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return null;
    }
  }, [projectionData, theme.colors]);

  const styles = createStyles(theme);
  console.log('💰 Theme colors:', theme.colors);

  if (loading && !refreshing) {
    return <Loading />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wealth Projection</Text>
        <Text style={styles.subtitle}>
          See your financial future with AI-powered projections
        </Text>
      </View>

      {/* Success/Error Messages */}
      {successMessage ? (
        <View style={[styles.messageContainer, styles.successMessage]}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.success}
          />
          <Text style={[styles.messageText, { color: theme.colors.success }]}>
            {successMessage}
          </Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={[styles.messageContainer, styles.errorMessage]}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={[styles.messageText, { color: theme.colors.error }]}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Chart Display - At Top */}
      {showChart && (
        <Card style={styles.chartCard}>
          <Text style={styles.cardTitle}>Wealth Projection Chart</Text>
          {chartData && chartData.labels && chartData.labels.length > 0 ? (
            <View style={styles.chartContainer}>
              <Chart
                key={`chart-${chartData?.labels?.length || 0}`}
                data={chartData}
                type="line"
                height={300}
                showLegend={true}
                showGrid={true}
                yAxisLabel="Value ($)"
                xAxisLabel="Age (years)"
                formatYLabel={formatCurrencyAbbreviated}
              />
            </View>
          ) : (
            <View style={styles.chartContainer}>
              <Text style={styles.placeholderText}>
                Chart data is being prepared...
              </Text>
            </View>
          )}

          {/* Projection Summary */}
          {showSummary && projectionData.length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>📊 Projection Summary</Text>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>Final Age</Text>
                  <Text style={styles.summaryCardValue}>
                    {projectionData[projectionData.length - 1].age} years
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>Investment Growth</Text>
                  <Text style={styles.summaryCardValue}>
                    {wealthProjectionService.formatCurrency(
                      projectionData[projectionData.length - 1].scenario_1 -
                        projectionData[projectionData.length - 1].debt_line
                    )}
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>Checking Growth</Text>
                  <Text style={styles.summaryCardValue}>
                    {wealthProjectionService.formatCurrency(
                      projectionData[projectionData.length - 1].scenario_3 -
                        projectionData[projectionData.length - 1].debt_line
                    )}
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>Total Assets</Text>
                  <Text style={styles.summaryCardValue}>
                    {wealthProjectionService.formatCurrency(
                      projectionData[projectionData.length - 1].scenario_1
                    )}
                  </Text>
                </View>
              </View>

              {/* Key Insights */}
              <View style={styles.insightsContainer}>
                <Text style={styles.insightsTitle}>💡 Key Insights</Text>

                <View style={styles.insightItem}>
                  <Ionicons
                    name="trending-up"
                    size={16}
                    color={theme.colors.success}
                  />
                  <Text style={styles.insightText}>
                    Your wealth could grow by{' '}
                    {wealthProjectionService.formatCurrency(
                      projectionData[projectionData.length - 1].scenario_1 -
                        projectionData[0].scenario_1
                    )}{' '}
                    over {projectionData.length - 1} years
                  </Text>
                </View>

                <View style={styles.insightItem}>
                  <Ionicons
                    name="calculator"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.insightText}>
                    Annual contribution of{' '}
                    {wealthProjectionService.formatCurrency(
                      formData.annualContributions || 0
                    )}
                    at {formData.assetInterest || 0}% return
                  </Text>
                </View>

                {(formData.debt || 0) > 0 && (
                  <View style={styles.insightItem}>
                    <Ionicons
                      name="card"
                      size={16}
                      color={theme.colors.error}
                    />
                    <Text style={styles.insightText}>
                      Debt of{' '}
                      {wealthProjectionService.formatCurrency(
                        formData.debt || 0
                      )}{' '}
                      at {formData.debtInterest || 0}% interest
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Input Form */}
      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>Projection Parameters</Text>

        {/* Basic Parameters */}
        <View style={styles.inputGroup}>
          <Input
            label="Current Age"
            value={getFormValue('age')}
            onChangeText={text => handleInputChange('age', text)}
            keyboardType="numeric"
            error={errors.age}
            leftIcon="person"
          />

          <Input
            label="Max Age"
            value={getFormValue('maxAge')}
            onChangeText={text => handleInputChange('maxAge', text)}
            keyboardType="numeric"
            error={errors.maxAge}
            leftIcon="time"
          />

          <Input
            label="Starting Wealth ($)"
            value={getFormValue('startWealth')}
            onChangeText={text => handleInputChange('startWealth', text)}
            keyboardType="numeric"
            error={errors.startWealth}
            leftIcon="wallet"
          />

          <Input
            label="Total Debt ($)"
            value={getFormValue('debt')}
            onChangeText={text => handleInputChange('debt', text)}
            keyboardType="numeric"
            error={errors.debt}
            leftIcon="card"
          />

          <Input
            label="Annual Contributions ($)"
            value={getFormValue('annualContributions')}
            onChangeText={text =>
              handleInputChange('annualContributions', text)
            }
            keyboardType="numeric"
            error={errors.annualContributions}
            leftIcon="add-circle"
          />
        </View>

        {/* Advanced Parameters Toggle */}
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? 'Hide' : 'Show'} Advanced Parameters
          </Text>
          <Ionicons
            name={showAdvanced ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {/* Advanced Parameters */}
        {showAdvanced && (
          <View style={styles.inputGroup}>
            <Input
              label="Asset Interest Rate (%)"
              value={getFormValue('assetInterest')}
              onChangeText={text => handleInputChange('assetInterest', text)}
              keyboardType="numeric"
              error={errors.assetInterest}
              leftIcon="trending-up"
            />

            <Input
              label="Debt Interest Rate (%)"
              value={getFormValue('debtInterest')}
              onChangeText={text => handleInputChange('debtInterest', text)}
              keyboardType="numeric"
              error={errors.debtInterest}
              leftIcon="trending-down"
            />

            <Input
              label="Inflation Rate (%)"
              value={getFormValue('inflation')}
              onChangeText={text => handleInputChange('inflation', text)}
              keyboardType="numeric"
              error={errors.inflation}
              leftIcon="pulse"
            />

            <Input
              label="Tax Rate (%)"
              value={getFormValue('taxRate')}
              onChangeText={text => handleInputChange('taxRate', text)}
              keyboardType="numeric"
              error={errors.taxRate}
              leftIcon="calculator"
            />

            <Input
              label="Checking Interest Rate (%)"
              value={getFormValue('checkingInterest')}
              onChangeText={text => handleInputChange('checkingInterest', text)}
              keyboardType="numeric"
              error={errors.checkingInterest}
              leftIcon="card"
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <Button
            title="Import Financial Data"
            onPress={importFinancialData}
            variant="outline"
            style={[styles.button]}
            icon="download"
          />

          <Button
            title="Save Settings"
            onPress={saveSettings}
            variant="outline"
            style={[styles.button]}
            icon="save"
          />

          <Button
            title="Calculate Projection"
            onPress={calculateProjection}
            variant="primary"
            style={[styles.button]}
            icon="calculator"
            loading={loading}
          />
        </View>
      </Card>
    </ScrollView>
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
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    messageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      margin: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    successMessage: {
      backgroundColor: theme.colors.success + '20',
    },
    errorMessage: {
      backgroundColor: theme.colors.error + '20',
    },
    messageText: {
      marginLeft: theme.spacing.sm,
      fontSize: 14,
      fontWeight: '500',
    },
    formCard: {
      margin: theme.spacing.md,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    inputGroup: {
      marginBottom: theme.spacing.lg,
    },
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    advancedToggleText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    buttonGroup: {
      gap: theme.spacing.md,
    },
    button: {
      marginBottom: theme.spacing.sm,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      color: theme.colors.text,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    chartCard: {
      margin: theme.spacing.md,
    },
    chartContainer: {
      marginBottom: theme.spacing.lg,
    },
    summaryContainer: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    summaryCard: {
      width: '48%',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      alignItems: 'center',
    },
    summaryCardTitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    summaryCardValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    insightsContainer: {
      marginTop: theme.spacing.md,
    },
    insightsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    insightItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    insightText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.sm,
      flex: 1,
      lineHeight: 20,
    },
    placeholderText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      padding: theme.spacing.lg,
    },
  });

export default WealthProjectionScreen;
