import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation({ onNavigate }) {
  const location = useLocation();
  
  return (
    <nav className="App-sidebar">
      <ul className="App-menu">
        <li 
          className={`App-menu-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          <Link to="/dashboard" onClick={onNavigate}>Dashboard</Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/accounts-and-debts' ? 'active' : ''}`}
        >
          <Link to="/accounts-and-debts" onClick={onNavigate}>Accounts and Debts</Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/monthly-budget' ? 'active' : ''}`}
        >
          <Link to="/monthly-budget" onClick={onNavigate}>Monthly Budget</Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/debt-planning' ? 'active' : ''}`}
        >
          <Link to="/debt-planning" onClick={onNavigate}>Debt Planning</Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/expense-analyzer' ? 'active' : ''}`}
        >
          <Link to="/expense-analyzer" onClick={onNavigate}>Expense Analyzer</Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/wealth-projector' ? 'active' : ''}`}
        >
          <Link to="/wealth-projector" onClick={onNavigate}>Wealth Projector</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation; 