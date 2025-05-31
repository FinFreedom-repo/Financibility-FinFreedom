import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="App-sidebar">
      <ul className="App-menu">
        <li 
          className={`App-menu-item ${location.pathname === '/monthly-budget' ? 'active' : ''}`}
        >
          <Link to="/monthly-budget">Monthly Budget</Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/expense-analyzer' ? 'active' : ''}`}
        >
          <Link to="/expense-analyzer">Expense Analyzer</Link>
        </li>
        <li 
          className={`App-menu-item ${location.pathname === '/wealth-projector' ? 'active' : ''}`}
        >
          <Link to="/wealth-projector">Wealth Projector</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation; 