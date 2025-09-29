import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, API_CONFIG } from '../constants';
import apiClient from '../services/api';
import secureStorage from '../services/secureStorage';
import biometricAuth from '../services/biometricAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  loginWithBiometric: () => Promise<{ success: boolean; message: string }>;
  enableBiometric: () => Promise<{ success: boolean; message: string }>;
  disableBiometric: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    initializeAuth();
    checkBiometricStatus();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Check if server has restarted
      const serverStartupTime = await secureStorage.getItem('server_startup_time');
      const currentServerStartup = await getServerStartupTime();
      
      if (serverStartupTime && currentServerStartup && serverStartupTime !== currentServerStartup) {
        // Server has restarted, clear auth data
        await clearAuthData();
        setLoading(false);
        return;
      }

      // Store current server startup time
      if (currentServerStartup) {
        await secureStorage.setItem('server_startup_time', currentServerStartup);
      }

      // Check for stored tokens
      const { accessToken } = await secureStorage.getTokens();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      // Verify token by making a request to profile endpoint
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
      if (response.data && !response.error && (response.data as any).user) {
        setUser((response.data as any).user);
        apiClient.setAuthToken(accessToken);
      } else {
        // Token is invalid, clear auth data
        await clearAuthData();
      }
    } catch (error) {
      await clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const checkBiometricStatus = async () => {
    try {
      const status = await biometricAuth.getStatus();
      setBiometricAvailable(status.isAvailable);
      setBiometricEnabled(status.isEnabled);
    } catch (error) {
    }
  };

  const getServerStartupTime = async (): Promise<string | null> => {
    try {
      const response = await apiClient.get('/api/mongodb/server-info/');
      return (response.data as any)?.startup_time || null;
    } catch (error) {
      return null;
    }
  };

  const clearAuthData = async () => {
    await secureStorage.clearAuthData();
    apiClient.removeAuthToken();
    setUser(null);
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login...');
      const response = await apiClient.login(credentials);
      console.log('🔐 Login response:', response);

      if (response.error) {
        return {
          success: false,
          message: response.error,
        };
      }

      const { access, refresh, user: userData } = response.data as AuthResponse;

      // Ensure tokens are strings before storing
      const accessToken = typeof access === 'string' ? access : String(access);
      const refreshToken = typeof refresh === 'string' ? refresh : String(refresh);


      // Store tokens and user data securely
      await secureStorage.storeTokens(accessToken, refreshToken);
      await secureStorage.storeUserData(userData);

      // Set auth token for future requests
      apiClient.setAuthToken(accessToken);

      // Update user state
      setUser(userData);

      return {
        success: true,
        message: SUCCESS_MESSAGES.LOGIN,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || ERROR_MESSAGES.UNKNOWN,
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      const response = await apiClient.register(credentials);

      if (response.error) {
        return {
          success: false,
          message: response.error,
        };
      }

      const { access, refresh, user: userData } = response.data as AuthResponse;

      // Ensure tokens are strings before storing
      const accessToken = typeof access === 'string' ? access : String(access);
      const refreshToken = typeof refresh === 'string' ? refresh : String(refresh);


      // Store tokens and user data securely
      await secureStorage.storeTokens(accessToken, refreshToken);
      await secureStorage.storeUserData(userData);

      // Set auth token for future requests
      apiClient.setAuthToken(accessToken);

      // Update user state
      setUser(userData);

      return {
        success: true,
        message: SUCCESS_MESSAGES.REGISTER,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || ERROR_MESSAGES.UNKNOWN,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiClient.logout();
      await clearAuthData();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    secureStorage.storeUserData(updatedUser);
  };

  const loginWithBiometric = async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!biometricAvailable) {
        return {
          success: false,
          message: 'Biometric authentication is not available on this device',
        };
      }

      const result = await biometricAuth.authenticate('Authenticate to access your account');
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Biometric authentication failed',
        };
      }

      // Try to get stored user data and tokens
      const userData = await secureStorage.getUserData();
      const { accessToken } = await secureStorage.getTokens();

      if (!userData || !accessToken) {
        return {
          success: false,
          message: 'No stored authentication data found. Please log in with your credentials.',
        };
      }

      // Verify the token is still valid
      try {
        apiClient.setAuthToken(accessToken);
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
        
        if (response.data && !response.error && (response.data as any).user) {
          setUser((response.data as any).user);
          return {
            success: true,
            message: 'Biometric authentication successful',
          };
        } else {
          // Token is invalid, clear auth data
          await clearAuthData();
          return {
            success: false,
            message: 'Authentication expired. Please log in again.',
          };
        }
      } catch (error) {
        await clearAuthData();
        return {
          success: false,
          message: 'Authentication expired. Please log in again.',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Biometric authentication failed',
      };
    }
  };

  const enableBiometric = async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!biometricAvailable) {
        return {
          success: false,
          message: 'Biometric authentication is not available on this device',
        };
      }

      const result = await biometricAuth.authenticate('Enable biometric authentication for your account');
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Biometric authentication failed',
        };
      }

      const success = await biometricAuth.enable();
      if (success) {
        setBiometricEnabled(true);
        return {
          success: true,
          message: 'Biometric authentication enabled successfully',
        };
      } else {
        return {
          success: false,
          message: 'Failed to enable biometric authentication',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to enable biometric authentication',
      };
    }
  };

  const disableBiometric = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await biometricAuth.authenticate('Disable biometric authentication for your account');
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Biometric authentication failed',
        };
      }

      const success = await biometricAuth.disable();
      if (success) {
        setBiometricEnabled(false);
        return {
          success: true,
          message: 'Biometric authentication disabled successfully',
        };
      } else {
        return {
          success: false,
          message: 'Failed to disable biometric authentication',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to disable biometric authentication',
      };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    biometricAvailable,
    biometricEnabled,
    login,
    register,
    logout,
    updateUser,
    loginWithBiometric,
    enableBiometric,
    disableBiometric,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;