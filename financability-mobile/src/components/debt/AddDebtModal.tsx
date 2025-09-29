import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Debt } from '../../services/debtPlanningService';
import debtPlanningService from '../../services/debtPlanningService';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';

interface AddDebtModalProps {
  visible: boolean;
  debt: Debt | null;
  onClose: () => void;
  onSave: (debtData: Partial<Debt>) => void;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({
  visible,
  debt,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [formData, setFormData] = useState({
    name: '',
    debt_type: 'credit_card',
    balance: '',
    amount: '',
    interest_rate: '',
    effective_date: new Date().toISOString().split('T')[0],
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const debtTypes = [
    { value: 'credit_card', label: 'Credit Card', icon: 'card' },
    { value: 'student_loan', label: 'Student Loan', icon: 'school' },
    { value: 'auto-loan', label: 'Auto Loan', icon: 'car' },
    { value: 'mortgage', label: 'Mortgage', icon: 'home' },
    { value: 'personal_loan', label: 'Personal Loan', icon: 'cash' },
  ];

  useEffect(() => {
    if (debt) {
      setFormData({
        name: debt.name || '',
        debt_type: debt.debt_type || 'credit_card',
        balance: debt.balance?.toString() || '',
        amount: debt.amount?.toString() || '',
        interest_rate: debt.interest_rate?.toString() || '',
        effective_date: debt.effective_date ? debt.effective_date.split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        name: '',
        debt_type: 'credit_card',
        balance: '',
        amount: '',
        interest_rate: '',
        effective_date: new Date().toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [debt, visible]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Debt name is required';
    }

    if (!formData.balance || isNaN(Number(formData.balance)) || Number(formData.balance) <= 0) {
      newErrors.balance = 'Valid balance is required';
    }

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Valid original amount is required';
    }

    if (!formData.interest_rate || isNaN(Number(formData.interest_rate)) || Number(formData.interest_rate) < 0) {
      newErrors.interest_rate = 'Valid interest rate is required';
    }

    if (!formData.effective_date) {
      newErrors.effective_date = 'Effective date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const debtData: Partial<Debt> = {
        name: formData.name.trim(),
        debt_type: formData.debt_type,
        balance: Number(formData.balance),
        amount: Number(formData.amount),
        interest_rate: Number(formData.interest_rate),
        effective_date: formData.effective_date,
      };

      await onSave(debtData);
    } catch (error) {
      Alert.alert('Error', 'Failed to save debt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      debt_type: 'credit_card',
      balance: '',
      amount: '',
      interest_rate: '',
      effective_date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    onClose();
  };

  const getDebtTypeIcon = (debtType: string) => {
    const type = debtTypes.find(t => t.value === debtType);
    return type?.icon || 'card';
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
            {/* Debt Name */}
            <Input
              label="Debt Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="e.g., Chase Credit Card"
              error={errors.name}
              leftIcon="card"
            />

            {/* Debt Type */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Debt Type</Text>
              <View style={styles.debtTypeGrid}>
                {debtTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.debtTypeOption,
                      formData.debt_type === type.value && styles.selectedDebtType
                    ]}
                    onPress={() => setFormData({ ...formData, debt_type: type.value })}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={formData.debt_type === type.value ? theme.colors.surface : theme.colors.primary}
                    />
                    <Text style={[
                      styles.debtTypeLabel,
                      formData.debt_type === type.value && styles.selectedDebtTypeLabel
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Balance and Original Amount */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="Current Balance"
                  value={formData.balance}
                  onChangeText={(text) => setFormData({ ...formData, balance: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  error={errors.balance}
                  leftIcon="cash"
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="Original Amount"
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  error={errors.amount}
                  leftIcon="trending-up"
                />
              </View>
            </View>

            {/* Interest Rate */}
            <Input
              label="Interest Rate (%)"
              value={formData.interest_rate}
              onChangeText={(text) => setFormData({ ...formData, interest_rate: text })}
              placeholder="0.00"
              keyboardType="numeric"
              error={errors.interest_rate}
              leftIcon="trending-up"
            />

            {/* Effective Date */}
            <Input
              label="Effective Date"
              value={formData.effective_date}
              onChangeText={(text) => setFormData({ ...formData, effective_date: text })}
              placeholder="YYYY-MM-DD"
              error={errors.effective_date}
              leftIcon="calendar"
            />

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                title="Cancel"
                onPress={handleClose}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title={debt ? 'Update Debt' : 'Add Debt'}
                onPress={handleSave}
                loading={loading}
                style={styles.saveButton}
                icon={debt ? 'checkmark' : 'add'}
              />
            </View>
          </Card>
        </ScrollView>
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
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  debtTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  debtTypeOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  selectedDebtType: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  debtTypeLabel: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  selectedDebtTypeLabel: {
    color: theme.colors.surface,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default AddDebtModal;
