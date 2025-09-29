import apiClient from './api';
import { API_CONFIG } from '../constants';

export interface UserProfile {
  age?: number;
  sex?: 'M' | 'F' | 'O';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  profile_image?: string;
  bio?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  profile?: UserProfile;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileData {
  age?: number;
  sex?: 'M' | 'F' | 'O';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  bio?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  profile_image?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface DeleteAccountData {
  password: string;
  confirm_deletion: boolean;
}

class ProfileService {
  /**
   * Get user profile information
   */
  async getProfile(): Promise<UserProfile> {
    try {
      console.log('👤 Fetching user profile...');
      const response = await apiClient.get('/api/mongodb/auth/mongodb/profile/');
      console.log('👤 Profile response status:', response.status);
      console.log('👤 Profile response data:', response.data);
      
      const responseData = response.data as any;
      
      // Handle case when user doesn't have a profile yet
      if (!responseData || !responseData.user) {
        console.log('👤 No user data found, returning empty profile');
        return {
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
        };
      }
      
      // Extract profile data from nested structure
      const profileData = responseData.user.profile || {};
      
      return {
        age: profileData.age || undefined,
        sex: profileData.sex || undefined,
        marital_status: profileData.marital_status || undefined,
        profile_image: profileData.avatar || profileData.profile_image || undefined,
        bio: profileData.bio || undefined,
        phone: profileData.phone || undefined,
        address: profileData.address || undefined,
        date_of_birth: profileData.date_of_birth || undefined,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at
      };
    } catch (error) {
      console.error('👤 Error fetching profile:', error);
      // Return empty profile instead of throwing error for graceful handling
      return {
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
      };
    }
  }

  /**
   * Update user profile information
   */
  async updateProfile(profileData: UpdateProfileData): Promise<boolean> {
    try {
      console.log('👤 Updating user profile...', profileData);
      const requestData = {
        profile: profileData
      };
      console.log('👤 Sending profile update request:', requestData);
      
      const response = await apiClient.put('/api/mongodb/auth/mongodb/profile/update/', requestData);
      console.log('👤 Profile update response status:', response.status);
      console.log('👤 Profile update response data:', response.data);
      
      if (response.status === 200) {
        console.log('👤 Profile update successful');
        return true;
      } else {
        console.log('👤 Profile update failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('👤 Profile update error:', error);
      throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user account information (username, email)
   */
  async updateUser(userData: UpdateUserData): Promise<boolean> {
    try {
      console.log('👤 Updating user account...', userData);
      const response = await apiClient.put('/api/mongodb/auth/mongodb/user/update/', userData);
      console.log('👤 User update response status:', response.status);
      console.log('👤 User update response data:', response.data);
      
      return response.status === 200;
    } catch (error) {
      console.error('👤 User update error:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordData): Promise<boolean> {
    try {
      console.log('👤 Changing password...');
      const response = await apiClient.put('/api/mongodb/auth/mongodb/user/update/', {
        password: passwordData.new_password
      });
      console.log('👤 Password change response status:', response.status);
      console.log('👤 Password change response data:', response.data);
      
      return response.status === 200;
    } catch (error) {
      console.error('👤 Password change error:', error);
      throw new Error(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(imageUri: string): Promise<string> {
    try {
      console.log('👤 Uploading profile image...', imageUri);
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile_image.jpg',
      } as any);
      
      const response = await apiClient.post('/api/mongodb/auth/mongodb/user/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('👤 Image upload response:', response.data);
      
      const responseData = response.data as any;
      console.log('👤 Image upload response data:', responseData);
      return responseData.image_url || responseData.profile_image_url;
    } catch (error) {
      throw new Error(`Failed to upload profile image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete profile image
   */
  async deleteProfileImage(): Promise<boolean> {
    try {
      console.log('👤 Deleting profile image...');
      const response = await apiClient.delete('/api/mongodb/auth/mongodb/user/delete-image/');
      console.log('👤 Image delete response:', response.data);
      
      return response.status === 200;
    } catch (error) {
      throw new Error(`Failed to delete profile image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(deleteData: DeleteAccountData): Promise<boolean> {
    try {
      console.log('👤 Deleting user account...');
      const response = await apiClient.delete('/api/mongodb/auth/mongodb/user/delete/', {
        data: deleteData
      });
      console.log('👤 Account delete response:', response.data);
      
      return response.status === 200;
    } catch (error) {
      throw new Error(`Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<any> {
    try {
      console.log('👤 Fetching user settings...');
      const response = await apiClient.get('/api/mongodb/settings/');
      console.log('👤 Settings response:', response.data);
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(settingsData: any): Promise<boolean> {
    try {
      console.log('👤 Updating user settings...', settingsData);
      const response = await apiClient.put('/api/mongodb/settings/update/', settingsData);
      console.log('👤 Settings update response:', response.data);
      
      return response.status === 200;
    } catch (error) {
      throw new Error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate profile data
   */
  validateProfileData(data: UpdateProfileData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.age !== undefined && (data.age < 13 || data.age > 120)) {
      errors.push('Age must be between 13 and 120');
    }

    if (data.sex && !['M', 'F', 'O'].includes(data.sex)) {
      errors.push('Sex must be M, F, or O');
    }

    if (data.marital_status && !['single', 'married', 'divorced', 'widowed'].includes(data.marital_status)) {
      errors.push('Marital status must be single, married, divorced, or widowed');
    }

    if (data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
      errors.push('Phone number format is invalid');
    }

    if (data.date_of_birth) {
      const date = new Date(data.date_of_birth);
      const now = new Date();
      if (date > now) {
        errors.push('Date of birth cannot be in the future');
      }
      if (now.getFullYear() - date.getFullYear() > 120) {
        errors.push('Date of birth is too far in the past');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate password data
   */
  validatePasswordData(data: ChangePasswordData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.current_password) {
      errors.push('Current password is required');
    }

    if (!data.new_password) {
      errors.push('New password is required');
    } else if (data.new_password.length < 8) {
      errors.push('New password must be at least 8 characters long');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.new_password)) {
      errors.push('New password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    if (data.new_password !== data.confirm_password) {
      errors.push('New password and confirmation do not match');
    }

    if (data.current_password === data.new_password) {
      errors.push('New password must be different from current password');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth: string): number {
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get profile completion percentage
   */
  getProfileCompletion(profile: UserProfile): number {
    const fields = [
      'age', 'sex', 'marital_status', 'profile_image', 
      'bio', 'phone', 'address', 'date_of_birth'
    ];
    
    const completedFields = fields.filter(field => {
      const value = profile[field as keyof UserProfile];
      return value !== undefined && value !== null && value !== '';
    });
    
    return Math.round((completedFields.length / fields.length) * 100);
  }
}

export default new ProfileService();
