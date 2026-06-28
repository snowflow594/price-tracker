import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';

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
    tagline: 'Empieza a monitorear precios hoy.',
    cardTitle: 'Crear cuenta',
    cardSubtitle: 'Comienza a seguir tus productos favoritos.',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'nombre@correo.com',
    passwordLabel: 'Contraseña',
    termsPrefix: 'Acepto los',
    termsLink: 'Términos de uso',
    termsMid: 'y la',
    privacyLink: 'Política de privacidad',
    errorTerms: 'Debes aceptar los términos de servicio para continuar.',
    createAccount: 'Crear cuenta',
    processing: 'Procesando...',
    alreadyHave: '¿Ya tienes una cuenta?',
    signIn: 'Inicia sesión',
    footerTerms: 'Términos de uso',
    footerPrivacy: 'Política de privacidad',
    footer: '© 2026 Price Tracker. Todos los derechos reservados.',
    feat1: 'Tiempo real',
    feat2: 'Cifrado',
    feat3: 'Tendencias',
    errorDefault: 'Error al crear la cuenta',
  },
  en: {
    tagline: 'Start monitoring prices today.',
    cardTitle: 'Create account',
    cardSubtitle: 'Track your favorite products and save money.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@email.com',
    passwordLabel: 'Password',
    termsPrefix: 'I agree to the',
    termsLink: 'Terms of Service',
    termsMid: 'and',
    privacyLink: 'Privacy Policy',
    errorTerms: 'You must accept the terms of service to continue.',
    createAccount: 'Create Account',
    processing: 'Processing...',
    alreadyHave: 'Already have an account?',
    signIn: 'Sign In',
    footerTerms: 'Terms of Service',
    footerPrivacy: 'Privacy Policy',
    footer: '© 2026 Price Tracker. All rights reserved.',
    feat1: 'Real-time',
    feat2: 'Encrypted',
    feat3: 'Forecasting',
    errorDefault: 'Error creating account',
  },
};

export default function Register({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('es');
  const [modal, setModal] = useState(null);
  const t = i18n[lang];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!terms) {
      setError(t.errorTerms);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { user, token } = await register(email, password);
      login(user, token, true);
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
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary opacity-5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-[440px] z-10">

          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}>
                trending_up
              </span>
              <h1 className="text-2xl font-bold text-primary tracking-tight">Price Tracker</h1>
            </div>
            <p className="text-base text-on-surface-variant opacity-80">{t.tagline}</p>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-md border border-[#E2E8F0] rounded-xl shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-on-surface mb-1">{t.cardTitle}</h2>
              <p className="text-xs text-on-surface-variant">{t.cardSubtitle}</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-error-container text-error rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="reg-email">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 20 }}>
                    mail
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full pl-10 pr-4 py-3 bg-[#F1F5F9] border border-transparent rounded-lg text-base focus:bg-white focus:border-secondary focus:outline-none transition-all placeholder:text-outline"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="reg-password">
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 20 }}>
                    lock
                  </span>
                  <input
                    id="reg-password"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-secondary transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {showPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Terms — links open modal independently of the checkbox */}
              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  checked={terms}
                  onChange={e => setTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary flex-shrink-0"
                />
                <span className="text-xs text-on-surface-variant leading-tight">
                  {t.termsPrefix}{' '}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setModal('terms'); }}
                    className="text-secondary hover:underline"
                  >
                    {t.termsLink}
                  </button>
                  {' '}{t.termsMid}{' '}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setModal('privacy'); }}
                    className="text-secondary hover:underline"
                  >
                    {t.privacyLink}
                  </button>.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-on-primary font-semibold text-lg py-3.5 rounded-lg shadow-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>sync</span>
                    {t.processing}
                  </>
                ) : (
                  <>
                    {t.createAccount}
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-base text-on-surface-variant">
                {t.alreadyHave}{' '}
                <button onClick={onSwitch} className="text-secondary font-semibold hover:underline transition-all">
                  {t.signIn}
                </button>
              </p>
            </div>
          </div>

          {/* Feature teasers */}
          <div className="mt-8 grid grid-cols-3 gap-6 opacity-60">
            <div className="text-center">
              <span className="material-symbols-outlined text-primary mb-1">bolt</span>
              <p className="text-xs font-semibold block">{t.feat1}</p>
            </div>
            <div className="text-center">
              <span className="material-symbols-outlined text-primary mb-1">security</span>
              <p className="text-xs font-semibold block">{t.feat2}</p>
            </div>
            <div className="text-center">
              <span className="material-symbols-outlined text-primary mb-1">query_stats</span>
              <p className="text-xs font-semibold block">{t.feat3}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 bg-surface-container border-t border-outline-variant">
        <div className="max-w-[1280px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="font-bold text-xl text-on-surface">Price Tracker</p>
            <p className="text-xs text-on-surface-variant mt-1">{t.footer}</p>
          </div>
          <div className="flex gap-6">
            <button
              onClick={() => setModal('terms')}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none p-0 cursor-pointer"
            >
              {t.footerTerms}
            </button>
            <button
              onClick={() => setModal('privacy')}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none p-0 cursor-pointer"
            >
              {t.footerPrivacy}
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
