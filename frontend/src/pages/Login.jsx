import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';

const MODAL_CONTENT = {
  privacy: {
    es: {
      title: 'Política de privacidad',
      body: [
        'Price Tracker es un proyecto personal de portafolio desarrollado por Estefano Quispe.',
        'Este sitio no recopila, almacena ni comparte datos personales de ningún tipo.',
        'No se utilizan cookies de seguimiento de terceros.',
        'Los precios mostrados se obtienen de fuentes públicas (API oficial de Mercado Libre) y se presentan solo con fines informativos. Pueden no reflejar disponibilidad en tiempo real ni ofertas actuales.',
      ],
    },
    en: {
      title: 'Privacy Policy',
      body: [
        'Price Tracker is a personal portfolio project developed by Estefano Quispe.',
        'This site does not collect, store, or share personal data of any kind.',
        'No third-party tracking cookies are used.',
        'Prices displayed are fetched from public sources (Mercado Libre official API) and are provided for informational purposes only. They may not reflect real-time availability or current offers.',
      ],
    },
  },
  terms: {
    es: {
      title: 'Términos de uso',
      body: [
        'Price Tracker es un proyecto personal de portafolio, no un producto comercial.',
        'La información mostrada (precios, nombres de productos, imágenes) se obtiene de fuentes públicas y se presenta "tal cual", sin garantía de exactitud ni disponibilidad.',
        'Esta herramienta es de uso personal. No puede utilizarse con fines comerciales ni redistribución del contenido obtenido.',
        'El desarrollador no se hace responsable de las decisiones de compra tomadas en base a los precios mostrados.',
      ],
    },
    en: {
      title: 'Terms of Service',
      body: [
        'Price Tracker is a personal portfolio project, not a commercial product.',
        'The information shown (prices, product names, images) is obtained from public sources and is provided "as is", without any guarantee of accuracy or availability.',
        'This tool is intended for personal use only. It may not be used for commercial purposes or redistribution of content.',
        'The developer is not responsible for purchasing decisions made based on the prices shown.',
      ],
    },
  },
};

const i18n = {
  es: {
    title: 'Bienvenido de vuelta',
    subtitle: 'Inicia sesión para monitorear tus precios.',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'nombre@correo.com',
    passwordLabel: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    remember: 'Recordar este dispositivo',
    signIn: 'Iniciar sesión',
    verifying: 'Verificando...',
    noAccount: '¿No tienes una cuenta?',
    signUp: 'Regístrate',
    terms: 'Términos de uso',
    privacy: 'Política de privacidad',
    footer: '© 2026 Price Tracker. Todos los derechos reservados.',
    errorDefault: 'Error al iniciar sesión',
  },
  en: {
    title: 'Welcome Back',
    subtitle: 'Sign in to monitor your prices.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@email.com',
    passwordLabel: 'Password',
    forgotPassword: 'Forgot Password?',
    remember: 'Remember this device',
    signIn: 'Sign In',
    verifying: 'Verifying...',
    noAccount: "Don't have an account?",
    signUp: 'Sign Up',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    footer: '© 2026 Price Tracker. All rights reserved.',
    errorDefault: 'Login failed',
  },
};

export default function Login({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('es');
  const [modal, setModal] = useState(null);
  const t = i18n[lang];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, token } = await loginUser(email, password);
      login(user, token, remember);
    } catch (err) {
      setError(err.response?.data?.error || t.errorDefault);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* Header */}
      <header className="w-full sticky top-0 z-50 bg-surface border-b border-outline-variant shadow-sm h-16">
        <div className="max-w-[1280px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>trending_up</span>
            <span className="text-xl font-bold text-primary">Price Tracker</span>
          </div>
          <div className="flex items-center gap-1">
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
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-8 py-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full bg-primary-container blur-[100px] opacity-20" />
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full bg-secondary-container blur-[100px] opacity-10" />
        </div>

        <div className="relative z-10 w-full max-w-[440px] bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-on-surface mb-2">{t.title}</h1>
            <p className="text-base text-on-surface-variant">{t.subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-error-container text-error rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-on-surface-variant" htmlFor="email">
                {t.emailLabel}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 20 }}>
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full pl-10 pr-4 py-3 bg-[#F1F5F9] border border-transparent rounded-lg text-base focus:bg-white focus:border-secondary focus:outline-none transition-all placeholder:text-outline"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="password">
                  {t.passwordLabel}
                </label>
                <span className="text-xs font-semibold text-secondary cursor-default">{t.forgotPassword}</span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 20 }}>
                  lock
                </span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#F1F5F9] border border-transparent rounded-lg text-base focus:bg-white focus:border-secondary focus:outline-none transition-all placeholder:text-outline"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary"
              />
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="remember">
                {t.remember}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-primary text-on-primary font-semibold text-lg rounded-lg hover:bg-[#005236] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>refresh</span>
                  {t.verifying}
                </>
              ) : (
                <>
                  {t.signIn}
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-outline-variant text-center">
            <p className="text-base text-on-surface-variant">
              {t.noAccount}{' '}
              <button onClick={onSwitch} className="text-secondary font-bold hover:underline ml-1">
                {t.signUp}
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 bg-surface-container border-t border-outline-variant">
        <div className="max-w-[1280px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-bold text-xl text-on-surface">Price Tracker</span>
          <p className="text-xs text-on-surface-variant">{t.footer}</p>
          <div className="flex gap-6">
            <button
              onClick={() => setModal('terms')}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none p-0 cursor-pointer"
            >
              {t.terms}
            </button>
            <button
              onClick={() => setModal('privacy')}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none p-0 cursor-pointer"
            >
              {t.privacy}
            </button>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl max-w-lg w-full p-8 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModal(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
            <h2 className="text-lg font-bold text-on-surface mb-4">
              {MODAL_CONTENT[modal][lang].title}
            </h2>
            <div className="flex flex-col gap-3">
              {MODAL_CONTENT[modal][lang].body.map((paragraph, i) => (
                <p key={i} className="text-sm text-on-surface-variant leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
