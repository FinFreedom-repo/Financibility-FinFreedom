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
        const response = await axios.get('/api/mongodb/auth/mongodb/profile/');
        console.log('AuthContext: Token verified successfully');
        
        setUser({ id: response.data.user.id, username: response.data.user.username });
        
        // Cache user info for offline scenarios
        localStorage.setItem('cached_username', response.data.user.username);
        localStorage.setItem('cached_user_id', response.data.user.id.toString());
      } catch (error) {
        console.error('AuthContext: Token verification failed:', error);
        
        // Only attempt refresh if we got a clear authentication error
        // Also treat 500 errors during token verification as auth errors
        const isAuthError = error.response?.status === 401 || 
                           error.response?.status === 403 ||
                           (error.response?.status === 500 && error.config?.url?.includes('/profile/'));
        
        if (isAuthError) {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              console.log('AuthContext: Attempting to refresh token...');
              const refreshResponse = await axios.post('/api/mongodb/auth/mongodb/refresh/', {
                refresh: refreshToken
              });
              
              const newToken = refreshResponse.data.access;
              localStorage.setItem('access_token', newToken);
              axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              
              // Retry getting user profile
              const profileResponse = await axios.get('/api/mongodb/auth/mongodb/profile/');
              setUser({ id: profileResponse.data.user.id, username: profileResponse.data.user.username });
              
              // Update cached user info
              localStorage.setItem('cached_username', profileResponse.data.user.username);
              localStorage.setItem('cached_user_id', profileResponse.data.user.id.toString());
              
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
          // Network error (not server error) - keep user logged in with cached data
          // Only use cached data for actual network issues, not auth/server errors
          const isNetworkError = !error.response || error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED';
          
          if (isNetworkError) {
            console.warn('AuthContext: Network error during token verification, keeping user logged in with cached data');
            const cachedUsername = localStorage.getItem('cached_username');
            const cachedUserId = localStorage.getItem('cached_user_id');
            
            if (cachedUsername && cachedUserId) {
              setUser({ id: parseInt(cachedUserId), username: cachedUsername });
              console.log('AuthContext: Using cached user data:', { id: parseInt(cachedUserId), username: cachedUsername });
            } else {
              // No cached data available, clear everything
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('cached_username');
              localStorage.removeItem('cached_user_id');
              delete axios.defaults.headers.common['Authorization'];
              setUser(null);
              console.log('AuthContext: No cached data, clearing all auth data');
            }
          } else {
            // Other server errors - clear auth data
            console.error('AuthContext: Server error during token verification, clearing auth data');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('cached_username');
            localStorage.removeItem('cached_user_id');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
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