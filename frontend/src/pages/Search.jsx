import { useState, useRef } from 'react';
import { searchFalabella, searchAmazon, addProduct } from '../services/api';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Thumb from '../components/Thumb';
import PlatformTag from '../components/PlatformTag';
import { money } from '../utils/format';

const STEP = 10;
const MAX_LIMIT = 30;

const T = {
  es: {
    heroTitle: 'Rastrea cualquier precio.', heroAccent: 'Compra en el momento justo.',
    heroSub: 'Busca un producto en Falabella o Amazon, agrégalo a monitoreo y te avisamos cuando baje de tu precio objetivo.',
    placeholder: 'Busca un producto… ej. "laptop", "iPhone 15", "auriculares"',
    results: 'resultados', monitor: 'Monitorear', monitoring: 'Monitoreando',
    view: 'Ver', suggested: 'Búsquedas populares', searching: 'Buscando…',
    loadingMore: 'Cargando más…', loadMore: 'Ver más resultados',
    error: 'Error al buscar. Intenta de nuevo.', noResults: 'Sin resultados. Intenta con otro término.',
    blockedAmazon: 'Amazon bloquea búsquedas desde servidores cloud. Funciona en entorno local.',
  },
  en: {
    heroTitle: 'Track any price.', heroAccent: 'Buy at the right moment.',
    heroSub: "Search a product on Falabella or Amazon, add it to monitoring and we'll alert you when it drops below your target.",
    placeholder: 'Search a product… e.g. "laptop", "iPhone 15", "headphones"',
    results: 'results', monitor: 'Monitor', monitoring: 'Monitoring',
    view: 'View', suggested: 'Popular searches', searching: 'Searching…',
    loadingMore: 'Loading more…', loadMore: 'Load more results',
    error: 'Search error. Please try again.', noResults: 'No results. Try a different term.',
    blockedAmazon: 'Amazon blocks searches from cloud servers. Works in local environment.',
  },
};

const SUGGESTIONS = ['Laptop', 'iPhone', 'AirPods', 'Monitor', 'SSD', 'Teclado mecánico'];

