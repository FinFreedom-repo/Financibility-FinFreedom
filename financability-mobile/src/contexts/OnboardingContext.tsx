import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import secureStorage from '../services/secureStorage';
import accountsDebtsService from '../services/accountsDebtsService';
import budgetService from '../services/budgetService';
import { useAuth } from './AuthContext';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
}

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if onboarding was explicitly marked as complete
      // Once explicitly completed, it never shows again (standard behavior)
      const markedComplete = await secureStorage.getItem(
        ONBOARDING_COMPLETE_KEY
      );
      if (markedComplete === 'true') {
        setIsOnboardingComplete(true);
        setIsLoading(false);
        return;
      }

      // For new users: Check if they already have accounts and budget
      // This helps existing users who already set up their data
      // but haven't gone through the new onboarding flow
      try {
        const [accounts, budgets] = await Promise.all([
          accountsDebtsService.getAccounts(),
          budgetService.getBudgets(),
        ]);

        // If user has at least one account and one budget, auto-complete onboarding
        // This is a one-time convenience for existing users
        if (accounts.length > 0 && budgets.length > 0) {
          // Auto-complete for existing users, but they can still access onboarding
          // via settings if they want to see it again
          await secureStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
          setIsOnboardingComplete(true);
        } else {
          // New user with no data - show onboarding
          setIsOnboardingComplete(false);
        }
      } catch (_error) {
        // If API calls fail, assume onboarding not complete (show it)
        setIsOnboardingComplete(false);
      }
    } catch (_error) {
      setIsOnboardingComplete(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only check onboarding status when user is authenticated
    if (isAuthenticated) {
      checkOnboardingStatus();
    } else {
      // If not authenticated, assume onboarding not complete
      setIsOnboardingComplete(false);
      setIsLoading(false);
    }
  }, [isAuthenticated, checkOnboardingStatus]);

  const completeOnboarding = async () => {
    try {
      await secureStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      setIsOnboardingComplete(true);
    } catch {
      // Silently handle error
    }
  };

  const resetOnboarding = async () => {
    try {
      await secureStorage.removeItem(ONBOARDING_COMPLETE_KEY);
      setIsOnboardingComplete(false);
    } catch (_error) {
      // Silently handle error
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        isLoading,
        completeOnboarding,
        checkOnboardingStatus,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
