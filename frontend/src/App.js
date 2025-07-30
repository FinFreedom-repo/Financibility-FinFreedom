import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Navigation from './components/Navigation';
import WealthProjector from './components/WealthProjector';
import Login from './components/Login';
import Home from './components/Home';
import Register from './components/Register';
import MonthlyBudget from './components/MonthlyBudget';
import ExpenseAnalyzer from './components/ExpenseAnalyzer';
import DebtPlanning from './components/DebtPlanning';
import Dashboard from './components/Dashboard';
import AccountsAndDebts from './components/AccountsAndDebts';
import Account from './components/Account';
import DialogTest from './components/DialogTest';
import axios from './utils/axios';

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to login if not authenticated, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppContent() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const [showAccount, setShowAccount] = useState(false);
  const [profile, setProfile] = useState({ age: '', sex: '', marital_status: '' });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add logging for user state changes
  useEffect(() => {
    console.log('AppContent - Current user state:', user);
  }, [user]);

  // Fetch profile info when Account view is opened
  useEffect(() => {
    if (showAccount && user && !profileLoaded) {
      console.log('Fetching profile data for user:', user);
      axios.get('/api/profile/me/')
        .then(res => {
          console.log('Profile data received:', res.data);
          setProfile(res.data);
          setProfileLoaded(true);
        })
        .catch(error => {
          console.error('Error fetching profile:', error);
          setProfileLoaded(true);
        });
    }
    if (!showAccount) {
      setProfileLoaded(false);
      setSaveSuccess(false);
    }
  }, [showAccount, user, profileLoaded]);

  const handleSaveProfile = (data) => {
    console.log('Saving profile data:', data);
    
    // Use the UserProfileViewSet endpoints
    const method = profile && profile.id ? 'put' : 'post';
    const url = profile && profile.id ? `/api/profile/${profile.id}/` : '/api/profile/';
    console.log(`Saving profile with ${method.toUpperCase()} to ${url}:`, data);
    
    axios[method](url, data)
      .then(res => {
        console.log('Profile save response:', res.data);
        setProfile(res.data);
        setSaveSuccess(true);
        // Reset the success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      })
      .catch(error => {
        console.error('Error saving profile:', error);
        setSaveSuccess(false);
      });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {user ? (
          <>
            <Navigation onNavigate={() => setShowAccount(false)} />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                  ? '#0a0a0a' 
                  : theme.palette.grey[50],
                minHeight: '100vh',
                transition: 'all 0.3s ease',
              }}
            >
              <Toolbar />
              <Box sx={{ p: 3 }}>
                {showAccount ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '60vh' 
                  }}>
                    <Box sx={{ width: '100%', maxWidth: 600 }}>
                      <Account
                        username={user.username || ''}
                        age={profile.age || ''}
                        sex={profile.sex || ''}
                        maritalStatus={profile.marital_status || ''}
                        onSave={handleSaveProfile}
                      />
                      {saveSuccess && (
                        <Box sx={{ 
                          color: 'success.main', 
                          mt: 2, 
                          textAlign: 'center',
                          p: 2,
                          borderRadius: 1,
                          bgcolor: 'success.light',
                          opacity: 0.9
                        }}>
                          Profile saved successfully!
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Routes>
                    <Route path="/wealth-projector" element={
                      <ProtectedRoute>
                        <WealthProjector onNavigateToAccount={() => setShowAccount(true)} />
                      </ProtectedRoute>
                    } />
                    <Route path="/monthly-budget" element={
                      <ProtectedRoute>
                        <MonthlyBudget />
                      </ProtectedRoute>
                    } />
                    <Route path="/expense-analyzer" element={
                      <ProtectedRoute>
                        <ExpenseAnalyzer />
                      </ProtectedRoute>
                    } />
                    <Route path="/debt-planning" element={
                      <ProtectedRoute>
                        <DebtPlanning />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/accounts-and-debts" element={
                      <ProtectedRoute>
                        <AccountsAndDebts />
                      </ProtectedRoute>
                    } />
                    <Route path="/dialog-test" element={
                      <ProtectedRoute>
                        <DialogTest />
                      </ProtectedRoute>
                    } />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    } />
                  </Routes>
                )}
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ width: '100%' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        )}
      </Box>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