function ResultRow({ item, lang, isMonitored, onToggle, saving }) {
  const t = T[lang];
  const currency = item.source === 'amazon' ? 'USD' : 'PEN';
  return (
    <div className="pt-result">
      <Thumb name={item.name} size={64} />
      <div className="pt-result-main">
        <div className="pt-result-tags">
          <PlatformTag platform={item.source} size="sm" />
        </div>
        <div className="pt-result-name">{item.name}</div>
      </div>
      <div className="pt-result-price">
        <div className="pt-price-now">{money(item.price, currency)}</div>
      </div>
      <div className="pt-result-actions">
        <Button
          variant={isMonitored ? 'success-ghost' : 'primary'}
          size="sm"
          icon={isMonitored ? 'check' : 'bell'}
          onClick={() => !isMonitored && onToggle(item)}
          disabled={saving || isMonitored}
        >
          {saving ? '…' : isMonitored ? t.monitoring : t.monitor}
        </Button>
        <Button variant="ghost" size="sm" icon="external" href={item.url} target="_blank">{t.view}</Button>
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

  const hasQuery = query.trim().length > 0;
  const canLoadMore = results.length >= limit && limit < MAX_LIMIT;

  async function doSearch(q, plat, lim = STEP) {
    if (!q.trim()) return;
    setLoading(true); setError(''); setResults([]); setLimit(lim);
    try {
      const fn = (plat || platform) === 'amazon' ? searchAmazon : searchFalabella;
      const data = await fn(q, lim);
      setResults(data);
      if (!data.length) setError(t.noResults);
    } catch (err) {
      const isBlocked = err?.response?.data?.blocked || err?.response?.status === 503;
      setError(isBlocked && (plat || platform) === 'amazon' ? t.blockedAmazon : t.error);
    }
    setLoading(false);
  }

  async function handleLoadMore() {
    const newLimit = limit + STEP;
    setLoadingMore(true);
    try {
      const fn = platform === 'amazon' ? searchAmazon : searchFalabella;
      const data = await fn(query, newLimit);
      setResults(data);
      setLimit(newLimit);
    } catch { /* silencioso */ }
    setLoadingMore(false);
  }

  function handleSubmit(e) { e.preventDefault(); doSearch(query); }
  function pickSuggestion(s) { setQuery(s); doSearch(s); }

  async function handleToggle(item) {
    setSaving(s => ({ ...s, [item.url]: true }));
    try {
      const currency = item.source === 'amazon' ? 'USD' : 'PEN';
      await addProduct({ name: item.name, url: item.url, source: item.source, initial_price: item.price, currency });
      onAdded(item);
    } catch { /* silencioso */ }
    setSaving(s => ({ ...s, [item.url]: false }));
  }

  function handleClear() {
    setQuery(''); setResults([]); setError(''); setLimit(STEP);
    inputRef.current?.focus();
  }

  return (
    <div className="pt-search-view">
      {!hasQuery && (
        <div className="pt-hero">
          <div className="pt-hero-badge"><Icon name="sparkle" size={14} /> {lang === 'en' ? 'Real-time price tracking' : 'Seguimiento de precios en tiempo real'}</div>
          <h1 className="pt-hero-title">{t.heroTitle}<br /><span className="pt-grad">{t.heroAccent}</span></h1>
          <p className="pt-hero-sub">{t.heroSub}</p>
        </div>
      )}

      <div className={`pt-searchbar-wrap${hasQuery ? ' compact' : ''}`}>
        <form style={{ width: '100%' }} onSubmit={handleSubmit}>
          <div className="pt-searchbar">
            <Icon name="search" size={22} className="pt-search-icon" />
            <input
              ref={inputRef}
              className="pt-search-input"
              placeholder={t.placeholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="pt-search-clear" onClick={handleClear}>
                <Icon name="close" size={16} />
              </button>
            )}
            <button type="submit" className="pt-btn pt-btn-md pt-btn-primary" disabled={loading || !query.trim()}>
              {loading ? t.searching : <Icon name="search" size={17} />}
            </button>
          </div>
        </form>

        <div className="pt-platform-toggle">
          {[{ k: 'falabella', l: 'Falabella' }, { k: 'amazon', l: 'Amazon' }].map(o => (
            <button key={o.k} className={`pt-plat plat-${o.k}${platform === o.k ? ' is-active' : ''}`}
              onClick={() => { setPlatform(o.k); if (hasQuery) doSearch(query, o.k); }}>
              <span className="pt-plat-dot" />{o.l}
            </button>
          ))}
        </div>
      </div>

      {!hasQuery && !loading && (
        <div className="pt-suggested">
          <span className="pt-suggested-label">{t.suggested}</span>
          <div className="pt-chips">
            {SUGGESTIONS.map(s => (
              <button key={s} className="pt-chip" onClick={() => pickSuggestion(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {error && <p style={{ color: 'var(--up)', fontSize: 14, margin: '16px 0' }}>{error}</p>}

      {results.length > 0 && (
        <div className="pt-results">
          <div className="pt-results-head">
            <span><b>{results.length}</b> {t.results} · "{query}"</span>
          </div>
          <div className="pt-results-list">
            {results.map((item, i) => (
              <ResultRow
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
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <Button variant="ghost" icon="plus" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? t.loadingMore : t.loadMore}
              </Button>
            </div>
          )}
          {limit >= MAX_LIMIT && results.length >= MAX_LIMIT && (
            <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, marginTop: 12 }}>
              {lang === 'en' ? 'Showing maximum results. Refine your search for more specific results.' : 'Mostrando el máximo de resultados. Refina tu búsqueda para resultados más específicos.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
