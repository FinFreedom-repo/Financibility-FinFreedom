import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import WealthProjector from './components/WealthProjector';
import Login from './components/Login';
import MonthlyBudget from './components/MonthlyBudget';
import ExpenseAnalyzer from './components/ExpenseAnalyzer';
import DebtPlanning from './components/DebtPlanning';
import Account from './components/Account';
import './App.css';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const dropdownRef = useRef(null);

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
              <Navigation />
              <main className="App-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Account username={user.username || ''} />
              </main>
            </div>
          ) : (
            <div className="App-container">
              <Navigation />
              <main className="App-content">
                <Routes>
                  <Route path="/wealth-projector" element={<WealthProjector />} />
                  <Route path="/monthly-budget" element={<MonthlyBudget />} />
                  <Route path="/expense-analyzer" element={<ExpenseAnalyzer />} />
                  <Route path="/debt-planning" element={<DebtPlanning />} />
                  <Route path="/" element={<Navigate to="/wealth-projector" replace />} />
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
