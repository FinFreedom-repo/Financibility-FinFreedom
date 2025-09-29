import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { Theme } from '../types';
import { STORAGE_KEYS } from '../constants';
import { lightTheme, darkTheme, getTheme } from '../theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Default to system preference
    return systemColorScheme === 'dark';
  });

  const theme = getTheme(isDark);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        setIsDark(parsedTheme.isDark);
      } else {
        // Use system preference if no saved preference
        setIsDark(systemColorScheme === 'dark');
      }
    } catch (error) {
      // Fallback to system preference
      setIsDark(systemColorScheme === 'dark');
    }
  };

  const saveThemePreference = async (isDarkMode: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify({ isDark: isDarkMode }));
    } catch (error) {
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    saveThemePreference(newIsDark);
  };

  const setTheme = (isDarkMode: boolean) => {
    setIsDark(isDarkMode);
    saveThemePreference(isDarkMode);
  };

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

