export default function Logo({ size = 30 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id="lg-tag" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <path d="M20.5 3.2 35 8.2a2 2 0 0 1 1.3 1.9V24a4 4 0 0 1-1.2 2.8L22.4 39.6a3 3 0 0 1-4.2 0L3.4 24.9a3 3 0 0 1 0-4.2L16.2 7.9A4 4 0 0 1 19 6.7"
          fill="none" stroke="url(#lg-tag)" strokeWidth="2.4" strokeLinejoin="round" opacity="0.9" />
        <circle cx="27.5" cy="12.5" r="2.4" fill="none" stroke="url(#lg-tag)" strokeWidth="2.2" />
        <path d="M11 26.5 16.5 21l4 3.2L28 16" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24.4 16h3.6v3.6" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text)', letterSpacing: '-0.02em' }}>
        Price Tracker
      </span>
    </div>
  );
}
