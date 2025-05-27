import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import WealthProjector from './components/WealthProjector';
import Login from './components/Login';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="App-sidebar">
      <ul className="App-menu">
        <li 
          className={`App-menu-item ${location.pathname === '/wealth-projector' ? 'active' : ''}`}
        >
          <Link to="/wealth-projector">Wealth Projector</Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/expenses' ? 'active' : ''}`}
        >
          <Link to="/expenses">Expenses</Link>
        </li>
      </ul>
    </nav>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage on initial load
    const savedAuth = localStorage.getItem('isAuthenticated');
    return savedAuth === 'true';
  });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (credentials) => {
    if (credentials.email === 'kevin' && credentials.password === 'kmac7272') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setLoginError('');
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated ? (
          <>
            <header className="App-header">
              <h1 className="App-title">Financability</h1>
              <button className="login-button" onClick={handleLogout}>Logout</button>
            </header>
            <div className="App-container">
              <Navigation />
              <main className="App-content">
                <Routes>
                  <Route path="/wealth-projector" element={<WealthProjector />} />
                  <Route path="/expenses" element={<div>Expenses View Coming Soon</div>} />
                  <Route path="/" element={<Navigate to="/wealth-projector" replace />} />
                </Routes>
              </main>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/" element={<Login onLogin={handleLogin} error={loginError} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
