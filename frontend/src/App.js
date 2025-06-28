import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import './App.css';
import axios from './utils/axios';
import USAFlag from './components/USAFlag';

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [profile, setProfile] = useState({ age: '', sex: '', marital_status: '' });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
    <div className="App">
      {user ? (
        <>
          <header className="app-header">
            <div className="header-content">
              <h1 className="app-title">FinFreedom <USAFlag /></h1>
              <nav className="nav-menu">
                <div className="user-menu-container" ref={dropdownRef}>
                  {console.log('Current user state in header:', user)}
                  <div
                    className="user-icon"
                    onClick={() => setDropdownOpen((open) => !open)}
                    title={user?.username || 'User'}
                  >
                    {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                  </div>
                  {dropdownOpen && (
                    <div className="user-dropdown">
                      <button className="dropdown-item" onClick={() => { setShowAccount(true); setDropdownOpen(false); }}>Account</button>
                      <button className="dropdown-item">Settings</button>
                      <button className="dropdown-item" onClick={logout}>Logout</button>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </header>
          {showAccount ? (
            <div className="App-container">
              <Navigation onNavigate={() => setShowAccount(false)} />
              <main className="App-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ width: '100%' }}>
                  <Account
                    username={user.username || ''}
                    age={profile.age || ''}
                    sex={profile.sex || ''}
                    maritalStatus={profile.marital_status || ''}
                    onSave={handleSaveProfile}
                  />
                  {saveSuccess && <div style={{ color: 'green', marginTop: '1rem', textAlign: 'center' }}>Profile saved!</div>}
                </div>
              </main>
            </div>
          ) : (
            <div className="App-container">
              <Navigation onNavigate={() => setShowAccount(false)} />
              <main className="App-content">
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
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          )}
        </>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
