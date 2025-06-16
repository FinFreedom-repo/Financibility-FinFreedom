import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const verifyToken = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Verify token by making a request to a protected endpoint
          const response = await axios.get('/api/profile/me/');
          setUser({ id: response.data.id, username: response.data.username });
        } catch (error) {
          // If token verification fails, clear tokens and user state
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

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
      console.log('Setting user state with:', userData);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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