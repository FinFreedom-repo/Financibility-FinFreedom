import { API_CONFIG } from '../constants';

export const testNetworkConnectivity = async () => {
  try {
    console.log('🧪 Testing network connectivity...');
    console.log('🌐 API Base URL:', API_CONFIG.BASE_URL);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/mongodb/server-info/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Network test successful:', data);
      return { success: true, data };
    } else {
      console.log('❌ Network test failed with status:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error: any) {
    console.log('❌ Network test error:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error',
      code: error.code,
      name: error.name
    };
  }
};

export const testApiClient = async () => {
  try {
    console.log('🧪 Testing API client...');
    
    // Import the API client
    const { default: apiClient } = await import('../services/api');
    
    const response = await apiClient.get('/api/mongodb/server-info/');
    console.log('✅ API client test successful:', response.data);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.log('❌ API client test error:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error',
      code: error.code,
      name: error.name
    };
  }
};
