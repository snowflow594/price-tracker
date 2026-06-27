import { useState, useRef } from 'react';
import Search from './pages/Search';
import Dashboard from './pages/Dashboard';
import Icon from './components/Icon';
import './App.css';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [lang, setLang] = useState('es');
  const [monitoredUrls, setMonitoredUrls] = useState([]);
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
    setRefreshTrigger(r => r + 1);
    const name = item.name.length > 28 ? item.name.slice(0, 28) + '…' : item.name;
    showToast(
      `"${name}" ${lang === 'en' ? 'added to watchlist' : 'añadido al watchlist'}`,
      'success'
    );
  }

  function nav(to) {
    setView(to);
    setToast(null);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-on-surface">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface border-b border-outline-variant">
        <nav className="flex items-center justify-between h-16 px-8 max-w-[1280px] mx-auto">

          {/* Logo + nav tabs */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => nav('dashboard')}
              className="text-xl font-bold text-primary tracking-tight"
            >
              Price Tracker
            </button>
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => nav('dashboard')}
                className={`text-sm font-medium pb-1 transition-colors ${
                  view === 'dashboard'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => nav('watchlist')}
                className={`relative text-sm font-medium pb-1 transition-colors ${
                  view === 'watchlist'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {lang === 'en' ? 'Watchlist' : 'Mis Productos'}
                {alertCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full bg-primary text-on-primary">
                    {alertCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="hidden sm:flex items-center gap-1">
              {['es', 'en'].map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                    lang === l
                      ? 'text-primary bg-surface-container-low'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Bell */}
            <button className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-colors">
              <Icon name="bell" size={20} />
            </button>

            {/* Sign In — placeholder for future auth */}
            <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
              {lang === 'en' ? 'Sign In' : 'Iniciar sesión'}
            </button>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-8 py-8">
        {view === 'dashboard'
          ? <Search
              lang={lang}
              monitoredUrls={monitoredUrls}
              onAdded={handleAdded}
              goWatchlist={() => nav('watchlist')}
            />
          : <Dashboard
              lang={lang}
              goSearch={() => nav('dashboard')}
              refreshTrigger={refreshTrigger}
              onAlertCount={setAlertCount}
            />
        }
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-[1280px] mx-auto px-8 py-6 gap-4">
          <div>
            <p className="font-bold text-on-surface">Price Tracker</p>
            <p className="text-xs text-on-surface-variant mt-1">© 2024 Price Tracker. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            {['Política de privacidad', 'Términos de uso', 'Contacto'].map(l => (
              <span key={l} className="text-xs text-on-surface-variant hover:text-primary cursor-pointer transition-colors">
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div className={`pt-toast tone-${toast.tone}`}>
          <Icon name={toast.tone === 'success' ? 'check' : 'bell'} size={18} />
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
