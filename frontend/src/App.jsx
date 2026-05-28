import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import './App.css';

export default function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">📊</span>
          <span className="brand-name">Price Tracker</span>
        </div>
        <div className="navbar-links">
          <button className={`nav-link ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
            Mis productos
          </button>
          <button className={`nav-link ${page === 'search' ? 'active' : ''}`} onClick={() => setPage('search')}>
            Buscar
          </button>
        </div>
      </nav>

      <main className="main-content">
        {page === 'dashboard' ? <Dashboard /> : <Search />}
      </main>
    </div>
  );
}
