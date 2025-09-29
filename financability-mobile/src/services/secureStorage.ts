import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants';

/**
 * Secure Storage Service
 * Handles secure storage of sensitive data like JWT tokens
 * Uses Expo SecureStore for maximum security
 */
class SecureStorageService {
  /**
   * Store a value securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      throw new Error(`Failed to store ${key}`);
    }
  }

  /**
   * Retrieve a value securely
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove a value securely
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
    }
  }

  /**
   * Remove multiple items securely
   */
  async removeItems(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(key => this.removeItem(key)));
    } catch (error) {
    }
  }

  /**
   * Store JWT tokens securely
   */
  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        this.saveToken(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        this.saveToken(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ]);
    } catch (error) {
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Save token as JSON string
   */
  async saveToken(key: string, token: string): Promise<void> {
    try {
      const tokenData = { token, timestamp: Date.now() };
      await SecureStore.setItemAsync(key, JSON.stringify(tokenData));
    } catch (error) {
      throw new Error(`Failed to save ${key}`);
    }
  }

  /**
   * Get token and parse JSON
   */
  async getToken(key: string): Promise<string | null> {
    try {
      const tokenData = await SecureStore.getItemAsync(key);
      if (!tokenData) return null;
      
      const parsed = JSON.parse(tokenData);
      return parsed.token || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete token
   */
  async deleteToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
    }
  }

  /**
   * Retrieve JWT tokens securely
   */
  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.getToken(STORAGE_KEYS.ACCESS_TOKEN),
        this.getToken(STORAGE_KEYS.REFRESH_TOKEN),
      ]);
      return { accessToken, refreshToken };
    } catch (error) {
      return { accessToken: null, refreshToken: null };
    }
  }

  /**
   * Clear all authentication data
   */
  async clearAuthData(): Promise<void> {
    try {
      await this.removeItems([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.SERVER_STARTUP_TIME,
      ]);
    } catch (error) {
    }
  }

  /**
   * Store user data securely
   */
  async storeUserData(userData: any): Promise<void> {
    try {
      await this.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Retrieve user data securely
   */
  async getUserData(): Promise<any | null> {
    try {
      const userData = await this.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { accessToken } = await this.getTokens();
      return !!accessToken;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageService();
export default secureStorage;
