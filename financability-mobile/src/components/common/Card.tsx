import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { CardProps } from '../../types';
import { getBorderRadius, getShadow } from '../../theme';

const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 1,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, elevation);

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const createStyles = (theme: any, elevation: number) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: getBorderRadius('lg'),
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    ...getShadow(elevation, theme),
  },
});

export default Card;

