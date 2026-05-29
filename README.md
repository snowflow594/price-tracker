# Price Tracker

Dashboard de monitoreo de precios en tiempo real para productos de Falabella y Amazon. Rastrea el historial de precios, define objetivos y recibe alertas cuando un producto baja de precio.

**Demo en producción:** [price-tracker-pearl-iota.vercel.app](https://price-tracker-pearl-iota.vercel.app)

---

## Características

- **Búsqueda en tiempo real** en Falabella.com.pe y Amazon.com con hasta 30 resultados
- **Historial de precios** con gráfico SVG interactivo (rangos 7D / 30D / 90D)
- **Precio objetivo** — define un target y la app te avisa cuando el precio baja de ese valor
- **Alertas** por notificación del navegador y por email (via Gmail SMTP)
- **Actualización automática** de precios cada 6 horas via cron job en el servidor
- **Diseño responsive** dark theme con soporte de idiomas español / inglés

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite, CSS custom (design system propio) |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Scraping | Puppeteer + puppeteer-extra-plugin-stealth |
| Automatización | node-cron (cada 6 horas) |
| Email | Nodemailer + Gmail SMTP |
| Deploy | Vercel (frontend) + Railway (backend + DB) |

## Arquitectura

```
React (Vercel)
    │
    │ HTTPS
    ▼
Express API (Railway)
    │
    ├── /api/falabella/search  ──▶  Puppeteer → Falabella.com.pe
    ├── /api/amazon/search     ──▶  Puppeteer → Amazon.com
    ├── /api/products          ──▶  PostgreSQL (CRUD)
    └── /api/jobs/update-prices ──▶ Cron job manual
              │
              ▼
        node-cron (6h)
        Actualiza precios + envía alertas por email
```

## Estructura del proyecto

```
price-tracker/
├── backend/
│   ├── src/
│   │   ├── routes/        # products.js, amazon.js, falabella.js
│   │   ├── scrapers/      # amazon.js, falabella.js (Puppeteer)
│   │   ├── services/      # mailer.js (Nodemailer)
│   │   ├── db/            # pool.js, init.sql, migrate.js
│   │   └── jobs/          # priceUpdater.js (cron cada 6h)
│   ├── nixpacks.toml      # Configuración Chromium para Railway
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/    # Icon, Button, Logo, PlatformTag, Thumb, PriceChart
    │   ├── pages/         # Search.jsx, Dashboard.jsx
    │   ├── services/      # api.js (Axios)
    │   └── utils/         # format.js (money, fmtDate)
    └── package.json
```

## Instalación local

### Requisitos
- Node.js 20+
- PostgreSQL 14+
- Google Chrome instalado (para los scrapers en Windows)

### Backend

```bash
cd backend
npm install
```

Crea el archivo `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=price_tracker
DB_USER=postgres
DB_PASSWORD=tu_password

PORT=3001

# Alertas por email (opcional)
GMAIL_USER=tu@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
ALERT_EMAIL=tu@gmail.com
```

Crea la base de datos e inicia el servidor:

```bash
# Crear la DB en PostgreSQL
psql -U postgres -c "CREATE DATABASE price_tracker;"

# El servidor crea las tablas automáticamente al arrancar
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## API REST

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/falabella/search?q=laptop` | Busca productos en Falabella |
| `GET` | `/api/amazon/search?q=laptop` | Busca productos en Amazon |
| `GET` | `/api/products` | Lista todos los productos monitoreados |
| `POST` | `/api/products` | Agrega un producto al monitoreo |
| `DELETE` | `/api/products/:id` | Elimina un producto y su historial |
| `PATCH` | `/api/products/:id/target` | Guarda el precio objetivo |
| `GET` | `/api/products/:id/history` | Historial de precios de un producto |
| `POST` | `/api/jobs/update-prices` | Dispara actualización manual de precios |
| `GET` | `/health` | Estado del servidor y la DB |

## Deploy

El proyecto usa **Railway** para el backend y **Vercel** para el frontend.

### Variables de entorno en producción

**Railway (backend):**
- `DATABASE_URL` → lo genera Railway automáticamente al agregar PostgreSQL
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ALERT_EMAIL` → configurar manualmente

**Vercel (frontend):**
- `VITE_API_URL` → URL completa del backend en Railway, e.g. `https://tu-app.up.railway.app`

> **Nota:** `VITE_API_URL` debe incluir el prefijo `https://`, de lo contrario Vercel lo trata como ruta relativa.

## Notas técnicas

- **Mercado Libre** fue descartado: implementa un sistema antiBOT ("Anubis") con proof-of-work y fingerprinting del navegador que bloquea cualquier instancia de Chrome headless.
- Los scrapers usan `puppeteer-extra-plugin-stealth` para evitar detección básica de bots.
- En Railway, Chromium se instala via `nixpacks.toml`; la ruta se detecta automáticamente en runtime con `which chromium`.
- Los precios objetivo se almacenan en PostgreSQL (no en localStorage) para que las alertas por email funcionen desde el servidor.
</content>
</invoke>