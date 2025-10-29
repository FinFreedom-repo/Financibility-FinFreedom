import Constants from 'expo-constants';

// API Configuration
// For mobile devices, we need to use the computer's IP address, not localhost
const getBaseURL = () => {
  // Always use the configured API base URL from app.json
  return (
    Constants.expoConfig?.extra?.apiBaseUrl ||
    'https://financibility-finfreedom-backend.onrender.com'
  );
};

const baseURL = getBaseURL();

// Debug logging for API configuration
console.log('🔧 API Configuration:', {
  baseURL,
  timeout: Constants.expoConfig?.extra?.apiTimeout || 30000,
  expoConfig: Constants.expoConfig?.extra,
});

export const API_CONFIG = {
  BASE_URL: baseURL,
  TIMEOUT: Constants.expoConfig?.extra?.apiTimeout || 30000, // Increased to 30 seconds
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/mongodb/auth/mongodb/login/',
      REGISTER: '/api/mongodb/auth/mongodb/register/',
      REFRESH: '/api/mongodb/auth/mongodb/refresh/',
      PROFILE: '/api/mongodb/auth/mongodb/profile/',
      UPDATE_PROFILE: '/api/mongodb/auth/mongodb/profile/update/',
    },
    ACCOUNTS: {
      LIST: '/api/mongodb/accounts/',
      CREATE: '/api/mongodb/accounts/create/',
      UPDATE: (id: string) => `/api/mongodb/accounts/${id}/update/`,
      DELETE: (id: string) => `/api/mongodb/accounts/${id}/delete/`,
    },
    DEBTS: {
      LIST: '/api/mongodb/debts/',
      CREATE: '/api/mongodb/debts/create/',
      UPDATE: (id: string) => `/api/mongodb/debts/${id}/update/`,
      DELETE: (id: string) => `/api/mongodb/debts/${id}/delete/`,
    },
    BUDGET: {
      LIST: '/api/mongodb/budgets/',
      CREATE: '/api/mongodb/budgets/create/',
      UPDATE: (id: string) => `/api/mongodb/budgets/${id}/update/`,
      DELETE: (id: string) => `/api/mongodb/budgets/${id}/delete/`,
      MONTH: '/api/mongodb/budgets/get-month/',
      SAVE_MONTH: '/api/mongodb/budgets/save-month/',
    },
    TRANSACTIONS: {
      LIST: '/api/mongodb/transactions/',
      CREATE: '/api/mongodb/transactions/create/',
      UPDATE: (id: string) => `/api/mongodb/transactions/${id}/update/`,
      DELETE: (id: string) => `/api/mongodb/transactions/${id}/delete/`,
    },
    WEALTH: {
      PROJECT: '/api/mongodb/project-wealth/',
      PROJECT_ENHANCED: '/api/mongodb/project-wealth-enhanced/',
      SETTINGS: '/api/mongodb/wealth-projection-settings/',
      SAVE_SETTINGS: '/api/mongodb/wealth-projection-settings/save/',
    },
    DASHBOARD: {
      MAIN: '/api/mongodb/dashboard/',
      FINANCIAL_STEPS: '/api/mongodb/financial-steps/calculate/',
    },
    NOTIFICATIONS: {
      LIST: '/api/mongodb/notifications/',
      UNREAD_COUNT: '/api/mongodb/notifications/unread-count/',
      MARK_READ: (id: string) => `/api/mongodb/notifications/${id}/mark-read/`,
      MARK_ALL_READ: '/api/mongodb/notifications/mark-all-read/',
      DELETE: (id: string) => `/api/mongodb/notifications/${id}/delete/`,
    },
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  SETTINGS: 'settings',
  SERVER_STARTUP_TIME: 'server_startup_time',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: Constants.expoConfig?.extra?.appName || 'Financability',
  VERSION: Constants.expoConfig?.extra?.appVersion || '1.0.0',
  DEBUG: Constants.expoConfig?.extra?.debug || false,
  LOG_LEVEL: Constants.expoConfig?.extra?.logLevel || 'info',
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  COLORS: {
    LIGHT: {
      primary: '#2196F3',
      secondary: '#FF9800',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#1A1A1A',
      textSecondary: '#666666',
      error: '#F44336',
      success: '#4CAF50',
      warning: '#FF9800',
      info: '#2196F3',
    },
    DARK: {
      primary: '#64B5F6',
      secondary: '#FFB74D',
      background: '#121212',
      surface: '#1E1E1E',
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
      error: '#F44336',
      success: '#4CAF50',
      warning: '#FF9800',
      info: '#2196F3',
    },
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  TYPOGRAPHY: {
    h1: { fontSize: 32, fontWeight: 'bold' as const },
    h2: { fontSize: 24, fontWeight: 'bold' as const },
    h3: { fontSize: 20, fontWeight: '600' as const },
    h4: { fontSize: 18, fontWeight: '600' as const },
    h5: { fontSize: 16, fontWeight: '600' as const },
    h6: { fontSize: 14, fontWeight: '600' as const },
    body1: { fontSize: 16, fontWeight: 'normal' as const },
    body2: { fontSize: 14, fontWeight: 'normal' as const },
    caption: { fontSize: 12, fontWeight: 'normal' as const },
    button: { fontSize: 16, fontWeight: '600' as const },
  },
  BORDER_RADIUS: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
  },
} as const;

// Navigation Configuration
export const NAVIGATION_CONFIG = {
  TAB_BAR_HEIGHT: 60,
  HEADER_HEIGHT: 60,
  DRAWER_WIDTH: 280,
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Authentication required. Please log in.',
  FORBIDDEN: 'Access denied. You do not have permission.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION: 'Please check your input and try again.',
  UNKNOWN: 'An unexpected error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  REGISTER: 'Account created successfully!',
  LOGOUT: 'Successfully logged out!',
  SAVE: 'Changes saved successfully!',
  DELETE: 'Item deleted successfully!',
  UPDATE: 'Updated successfully!',
} as const;

// Chart Colors
export const CHART_COLORS = [
  '#2196F3',
  '#FF9800',
  '#4CAF50',
  '#F44336',
  '#9C27B0',
  '#00BCD4',
  '#FFC107',
  '#795548',
  '#607D8B',
  '#E91E63',
] as const;

// Account Types
export const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'investment', label: 'Investment' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'other', label: 'Other' },
] as const;

// Debt Types
export const DEBT_TYPES = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'loan', label: 'Personal Loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'other', label: 'Other' },
] as const;

// Budget Categories
export const BUDGET_CATEGORIES = [
  'Housing',
  'Food',
  'Transportation',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Insurance',
  'Savings',
  'Debt Payment',
  'Other',
] as const;

// Transaction Categories
export const TRANSACTION_CATEGORIES = [
  'Income',
  'Housing',
  'Food',
  'Transportation',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Insurance',
  'Savings',
  'Debt Payment',
  'Other',
] as const;
