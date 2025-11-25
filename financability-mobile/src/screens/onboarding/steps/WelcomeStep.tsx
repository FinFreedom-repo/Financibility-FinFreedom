import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import Button from '../../../components/common/Button';

interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, onSkip }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="wallet" size={80} color={theme.colors.primary} />
      </View>

      <Text style={styles.title}>Welcome to Financibility!</Text>
      <Text style={styles.subtitle}>
        Let's get you set up in just a few steps
      </Text>

      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.success}
          />
          <Text style={styles.featureText}>Track your accounts</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.success}
          />
          <Text style={styles.featureText}>Set up your budget</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.success}
          />
          <Text style={styles.featureText}>Plan your financial future</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Get Started"
          onPress={onNext}
          style={styles.primaryButton}
        />
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    iconContainer: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    subtitle: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    featuresContainer: {
      width: '100%',
      marginBottom: theme.spacing.xl,
    },
    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    featureText: {
      ...theme.typography.body1,
      color: theme.colors.text,
      marginLeft: theme.spacing.md,
    },
    buttonContainer: {
      width: '100%',
      marginTop: theme.spacing.xl,
    },
    primaryButton: {
      marginBottom: theme.spacing.md,
    },
    skipButton: {
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    skipText: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary,
    },
  });

export default WelcomeStep;
