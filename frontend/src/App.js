import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import WealthProjector from './components/WealthProjector';
import Login from './components/Login';
import MonthlyBudget from './components/MonthlyBudget';
import ExpenseAnalyzer from './components/ExpenseAnalyzer';
import DebtPlanning from './components/DebtPlanning';
import Dashboard from './components/Dashboard';
import Account from './components/Account';
import './App.css';
import axios from './utils/axios';

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

  // Fetch profile info when Account view is opened
  useEffect(() => {
    if (showAccount && user && !profileLoaded) {
      axios.get('/api/profile/me/')
        .then(res => {
          setProfile(res.data);
          setProfileLoaded(true);
        })
        .catch(() => setProfileLoaded(true));
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
    // If profile exists, update; else, create
    const method = profile && profile.age !== undefined ? 'put' : 'post';
    const url = profile && profile.age !== undefined ? `/api/profile/${profile.id}/` : '/api/profile/';
    axios[method](url, data)
      .then(res => {
        setProfile(res.data);
        setSaveSuccess(true);
      });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {user ? (
        <>
          <header className="App-header">
            <h1 className="App-title">Financability</h1>
            <div className="user-menu-container" ref={dropdownRef}>
              <div
                className="user-icon"
                onClick={() => setDropdownOpen((open) => !open)}
                title={user.username || 'User'}
              >
                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
              </div>
              {dropdownOpen && (
                <div className="user-dropdown">
                  <button className="dropdown-item" onClick={() => { setShowAccount(true); setDropdownOpen(false); }}>Account</button>
                  <button className="dropdown-item">Settings</button>
                  <button className="dropdown-item" onClick={logout}>Logout</button>
                </div>
              )}
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
                      <WealthProjector />
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
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          )}
        </>
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
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
