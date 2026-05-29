import { useEffect, useState, useCallback } from 'react';
import { getProducts, getPriceHistory, deleteProduct, setProductTarget, triggerUpdate } from '../services/api';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Thumb from '../components/Thumb';
import PlatformTag from '../components/PlatformTag';
import PriceChart from '../components/PriceChart';
import { money, fmtDate } from '../utils/format';

const NOTIF_KEY = 'pt_notified';
function loadNotified() { try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'); } catch { return {}; } }
function saveNotified(n) { localStorage.setItem(NOTIF_KEY, JSON.stringify(n)); }

const T = {
  es: { title: 'Mis productos', sub: 'monitoreando', current: 'Precio actual', target: 'Objetivo', change: '% cambio', lowest: 'Mín. histórico', setTarget: 'Editar objetivo', goto: 'Ir a la tienda', remove: 'Dejar de monitorear', reached: '¡Objetivo alcanzado!', good: 'Buen momento para comprar', wait: 'Espera una bajada', away: 'a tu objetivo', alertOn: 'Alerta activa', emptyTitle: 'Aún no monitoreas ningún producto', emptySub: 'Busca un producto y toca "Monitorear". Verás aquí su gráfico de precios y te avisaremos cuando baje de tu objetivo.', emptyCta: 'Buscar productos', updating: 'Actualizando precios…', update: '↻ Actualizar', targetTitle: 'Precio objetivo', targetHint: 'Te avisaremos cuando el precio baje de este valor.', save: 'Guardar', cancel: 'Cancelar' },
  en: { title: 'My products', sub: 'monitoring', current: 'Current price', target: 'Target', change: '% change', lowest: 'All-time low', setTarget: 'Edit target', goto: 'Go to store', remove: 'Stop monitoring', reached: 'Target reached!', good: 'Good time to buy', wait: 'Better to wait', away: 'from your target', alertOn: 'Alert on', emptyTitle: "You're not monitoring any product yet", emptySub: "Search a product and tap \"Monitor\". You'll see its price chart and we'll alert you when it drops below your target.", emptyCta: 'Search products', updating: 'Updating prices…', update: '↻ Update', targetTitle: 'Target price', targetHint: "We'll alert you when the price drops below this value.", save: 'Save', cancel: 'Cancel' },
};

function TargetModal({ product, lang, onClose, onSave }) {
  const t = T[lang];
  const price = parseFloat(product.price) || 0;
  const [val, setVal] = useState(product.target_price ?? Math.round(price * 0.9));
  const currency = product.source === 'amazon' ? 'USD' : 'PEN';
  return (
    <div className="pt-modal-scrim" onClick={onClose}>
      <div className="pt-modal" onClick={e => e.stopPropagation()}>
        <div className="pt-modal-head">
          <Icon name="target" size={20} />
          <h3>{t.targetTitle}</h3>
          <button className="pt-icon-btn" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="pt-modal-prod">
          <Thumb name={product.name} size={40} radius={11} />
          <span style={{ marginLeft: 10 }}>{product.name.slice(0, 60)}{product.name.length > 60 ? '…' : ''}</span>
        </div>
        <div className="pt-modal-input">
          <span className="pt-modal-cur">{currency === 'USD' ? '$' : 'S/'}</span>
          <input type="number" value={val} onChange={e => setVal(Number(e.target.value))} autoFocus />
        </div>
        <input type="range" className="pt-modal-range" min={Math.round(price * 0.5)} max={Math.round(price * 1.2)} step="1" value={val} onChange={e => setVal(Number(e.target.value))} />
        <div className="pt-modal-scale">
          <span>{money(Math.round(price * 0.5), currency)}</span>
          <span className="pt-dim">{lang === 'en' ? 'now' : 'ahora'} {money(price, currency)}</span>
          <span>{money(Math.round(price * 1.2), currency)}</span>
        </div>
        <p className="pt-modal-hint">{t.targetHint}</p>
        <div className="pt-modal-actions">
          <Button variant="ghost" onClick={onClose}>{t.cancel}</Button>
          <Button variant="primary" icon="check" onClick={() => onSave(val)}>{t.save}</Button>
        </div>
      </div>
    </div>
  );
}

function MonitorCard({ product, history, lang, onRemove, onTarget }) {
  const t = T[lang];
  const currency = product.source === 'amazon' ? 'USD' : 'PEN';
  const price = parseFloat(product.price) || 0;
  const target = product.target_price ? parseFloat(product.target_price) : null;
  const prices = history.map(h => parseFloat(h.price));
  const minPrice = prices.length ? Math.min(...prices) : price;
  const firstPrice = prices[0] || price;
  const changePct = firstPrice ? ((price - firstPrice) / firstPrice) * 100 : 0;
  const reached = target != null && price <= target;
  const good = !reached && target != null && price <= target * 1.05;
  const status = reached ? 'reached' : good ? 'good' : 'wait';
  const awayPct = target ? Math.abs(((price - target) / target) * 100) : null;

  return (
    <div className={`pt-card status-${status}`}>
      <div className="pt-card-top">
        <Thumb name={product.name} size={52} radius={13} />
        <div className="pt-card-id">
          <div className="pt-card-tags">
            <PlatformTag platform={product.source} size="sm" />
            <span className="pt-since">{lang === 'en' ? 'Since' : 'Desde'} {fmtDate(new Date(product.created_at).getTime(), lang)}</span>
          </div>
          <div className="pt-card-name">{product.name}</div>
        </div>
        <button className="pt-icon-btn pt-remove" title={t.remove} onClick={() => onRemove(product.id)}>
          <Icon name="trash" size={17} />
        </button>
      </div>

      <div className={`pt-status-banner banner-${status}`}>
        <Icon name={reached ? 'check' : good ? 'arrowDown' : 'arrowUp'} size={15} />
        <span>{reached ? t.reached : good ? t.good : t.wait}</span>
        {!reached && awayPct != null && (
          <span className="pt-status-extra">· {awayPct.toFixed(1)}% {t.away}</span>
        )}
      </div>

      <PriceChart history={history} target={target} currency={currency} lang={lang} height={200} />

      <div className="pt-stats-row">
        <div className="pt-stat">
          <div className="pt-stat-label">{t.current}</div>
          <div className="pt-stat-val pt-mono">{money(price, currency)}</div>
        </div>
        <div className={`pt-stat ${changePct <= 0 ? 'tone-down' : 'tone-up'}`}>
          <div className="pt-stat-label">{t.change}</div>
          <div className="pt-stat-val pt-mono">{changePct <= 0 ? '▼' : '▲'} {Math.abs(changePct).toFixed(1)}%</div>
        </div>
        <div className="pt-stat">
          <div className="pt-stat-label">{t.target}</div>
          <div className="pt-stat-val">
            <button className="pt-target-btn" onClick={() => onTarget(product)}>
              <Icon name="target" size={14} />
              <span className="pt-mono">{target != null ? money(target, currency) : '—'}</span>
            </button>
          </div>
        </div>
        <div className="pt-stat">
          <div className="pt-stat-label">{t.lowest}</div>
          <div className="pt-stat-val pt-mono pt-dim">{money(minPrice, currency)}</div>
        </div>
      </div>

      <div className="pt-card-foot">
        <span className={`pt-alert-chip${reached ? ' is-on' : ''}`}>
          <Icon name="bell" size={14} /> {t.alertOn} · {target != null ? money(target, currency) : '—'}
        </span>
        <Button variant="ghost" size="sm" icon="external" href={product.url} target="_blank">{t.goto}</Button>
      </div>
    </div>
  );
}

export default function Dashboard({ lang, goSearch, refreshTrigger, onAlertCount }) {
  const t = T[lang];
  const [products, setProducts] = useState([]);
  const [histories, setHistories] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [targetModal, setTargetModal] = useState(null);

  const computeAlerts = useCallback((prods) => {
    const count = prods.filter(p => {
      const price = parseFloat(p.price);
      const target = parseFloat(p.target_price);
      return target && price && price <= target;
    }).length;
    onAlertCount?.(count);
  }, [onAlertCount]);

  function triggerBrowserNotifications(prods) {
    if (!('Notification' in window)) return;
    const notified = loadNotified();
    const drops = prods.filter(p => {
      const price = parseFloat(p.price);
      const target = parseFloat(p.target_price);
      if (!target || !price || price > target) return false;
      return notified[p.id] !== price; // only notify if price changed since last time
    });
    if (!drops.length) return;

    const notify = () => {
      drops.forEach(p => {
        const currency = p.source === 'amazon' ? 'USD' : 'PEN';
        const symbol = currency === 'USD' ? '$' : 'S/';
        new Notification('¡Precio objetivo alcanzado! 🎯', {
          body: `${p.name.slice(0, 60)} bajó a ${symbol} ${parseFloat(p.price).toLocaleString('es-PE')}`,
          icon: '/vite.svg',
        });
      });
      const updated = { ...notified };
      drops.forEach(p => { updated[p.id] = parseFloat(p.price); });
      saveNotified(updated);
    };

    if (Notification.permission === 'granted') {
      notify();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => { if (perm === 'granted') notify(); });
    }
  }

  async function loadAll() {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    computeAlerts(data);
    triggerBrowserNotifications(data);
    const hMap = {};
    await Promise.all(data.map(async p => {
      try { hMap[p.id] = await getPriceHistory(p.id); } catch { hMap[p.id] = []; }
    }));
    setHistories(hMap);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [refreshTrigger]);

  async function handleUpdate() {
    setUpdating(true);
    await triggerUpdate();
    setTimeout(() => { setUpdating(false); loadAll(); }, 40000);
  }

  async function handleRemove(id) {
    setProducts(ps => {
      const next = ps.filter(p => p.id !== id);
      computeAlerts(next);
      return next;
    });
    try { await deleteProduct(id); } catch { /* silencioso */ }
  }

  async function saveTarget(val) {
    const id = targetModal.id;
    try {
      await setProductTarget(id, val);
      setProducts(ps => {
        const next = ps.map(p => p.id === id ? { ...p, target_price: val } : p);
        computeAlerts(next);
        return next;
      });
    } catch { /* silencioso */ }
    setTargetModal(null);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Cargando…</div>;

  if (products.length === 0) {
    return (
      <div className="pt-empty">
        <div className="pt-empty-art">
          <svg viewBox="0 0 200 130" width="220" height="143" aria-hidden="true">
            <defs>
              <linearGradient id="emptyGrad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0.05" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <line x1="20" y1="20" x2="20" y2="110" stroke="var(--border)" strokeWidth="1.5" />
            <line x1="20" y1="110" x2="185" y2="110" stroke="var(--border)" strokeWidth="1.5" />
            {[35, 65, 95].map(yy => <line key={yy} x1="20" y1={yy} x2="185" y2={yy} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />)}
            <path d="M20 90 L55 78 L85 95 L120 55 L150 62 L185 30 L185 110 L20 110 Z" fill="url(#emptyGrad)" />
            <path d="M20 90 L55 78 L85 95 L120 55 L150 62 L185 30" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="185" cy="30" r="4.5" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
            <line x1="20" y1="48" x2="185" y2="48" stroke="var(--accent)" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.6" />
          </svg>
        </div>
        <h2 className="pt-empty-title">{t.emptyTitle}</h2>
        <p className="pt-empty-sub">{t.emptySub}</p>
        <Button variant="primary" icon="search" onClick={goSearch}>{t.emptyCta}</Button>
      </div>
    );
  }

  return (
    <div className="pt-my">
      <div className="pt-my-head">
        <h1 className="pt-my-title">{t.title}</h1>
        <span className="pt-my-count">{products.length} {t.sub}</span>
        <button className="pt-btn pt-btn-sm pt-btn-ghost" style={{ marginLeft: 'auto' }} onClick={handleUpdate} disabled={updating}>
          <Icon name="refresh" size={15} />
          {updating ? t.updating : t.update}
        </button>
      </div>
      <div className="pt-cards">
        {products.map(p => (
          <MonitorCard
            key={p.id}
            product={p}
            history={histories[p.id] || []}
            lang={lang}
            onRemove={handleRemove}
            onTarget={setTargetModal}
          />
        ))}
      </div>

      {targetModal && (
        <TargetModal product={targetModal} lang={lang} onClose={() => setTargetModal(null)} onSave={saveTarget} />
      )}
    </div>
  );
}
