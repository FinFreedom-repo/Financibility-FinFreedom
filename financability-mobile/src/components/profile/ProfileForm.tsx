import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { UserProfile, UpdateProfileData } from '../../services/profileService';
import profileService from '../../services/profileService';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import ProfileImagePicker from './ProfileImagePicker';

interface ProfileFormProps {
  initialProfile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  style?: any;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  initialProfile,
  onProfileUpdate,
  style,
}) => {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [formData, setFormData] = useState({
    age: profile.age?.toString() || '',
    sex: profile.sex || '',
    marital_status: profile.marital_status || '',
    bio: profile.bio || '',
    phone: profile.phone || '',
    address: profile.address || '',
    date_of_birth: profile.date_of_birth || '',
  });

  useEffect(() => {
    setProfile(initialProfile);
    setFormData({
      age: initialProfile.age?.toString() || '',
      sex: initialProfile.sex || '',
      marital_status: initialProfile.marital_status || '',
      bio: initialProfile.bio || '',
      phone: initialProfile.phone || '',
      address: initialProfile.address || '',
      date_of_birth: initialProfile.date_of_birth || '',
    });
  }, [initialProfile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = formatDateForInput(selectedDate);
      handleInputChange('date_of_birth', formattedDate);
    }
  };

  const showDatePickerModal = () => {
    if (formData.date_of_birth) {
      const date = new Date(formData.date_of_birth);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    }
    setShowDatePicker(true);
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString();
  };

  const handleImageSelected = (imageUri: string) => {
    // Image is being processed
  };

  const handleImageUploaded = (imageUrl: string) => {
    const updatedProfile = { ...profile, profile_image: imageUrl };
    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const handleImageDeleted = () => {
    const updatedProfile = { ...profile, profile_image: undefined };
    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) < 13 || Number(formData.age) > 120)) {
      newErrors.age = 'Age must be between 13 and 120';
    }

    if (formData.sex && !['M', 'F', 'O'].includes(formData.sex)) {
      newErrors.sex = 'Please select a valid gender';
    }

    if (formData.marital_status && !['single', 'married', 'divorced', 'widowed'].includes(formData.marital_status)) {
      newErrors.marital_status = 'Please select a valid marital status';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.date_of_birth) {
      const date = new Date(formData.date_of_birth);
      const now = new Date();
      if (date > now) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    try {
      setLoading(true);
      
      const updateData: UpdateProfileData = {
        age: formData.age ? Number(formData.age) : undefined,
        sex: formData.sex as 'M' | 'F' | 'O' | undefined,
        marital_status: formData.marital_status as 'single' | 'married' | 'divorced' | 'widowed' | undefined,
        bio: formData.bio || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        profile_image: profile.profile_image || undefined,
      };

      await profileService.updateProfile(updateData);
      
      const updatedProfile = { ...profile, ...updateData };
      setProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Profile Image */}
      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Profile Picture
        </Text>
        <ProfileImagePicker
          currentImage={profile.profile_image}
          onImageSelected={handleImageSelected}
          onImageUploaded={handleImageUploaded}
          onImageDeleted={handleImageDeleted}
        />
      </Card>

      {/* Personal Information */}
      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Personal Information
        </Text>
        
        <Input
          label="Age"
          value={formData.age}
          onChangeText={(text) => handleInputChange('age', text)}
          placeholder="Enter your age"
          keyboardType="numeric"
          leftIcon="calendar"
          error={errors.age}
        />

        <View style={styles.pickerContainer}>
          <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>
            Gender
          </Text>
          <View style={styles.pickerOptions}>
            {[
              { value: 'M', label: 'Male', icon: 'male' },
              { value: 'F', label: 'Female', icon: 'female' },
              { value: 'O', label: 'Other', icon: 'person' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickerOption,
                  {
                    backgroundColor: formData.sex === option.value 
                      ? theme.colors.primary + '20' 
                      : theme.colors.surface,
                    borderColor: formData.sex === option.value 
                      ? theme.colors.primary 
                      : theme.colors.textSecondary + '30',
                  }
                ]}
                onPress={() => handleInputChange('sex', option.value)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={20} 
                  color={formData.sex === option.value ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.pickerOptionText,
                  { 
                    color: formData.sex === option.value ? theme.colors.primary : theme.colors.text 
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
        </View>

        <View style={styles.pickerContainer}>
          <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>
            Marital Status
          </Text>
          <View style={styles.pickerOptions}>
            {[
              { value: 'single', label: 'Single', icon: 'person' },
              { value: 'married', label: 'Married', icon: 'heart' },
              { value: 'divorced', label: 'Divorced', icon: 'heart-dislike' },
              { value: 'widowed', label: 'Widowed', icon: 'flower' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickerOption,
                  {
                    backgroundColor: formData.marital_status === option.value 
                      ? theme.colors.primary + '20' 
                      : theme.colors.surface,
                    borderColor: formData.marital_status === option.value 
                      ? theme.colors.primary 
                      : theme.colors.textSecondary + '30',
                  }
                ]}
                onPress={() => handleInputChange('marital_status', option.value)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={20} 
                  color={formData.marital_status === option.value ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.pickerOptionText,
                  { 
                    color: formData.marital_status === option.value ? theme.colors.primary : theme.colors.text 
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.marital_status && <Text style={styles.errorText}>{errors.marital_status}</Text>}
        </View>

        <View style={styles.dateInputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Date of Birth
          </Text>
          <View style={styles.dateInputRow}>
            <Input
              label=""
              value={formData.date_of_birth}
              onChangeText={(text) => handleInputChange('date_of_birth', text)}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar"
              error={errors.date_of_birth}
              keyboardType="numeric"
              style={styles.dateInput}
            />
            <TouchableOpacity
              style={[styles.calendarButton, { backgroundColor: theme.colors.primary }]}
              onPress={showDatePickerModal}
            >
              <Ionicons name="calendar" size={20} color="white" />
            </TouchableOpacity>
          </View>
          {formData.date_of_birth && (
            <Text style={[styles.dateDisplayText, { color: theme.colors.textSecondary }]}>
              {formatDateForDisplay(formData.date_of_birth)}
            </Text>
          )}
        </View>
      </Card>

      {/* Contact Information */}
      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Contact Information
        </Text>
        
        <Input
          label="Phone Number"
          value={formData.phone}
          onChangeText={(text) => handleInputChange('phone', text)}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          leftIcon="call"
          error={errors.phone}
        />

        <Input
          label="Address"
          value={formData.address}
          onChangeText={(text) => handleInputChange('address', text)}
          placeholder="Enter your address"
          leftIcon="location"
          multiline
          numberOfLines={3}
        />
      </Card>

      {/* Bio */}
      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          About You
        </Text>
        
        <Input
          label="Bio"
          value={formData.bio}
          onChangeText={(text) => handleInputChange('bio', text)}
          placeholder="Tell us about yourself..."
          leftIcon="person"
          multiline
          numberOfLines={4}
        />
      </Card>

      {/* Save Button */}
      <Button
        title="Save Profile"
        onPress={handleSave}
        loading={loading}
        style={styles.saveButton}
        icon="checkmark"
      />

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDatePickerChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
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
  pickerContainer: {
    marginBottom: theme.spacing.md,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  pickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '45%',
  },
  pickerOptionText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  saveButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  // Date Input Styles
  dateInputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateInput: {
    flex: 1,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDisplayText: {
    fontSize: 14,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
});

export default ProfileForm;
