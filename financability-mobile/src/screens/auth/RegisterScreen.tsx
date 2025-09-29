import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterCredentials } from '../../types';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { VALIDATION_RULES } from '../../constants';

const { width, height } = Dimensions.get('window');

const RegisterScreen: React.FC = () => {
  const { theme } = useTheme();
  const { register, loading } = useAuth();
  const navigation = useNavigation();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    username: '',
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Partial<RegisterCredentials & { confirmPassword: string }>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterCredentials & { confirmPassword: string }> = {};

    // Validate username
    if (!credentials.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (credentials.username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      newErrors.username = `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`;
    } else if (!VALIDATION_RULES.USERNAME.PATTERN.test(credentials.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Validate email
    if (!credentials.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!VALIDATION_RULES.EMAIL.PATTERN.test(credentials.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`;
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (credentials.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      
      const result = await register(credentials);
      
      
      if (!result.success) {
        Alert.alert(
          'Registration Failed', 
          `Error: ${result.message}\n\nPlease check:\n1. Your internet connection\n2. Backend server is running\n3. API URL is correct`,
          [
            { text: 'OK' },
            { text: 'Retry', onPress: handleRegister }
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
        'Registration Error', 
        errorMessage,
        [
          { text: 'OK' },
          { text: 'Retry', onPress: handleRegister }
        ]
      );
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(credentials.password);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

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
              
              <Text style={styles.subtitle}>Create Your Account</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <Input
                label="Username"
                value={credentials.username}
                onChangeText={(text) => setCredentials({ ...credentials, username: text })}
                placeholder="Choose a username"
                error={errors.username}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="person"
              />

              <Input
                label="Email"
                value={credentials.email}
                onChangeText={(text) => setCredentials({ ...credentials, email: text })}
                placeholder="Enter your email"
                keyboardType="email-address"
                error={errors.email}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="mail"
              />

              <Input
                label="Password"
                value={credentials.password}
                onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                error={errors.password}
                leftIcon="lock-closed"
                rightIcon={showPassword ? "eye-off" : "eye"}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              {/* Password Requirements */}
              {credentials.password && (
                <View style={styles.passwordRequirements}>
                  <Text style={styles.passwordRequirementsTitle}>Password Requirements:</Text>
                  <View style={styles.requirementItem}>
                    <Ionicons 
                      name={passwordRequirements.length ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordRequirements.length ? theme.colors.success : theme.colors.error} 
                    />
                    <Text style={[styles.requirementText, { color: passwordRequirements.length ? theme.colors.success : theme.colors.error }]}>
                      At least 8 characters
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Ionicons 
                      name={passwordRequirements.uppercase ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordRequirements.uppercase ? theme.colors.success : theme.colors.error} 
                    />
                    <Text style={[styles.requirementText, { color: passwordRequirements.uppercase ? theme.colors.success : theme.colors.error }]}>
                      One uppercase letter
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Ionicons 
                      name={passwordRequirements.lowercase ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordRequirements.lowercase ? theme.colors.success : theme.colors.error} 
                    />
                    <Text style={[styles.requirementText, { color: passwordRequirements.lowercase ? theme.colors.success : theme.colors.error }]}>
                      One lowercase letter
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Ionicons 
                      name={passwordRequirements.number ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordRequirements.number ? theme.colors.success : theme.colors.error} 
                    />
                    <Text style={[styles.requirementText, { color: passwordRequirements.number ? theme.colors.success : theme.colors.error }]}>
                      One number
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Ionicons 
                      name={passwordRequirements.special ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordRequirements.special ? theme.colors.success : theme.colors.error} 
                    />
                    <Text style={[styles.requirementText, { color: passwordRequirements.special ? theme.colors.success : theme.colors.error }]}>
                      One special character
                    </Text>
                  </View>
                </View>
              )}

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                error={errors.confirmPassword}
                leftIcon="lock-closed"
                rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              <LinearGradient
                colors={['#ff0000', '#0066ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButton}
              >
                <Button
                  title="Create Account"
                  onPress={handleRegister}
                  loading={loading}
                  style={styles.registerButtonInner}
                  icon="person-add"
                  disabled={!isPasswordValid || credentials.password !== confirmPassword}
                />
              </LinearGradient>
            </View>

            {/* Footer Section */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <TouchableOpacity onPress={navigateToLogin}>
                  <Text style={styles.linkText}>Sign in</Text>
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
  passwordRequirements: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordRequirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  requirementText: {
    marginLeft: theme.spacing.sm,
    fontSize: 12,
  },
  registerButton: {
    marginTop: theme.spacing.lg,
    borderRadius: 16,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonInner: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
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

export default RegisterScreen;

