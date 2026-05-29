import { useState, useRef, useEffect } from 'react';
import Search from './pages/Search';
import Dashboard from './pages/Dashboard';
import Logo from './components/Logo';
import Icon from './components/Icon';
import './App.css';

export default function App() {
  const [view, setView] = useState('search');
  const [lang, setLang] = useState('es');
  const [monitoredUrls, setMonitoredUrls] = useState([]);
  const [count, setCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(msg, tone = 'success') {
    setToast({ msg, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  function handleAdded(item) {
    setMonitoredUrls(u => [...u, item.url]);
    setCount(c => c + 1);
    setRefreshTrigger(r => r + 1);
    const name = item.name.length > 28 ? item.name.slice(0, 28) + '…' : item.name;
    showToast(`"${name}" ${lang === 'en' ? 'added to monitoring' : 'añadido a monitoreo'}`, 'success');
  }

  return (
    <div className="pt-app">
      <header className="pt-header">
        <button className="pt-logo-btn" onClick={() => { setView('search'); setToast(null); }}><Logo size={30} /></button>
        <nav className="pt-nav">
          <button className={`pt-nav-btn${view === 'search' ? ' is-active' : ''}`} onClick={() => { setView('search'); setToast(null); }}>
            <Icon name="search" size={18} /><span>{lang === 'en' ? 'Search' : 'Buscar'}</span>
          </button>
          <button className={`pt-nav-btn${view === 'my' ? ' is-active' : ''}`} onClick={() => { setView('my'); setToast(null); setCount(0); }}>
            <Icon name="bookmark" size={18} /><span>{lang === 'en' ? 'My products' : 'Mis productos'}</span>
            {(count > 0 || alertCount > 0) && (
              <span className={`pt-nav-badge${alertCount > 0 ? ' pt-nav-badge-alert' : ''}`}>
                {alertCount > 0 ? alertCount : count}
              </span>
            )}
          </button>
        </nav>
        <div className="pt-header-right">
          <div className="pt-lang">
            {['es', 'en'].map(l => (
              <button key={l} className={`pt-lang-btn${lang === l ? ' is-active' : ''}`} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="pt-main">
        {view === 'search'
          ? <Search lang={lang} monitoredUrls={monitoredUrls} onAdded={handleAdded} />
          : <Dashboard lang={lang} goSearch={() => setView('search')} refreshTrigger={refreshTrigger} onAlertCount={setAlertCount} />
        }
      </main>

      {toast && (
        <div className={`pt-toast tone-${toast.tone}`}>
          <Icon name={toast.tone === 'success' ? 'check' : 'bell'} size={18} />
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
