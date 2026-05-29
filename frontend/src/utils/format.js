export function money(n, currency = 'PEN') {
  const num = parseFloat(n) || 0;
  if (currency === 'USD') {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  return 'S/' + num.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function fmtDate(ts, lang = 'es') {
  return new Date(ts).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-PE', { day: 'numeric', month: 'short' });
}

export function thumbHue(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}
