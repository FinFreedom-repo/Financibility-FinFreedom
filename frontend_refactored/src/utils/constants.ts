export const APP_NAME = import.meta.env.VITE_APP_NAME || "Financibility";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  ACCOUNTS: "/accounts",
  DEBTS: "/debts",
  BUDGETS: "/budgets",
  TRANSACTIONS: "/transactions",
  WEALTH: "/wealth",
  PROFILE: "/profile",
} as const;

export const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
  { value: "credit", label: "Credit" },
] as const;

export const DEBT_TYPES = [
  { value: "credit_card", label: "Credit Card" },
  { value: "student_loan", label: "Student Loan" },
  { value: "car_loan", label: "Car Loan" },
  { value: "mortgage", label: "Mortgage" },
  { value: "personal_loan", label: "Personal Loan" },
  { value: "other", label: "Other" },
] as const;
