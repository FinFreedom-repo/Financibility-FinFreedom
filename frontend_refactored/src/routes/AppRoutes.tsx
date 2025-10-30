import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";

// Pages
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import AccountsAndDebtsPage from "@/pages/AccountsAndDebtsPage";
import MonthlyBudgetPage from "@/pages/MonthlyBudgetPage";
import DebtPlanningPage from "@/pages/DebtPlanningPage";
import WealthProjectorPage from "@/pages/WealthProjectorPage";
import ExpenseAnalyzerPage from "@/pages/ExpenseAnalyzerPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.LOGIN} />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to={ROUTES.DASHBOARD} />
  );
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} /> : <HomePage />
        }
      />
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts-and-debts"
        element={
          <ProtectedRoute>
            <AccountsAndDebtsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monthly-budget"
        element={
          <ProtectedRoute>
            <MonthlyBudgetPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/debt-planning"
        element={
          <ProtectedRoute>
            <DebtPlanningPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wealth-projector"
        element={
          <ProtectedRoute>
            <WealthProjectorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expense-analyzer"
        element={
          <ProtectedRoute>
            <ExpenseAnalyzerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect based on auth */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? ROUTES.DASHBOARD : "/"} />}
      />
    </Routes>
  );
};

export default AppRoutes;
