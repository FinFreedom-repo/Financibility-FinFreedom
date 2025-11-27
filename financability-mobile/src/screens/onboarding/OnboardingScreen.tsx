import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import WelcomeStep from './steps/WelcomeStep';
import AccountsStep from './steps/AccountsStep';
import DebtsStep from './steps/DebtsStep';
import BudgetStep from './steps/BudgetStep';
import CompletionStep from './steps/CompletionStep';

type OnboardingStep =
  | 'welcome'
  | 'accounts'
  | 'debts'
  | 'budget'
  | 'completion';

const OnboardingScreen: React.FC = () => {
  const { theme } = useTheme();
  const { completeOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [, setAccountsAdded] = useState(false);
  const [, setDebtsAdded] = useState(false);
  const [, setBudgetSet] = useState(false);

  const styles = createStyles(theme);

  const steps: OnboardingStep[] = [
    'welcome',
    'accounts',
    'debts',
    'budget',
    'completion',
  ];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    // Navigation will automatically switch to Main when isOnboardingComplete becomes true
    // No need to manually navigate - React Navigation will re-render the stack
  };

  const handleComplete = async () => {
    await completeOnboarding();
    // Navigation will automatically switch to Main when isOnboardingComplete becomes true
    // No need to manually navigate - React Navigation will re-render the stack
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={handleNext} onSkip={handleSkip} />;
      case 'accounts':
        return (
          <AccountsStep
            onNext={handleNext}
            onBack={handleBack}
            onAccountsAdded={() => setAccountsAdded(true)}
          />
        );
      case 'debts':
        return (
          <DebtsStep
            onNext={handleNext}
            onBack={handleBack}
            onDebtsAdded={() => setDebtsAdded(true)}
          />
        );
      case 'budget':
        return (
          <BudgetStep
            onNext={handleNext}
            onBack={handleBack}
            onBudgetSet={() => setBudgetSet(true)}
          />
        );
      case 'completion':
        return <CompletionStep onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      {currentStep !== 'completion' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentStepIndex + 1) / (steps.length - 1)) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStepIndex + 1} of {steps.length - 1}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    progressContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      marginBottom: theme.spacing.sm,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
    progressText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
      padding: theme.spacing.lg,
    },
  });

export default OnboardingScreen;
