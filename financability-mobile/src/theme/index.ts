import { Theme } from '../types';
import { THEME_CONFIG } from '../constants';

// Light Theme
export const lightTheme: Theme = {
  colors: THEME_CONFIG.COLORS.LIGHT,
  spacing: THEME_CONFIG.SPACING,
  typography: THEME_CONFIG.TYPOGRAPHY,
  borderRadius: THEME_CONFIG.BORDER_RADIUS,
};

// Dark Theme
export const darkTheme: Theme = {
  colors: THEME_CONFIG.COLORS.DARK,
  spacing: THEME_CONFIG.SPACING,
  typography: THEME_CONFIG.TYPOGRAPHY,
  borderRadius: THEME_CONFIG.BORDER_RADIUS,
};

// Default Theme
export const defaultTheme = lightTheme;

// Theme Utilities
export const getTheme = (isDark: boolean): Theme => {
  return isDark ? darkTheme : lightTheme;
};

// Color Utilities
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Shadow Utilities
export const getShadow = (elevation: number, theme: Theme) => {
  if (theme.colors.background === THEME_CONFIG.COLORS.LIGHT.background) {
    // Light theme shadows
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation * 2,
      },
      shadowOpacity: 0.1 + (elevation * 0.05),
      shadowRadius: elevation * 2,
      elevation: elevation,
    };
  } else {
    // Dark theme shadows
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation * 2,
      },
      shadowOpacity: 0.3 + (elevation * 0.1),
      shadowRadius: elevation * 2,
      elevation: elevation,
    };
  }
};

// Border Radius Utilities
export const getBorderRadius = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'round') => {
  switch (size) {
    case 'xs':
      return THEME_CONFIG.BORDER_RADIUS.xs;
    case 'sm':
      return THEME_CONFIG.BORDER_RADIUS.sm;
    case 'md':
      return THEME_CONFIG.BORDER_RADIUS.md;
    case 'lg':
      return THEME_CONFIG.BORDER_RADIUS.lg;
    case 'xl':
      return THEME_CONFIG.BORDER_RADIUS.xl;
    case 'round':
      return THEME_CONFIG.BORDER_RADIUS.round;
    default:
      return THEME_CONFIG.BORDER_RADIUS.md;
  }
};

// Spacing Utilities
export const getSpacing = (multiplier: number = 1) => {
  return THEME_CONFIG.SPACING.md * multiplier;
};

// Typography Utilities
export const getFontSize = (size: keyof typeof THEME_CONFIG.TYPOGRAPHY) => {
  return THEME_CONFIG.TYPOGRAPHY[size].fontSize;
};

export const getFontWeight = (weight: keyof typeof THEME_CONFIG.TYPOGRAPHY) => {
  return THEME_CONFIG.TYPOGRAPHY[weight].fontWeight;
};

