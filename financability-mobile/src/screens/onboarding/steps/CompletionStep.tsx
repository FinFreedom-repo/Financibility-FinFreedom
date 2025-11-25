import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import Button from '../../../components/common/Button';

interface CompletionStepProps {
  onComplete: () => void;
}

const CompletionStep: React.FC<CompletionStepProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.checkmarkCircle}>
          <Ionicons name="checkmark" size={60} color={theme.colors.success} />
        </View>
      </View>

      <Text style={styles.title}>You're All Set!</Text>
      <Text style={styles.subtitle}>
        Your financial journey starts now. Let's build your wealth together.
      </Text>

      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <Ionicons name="analytics" size={24} color={theme.colors.primary} />
          <Text style={styles.featureText}>Track your progress</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="trending-up" size={24} color={theme.colors.primary} />
          <Text style={styles.featureText}>Plan your future</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons
            name="notifications"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.featureText}>Get insights & alerts</Text>
        </View>
      </View>

      <Button
        title="Get Started"
        onPress={onComplete}
        style={styles.button}
        icon="rocket"
      />
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
    checkmarkCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.success + '20',
      justifyContent: 'center',
      alignItems: 'center',
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
    button: {
      width: '100%',
      marginTop: theme.spacing.xl,
    },
  });

export default CompletionStep;
