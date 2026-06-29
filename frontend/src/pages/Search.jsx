import { useState, useRef } from 'react';
import { searchFalabella, searchML, addProduct } from '../services/api';
import Icon from '../components/Icon';
import { money, thumbHue } from '../utils/format';

const STEP = 10;
const MAX_LIMIT = 30;
const SUGGESTIONS = ['Laptop', 'iPhone', 'Auriculares', 'Smart TV', 'Monitor', 'Teclado'];

const T = {
  es: {
    badge: 'Actualizaciones automáticas cada 6 horas',
    heroTitle: 'Rastrea precios en las',
    heroAccent: 'tiendas más grandes.',
    heroSub: 'Deja de pagar de más. Recibe alertas cuando el precio de un producto llegue a tu objetivo.',
    placeholder: 'Busca un producto… ej. "laptop", "iPhone 15", "auriculares"',
    trackNow: 'Buscar',
    searching: 'Buscando…',
    suggested: 'Búsquedas populares',
    items: 'productos',
    monitor: 'Guardar en watchlist',
    monitoring: 'En watchlist',
    loadMore: 'Ver más resultados',
    loadingMore: 'Cargando…',
    noResults: 'Sin resultados. Intenta con otro término.',
    error: 'Error al buscar. Intenta de nuevo.',
    amazonTitle: 'Amazon no disponible en producción',
    amazonMsg: 'Amazon bloquea el scraping automatizado desde servidores en la nube. La búsqueda de Amazon funciona únicamente en entorno local. Usa Falabella para monitorear tus productos.',
    searchResults: 'Resultados de búsqueda',
  },
  en: {
    badge: 'Automatic updates every 6 hours',
    heroTitle: "Track prices across the",
    heroAccent: "world's biggest stores.",
    heroSub: "Stop overpaying. Get instant alerts when the products you love hit their lowest price ever.",
    placeholder: 'Search a product… e.g. "laptop", "iPhone 15", "headphones"',
    trackNow: 'Track Now',
    searching: 'Searching…',
    suggested: 'Popular searches',
    items: 'items',
    monitor: 'Save to Watchlist',
    monitoring: 'In Watchlist',
    loadMore: 'Load more results',
    loadingMore: 'Loading…',
    noResults: 'No results. Try a different term.',
    error: 'Search error. Please try again.',
    amazonTitle: 'Amazon unavailable in production',
    amazonMsg: 'Amazon blocks automated scraping from cloud servers. Amazon search only works in a local environment. Use Falabella to monitor your products.',
    searchResults: 'Search Results',
  },
};

function sourceCurrency(source) {
  return source === 'amazon' ? 'USD' : 'PEN';
}

function sourceLabel(source) {
  if (source === 'falabella') return 'Falabella';
  if (source === 'mercadolibre') return 'Mercado Libre';
  return 'Amazon';
}

