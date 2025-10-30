// User types
export interface User {
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  avatar: string;
}

// Account types
export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// Debt types
export interface Debt {
  id: string;
  name: string;
  debt_type: string;
  balance: number;
  amount: number;
  interest_rate: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

// Budget types
export interface Budget {
  id: string;
  month: number;
  year: number;
  income: number;
  expenses: {
    [key: string]: number;
  };
  created_at: string;
  updated_at: string;
}

// Common types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
