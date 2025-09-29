import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { ButtonProps } from '../../types';
import { getBorderRadius, getShadow } from '../../theme';

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  icon,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, variant, size);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.colors.surface : theme.colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon as any}
              size={20}
              color={variant === 'primary' 
                ? theme.colors.surface 
                : variant === 'secondary'
                ? theme.colors.text
                : variant === 'outline'
                ? theme.colors.primary
                : theme.colors.primary}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, disabled && styles.disabledText]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: any, variant: string, size: string) => StyleSheet.create({
  button: {
    paddingHorizontal: size === 'small' ? theme.spacing.md : size === 'large' ? theme.spacing.xl : theme.spacing.lg,
    paddingVertical: size === 'small' ? theme.spacing.sm : size === 'large' ? theme.spacing.lg : theme.spacing.md,
    borderRadius: getBorderRadius('md'),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: size === 'small' ? 36 : size === 'large' ? 52 : 44,
    ...(variant === 'primary' && {
      backgroundColor: theme.colors.primary,
      ...getShadow(2, theme),
    }),
    ...(variant === 'secondary' && {
      backgroundColor: theme.colors.secondary,
      ...getShadow(2, theme),
    }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    }),
    ...(variant === 'text' && {
      backgroundColor: 'transparent',
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  text: {
    fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
    fontWeight: '600',
    color: variant === 'primary' 
      ? theme.colors.surface 
      : variant === 'secondary'
      ? theme.colors.text
      : variant === 'outline'
      ? theme.colors.primary
      : theme.colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default Button;

