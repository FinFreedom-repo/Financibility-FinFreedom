import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      console.log('AuthContext: Verifying token on mount...');
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('AuthContext: No token found, user not authenticated');
        setLoading(false);
        return;
      }
      
      // Only use development mode if explicitly enabled and no real token exists
      const isDevelopment = process.env.REACT_APP_DEV_MODE === 'true' && !token;
      
      if (isDevelopment) {
        console.log('AuthContext: Development mode - setting default user');
        setUser({ id: 1, username: 'development_user' });
        setLoading(false);
        return;
      }
      
      try {
        // Set token in axios headers before making the request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verify token by making a request to a protected endpoint
        console.log('AuthContext: Verifying token with backend...');
        const response = await axios.get('/api/profile/me/');
        console.log('AuthContext: Token verified successfully');
        
        setUser({ id: response.data.id, username: response.data.username });
        
        // Cache user info for offline scenarios
        localStorage.setItem('cached_username', response.data.username);
        localStorage.setItem('cached_user_id', response.data.id.toString());
      } catch (error) {
        console.error('AuthContext: Token verification failed:', error);
        
        // Only attempt refresh if we got a clear authentication error
        const isAuthError = error.response?.status === 401 || 
                           error.response?.status === 403;
        
        if (isAuthError) {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              console.log('AuthContext: Attempting to refresh token...');
              const refreshResponse = await axios.post('/api/auth/token/refresh/', {
                refresh: refreshToken
              });
              
              const newToken = refreshResponse.data.access;
              localStorage.setItem('access_token', newToken);
              axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              
              // Retry getting user profile
              const profileResponse = await axios.get('/api/profile/me/');
              setUser({ id: profileResponse.data.id, username: profileResponse.data.username });
              
              // Update cached user info
              localStorage.setItem('cached_username', profileResponse.data.username);
              localStorage.setItem('cached_user_id', profileResponse.data.id.toString());
              
              console.log('AuthContext: Token refreshed successfully');
            } catch (refreshError) {
              console.error('AuthContext: Token refresh failed:', refreshError);
              // Clear all tokens and user state only if refresh also fails
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('cached_username');
              localStorage.removeItem('cached_user_id');
              delete axios.defaults.headers.common['Authorization'];
              setUser(null);
            }
          } else {
            // No refresh token, clear everything
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('cached_username');
            localStorage.removeItem('cached_user_id');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
          }
        } else {
          // Network error or server error - keep user logged in with cached data
          console.warn('AuthContext: Network/server error during token verification, keeping user logged in with cached data');
          const cachedUsername = localStorage.getItem('cached_username');
          const cachedUserId = localStorage.getItem('cached_user_id');
          
          if (cachedUsername && cachedUserId) {
            setUser({ id: parseInt(cachedUserId), username: cachedUsername });
            console.log('AuthContext: Using cached user data:', { id: parseInt(cachedUserId), username: cachedUsername });
          } else {
            // No cached data available, use generic fallback
            setUser({ id: 1, username: 'cached_user' });
            console.log('AuthContext: No cached data, using fallback user');
          }
        }
      }
      
      setLoading(false);
    };

    verifyToken();
  }, []);

  const register = async (username, email, password) => {
    try {
      console.log('Attempting registration for user:', username);
      const response = await axios.post('/api/auth/register/', {
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
      const response = await axios.post('/api/auth/token/', {
        username,
        password,
      });
      const { access, refresh } = response.data;
      console.log('Login successful, received tokens');
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      // Get user profile after successful login
      console.log('Fetching user profile...');
      const profileResponse = await axios.get('/api/profile/me/');
      console.log('Raw profile response:', profileResponse);
      console.log('Profile data:', profileResponse.data);
      
      // Use the username from the login attempt if not in profile
      const userData = { 
        id: profileResponse.data.id, 
        username: profileResponse.data.username || username // Fallback to login username
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