function ProductCard({ item, isMonitored, onToggle, saving, lang }) {
  const t = T[lang];
  const currency = sourceCurrency(item.source);
  const hue = thumbHue(item.name);

  return (
    <div className="group bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Image placeholder */}
      <div
        className="relative h-48 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(150deg, hsl(${hue} 30% 94%), hsl(${hue} 25% 90%))` }}
      >
        <span
          className="text-5xl font-bold select-none"
          style={{ color: `hsl(${hue} 40% 72%)` }}
        >
          {item.name.trim()[0]?.toUpperCase()}
        </span>
        {/* Platform badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-outline-variant text-on-surface-variant">
          {sourceLabel(item.source)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-sm font-semibold text-on-surface leading-snug line-clamp-2 flex-1">
            {item.name}
          </h3>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="text-outline hover:text-secondary transition-colors flex-none mt-0.5"
          >
            <Icon name="external" size={15} />
          </a>
        </div>

        <p className="text-2xl font-bold text-on-surface font-mono">
          {money(item.price, currency)}
        </p>

        <button
          onClick={() => !isMonitored && onToggle(item)}
          disabled={saving || isMonitored}
          className={`mt-auto w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            isMonitored
              ? 'bg-primary/10 text-primary cursor-default'
              : 'bg-primary text-on-primary hover:opacity-90 active:scale-95'
          } disabled:opacity-60`}
        >
          <Icon name={isMonitored ? 'check' : 'bookmark'} size={16} />
          {saving ? '…' : isMonitored ? t.monitoring : t.monitor}
        </button>
      </div>
    </div>
  );
}

export default function Search({ lang, monitoredUrls, onAdded }) {
  const t = T[lang];
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('falabella');
  const [results, setResults] = useState([]);
  const [limit, setLimit] = useState(STEP);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState({});
  const inputRef = useRef(null);

  const hasResults = results.length > 0;
  const showHero = !hasResults && !loading && !error && query.trim() === '';
  const canLoadMore = results.length >= limit && limit < MAX_LIMIT;

  function searchByPlatform(q, plat, lim) {
    if (plat === 'mercadolibre') return searchML(q, lim);
    return searchFalabella(q, lim);
  }

  async function doSearch(q, plat, lim = STEP) {
    if (!q.trim()) return;
    const activePlatform = plat ?? platform;

    if (activePlatform === 'amazon') {
      setResults([]);
      setError('amazon-blocked');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setLimit(lim);
    try {
      const data = await searchByPlatform(q, activePlatform, lim);
      setResults(data);
      if (!data.length) setError(t.noResults);
    } catch {
      setError(t.error);
    }
    setLoading(false);
  }

  async function handleLoadMore() {
    const newLimit = limit + STEP;
    setLoadingMore(true);
    try {
      const data = await searchByPlatform(query, platform, newLimit);
      setResults(data);
      setLimit(newLimit);
    } catch { /* silencioso */ }
    setLoadingMore(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    doSearch(query);
  }

  function pickSuggestion(s) {
    setQuery(s);
    doSearch(s);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setError('');
    setLimit(STEP);
    inputRef.current?.focus();
  }

  function switchPlatform(k) {
    setPlatform(k);
    if (query.trim()) {
      doSearch(query, k);
    } else if (k === 'amazon') {
      setError('amazon-blocked');
    } else {
      setError('');
    }
  }

  async function handleToggle(item) {
    setSaving(s => ({ ...s, [item.url]: true }));
    try {
      const currency = sourceCurrency(item.source);
      await addProduct({ name: item.name, url: item.url, source: item.source, initial_price: item.price, currency });
      onAdded(item);
    } catch { /* silencioso */ }
    setSaving(s => ({ ...s, [item.url]: false }));
  }

  return (
    <div>
      {/* Hero */}
      {showHero && (
        <section className="text-center pt-10 pb-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full mb-8 text-xs font-semibold">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>update</span>
            {t.badge}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4 leading-tight tracking-tight">
            {t.heroTitle}<br />
            <span className="text-primary">{t.heroAccent}</span>
          </h1>
          <p className="text-on-surface-variant text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            {t.heroSub}
          </p>
        </section>
      )}

      {/* Search bar */}
      <div className={showHero ? 'max-w-2xl mx-auto mb-8' : 'mb-6'}>
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center bg-surface border border-outline-variant rounded-xl p-2 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <span className="material-symbols-outlined text-outline ml-3" style={{ fontSize: 22 }}>search</span>
            <input
              ref={inputRef}
              type="text"
              placeholder={t.placeholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-on-surface placeholder:text-on-surface-variant text-base"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="text-outline hover:text-on-surface mr-2 transition-colors"
              >
                <Icon name="close" size={16} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? t.searching : t.trackNow}
            </button>
          </div>
        </form>

        {/* Platform toggle */}
        <div className="flex items-center gap-2 mt-3">
          {[
            { k: 'falabella',     label: 'Falabella',      color: '#006c49' },
            { k: 'mercadolibre', label: 'Mercado Libre',  color: '#ffe600' },
            { k: 'amazon',        label: 'Amazon',          color: '#ba1a1a' },
          ].map(o => (
            <button
              key={o.k}
              onClick={() => switchPlatform(o.k)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                platform === o.k
                  ? o.k === 'amazon'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline'
              }`}
            >
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: o.color }} />
              {o.label}
              {o.k === 'amazon' && (
                <span className="text-[10px] font-normal text-red-500/80 ml-0.5">
                  ({lang === 'en' ? 'blocked' : 'bloqueado'})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Popular suggestions */}
      {showHero && (
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mr-3">
            {t.suggested}:
          </span>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => pickSuggestion(s)}
              className="inline-block m-1 px-4 py-1.5 bg-surface-container rounded-full text-sm font-medium text-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-all"
            >
              #{s}
            </button>
          ))}
        </div>
      )}

      {/* Amazon blocked banner */}
      {error === 'amazon-blocked' && (
        <div className="mt-4 p-5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
          <span className="material-symbols-outlined text-red-600 mt-0.5 flex-none" style={{ fontSize: 24 }}>block</span>
          <div>
            <p className="text-sm font-bold text-red-700">{t.amazonTitle}</p>
            <p className="text-sm text-red-600/80 mt-1 leading-relaxed">{t.amazonMsg}</p>
          </div>
        </div>
      )}

      {/* Generic error */}
      {error && error !== 'amazon-blocked' && (
        <p className="text-error text-sm mt-4 font-medium">{error}</p>
      )}

      {/* Results */}
      {hasResults && (
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">{t.searchResults}</h2>
              <p className="text-on-surface-variant text-sm mt-1">
                {results.length} {t.items} · "{query}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item, i) => (
              <ProductCard
                key={item.url || i}
                item={item}
                lang={lang}
                isMonitored={monitoredUrls.includes(item.url)}
                onToggle={handleToggle}
                saving={saving[item.url]}
              />
            ))}
          </div>

          {canLoadMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-2.5 border border-outline-variant rounded-lg text-secondary font-semibold hover:bg-surface-container-low transition-all disabled:opacity-50"
              >
                {loadingMore ? t.loadingMore : t.loadMore}
              </button>
            </div>
          )}

          {limit >= MAX_LIMIT && results.length >= MAX_LIMIT && (
            <p className="text-center text-on-surface-variant text-xs mt-4">
              {lang === 'en'
                ? 'No more results to show. Try a more specific search term.'
                : 'No hay más resultados para mostrar. Prueba con un término más específico.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
