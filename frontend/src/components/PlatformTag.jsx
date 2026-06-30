export default function PlatformTag({ platform, size = 'md' }) {
  const map = {
    amazon: { label: 'Amazon', cls: 'tag-amazon' },
    falabella: { label: 'Falabella', cls: 'tag-falabella' },
  };
  const m = map[platform] || map.falabella;
  return (
    <span className={`pt-tag ${m.cls} ${size === 'sm' ? 'pt-tag-sm' : ''}`}>
      <span className="pt-tag-dot" />
      {m.label}
    </span>
  );
}
