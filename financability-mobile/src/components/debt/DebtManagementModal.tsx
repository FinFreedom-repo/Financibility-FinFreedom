import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Debt } from '../../services/debtPlanningService';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';

interface DebtManagementModalProps {
  visible: boolean;
  debt: Debt | null;
  formData: {
    name: string;
    debt_type: string;
    balance: string;
    interest_rate: string;
    payoff_date: string;
  };
  onFormDataChange: (data: any) => void;
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
}

const DebtManagementModal: React.FC<DebtManagementModalProps> = ({
  visible,
  debt,
  formData,
  onFormDataChange,
  onClose,
  onSave,
  loading,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const debtTypes = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'student_loan', label: 'Student Loan' },
    { value: 'auto_loan', label: 'Auto Loan' },
    { value: 'personal_loan', label: 'Personal Loan' },
    { value: 'mortgage', label: 'Mortgage' },
    { value: 'home_equity', label: 'Home Equity' },
    { value: 'business_loan', label: 'Business Loan' },
    { value: 'other', label: 'Other' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Debt name is required';
    }

    if (!formData.balance.trim()) {
      newErrors.balance = 'Balance is required';
    } else {
      const balance = parseFloat(formData.balance);
      if (isNaN(balance) || balance <= 0) {
        newErrors.balance = 'Balance must be a positive number';
      }
    }

    if (!formData.interest_rate.trim()) {
      newErrors.interest_rate = 'Interest rate is required';
    } else {
      const rate = parseFloat(formData.interest_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.interest_rate = 'Interest rate must be between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {debt ? 'Edit Debt' : 'Add New Debt'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Debt Information</Text>
            
            <Input
              label="Debt Name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="e.g., Chase Credit Card"
              error={errors.name}
              style={styles.input}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Debt Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                {debtTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      formData.debt_type === type.value && styles.selectedTypeOption
                    ]}
                    onPress={() => handleInputChange('debt_type', type.value)}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      formData.debt_type === type.value && styles.selectedTypeOptionText
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Input
              label="Current Balance"
              value={formData.balance}
              onChangeText={(value) => handleInputChange('balance', value)}
              placeholder="0.00"
              keyboardType="numeric"
              error={errors.balance}
              style={styles.input}
            />

            <Input
              label="Interest Rate (%)"
              value={formData.interest_rate}
              onChangeText={(value) => handleInputChange('interest_rate', value)}
              placeholder="0.00"
              keyboardType="numeric"
              error={errors.interest_rate}
              style={styles.input}
            />

            <Input
              label="Payoff Date (Optional)"
              value={formData.payoff_date}
              onChangeText={(value) => handleInputChange('payoff_date', value)}
              placeholder="MM/DD/YYYY"
              style={styles.input}
            />
          </Card>

          <Card style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color={theme.colors.warning} />
              <Text style={styles.tipsTitle}>Tips</Text>
            </View>
            <Text style={styles.tipText}>
              • Enter the current balance you owe, not the original loan amount
            </Text>
            <Text style={styles.tipText}>
              • Use the annual interest rate (e.g., 18.99 for 18.99%)
            </Text>
            <Text style={styles.tipText}>
              • The payoff date is optional and helps with planning
            </Text>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Cancel"
            onPress={handleClose}
            variant="outline"
            style={styles.footerButton}
          />
          <Button
            title={debt ? 'Update Debt' : 'Add Debt'}
            onPress={handleSave}
            loading={loading}
            style={styles.footerButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  formCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  selectedTypeOption: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  selectedTypeOptionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tipsCard: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.warning + '10',
    borderColor: theme.colors.warning + '30',
    borderWidth: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.warning,
    marginLeft: theme.spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});

export default DebtManagementModal;
