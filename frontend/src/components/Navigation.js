import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import USAFlag from './USAFlag';
import '../styles/Navigation.css';

function Navigation({ onNavigate }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  return (
    <nav className={`navigation ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        className={`nav-toggle ${isCollapsed ? 'collapsed' : ''}`}
        onClick={toggleCollapse}
        title={isCollapsed ? 'Expand Menu' : 'Collapse Menu'}
      >
        {isCollapsed ? '→' : '←'}
      </button>
      
      <ul className="App-menu">
        <li 
          className={`App-menu-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          data-tooltip="Dashboard"
        >
          <Link to="/dashboard" onClick={onNavigate}>
            <span className="menu-icon">📊</span>
            <span className="menu-text">Dashboard</span>
          </Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/accounts-and-debts' ? 'active' : ''}`}
          data-tooltip="Accounts and Debts"
        >
          <Link to="/accounts-and-debts" onClick={onNavigate}>
            <span className="menu-icon">💰</span>
            <span className="menu-text">Accounts and Debts</span>
          </Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/monthly-budget' ? 'active' : ''}`}
          data-tooltip="Monthly Budget"
        >
          <Link to="/monthly-budget" onClick={onNavigate}>
            <span className="menu-icon">📋</span>
            <span className="menu-text">Monthly Budget</span>
          </Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/debt-planning' ? 'active' : ''}`}
          data-tooltip="Debt Planning"
        >
          <Link to="/debt-planning" onClick={onNavigate}>
            <span className="menu-icon">🎯</span>
            <span className="menu-text">Debt Planning</span>
          </Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/expense-analyzer' ? 'active' : ''}`}
          data-tooltip="Expense Analyzer"
        >
          <Link to="/expense-analyzer" onClick={onNavigate}>
            <span className="menu-icon">📈</span>
            <span className="menu-text">Expense Analyzer</span>
          </Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/wealth-projector' ? 'active' : ''}`}
          data-tooltip="Wealth Projector"
        >
          <Link to="/wealth-projector" onClick={onNavigate}>
            <span className="menu-icon">🚀</span>
            <span className="menu-text">Wealth Projector</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation; 