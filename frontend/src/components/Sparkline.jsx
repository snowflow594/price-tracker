import { useMemo } from 'react';

export default function Sparkline({ history = [], width = 110, height = 36, down = true }) {
  const pts = history.map(h => parseFloat(h.price || h.p));
  const gid = useMemo(() => 'spk' + Math.random().toString(36).slice(2, 8), []);
  if (pts.length < 2) return null;
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  const stepX = width / (pts.length - 1);
  const coords = pts.map((p, i) => [i * stepX, height - ((p - min) / range) * (height - 4) - 2]);
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const color = down ? 'var(--down)' : 'var(--up)';
  return (
    <svg width={width} height={height} className="pt-spark" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
