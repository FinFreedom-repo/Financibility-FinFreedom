import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import profileService from '../../services/profileService';

interface ProfileImagePickerProps {
  currentImage?: string;
  onImageSelected: (imageUri: string) => void;
  onImageUploaded: (imageUrl: string) => void;
  onImageDeleted: () => void;
  style?: any;
}

const ProfileImagePicker: React.FC<ProfileImagePickerProps> = ({
  currentImage,
  onImageSelected,
  onImageUploaded,
  onImageDeleted,
  style,
}) => {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload a profile image.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleImagePicker = async (source: 'camera' | 'library') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        onImageSelected(imageUri);
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);
      const imageUrl = await profileService.uploadProfileImage(imageUri);
      
      // Also update the profile with the image URL
      try {
        await profileService.updateProfile({ profile_image: imageUrl });
        console.log('👤 Profile updated with image URL:', imageUrl);
      } catch (profileError) {
        console.error('👤 Error updating profile with image:', profileError);
        // Continue anyway, the image was uploaded successfully
      }
      
      onImageUploaded(imageUrl);
      Alert.alert('Success', 'Profile image updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = () => {
    Alert.alert(
      'Delete Profile Image',
      'Are you sure you want to delete your profile image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              await profileService.deleteProfileImage();
              
              // Also remove the profile_image from the profile
              try {
                await profileService.updateProfile({ profile_image: undefined });
                console.log('👤 Profile updated to remove image');
              } catch (profileError) {
                console.error('👤 Error updating profile to remove image:', profileError);
                // Continue anyway, the image was deleted successfully
              }
              
              onImageDeleted();
              Alert.alert('Success', 'Profile image deleted successfully!');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete image. Please try again.');
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => setShowOptions(true)}
        disabled={uploading}
      >
        {currentImage ? (
          <Image source={{ uri: currentImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="person" size={40} color={theme.colors.textSecondary} />
          </View>
        )}
        
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
        
        <View style={styles.editButton}>
          <Ionicons name="camera" size={16} color="white" />
        </View>
      </TouchableOpacity>

      <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
        Tap to change profile image
      </Text>

      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.optionsContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.optionsTitle, { color: theme.colors.text }]}>
              Profile Image
            </Text>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                handleImagePicker('camera');
              }}
            >
              <Ionicons name="camera" size={24} color={theme.colors.primary} />
              <Text style={[styles.optionText, { color: theme.colors.text }]}>
                Take Photo
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                handleImagePicker('library');
              }}
            >
              <Ionicons name="images" size={24} color={theme.colors.primary} />
              <Text style={[styles.optionText, { color: theme.colors.text }]}>
                Choose from Library
              </Text>
            </TouchableOpacity>
            
            {currentImage && (
              <TouchableOpacity
                style={[styles.optionButton, styles.deleteButton]}
                onPress={() => {
                  setShowOptions(false);
                  handleDeleteImage();
                }}
              >
                <Ionicons name="trash" size={24} color={theme.colors.error} />
                <Text style={[styles.optionText, { color: theme.colors.error }]}>
                  Delete Image
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    position: 'relative',
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  placeholderContainer: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    width: '80%',
    borderRadius: 16,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  optionText: {
    fontSize: 16,
    marginLeft: theme.spacing.md,
    fontWeight: '500',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileImagePicker;
