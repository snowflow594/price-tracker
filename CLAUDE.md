# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción

Dashboard de monitoreo de precios para productos de **Falabella.com.pe**: búsqueda de productos, watchlist por usuario, historial de precios, precio objetivo y alertas por email. Proyecto personal de portafolio.

Demo en producción: https://price-tracker-pearl-iota.vercel.app (frontend en Vercel, backend + PostgreSQL en Railway).

## Comandos

Monorepo con dos paquetes independientes (`backend/` y `frontend/`), sin package.json raíz. Ejecutar npm desde cada carpeta.

**Backend** (`backend/`):
```
npm run dev                        # servidor con nodemon (puerto 3001)
npm start                          # servidor sin reload
npm run migrate                    # ejecuta src/db/migrate.js
node src/jobs/run-price-update.js  # corre el actualizador de precios una vez (requiere .env)
```

**Frontend** (`frontend/`):
```
npm run dev      # Vite dev server (puerto 5173)
npm run build    # build de producción
npm run lint     # ESLint
```

No hay tests configurados en ninguno de los dos paquetes.

## Arquitectura

```
React SPA (Vercel) ──JWT Bearer──▶ Express API (Railway) ──▶ PostgreSQL (Railway)
                                        │
                                   Puppeteer + stealth ──▶ Falabella.com.pe
GitHub Actions (cron cada 6h)
    └── node src/jobs/run-price-update.js ──▶ misma DB + alertas via Resend
```

### Backend (Express 5, CommonJS)

- **Migraciones al arrancar:** `app.js` ejecuta `runMigration()` en el startup — corre `db/init.sql` completo más `ALTER TABLE ... IF NOT EXISTS` idempotentes. Los cambios de esquema nuevos se agregan como ALTERs idempotentes en `app.js` (columnas post-inicial) o en `init.sql` (tablas nuevas). No hay archivos de migración versionados.
- **Aislamiento multi-usuario (invariante crítico):** toda ruta de productos pasa por `middleware/auth.js` (`router.use(verifyToken)`) y toda query filtra por `WHERE user_id = req.user.id`. Cualquier query nueva sobre `products`/`price_history` debe mantener este scoping.
- **Scrapers** (`src/scrapers/`): usan `browserHelper.js` (puppeteer-extra + stealth). Falabella es la fuente activa; el scraper/ruta de Amazon existe en el backend pero el frontend solo consume Falabella. **Mercado Libre fue descartado** (su API requiere autorización OAuth de app) — no reintroducirlo.
- **Actualización de precios:** el cron real corre en GitHub Actions (`.github/workflows/update-prices.yml`, cada 6h) ejecutando `run-price-update.js` contra la DB de Railway. `priceUpdater.js` también exporta `startPriceUpdaterJob()` (node-cron) pero `app.js` NO lo llama — el servidor solo expone el disparo manual `POST /api/jobs/update-prices`.
- **Alertas:** si el precio ≤ `target_price` se envía email via Resend al email del usuario dueño del producto, con deduplicación de 24h via `alert_sent_at`. HTML del email escapado (`escapeHtml`/`isSafeUrl` en `services/mailer.js`).
- **Errores:** las respuestas al cliente son genéricas (`'Error interno del servidor'`); el detalle va solo a `console.error`. Mantener este patrón (evita divulgar información interna).

### Frontend (React 19 + Vite + Tailwind v4)

- **SPA sin router:** la navegación es estado local en `App.jsx` (`view`, `authView`). No hay react-router.
- **Auth:** `context/AuthContext.jsx` guarda token/usuario en `localStorage` o `sessionStorage` (claves `pt_token`, `pt_user`, según "recordarme"). `services/api.js` es la única instancia de axios y agrega el header `Authorization: Bearer` automáticamente — toda llamada nueva a la API se agrega ahí.
- **Bilingüe ES/EN:** los textos se definen inline como objetos `{ es, en }` con estado `lang` en `App.jsx`; no hay librería i18n.
- **Gráficos:** `PriceChart.jsx` / `Sparkline.jsx` (SVG propio + recharts instalado).

## Variables de entorno

**Backend** (`backend/.env`, nunca commitear): `DATABASE_URL` (o `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` para local), `DB_SSL_REJECT_UNAUTHORIZED` (poner `'false'` para Railway/Actions), `JWT_SECRET`, `RESEND_API_KEY`, `FRONTEND_URL` (para CORS), `PORT`, `PUPPETEER_EXECUTABLE_PATH` (opcional).

**Frontend:** `VITE_API_URL` (default `http://localhost:3001`).

El workflow de GitHub Actions necesita los secrets `DATABASE_URL` y `RESEND_API_KEY`.

## Convenciones

- Código, comentarios, logs y mensajes de error de API en **español**.
- La carpeta `docs/` (diagnóstico, API, arquitectura) no está versionada en git.
- Entorno de desarrollo: Windows 11 + PowerShell, Node.js 24.
