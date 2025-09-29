import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { DebtStrategy } from '../../services/debtPlanningService';

interface DebtStrategySelectorProps {
  strategies: DebtStrategy[];
  selectedStrategy: 'snowball' | 'avalanche';
  onStrategyChange: (strategy: 'snowball' | 'avalanche') => void;
}

const DebtStrategySelector: React.FC<DebtStrategySelectorProps> = ({
  strategies,
  selectedStrategy,
  onStrategyChange,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getStrategyIcon = (strategyId: string) => {
    switch (strategyId) {
      case 'snowball':
        return 'snow';
      case 'avalanche':
        return 'trending-down';
      default:
        return 'help-circle';
    }
  };

  const getStrategyColor = (strategyId: string) => {
    switch (strategyId) {
      case 'snowball':
        return theme.colors.info;
      case 'avalanche':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      {strategies.map((strategy) => (
        <TouchableOpacity
          key={strategy.id}
          style={[
            styles.strategyCard,
            selectedStrategy === strategy.id && styles.selectedStrategy
          ]}
          onPress={() => onStrategyChange(strategy.id)}
        >
          <View style={styles.strategyHeader}>
            <View style={styles.strategyIconContainer}>
              <Ionicons
                name={getStrategyIcon(strategy.id)}
                size={24}
                color={getStrategyColor(strategy.id)}
              />
            </View>
            <View style={styles.strategyInfo}>
              <Text style={[
                styles.strategyName,
                selectedStrategy === strategy.id && styles.selectedStrategyName
              ]}>
                {strategy.name}
              </Text>
              <Text style={[
                styles.strategyDescription,
                selectedStrategy === strategy.id && styles.selectedStrategyDescription
              ]}>
                {strategy.description}
              </Text>
            </View>
            <View style={styles.radioContainer}>
              <View style={[
                styles.radioButton,
                selectedStrategy === strategy.id && styles.selectedRadioButton
              ]}>
                {selectedStrategy === strategy.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  strategyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  selectedStrategy: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strategyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  selectedStrategyName: {
    color: theme.colors.primary,
  },
  strategyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  selectedStrategyDescription: {
    color: theme.colors.primary,
  },
  radioContainer: {
    marginLeft: theme.spacing.md,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioButton: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
});

export default DebtStrategySelector;
