import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import Dashboard from './pages/Dashboard';
import Icon from './components/Icon';
import { getProducts } from './services/api';
import './App.css';

const FOOTER_MODALS = {
  'Política de privacidad': {
    en: { title: 'Privacy Policy', body: [
      'Price Tracker is a personal portfolio project developed by Estefano Quispe.',
      'This site does not collect, store, or share personal data of any kind.',
      'No login is required and no tracking cookies are used.',
      'Prices displayed are fetched from public sources (Mercado Libre official API) and are provided for informational purposes only. They may not reflect real-time availability or current offers.',
    ]},
    es: { title: 'Política de privacidad', body: [
      'Price Tracker es un proyecto personal de portafolio desarrollado por Estefano Quispe.',
      'Este sitio no recopila, almacena ni comparte datos personales de ningún tipo.',
      'No se requiere inicio de sesión y no se utilizan cookies de seguimiento.',
      'Los precios mostrados se obtienen de fuentes públicas (API oficial de Mercado Libre) y se presentan solo con fines informativos. Pueden no reflejar disponibilidad en tiempo real ni ofertas actuales.',
    ]},
  },
  'Términos de uso': {
    en: { title: 'Terms of Use', body: [
      'Price Tracker is a personal portfolio project, not a commercial product.',
      'The information shown (prices, product names, images) is obtained from public sources and is provided "as is", without any guarantee of accuracy or availability.',
      'This tool is intended for personal use only. It may not be used for commercial purposes or redistribution of content.',
      'The developer is not responsible for purchasing decisions made based on the prices shown.',
    ]},
    es: { title: 'Términos de uso', body: [
      'Price Tracker es un proyecto personal de portafolio, no un producto comercial.',
      'La información mostrada (precios, nombres de productos, imágenes) se obtiene de fuentes públicas y se presenta "tal cual", sin garantía de exactitud ni disponibilidad.',
      'Esta herramienta es de uso personal. No puede utilizarse con fines comerciales ni redistribución del contenido obtenido.',
      'El desarrollador no se hace responsable de las decisiones de compra tomadas en base a los precios mostrados.',
    ]},
  },
};

function getInitials(email) {
  return (email?.split('@')[0] ?? '?').slice(0, 2).toUpperCase();
}

export default function App() {
  const { user, logout, loading } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [view, setView] = useState('dashboard');
  const [lang, setLang] = useState('es');
  const [monitoredUrls, setMonitoredUrls] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState(null);
  const [footerModal, setFooterModal] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    if (!user) { setMonitoredUrls([]); return; }
    getProducts()
      .then(products => setMonitoredUrls(products.map(p => p.url)))
      .catch(() => {});
  }, [user]);

  if (loading) return null;

  if (!user) {
    return authView === 'register'
      ? <Register onSwitch={() => setAuthView('login')} />
      : <Login onSwitch={() => setAuthView('register')} />;
  }

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

  function handleLogout() {
    setDropdownOpen(false);
    logout();
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

            {/* User dropdown */}
            <div className="relative">
              {dropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              )}
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="relative z-50 flex items-center gap-2 p-1 pl-3 pr-2 rounded-full border border-outline-variant hover:bg-surface-container transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
                  {getInitials(user.email)}
                </div>
                <span className="material-symbols-outlined text-outline" style={{ fontSize: 20 }}>
                  expand_more
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-surface border border-outline-variant rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-outline-variant">
                    <p className="text-xs font-semibold text-on-surface">Mi cuenta</p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-error hover:bg-error-container/20 transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
                    <span className="text-sm font-semibold">Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
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
            <p className="text-xs text-on-surface-variant mt-1">© 2026 Price Tracker. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            {['Política de privacidad', 'Términos de uso', 'Contacto'].map(l => (
              <button
                key={l}
                onClick={() => setFooterModal(l)}
                className="text-xs text-on-surface-variant hover:text-primary cursor-pointer transition-colors bg-transparent border-none p-0"
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* Footer modals */}
      {footerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setFooterModal(null)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl max-w-lg w-full p-8 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setFooterModal(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
              aria-label="Cerrar"
            >
              <Icon name="close" size={20} />
            </button>

            {footerModal === 'Contacto' ? (
              <>
                <h2 className="text-lg font-bold text-on-surface mb-6">
                  {lang === 'en' ? 'Contact' : 'Contacto'}
                </h2>
                <div className="flex flex-col gap-4">
                  <a
                    href="mailto:estefanoquispevasquez@gmail.com"
                    className="flex items-center gap-3 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors group"
                  >
                    <Icon name="mail" size={20} className="text-primary" />
                    <div>
                      <p className="text-xs text-on-surface-variant">{lang === 'en' ? 'Email' : 'Correo'}</p>
                      <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                        estefanoquispevasquez@gmail.com
                      </p>
                    </div>
                  </a>
                  <a
                    href="https://github.com/snowflow594/price-tracker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors group"
                  >
                    <Icon name="github" size={20} className="text-primary" />
                    <div>
                      <p className="text-xs text-on-surface-variant">GitHub</p>
                      <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                        github.com/snowflow594/price-tracker
                      </p>
                    </div>
                  </a>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-on-surface mb-4">
                  {FOOTER_MODALS[footerModal]?.[lang]?.title}
                </h2>
                <div className="flex flex-col gap-3">
                  {FOOTER_MODALS[footerModal]?.[lang]?.body.map((paragraph, i) => (
                    <p key={i} className="text-sm text-on-surface-variant leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
