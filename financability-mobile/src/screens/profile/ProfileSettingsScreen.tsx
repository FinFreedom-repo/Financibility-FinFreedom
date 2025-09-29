import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../services/profileService';
import profileService from '../../services/profileService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ProfileForm from '../../components/profile/ProfileForm';
import AccountSettings from '../../components/profile/AccountSettings';

const ProfileSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getProfile();
      setProfile(profileData);
      
      // If no profile exists, create a basic one
      if (!profileData || Object.keys(profileData).length === 0) {
        console.log('👤 No profile found, creating basic profile...');
        try {
          await profileService.updateProfile({
            age: undefined,
            sex: undefined,
            marital_status: undefined,
            bio: undefined,
            phone: undefined,
            address: undefined,
            date_of_birth: undefined
          });
          console.log('👤 Basic profile created successfully');
        } catch (createError) {
          console.log('👤 Failed to create basic profile, continuing with empty state');
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Don't show alert to user, just continue with empty profile
      setProfile({
        age: undefined,
        sex: undefined,
        marital_status: undefined,
        profile_image: undefined,
        bio: undefined,
        phone: undefined,
        address: undefined,
        date_of_birth: undefined,
        created_at: undefined,
        updated_at: undefined
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const handleProfileUpdate = useCallback((updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const getProfileCompletion = () => {
    return profileService.getProfileCompletion(profile);
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return theme.colors.success;
    if (percentage >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  const getCompletionMessage = (percentage: number) => {
    if (percentage >= 80) return 'Excellent! Your profile is well completed.';
    if (percentage >= 60) return 'Good progress! Complete a few more fields.';
    return 'Complete your profile to get the best experience.';
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Profile Settings
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Manage your personal information and account settings
        </Text>
      </View>

      {/* Profile Completion Card */}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor: activeTab === 'profile' ? theme.colors.primary : theme.colors.surface,
              borderColor: activeTab === 'profile' ? theme.colors.primary : theme.colors.textSecondary + '30',
            }
          ]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={activeTab === 'profile' ? 'white' : theme.colors.textSecondary} 
          />
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'profile' ? 'white' : theme.colors.textSecondary }
          ]}>
            Profile
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor: activeTab === 'account' ? theme.colors.primary : theme.colors.surface,
              borderColor: activeTab === 'account' ? theme.colors.primary : theme.colors.textSecondary + '30',
            }
          ]}
          onPress={() => setActiveTab('account')}
        >
          <Ionicons 
            name="settings" 
            size={20} 
            color={activeTab === 'account' ? 'white' : theme.colors.textSecondary} 
          />
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'account' ? 'white' : theme.colors.textSecondary }
          ]}>
            Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' ? (
          <ProfileForm
            initialProfile={profile}
            onProfileUpdate={handleProfileUpdate}
          />
        ) : (
          <AccountSettings />
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  completionCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    marginBottom: theme.spacing.md,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    marginRight: theme.spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  completionMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
});

export default ProfileSettingsScreen;
