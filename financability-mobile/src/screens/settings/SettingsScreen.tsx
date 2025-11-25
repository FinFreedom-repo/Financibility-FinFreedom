import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import profileService, { UserProfile } from '../../services/profileService';

const SettingsScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigation = useNavigation();
  const styles = createStyles(theme);
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Continue with empty profile
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Refresh profile when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });

    return unsubscribe;
  }, [navigation, loadProfile]);

  const handleLogout = () => {
    logout();
  };

  const navigateToProfile = () => {
    navigation.navigate('ProfileSettings' as never);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {profile.profile_image ? (
            <Image
              source={{ uri: profile.profile_image }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.profileImagePlaceholder,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Ionicons name="person" size={40} color="white" />
            </View>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.username || 'User'}</Text>
          <Text style={styles.profileEmail}>
            {user?.email || 'user@example.com'}
          </Text>
          {profile.age && (
            <Text style={styles.profileSecondary}>
              {profile.age} years old •{' '}
              {profile.sex === 'M'
                ? 'Male'
                : profile.sex === 'F'
                  ? 'Female'
                  : profile.sex === 'O'
                    ? 'Other'
                    : ''}
              {profile.marital_status &&
                ` • ${profile.marital_status.charAt(0).toUpperCase() + profile.marital_status.slice(1)}`}
            </Text>
          )}
        </View>
      </View>

      {/* Profile Settings Section */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Profile Settings</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={navigateToProfile}
        >
          <View style={styles.settingItemLeft}>
            <Ionicons name="person" size={20} color={theme.colors.primary} />
            <Text style={styles.settingLabel}>Manage Profile</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('ProfileInformation' as never)}
        >
          <View style={styles.settingItemLeft}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.settingLabel}>Profile Information</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </Card>

      {/* Payment Plans Section */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Subscription</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('PaymentPlans' as never)}
        >
          <View style={styles.settingItemLeft}>
            <Ionicons
              name="card-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.settingLabel}>Payment Plans</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Appearance</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{
              false: theme.colors.textSecondary + '30',
              true: theme.colors.primary + '50',
            }}
            thumbColor={
              isDark ? theme.colors.primary : theme.colors.textSecondary
            }
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{
              false: theme.colors.textSecondary + '30',
              true: theme.colors.primary + '50',
            }}
            thumbColor={theme.colors.primary}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Budget Alerts</Text>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{
              false: theme.colors.textSecondary + '30',
              true: theme.colors.primary + '50',
            }}
            thumbColor={theme.colors.primary}
          />
        </View>
      </Card>

      <View style={styles.logoutContainer}>
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.md,
    },
    profileImageContainer: {
      marginRight: theme.spacing.md,
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    profileImagePlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      ...theme.typography.h3,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    profileEmail: {
      ...theme.typography.body2,
      color: theme.colors.textSecondary,
    },
    profileSecondary: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    header: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary,
    },
    card: {
      margin: theme.spacing.lg,
    },
    cardTitle: {
      ...theme.typography.h4,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.textSecondary + '20',
    },
    settingItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingLabel: {
      ...theme.typography.body1,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    settingValue: {
      ...theme.typography.body2,
      color: theme.colors.textSecondary,
    },
    logoutContainer: {
      padding: theme.spacing.lg,
    },
    logoutButton: {
      borderColor: theme.colors.error,
    },
    // Profile Information Styles
    infoSection: {
      marginBottom: theme.spacing.lg,
    },
    sectionLabel: {
      ...theme.typography.h5,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      fontWeight: '600',
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.textSecondary + '10',
    },
    infoContent: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    infoLabel: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      fontWeight: '500',
    },
    infoValue: {
      ...theme.typography.body2,
      color: theme.colors.text,
      lineHeight: 20,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyStateText: {
      ...theme.typography.body1,
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      ...theme.typography.caption,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
  });

export default SettingsScreen;
