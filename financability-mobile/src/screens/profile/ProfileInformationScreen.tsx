import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import profileService, { UserProfile } from '../../services/profileService';

const ProfileInformationScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const styles = createStyles(theme);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getProfile();
      console.log('👤 ProfileInformationScreen - Loaded profile data:', profileData);
      console.log('👤 ProfileInformationScreen - Profile image URL:', profileData.profile_image);
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading profile information...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {profile.profile_image ? (
            <Image 
              source={{ uri: profile.profile_image }} 
              style={styles.profileImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('👤 ProfileInformationScreen - Image load error:', error);
              }}
              onLoad={() => {
                console.log('👤 ProfileInformationScreen - Image loaded successfully');
              }}
            />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="person" size={40} color="white" />
            </View>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.username || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          {profile.age && (
            <Text style={styles.profileSecondary}>
              {profile.age} years old • {profile.sex === 'M' ? 'Male' : profile.sex === 'F' ? 'Female' : profile.sex === 'O' ? 'Other' : ''}
              {profile.marital_status && ` • ${profile.marital_status.charAt(0).toUpperCase() + profile.marital_status.slice(1)}`}
            </Text>
          )}
        </View>
      </View>

      {/* Basic Information Section */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Basic Information</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user?.username || 'Not set'}</Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
          </View>
        </View>
        
        {profile.age && (
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{profile.age} years old</Text>
            </View>
          </View>
        )}
        
        {profile.sex && (
          <View style={styles.infoItem}>
            <Ionicons name="person-circle-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>
                {profile.sex === 'M' ? 'Male' : profile.sex === 'F' ? 'Female' : profile.sex === 'O' ? 'Other' : profile.sex}
              </Text>
            </View>
          </View>
        )}
        
        {profile.marital_status && (
          <View style={styles.infoItem}>
            <Ionicons name="heart-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Marital Status</Text>
              <Text style={styles.infoValue}>
                {profile.marital_status.charAt(0).toUpperCase() + profile.marital_status.slice(1)}
              </Text>
            </View>
          </View>
        )}
        
        {profile.date_of_birth && (
          <View style={styles.infoItem}>
            <Ionicons name="gift-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.date_of_birth).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Contact Information Section */}
      {(profile.phone || profile.address) && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          
          {profile.phone && (
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profile.phone}</Text>
              </View>
            </View>
          )}
          
          {profile.address && (
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{profile.address}</Text>
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Bio Section */}
      {profile.bio && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <View style={styles.infoItem}>
            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Bio</Text>
              <Text style={styles.infoValue}>{profile.bio}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Empty State */}
      {!profile.age && !profile.sex && !profile.marital_status && !profile.date_of_birth && !profile.phone && !profile.address && !profile.bio && (
        <Card style={styles.card}>
          <View style={styles.emptyState}>
            <Ionicons name="information-circle-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              No profile information available
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              Go to Profile Settings to add your information
            </Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
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
    backgroundColor: theme.colors.textSecondary + '20',
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
  card: {
    margin: theme.spacing.lg,
  },
  cardTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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

export default ProfileInformationScreen;
