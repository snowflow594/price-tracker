const nodemailer = require('nodemailer');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSafeUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendPriceAlert({ to, productName, currentPrice, targetPrice, currency, url, source }) {
  const symbol = currency === 'USD' ? '$' : 'S/';
  const platformLabel = source === 'amazon' ? 'Amazon' : source === 'falabella' ? 'Falabella' : escapeHtml(source);
  const safeProductName = escapeHtml(productName);
  const safeUrl = isSafeUrl(url) ? url : '#';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080B14;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#111726;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.07);">
    <div style="background:linear-gradient(135deg,#3D7BFF,#7A5BFF);padding:28px 32px;">
      <p style="margin:0;color:rgba(255,255,255,.75);font-size:13px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;">Price Tracker</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">¡Precio objetivo alcanzado!</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;color:#9AA5BE;font-size:15px;line-height:1.6;">
        El producto que estás monitoreando bajó de tu precio objetivo en <strong style="color:#fff">${platformLabel}</strong>.
      </p>
      <div style="background:#171F31;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 12px;color:#9AA5BE;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Producto</p>
        <p style="margin:0;color:#EAEEF7;font-size:15px;font-weight:600;line-height:1.4;">${safeProductName}</p>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#171F31;border-radius:12px;padding:16px;">
          <p style="margin:0 0 6px;color:#9AA5BE;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Precio actual</p>
          <p style="margin:0;color:#2BD9A0;font-size:22px;font-weight:700;">${symbol} ${currentPrice.toLocaleString('es-PE')}</p>
        </div>
        <div style="flex:1;background:#171F31;border-radius:12px;padding:16px;">
          <p style="margin:0 0 6px;color:#9AA5BE;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Tu objetivo</p>
          <p style="margin:0;color:#EAEEF7;font-size:22px;font-weight:700;">${symbol} ${targetPrice.toLocaleString('es-PE')}</p>
        </div>
      </div>
      <a href="${safeUrl}" style="display:block;background:linear-gradient(135deg,#3D7BFF,#7A5BFF);color:#fff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:700;">
        Ver en ${platformLabel} →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,.07);">
      <p style="margin:0;color:#5E6A88;font-size:12px;text-align:center;">
        Recibirás una alerta por cada producto cuando su precio baje del objetivo por primera vez.
      </p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Price Tracker" <${process.env.GMAIL_USER}>`,
    to,
    subject: `🎯 ¡${productName.slice(0, 50)} bajó de precio!`,
    html,
  });
}

module.exports = { sendPriceAlert };
