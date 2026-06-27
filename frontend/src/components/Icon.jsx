export default function Icon({ name, size = 20, className = '', style }) {
  const s = { width: size, height: size, ...style };
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" {...c} /><line x1="16.5" y1="16.5" x2="21" y2="21" {...c} /></>,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" {...c} /><path d="M10 20a2 2 0 0 0 4 0" {...c} /></>,
    bookmark: <path d="M6 4h12v16l-6-4-6 4Z" {...c} />,
    trash: <><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" {...c} /></>,
    external: <><path d="M14 5h5v5M19 5l-8 8M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" {...c} /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7" {...c} />,
    arrowDown: <path d="M12 5v14M6 13l6 6 6-6" {...c} />,
    arrowUp: <path d="M12 19V5M6 11l6-6 6 6" {...c} />,
    target: <><circle cx="12" cy="12" r="8" {...c} /><circle cx="12" cy="12" r="3.5" {...c} /></>,
    swap: <><path d="M7 7h12l-3-3M17 17H5l3 3" {...c} /></>,
    sparkle: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" {...c} />,
    close: <path d="M6 6l12 12M18 6L6 18" {...c} />,
    plus: <path d="M12 5v14M5 12h14" {...c} />,
    refresh: <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" {...c} />,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2" {...c} /><path d="M2 8l10 6 10-6" {...c} /></>,
    github: <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" {...c} />,
  };
  return (
    <svg viewBox="0 0 24 24" style={s} className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
