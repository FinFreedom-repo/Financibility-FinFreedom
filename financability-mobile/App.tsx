import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { testNetworkConnectivity, testApiClient } from './src/utils/networkTest';

export default function App() {
  useEffect(() => {
    // Run network tests on app startup
    const runNetworkTests = async () => {
      console.log('🚀 App started, running network tests...');
      
      // Test 1: Basic fetch
      const fetchResult = await testNetworkConnectivity();
      console.log('📡 Fetch test result:', fetchResult);
      
      // Test 2: API client
      const apiResult = await testApiClient();
      console.log('🔧 API client test result:', apiResult);
    };
    
    runNetworkTests();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}