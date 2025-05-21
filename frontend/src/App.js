import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import WealthProjector from './components/WealthProjector';

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
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Financability</h1>
        </header>
        <div className="App-container">
          <Navigation />
          <main className="App-content">
            <Routes>
              <Route path="/wealth-projector" element={<WealthProjector />} />
              <Route path="/expenses" element={<div>Expenses View Coming Soon</div>} />
              <Route path="/" element={<WealthProjector />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
