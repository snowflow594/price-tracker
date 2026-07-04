import { useEffect, useState, useCallback } from 'react';
import { getProducts, getPriceHistory, deleteProduct, setProductTarget, triggerUpdate } from '../services/api';
import Icon from '../components/Icon';
import Sparkline from '../components/Sparkline';
import PriceChart from '../components/PriceChart';
import { money, fmtDate, thumbHue } from '../utils/format';

const T = {
  es: {
    title: 'Mis Productos',
    subtitle: n => `Monitoreando ${n} producto${n !== 1 ? 's' : ''}`,
    colProduct: 'Producto',
    colPrice: 'Precio actual',
    colTrend: 'Tendencia 7D',
    colActions: 'Acciones',
    statProducts: 'Monitoreando',
    statAlerts: 'Alertas config.',
    statReached: 'Objetivos alcanzados',
    statAuto: 'Actualización',
    statAutoVal: 'Automática (6h)',
    viewChart: 'Ver gráfico',
    remove: 'Eliminar',
    goto: 'Ir a la tienda',
    setTarget: 'Fijar objetivo',
    update: 'Actualizar',
    updating: 'Actualizando…',
    addProduct: 'Buscar producto',
    emptyTitle: 'Tu watchlist está vacía',
    emptySub: 'Busca un producto y toca "Guardar en watchlist". Aquí verás su historial de precios y te avisaremos cuando baje de tu objetivo.',
    emptyCta: 'Buscar productos',
    targetTitle: 'Precio objetivo',
    targetHint: 'Te avisaremos por email cuando el precio baje de este valor.',
    save: 'Guardar',
    cancel: 'Cancelar',
    chartTitle: 'Historial de precios',
    inStock: 'Disponible',
    loading: 'Cargando…',
    deleteError: 'Error al eliminar el producto',
    targetError: 'Error al guardar el objetivo',
    target: 'Objetivo',
    currentPrice: 'Precio actual',
    historicalLow: 'Mín. histórico',
    tapToEdit: 'toca para editar',
    since: 'desde',
    now: 'ahora',
  },
  en: {
    title: 'My Watchlist',
    subtitle: n => `Monitoring ${n} product${n !== 1 ? 's' : ''}`,
    colProduct: 'Product',
    colPrice: 'Current Price',
    colTrend: '7-Day Trend',
    colActions: 'Actions',
    statProducts: 'Monitoring',
    statAlerts: 'Alerts set',
    statReached: 'Targets reached',
    statAuto: 'Updates',
    statAutoVal: 'Automatic (6h)',
    viewChart: 'View chart',
    remove: 'Remove',
    goto: 'Go to store',
    setTarget: 'Set target',
    update: 'Update',
    updating: 'Updating…',
    addProduct: 'Search product',
    emptyTitle: 'Your watchlist is empty',
    emptySub: "Search for a product and tap \"Save to Watchlist\". You'll see its price history and we'll alert you when it drops below your target.",
    emptyCta: 'Search products',
    targetTitle: 'Target price',
    targetHint: "We'll alert you by email when the price drops below this value.",
    save: 'Save',
    cancel: 'Cancel',
    chartTitle: 'Price History',
    inStock: 'In Stock',
    loading: 'Loading…',
    deleteError: 'Failed to remove product',
    targetError: 'Failed to save target price',
    target: 'Target',
    currentPrice: 'Current price',
    historicalLow: 'All-time low',
    tapToEdit: 'tap to edit',
    since: 'since',
    now: 'now',
  },
};

