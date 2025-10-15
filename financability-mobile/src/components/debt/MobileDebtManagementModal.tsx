import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Debt } from '../../services/debtPlanningService';
import Button from '../common/Button';

const { width, height } = Dimensions.get('window');

interface MobileDebtManagementModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (debt: Partial<Debt>) => Promise<void>;
  onDelete: (debtId: string) => Promise<void>;
  editingDebt: Debt | null;
  loading: boolean;
  theme: any;
}

const MobileDebtManagementModal: React.FC<MobileDebtManagementModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  editingDebt,
  loading,
  theme,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    debt_type: 'credit_card',
    balance: '',
    interest_rate: '',
    effective_date: ''
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const styles = createStyles(theme);

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

  useEffect(() => {
    if (editingDebt) {
      setFormData({
        name: editingDebt.name || '',
        debt_type: editingDebt.debt_type || 'credit_card',
        balance: editingDebt.balance?.toString() || '',
        interest_rate: editingDebt.interest_rate?.toString() || '',
        effective_date: editingDebt.effective_date || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        name: '',
        debt_type: 'credit_card',
        balance: '',
        interest_rate: '',
        effective_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [editingDebt]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a debt name');
      return;
    }

    if (!formData.balance || parseFloat(formData.balance) <= 0) {
      Alert.alert('Error', 'Please enter a valid balance amount');
      return;
    }

    if (!formData.interest_rate || parseFloat(formData.interest_rate) < 0) {
      Alert.alert('Error', 'Please enter a valid interest rate');
      return;
    }

    try {
      await onSave({
        ...formData,
        balance: parseFloat(formData.balance),
        interest_rate: parseFloat(formData.interest_rate),
        ...(editingDebt && { _id: editingDebt._id } as any)
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save debt. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!editingDebt?._id) return;

    Alert.alert(
      'Delete Debt',
      `Are you sure you want to delete "${editingDebt.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(editingDebt._id);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete debt. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderDebtTypeSelector = () => {
    return (
      <View style={styles.selectorContainer}>
        <Text style={styles.label}>Debt Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.typeButtons}>
            {debtTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  formData.debt_type === type.value && styles.activeTypeButton
                ]}
                onPress={() => setFormData(prev => ({ ...prev, debt_type: type.value }))}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.debt_type === type.value && styles.activeTypeButtonText
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingDebt ? 'Edit Debt' : 'Add New Debt'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Debt Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Debt Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Chase Credit Card"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            {/* Debt Type */}
            {renderDebtTypeSelector()}

            {/* Balance */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Balance *</Text>
              <TextInput
                style={styles.input}
                value={formData.balance}
                onChangeText={(text) => setFormData(prev => ({ ...prev, balance: text }))}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            {/* Interest Rate */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Interest Rate (%) *</Text>
              <TextInput
                style={styles.input}
                value={formData.interest_rate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, interest_rate: text }))}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            {/* Effective Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Effective Date</Text>
              <TextInput
                style={styles.input}
                value={formData.effective_date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, effective_date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {editingDebt && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={loading}
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.actionButtons}>
              <Button
                title="Cancel"
                onPress={onClose}
                variant="outline"
                style={styles.cancelButton}
                disabled={loading}
              />
              <Button
                title={editingDebt ? 'Update' : 'Add Debt'}
                onPress={handleSave}
                style={styles.saveButton}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  selectorContainer: {
    marginBottom: theme.spacing.lg,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  typeButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTypeButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  activeTypeButtonText: {
    color: 'white',
  },
  actions: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default MobileDebtManagementModal;
