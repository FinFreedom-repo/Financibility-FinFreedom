import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types';
import apiClient from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { VALIDATION_RULES } from '../../constants';

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const { theme } = useTheme();
  const { login, loading, loginWithBiometric, biometricAvailable, biometricEnabled } = useAuth();
  const navigation = useNavigation();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({});
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginCredentials> = {};

    // Validate username
    if (!credentials.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (credentials.username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      newErrors.username = `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`;
    } else if (!VALIDATION_RULES.USERNAME.PATTERN.test(credentials.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Validate password
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      
      const result = await login(credentials);
      
      
      if (!result.success) {
        Alert.alert(
          'Login Failed', 
          `Error: ${result.message}\n\nPlease check:\n1. Your internet connection\n2. Backend server is running\n3. API URL is correct`,
          [
            { text: 'OK' },
            { text: 'Retry', onPress: handleLogin }
          ]
        );
      }
    } catch (error: any) {
      
      let errorMessage = 'Unknown error occurred';
      
      if (error.message?.includes('Network Error')) {
        errorMessage = 'Network Error: Cannot connect to server. Please check:\n1. Backend server is running on http://192.168.18.224:8000\n2. Your device is connected to the same WiFi network\n3. Firewall is not blocking the connection';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timeout: Server took too long to respond. Please try again.';
      } else if (error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused: Backend server is not running or not accessible.';
      } else if (error.message?.includes('ENOTFOUND')) {
        errorMessage = 'Server not found: Check if the IP address 192.168.18.224 is correct.';
      } else {
        errorMessage = `Error: ${error.message || 'Unknown error'}`;
      }
      
      Alert.alert(
        'Login Error', 
        errorMessage,
        [
          { text: 'OK' },
          { text: 'Retry', onPress: handleLogin }
        ]
      );
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setBiometricLoading(true);
      const result = await loginWithBiometric();
      
      if (!result.success) {
        Alert.alert('Biometric Login Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    } finally {
      setBiometricLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
  };


  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Background Gradient */}
        <View style={styles.backgroundGradient} />
        
        <View style={styles.contentContainer}>
          <Card style={styles.formCard}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#ff0000', '#0066ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Ionicons name="business" size={32} color="white" />
                </LinearGradient>
              </View>
              
              <View style={styles.titleContainer}>
                <Text style={styles.title}>FinFreedom</Text>
                <Image 
                  source={require('../../../assets/wave_narrow.png')} 
                  style={styles.flagImage}
                  resizeMode="contain"
                />
              </View>
              
              <Text style={styles.subtitle}>Sign In to Your Account</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <Input
                label="Username"
                value={credentials.username}
                onChangeText={(text) => setCredentials({ ...credentials, username: text })}
                placeholder="Enter your username"
                error={errors.username}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="person"
              />

              <Input
                label="Password"
                value={credentials.password}
                onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                placeholder="Enter your password"
                secureTextEntry
                error={errors.password}
                leftIcon="lock-closed"
                rightIcon={showPassword ? "eye-off" : "eye"}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              <LinearGradient
                colors={['#ff0000', '#0066ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.loginButtonInner}
                  icon="log-in"
                />
              </LinearGradient>


              {biometricAvailable && (
                <View style={styles.biometricSection}>
                  <View style={styles.biometricDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  
                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricLogin}
                    disabled={biometricLoading || loading}
                  >
                    {biometricLoading ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Ionicons 
                        name={Platform.OS === 'ios' ? 'scan' : 'finger-print'} 
                        size={24} 
                        color={theme.colors.primary} 
                      />
                    )}
                    <Text style={styles.biometricButtonText}>
                      {Platform.OS === 'ios' ? 'Sign in with Face ID' : 'Sign in with Fingerprint'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Footer Section */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
                <TouchableOpacity onPress={navigateToRegister}>
                  <Text style={styles.linkText}>Sign up</Text>
                </TouchableOpacity>
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    minHeight: height,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  formCard: {
    padding: theme.spacing.xl,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarContainer: {
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  flagImage: {
    width: 50,
    height: 35,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: 'normal',
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  loginButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: 16,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonInner: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  biometricSection: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  biometricDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    width: '100%',
    justifyContent: 'center',
  },
  biometricButtonText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;

