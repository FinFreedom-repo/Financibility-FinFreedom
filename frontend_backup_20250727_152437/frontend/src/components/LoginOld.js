import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import USAFlag from './USAFlag';
import '../styles/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log('Login attempt for username:', username);
      const success = await login(username, password);
      console.log('Login result:', success);
      
      if (success) {
        // Redirect to intended destination or dashboard after successful login
        const from = location.state?.from?.pathname || '/dashboard';
        console.log('Login successful, redirecting to:', from);
        navigate(from, { replace: true });
      } else {
        console.log('Login failed, staying on login page');
        setError('Invalid username or password');
      }
    } catch (err) {
      console.log('Login error caught:', err);
      setError('An error occurred during login');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title">FinFreedom <USAFlag /></h2>
        <h3 className="login-subtitle">Sign In</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login; 