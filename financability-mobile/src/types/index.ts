// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  profile?: UserProfile;
}

export interface UserProfile {
  age?: string;
  sex?: string;
  marital_status?: string;
  created_at?: string;
  updated_at?: string;
}

// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Account Types
export interface Account {
  id: string;
  name: string;
  account_type: 'checking' | 'savings' | 'investment' | 'retirement' | 'other';
  balance: number;
  interest_rate: number;
  effective_date: string;
  user: string;
  created_at?: string;
  updated_at?: string;
}

// Debt Types
export interface Debt {
  id: string;
  name: string;
  debt_type: 'credit_card' | 'loan' | 'mortgage' | 'student_loan' | 'other';
  balance: number;
  amount: number;
  interest_rate: number;
  effective_date: string;
  payoff_date?: string;
  user: string;
  created_at?: string;
  updated_at?: string;
}

// Budget Types
export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  month: string;
  year: number;
  user: string;
  created_at?: string;
  updated_at?: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  account?: string;
  user: string;
  created_at?: string;
  updated_at?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  Dashboard: undefined;
  Accounts: undefined;
  Budget: undefined;
  Analytics: undefined;
  ExpenseAnalyzer: undefined;
  Settings: undefined;
  Profile: undefined;
  ProfileSettings: undefined;
  ProfileInformation: undefined;
  PaymentPlans: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Accounts: undefined;
  Budget: undefined;
  Analytics: undefined;
  WealthProjection: undefined;
  DebtPlanning: undefined;
  Settings: undefined;
};

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: object;
    h2: object;
    h3: object;
    h4: object;
    h5: object;
    h6: object;
    body1: object;
    body2: object;
    caption: object;
    button: object;
  };
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
}

// Component Props Types
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: object;
  icon?: string;
}

export interface CardProps {
  children: React.ReactNode;
  style?: object;
  elevation?: number;
}

export interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  style?: object;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

// Settings Types
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  biometric_auth: boolean;
  currency: string;
  language: string;
}
