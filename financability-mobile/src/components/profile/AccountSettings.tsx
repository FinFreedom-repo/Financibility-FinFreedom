import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { UpdateUserData, ChangePasswordData } from '../../services/profileService';
import profileService from '../../services/profileService';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';

interface AccountSettingsProps {
  style?: any;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ style }) => {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'password' | 'delete'>('account');
  
  // Account update form
  const [accountData, setAccountData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  
  // Password change form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  // Delete account form
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirm_deletion: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAccountDataChange = (field: string, value: string) => {
    setAccountData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordDataChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDeleteDataChange = (field: string, value: string | boolean) => {
    setDeleteData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateAccountData = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!accountData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (accountData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!accountData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordData = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.new_password)) {
      newErrors.new_password = 'Password must contain uppercase, lowercase, and number';
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (passwordData.current_password === passwordData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateAccount = async () => {
    if (!validateAccountData()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    try {
      setLoading(true);
      
      const updateData: UpdateUserData = {
        username: accountData.username.trim(),
        email: accountData.email.trim(),
      };

      await profileService.updateUser(updateData);
      if (user) {
        updateUser({ ...user, ...updateData });
      }
      
      Alert.alert('Success', 'Account information updated successfully!');
    } catch (error: any) {
      console.error('Account update error:', error);
      const errorMessage = error.message.includes('Username already exists') 
        ? 'Username is already taken. Please choose a different one.'
        : 'Failed to update account information. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordData()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    try {
      setLoading(true);
      
      const passwordChangeData: ChangePasswordData = {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      };

      await profileService.changePassword(passwordChangeData);
      
      // Clear password fields
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMessage = error.message.includes('Invalid current password')
        ? 'Current password is incorrect.'
        : 'Failed to change password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteData.confirm_deletion) {
      Alert.alert('Confirmation Required', 'Please confirm that you want to delete your account.');
      return;
    }

    if (!deleteData.password) {
      Alert.alert('Password Required', 'Please enter your password to confirm account deletion.');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const deleteAccountData = {
                password: deleteData.password,
                confirm_deletion: true,
              };

              await profileService.deleteAccount(deleteAccountData);
              
              Alert.alert(
                'Account Deleted',
                'Your account has been permanently deleted.',
                [{ text: 'OK', onPress: () => {
                  // This will be handled by the auth context
                }}]
              );
            } catch (error: any) {
              console.error('Account deletion error:', error);
              const errorMessage = error.message.includes('Invalid password')
                ? 'Password is incorrect.'
                : 'Failed to delete account. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(theme);

  const renderTabButton = (tab: string, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tabButton,
        {
          backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.surface,
          borderColor: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary + '30',
        }
      ]}
      onPress={() => setActiveTab(tab as any)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === tab ? 'white' : theme.colors.textSecondary} 
      />
      <Text style={[
        styles.tabButtonText,
        { color: activeTab === tab ? 'white' : theme.colors.textSecondary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('account', 'Account', 'person')}
        {renderTabButton('password', 'Password', 'lock-closed')}
        {renderTabButton('delete', 'Delete', 'trash')}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'account' && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Account Information
            </Text>
            
            <Input
              label="Username"
              value={accountData.username}
              onChangeText={(text) => handleAccountDataChange('username', text)}
              placeholder="Enter your username"
              leftIcon="person"
              error={errors.username}
            />

            <Input
              label="Email"
              value={accountData.email}
              onChangeText={(text) => handleAccountDataChange('email', text)}
              placeholder="Enter your email"
              keyboardType="email-address"
              leftIcon="mail"
              error={errors.email}
            />

            <Button
              title="Update Account"
              onPress={handleUpdateAccount}
              loading={loading}
              style={styles.actionButton}
              icon="checkmark"
            />
          </Card>
        )}

        {activeTab === 'password' && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Change Password
            </Text>
            
            <Input
              label="Current Password"
              value={passwordData.current_password}
              onChangeText={(text) => handlePasswordDataChange('current_password', text)}
              placeholder="Enter current password"
              secureTextEntry
              leftIcon="lock-closed"
              error={errors.current_password}
            />

            <Input
              label="New Password"
              value={passwordData.new_password}
              onChangeText={(text) => handlePasswordDataChange('new_password', text)}
              placeholder="Enter new password"
              secureTextEntry
              leftIcon="lock-closed"
              error={errors.new_password}
            />

            <Input
              label="Confirm New Password"
              value={passwordData.confirm_password}
              onChangeText={(text) => handlePasswordDataChange('confirm_password', text)}
              placeholder="Confirm new password"
              secureTextEntry
              leftIcon="lock-closed"
              error={errors.confirm_password}
            />

            <Button
              title="Change Password"
              onPress={handleChangePassword}
              loading={loading}
              style={styles.actionButton}
              icon="key"
            />
          </Card>
        )}

        {activeTab === 'delete' && (
          <Card style={styles.sectionCard}>
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={24} color={theme.colors.error} />
              <Text style={[styles.warningTitle, { color: theme.colors.error }]}>
                Danger Zone
              </Text>
            </View>
            
            <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
              Once you delete your account, there is no going back. All your data, including accounts, debts, budgets, and settings will be permanently deleted.
            </Text>

            <Input
              label="Current Password"
              value={deleteData.password}
              onChangeText={(text) => handleDeleteDataChange('password', text)}
              placeholder="Enter your password to confirm"
              secureTextEntry
              leftIcon="lock-closed"
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleDeleteDataChange('confirm_deletion', !deleteData.confirm_deletion)}
            >
              <View style={[
                styles.checkbox,
                {
                  backgroundColor: deleteData.confirm_deletion ? theme.colors.error : 'transparent',
                  borderColor: theme.colors.error,
                }
              ]}>
                {deleteData.confirm_deletion && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text style={[styles.checkboxText, { color: theme.colors.text }]}>
                I understand that this action cannot be undone
              </Text>
            </TouchableOpacity>

            <Button
              title="Delete Account Forever"
              onPress={handleDeleteAccount}
              loading={loading}
              style={[styles.actionButton, styles.deleteButton]}
              icon="trash"
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabButtonText: {
    marginLeft: theme.spacing.xs,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    marginTop: theme.spacing.md,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
});

export default AccountSettings;
