import { useState, useRef, useEffect, useMemo } from 'react';
import { money, fmtDate } from '../utils/format';

export default function PriceChart({ history = [], target, currency = 'PEN', lang = 'es', height = 220 }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(600);
  const [range, setRange] = useState(90);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => setW(entries[0].contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Normalizar formato: API devuelve {price, scraped_at}, diseño usa {p, t}
  const normalized = useMemo(() =>
    history.map(h => ({
      p: parseFloat(h.price ?? h.p),
      t: h.scraped_at ? new Date(h.scraped_at).getTime() : (h.t ?? Date.now()),
    })), [history]);

  const data = useMemo(() => normalized.slice(Math.max(0, normalized.length - range)), [normalized, range]);

  if (data.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-faint)', fontSize: 13 }}>
        {lang === 'en' ? 'Chart will appear after the next automatic update.' : 'El gráfico aparecerá tras la próxima actualización automática.'}
      </div>
    );
  }

  const padL = 60, padR = 16, padT = 16, padB = 26;
  const plotW = Math.max(10, w - padL - padR);
  const plotH = height - padT - padB;

  const prices = data.map(d => d.p);
  const lo = Math.min(...prices, target ?? Infinity);
  const hi = Math.max(...prices, target ?? -Infinity);
  const pad = (hi - lo) * 0.12 || 1;
  const yMin = lo - pad, yMax = hi + pad;
  const yRange = yMax - yMin || 1;

  const x = i => padL + (i / (data.length - 1)) * plotW;
  const y = p => padT + (1 - (p - yMin) / yRange) * plotH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.p).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${x(data.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${padL},${(padT + plotH).toFixed(1)} Z`;

  const current = prices[prices.length - 1];
  const goingDown = current <= prices[0];
  const color = goingDown ? 'var(--down)' : 'var(--up)';

  const minIdx = prices.indexOf(Math.min(...prices));
  const maxIdx = prices.indexOf(Math.max(...prices));
  const yticks = [0, 0.33, 0.66, 1].map(f => yMin + f * yRange);

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - padL) / plotW) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  const gid = useMemo(() => 'pc' + Math.random().toString(36).slice(2, 8), []);
  const ranges = [{ d: 7, l: '7D' }, { d: 30, l: '30D' }, { d: 90, l: '90D' }];

  return (
    <div className="pt-chart" ref={wrapRef}>
      <div className="pt-chart-ranges">
        {ranges.map(r => (
          <button key={r.d} className={`pt-range${range === r.d ? ' is-active' : ''}`} onClick={() => setRange(r.d)}>{r.l}</button>
        ))}
      </div>
      <svg width={w} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: 'block', cursor: 'crosshair' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.26" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yticks.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={y(v)} x2={w - padR} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={padL - 8} y={y(v) + 4} textAnchor="end" className="pt-axis">{money(v, currency)}</text>
          </g>
        ))}
        {target != null && (
          <g>
            <line x1={padL} y1={y(target)} x2={w - padR} y2={y(target)} stroke="var(--accent)" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.85" />
            <rect x={w - padR - 78} y={y(target) - 9} width="78" height="18" rx="5" fill="var(--accent)" opacity="0.16" />
            <text x={w - padR - 39} y={y(target) + 4} textAnchor="middle" className="pt-target-label">{lang === 'en' ? 'Target' : 'Objetivo'}</text>
          </g>
        )}
        <path d={areaPath} fill={`url(#${gid})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(minIdx)} cy={y(prices[minIdx])} r="3.5" fill="var(--down)" stroke="var(--bg)" strokeWidth="2" />
        <text x={x(minIdx)} y={y(prices[minIdx]) + 18} textAnchor="middle" className="pt-extreme">{money(prices[minIdx], currency)}</text>
        <circle cx={x(maxIdx)} cy={y(prices[maxIdx])} r="3.5" fill="var(--up)" stroke="var(--bg)" strokeWidth="2" />
        <text x={x(maxIdx)} y={y(prices[maxIdx]) - 10} textAnchor="middle" className="pt-extreme">{money(prices[maxIdx], currency)}</text>
        <circle cx={x(data.length - 1)} cy={y(current)} r="4" fill={color} stroke="var(--bg)" strokeWidth="2" />
        {hover != null && (
          <g>
            <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + plotH} stroke="var(--text-faint)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover].p)} r="4.5" fill="var(--text)" stroke={color} strokeWidth="2.5" />
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="pt-chart-tip" style={{ left: Math.max(8, Math.min(w - 130, x(hover) - 60)) }}>
          <div className="pt-chart-tip-price">{money(data[hover].p, currency)}</div>
          <div className="pt-chart-tip-date">{fmtDate(data[hover].t, lang)}</div>
        </div>
      )}
    </div>
  );
}
