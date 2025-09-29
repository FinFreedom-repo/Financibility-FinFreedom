import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/**
 * Biometric Authentication Service
 * Handles biometric authentication (Face ID, Touch ID, Fingerprint)
 */
class BiometricAuthService {
  /**
   * Check if biometric authentication is available on the device
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available biometric types
   */
  async getAvailableTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      return [];
    }
  }

  /**
   * Get human-readable biometric type names
   */
  getBiometricTypeName(type: LocalAuthentication.AuthenticationType): string {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris Recognition';
      default:
        return 'Biometric Authentication';
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticate(reason?: string): Promise<LocalAuthentication.LocalAuthenticationResult> {
    try {
      const defaultReason = 'Authenticate to access your account';
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || defaultReason,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'authentication_failed',
      };
    }
  }

  /**
   * Check if biometric authentication is enabled in settings
   */
  async isEnabled(): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) return false;

      // For now, we'll assume it's enabled if available
      // In a real app, you might want to store this preference
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enable biometric authentication (placeholder for future implementation)
   */
  async enable(): Promise<boolean> {
    try {
      // This would typically involve:
      // 1. Checking if biometrics are available
      // 2. Storing user preference in secure storage
      // 3. Setting up biometric authentication flow
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disable biometric authentication (placeholder for future implementation)
   */
  async disable(): Promise<boolean> {
    try {
      // This would typically involve:
      // 1. Clearing biometric authentication preference
      // 2. Removing any stored biometric data
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get biometric authentication status and capabilities
   */
  async getStatus(): Promise<{
    isAvailable: boolean;
    isEnabled: boolean;
    types: LocalAuthentication.AuthenticationType[];
    typeNames: string[];
  }> {
    try {
      const [isAvailable, isEnabled, types] = await Promise.all([
        this.isAvailable(),
        this.isEnabled(),
        this.getAvailableTypes(),
      ]);

      const typeNames = types.map(type => this.getBiometricTypeName(type));

      return {
        isAvailable,
        isEnabled,
        types,
        typeNames,
      };
    } catch (error) {
      return {
        isAvailable: false,
        isEnabled: false,
        types: [],
        typeNames: [],
      };
    }
  }
}

// Export singleton instance
export const biometricAuth = new BiometricAuthService();
export default biometricAuth;