/* ── Target price modal ── */
function TargetModal({ product, lang, onClose, onSave }) {
  const t = T[lang];
  const price = parseFloat(product.price) || 0;
  const currency = product.source === 'amazon' ? 'USD' : 'PEN';
  const [val, setVal] = useState(product.target_price ?? Math.round(price * 0.9));

  return (
    <div className="pt-modal-scrim" onClick={onClose}>
      <div className="pt-modal" onClick={e => e.stopPropagation()}>
        <div className="pt-modal-head">
          <Icon name="target" size={20} />
          <h3>{t.targetTitle}</h3>
          <button onClick={onClose} className="text-outline hover:text-on-surface transition-colors ml-auto">
            <Icon name="close" size={18} />
          </button>
        </div>

        <p className="text-sm text-on-surface-variant mb-5 line-clamp-2">{product.name}</p>

        <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-xl p-4 mb-4">
          <span className="font-mono text-xl font-bold text-on-surface-variant">
            {currency === 'USD' ? '$' : 'S/'}
          </span>
          <input
            type="number"
            value={val}
            onChange={e => setVal(Number(e.target.value))}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none font-mono text-2xl font-bold text-on-surface"
          />
        </div>

        <input
          type="range"
          className="pt-modal-range"
          min={Math.round(price * 0.5)}
          max={Math.round(price * 1.2)}
          step="1"
          value={val}
          onChange={e => setVal(Number(e.target.value))}
        />
        <div className="pt-modal-scale">
          <span>{money(Math.round(price * 0.5), currency)}</span>
          <span>{t.now} {money(price, currency)}</span>
          <span>{money(Math.round(price * 1.2), currency)}</span>
        </div>

        <p className="text-sm text-on-surface-variant mb-5">{t.targetHint}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={() => onSave(val)}
            className="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Full chart modal ── */
function ChartModal({ product, history, lang, onClose, onOpenTarget }) {
  const t = T[lang];
  const currency = product.source === 'amazon' ? 'USD' : 'PEN';
  const target = product.target_price ? parseFloat(product.target_price) : null;
  const prices = history.map(h => parseFloat(h.price));
  const minPrice = prices.length ? Math.min(...prices) : null;
  const currentPrice = parseFloat(product.price) || 0;

  return (
    <div className="pt-modal-scrim" onClick={onClose}>
      <div
        className="pt-modal"
        style={{ maxWidth: 680 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pt-modal-head">
          <Icon name="sparkle" size={20} />
          <h3>{t.chartTitle}</h3>
          <button onClick={onClose} className="text-outline hover:text-on-surface transition-colors ml-auto">
            <Icon name="close" size={18} />
          </button>
        </div>

        <p className="text-sm text-on-surface-variant mb-4 line-clamp-1">{product.name}</p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: t.currentPrice, val: money(currentPrice, currency), color: 'text-on-surface' },
            { label: t.historicalLow, val: minPrice != null ? money(minPrice, currency) : '—', color: 'text-primary' },
            {
              label: t.target,
              val: target != null ? money(target, currency) : '—',
              color: 'text-secondary',
              action: () => onOpenTarget(product),
            },
          ].map(stat => (
            <div
              key={stat.label}
              className={`bg-surface-container-low border border-outline-variant rounded-xl p-3 ${stat.action ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
              onClick={stat.action}
            >
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.val}</p>
              {stat.action && <p className="text-[10px] text-on-surface-variant mt-0.5">{t.tapToEdit}</p>}
            </div>
          ))}
        </div>

        <PriceChart history={history} target={target} currency={currency} lang={lang} height={220} />

        <div className="mt-4 flex justify-end">
          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-secondary hover:bg-surface-container-low transition-colors"
          >
            <Icon name="external" size={15} />
            {t.goto}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Watchlist row ── */
function WatchlistRow({ product, history, lang, onRemove, onTarget, onViewChart }) {
  const t = T[lang];
  const currency = product.source === 'amazon' ? 'USD' : 'PEN';
  const price = parseFloat(product.price) || 0;
  const target = product.target_price ? parseFloat(product.target_price) : null;
  const reached = target != null && price <= target;

  const prices = history.map(h => parseFloat(h.price));
  const firstPrice = prices[0] || price;
  const changePct = firstPrice ? ((price - firstPrice) / firstPrice) * 100 : 0;
  const priceDown = changePct <= 0;

  const hue = thumbHue(product.name);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant last:border-0">

      {/* Product (cols 1-5) */}
      <div className="md:col-span-5 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-lg flex-none flex items-center justify-center text-lg font-bold border border-outline-variant/50"
          style={{
            background: `linear-gradient(150deg, hsl(${hue} 30% 94%), hsl(${hue} 25% 90%))`,
            color: `hsl(${hue} 40% 60%)`,
          }}
        >
          {product.name.trim()[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-on-surface text-sm truncate">{product.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {reached ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {lang === 'en' ? '🎯 Target reached!' : '🎯 ¡Objetivo alcanzado!'}
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                {t.inStock}
              </span>
            )}
            <span className="text-[11px] text-on-surface-variant">
              {t.since} {fmtDate(new Date(product.created_at).getTime(), lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Price (cols 6-7) */}
      <div className="md:col-span-2 md:text-right">
        <p className="text-lg font-bold text-on-surface font-mono">{money(price, currency)}</p>
        <p className={`text-xs font-semibold flex items-center md:justify-end gap-0.5 mt-0.5 ${priceDown ? 'text-primary-container' : 'text-error'}`}>
          <Icon name={priceDown ? 'arrowDown' : 'arrowUp'} size={12} />
          {Math.abs(changePct).toFixed(1)}%
        </p>
      </div>

      {/* Sparkline (cols 8-9) */}
      <div className="md:col-span-2 flex justify-center">
        {prices.length >= 2
          ? <Sparkline history={history} width={80} height={28} down={priceDown} />
          : <span className="text-xs text-on-surface-variant">—</span>
        }
      </div>

      {/* Actions (cols 10-12) */}
      <div className="md:col-span-3 flex items-center justify-end gap-3">
        <button
          onClick={() => onTarget(product)}
          title={t.setTarget}
          className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <Icon name="target" size={14} />
          {target != null ? money(target, currency) : t.setTarget}
        </button>
        <button
          onClick={() => onViewChart(product)}
          className="text-sm font-semibold text-secondary hover:underline transition-colors whitespace-nowrap"
        >
          {t.viewChart}
        </button>
        <button
          onClick={() => onRemove(product.id)}
          className="p-1.5 text-on-surface-variant hover:text-error transition-colors"
          title={t.remove}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard({ lang, goSearch, refreshTrigger, onAlertCount, onToast }) {
  const t = T[lang];
  const [products, setProducts] = useState([]);
  const [histories, setHistories] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [targetModal, setTargetModal] = useState(null);
  const [chartModal, setChartModal] = useState(null);

  const computeAlerts = useCallback((prods) => {
    const count = prods.filter(p => {
      const price = parseFloat(p.price);
      const target = parseFloat(p.target_price);
      return target && price && price <= target;
    }).length;
    onAlertCount?.(count);
  }, [onAlertCount]);

  async function loadAll() {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    computeAlerts(data);
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
    const snapshot = Object.fromEntries(products.map(p => [p.id, String(p.price)]));
    await triggerUpdate();

    let elapsed = 0;
    const poll = setInterval(async () => {
      elapsed += 5000;
      try {
        const data = await getProducts();
        const changed = data.some(p => String(p.price) !== snapshot[p.id]);
        if (changed || elapsed >= 90000) {
          clearInterval(poll);
          setProducts(data);
          computeAlerts(data);
          const hMap = {};
          await Promise.all(data.map(async p => {
            try { hMap[p.id] = await getPriceHistory(p.id); } catch { hMap[p.id] = []; }
          }));
          setHistories(hMap);
          setUpdating(false);
        }
      } catch {
        if (elapsed >= 90000) { clearInterval(poll); setUpdating(false); }
      }
    }, 5000);
  }

  async function handleRemove(id) {
    const removed = products.find(p => p.id === id);
    setProducts(ps => {
      const next = ps.filter(p => p.id !== id);
      computeAlerts(next);
      return next;
    });
    try {
      await deleteProduct(id);
    } catch {
      setProducts(ps => {
        const next = [...ps, removed].sort((a, b) => a.id - b.id);
        computeAlerts(next);
        return next;
      });
      onToast?.(t.deleteError, 'error');
    }
  }

  async function saveTarget(val) {
    const id = targetModal.id;
    setTargetModal(null);
    try {
      await setProductTarget(id, val);
      setProducts(ps => {
        const next = ps.map(p => p.id === id ? { ...p, target_price: val } : p);
        computeAlerts(next);
        return next;
      });
    } catch {
      onToast?.(t.targetError, 'error');
    }
  }

  const totalProducts = products.length;
  const alertsSet = products.filter(p => p.target_price != null).length;
  const targetsReached = products.filter(p => {
    const price = parseFloat(p.price);
    const target = parseFloat(p.target_price);
    return target && price && price <= target;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin mr-2" style={{ fontSize: 20 }}>refresh</span>
        {t.loading}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center max-w-sm mx-auto py-20">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-5">
          <Icon name="bookmark" size={28} className="text-outline" />
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-3">{t.emptyTitle}</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-6">{t.emptySub}</p>
        <button
          onClick={goSearch}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
        >
          <Icon name="search" size={16} />
          {t.emptyCta}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">{t.title}</h1>
          <p className="text-on-surface-variant text-sm mt-1">{t.subtitle(totalProducts)}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={goSearch}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-secondary hover:bg-surface-container-low transition-colors"
          >
            <Icon name="plus" size={16} />
            {t.addProduct}
          </button>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Icon name="refresh" size={16} />
            {updating ? t.updating : t.update}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: t.statProducts, value: totalProducts, color: 'text-on-surface' },
          { label: t.statAlerts,   value: alertsSet,     color: 'text-primary' },
          {
            label: t.statReached,
            value: targetsReached,
            color: targetsReached > 0 ? 'text-tertiary' : 'text-on-surface',
            highlight: targetsReached > 0,
          },
          { label: t.statAuto, value: t.statAutoVal, color: 'text-on-surface-variant', small: true },
        ].map(stat => (
          <div
            key={stat.label}
            className={`bg-surface border border-outline-variant rounded-xl p-4 ${stat.highlight ? 'border-l-4 border-l-primary' : ''}`}
          >
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`font-bold ${stat.small ? 'text-sm mt-1' : 'text-2xl'} ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Watchlist table */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {/* Header — desktop only */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest">
          <div className="col-span-5">{t.colProduct}</div>
          <div className="col-span-2 text-right">{t.colPrice}</div>
          <div className="col-span-2 text-center">{t.colTrend}</div>
          <div className="col-span-3 text-right">{t.colActions}</div>
        </div>

        {products.map(p => (
          <WatchlistRow
            key={p.id}
            product={p}
            history={histories[p.id] || []}
            lang={lang}
            onRemove={handleRemove}
            onTarget={setTargetModal}
            onViewChart={setChartModal}
          />
        ))}
      </div>

      {targetModal && (
        <TargetModal
          product={targetModal}
          lang={lang}
          onClose={() => setTargetModal(null)}
          onSave={saveTarget}
        />
      )}

      {chartModal && (
        <ChartModal
          product={chartModal}
          history={histories[chartModal.id] || []}
          lang={lang}
          onClose={() => setChartModal(null)}
          onOpenTarget={prod => { setChartModal(null); setTargetModal(prod); }}
        />
      )}
    </div>
  );
}
