import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import WealthProjector from './components/WealthProjector';
import Login from './components/Login';
import MonthlyBudget from './components/MonthlyBudget';
import ExpenseAnalyzer from './components/ExpenseAnalyzer';
import DebtPlanning from './components/DebtPlanning';
import './App.css';

function AppContent() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {user ? (
        <>
          <header className="App-header">
            <h1 className="App-title">Financability</h1>
            <button className="login-button" onClick={logout}>Logout</button>
          </header>
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
