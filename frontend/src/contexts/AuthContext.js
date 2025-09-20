import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add periodic token expiration check
  useEffect(() => {
    const checkTokenExpiration = () => {
      const tokenTimestamp = localStorage.getItem('token_timestamp');
      if (tokenTimestamp) {
        const tokenAge = Date.now() - parseInt(tokenTimestamp);
        if (tokenAge > 300000) { // 5 minutes in milliseconds
          console.log('AuthContext: Token expired during session, redirecting to login');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('cached_username');
          localStorage.removeItem('cached_user_id');
          localStorage.removeItem('token_timestamp');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          window.location.href = '/login';
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 300000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      console.log('AuthContext: Verifying token on mount...');
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('AuthContext: No token found, user not authenticated');
        setLoading(false);
        return;
      }
      
      // Check if server has restarted by comparing startup times
      try {
        console.log('AuthContext: Checking if server has restarted...');
        const serverInfoResponse = await axios.get('/api/mongodb/server-info/');
        const currentServerStartup = serverInfoResponse.data.startup_time;
        const lastKnownStartup = localStorage.getItem('server_startup_time');
        
        if (lastKnownStartup && lastKnownStartup !== currentServerStartup) {
          console.log('AuthContext: Server has restarted, clearing all auth data');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('cached_username');
          localStorage.removeItem('cached_user_id');
          localStorage.removeItem('token_timestamp');
          localStorage.removeItem('server_startup_time');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Store current server startup time
        localStorage.setItem('server_startup_time', currentServerStartup);
      } catch (serverInfoError) {
        console.warn('AuthContext: Could not check server info, proceeding with token validation');
      }
      
      // Check if token is older than 60 minutes (3600 seconds) - matches backend expiration
      const tokenTimestamp = localStorage.getItem('token_timestamp');
      if (tokenTimestamp) {
        const tokenAge = Date.now() - parseInt(tokenTimestamp);
        if (tokenAge > 300000) { // 5 minutes in milliseconds
          console.log('AuthContext: Token is older than 5 minutes, clearing auth data');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('cached_username');
          localStorage.removeItem('cached_user_id');
          localStorage.removeItem('token_timestamp');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setLoading(false);
          return;
        }
      }
      
      try {
        // Set token in axios headers before making the request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verify token by making a request to a protected endpoint
        console.log('AuthContext: Verifying token with backend...');
        const response = await axios.get('/api/mongodb/auth/mongodb/profile/');
        console.log('AuthContext: Token verified successfully');
        
        setUser({ id: response.data.user.id, username: response.data.user.username });
        
        // Cache user info for offline scenarios
        localStorage.setItem('cached_username', response.data.user.username);
        localStorage.setItem('cached_user_id', response.data.user.id.toString());
        
        // Update token timestamp
        localStorage.setItem('token_timestamp', Date.now().toString());
      } catch (error) {
        console.error('AuthContext: Token verification failed:', error);
        
        // Any error during token verification should clear auth data
        // This prevents auto-login when there are any issues
        console.error('AuthContext: Error during token verification, clearing auth data');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('cached_username');
        localStorage.removeItem('cached_user_id');
        localStorage.removeItem('token_timestamp');
        localStorage.removeItem('server_startup_time');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
      
      setLoading(false);
    };

    verifyToken();
  }, []);

  const register = async (username, email, password) => {
    try {
      console.log('Attempting registration for user:', username);
      const response = await axios.post('/api/mongodb/auth/mongodb/register/', {
        username,
        email,
        password,
      });
      console.log('Registration response:', response.data);
      
      // After successful registration, log the user in
      return await login(username, password);
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  };

  const login = async (username, password) => {
    try {
      console.log('Attempting login for user:', username);
      const response = await axios.post('/api/mongodb/auth/mongodb/login/', {
        username,
        password,
      });
      const { access, refresh, user } = response.data;
      console.log('Login successful, received tokens');
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('token_timestamp', Date.now().toString());
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      // Store server startup time for restart detection
      try {
        const serverInfoResponse = await axios.get('/api/mongodb/server-info/');
        localStorage.setItem('server_startup_time', serverInfoResponse.data.startup_time);
      } catch (e) {
        console.warn('Could not get server startup time');
      }
      
      // Use the user data from the login response
      const userData = { 
        id: user.id, 
        username: user.username
      };
      
      // Cache user info for persistence across reloads
      localStorage.setItem('cached_username', userData.username);
      localStorage.setItem('cached_user_id', userData.id.toString());
      
      console.log('Setting user state with:', userData);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      // Clear any existing tokens on login failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('cached_username');
      localStorage.removeItem('cached_user_id');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('cached_username');
    localStorage.removeItem('cached_user_id');
    localStorage.removeItem('token_timestamp');
    localStorage.removeItem('server_startup_time');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 