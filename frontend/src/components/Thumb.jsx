import { thumbHue } from '../utils/format';

export default function Thumb({ name = '', size = 56, radius = 14 }) {
  const hue = thumbHue(name);
  const glyph = name.trim()[0]?.toUpperCase() || '?';
  return (
    <div className="pt-thumb" style={{
      width: size, height: size, borderRadius: radius,
      background: `linear-gradient(150deg, oklch(0.32 0.07 ${hue}), oklch(0.22 0.05 ${hue}))`,
      color: `oklch(0.86 0.10 ${hue})`,
      fontSize: size * 0.42,
      fontWeight: 700,
      fontFamily: 'var(--font-display)',
    }}>
      {glyph}
    </div>
  );
}
