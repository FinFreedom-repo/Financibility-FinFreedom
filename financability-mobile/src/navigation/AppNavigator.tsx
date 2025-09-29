import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList, TabParamList } from '../types';

// Import screens (we'll create these next)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AccountsAndDebtsScreen from '../screens/accounts/AccountsAndDebtsScreen';
import MonthlyBudgetScreen from '../screens/budget/MonthlyBudgetScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileSettingsScreen from '../screens/profile/ProfileSettingsScreen';
import ProfileInformationScreen from '../screens/profile/ProfileInformationScreen';
import PaymentPlansScreen from '../screens/payment/PaymentPlansScreen';
import WealthProjectionScreen from '../screens/wealth/WealthProjectionScreen';
import DebtPlanningScreen from '../screens/debt/DebtPlanningScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import LoadingScreen from '../components/common/LoadingScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Drawer = createDrawerNavigator();

// Tab Navigator for authenticated users
const TabNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Accounts':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Budget':
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
              break;
            case 'WealthProjection':
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case 'DebtPlanning':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.textSecondary + '20',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.textSecondary + '20',
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Accounts" 
        component={AccountsAndDebtsScreen}
        options={{ title: 'Accounts & Debts' }}
      />
      <Tab.Screen 
        name="Budget" 
        component={MonthlyBudgetScreen}
        options={{ title: 'Monthly Budget' }}
      />
      <Tab.Screen 
        name="WealthProjection" 
        component={WealthProjectionScreen}
        options={{ title: 'Wealth Projection' }}
      />
      <Tab.Screen 
        name="DebtPlanning" 
        component={DebtPlanningScreen}
        options={{ title: 'Debt Planning' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

// Drawer Navigator for additional screens
const DrawerNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.textSecondary + '20',
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Drawer.Screen 
        name="Main" 
        component={TabNavigator}
        options={{ 
          title: 'Financability',
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  );
};

// Main App Navigator
const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.colors.background === theme.colors.background,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.textSecondary + '20',
          notification: theme.colors.error,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '800',
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.textSecondary + '20',
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Main" 
              component={DrawerNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ProfileSettings" 
              component={ProfileSettingsScreen}
              options={{ 
                title: 'Profile Settings',
                headerBackTitle: 'Settings',
              }}
            />
            <Stack.Screen 
              name="ProfileInformation" 
              component={ProfileInformationScreen}
              options={{ 
                title: 'Profile Information',
                headerBackTitle: 'Settings',
              }}
            />
            <Stack.Screen 
              name="PaymentPlans" 
              component={PaymentPlansScreen}
              options={{ 
                title: 'Payment Plans',
                headerBackTitle: 'Settings',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ 
                title: 'Login',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ 
                title: 'Create Account',
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
