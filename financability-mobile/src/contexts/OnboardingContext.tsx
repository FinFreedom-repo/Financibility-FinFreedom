import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../services/api';
import { API_CONFIG } from '../constants';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsOnboardingComplete(user.onboarding_complete || false);
      setIsLoading(false);
    } else {
      setIsOnboardingComplete(false);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const completeOnboarding = async () => {
    try {
      await apiClient.put(API_CONFIG.ENDPOINTS.AUTH.ONBOARDING_COMPLETE);
      setIsOnboardingComplete(true);
    } catch {
      // Silently handle error
    }
  };

  const resetOnboarding = async () => {
    // Reset is handled by backend - just update local state
    setIsOnboardingComplete(false);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        isLoading,
        completeOnboarding,
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
