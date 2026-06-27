# Price Tracker

Dashboard de monitoreo de precios en tiempo real para productos de **Falabella.com.pe** y **Amazon.com**. Busca productos, agrégalos al monitoreo, define un precio objetivo y recibe una alerta cuando el precio baje.

**Demo en producción:** [price-tracker-pearl-iota.vercel.app](https://price-tracker-pearl-iota.vercel.app)

---

## Características

- **Búsqueda en tiempo real** en Falabella y Amazon con hasta 30 resultados paginados
- **Monitoreo de productos** — agrega cualquier producto y rastrea su historial de precios
- **Gráfico de historial** SVG interactivo con rangos de 7, 30 y 90 días
- **Precio objetivo** — define un target y la app te notifica cuando el precio lo alcanza
- **Alertas** por notificación del navegador (Web Notifications API) y por email (Gmail SMTP)
- **Actualización automática** de precios cada 6 horas via GitHub Actions (cron schedule)
- **Soporte bilingüe** español / inglés
- **Dark theme** con design system propio (sin librerías de UI externas)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 |
| Backend | Node.js + Express 5 |
| Base de datos | PostgreSQL |
| Scraping | Puppeteer 25 + puppeteer-extra-plugin-stealth |
| Automatización | GitHub Actions (cron schedule cada 6 horas) |
| Email | Nodemailer + Gmail SMTP |
| Deploy | Vercel (frontend) + Railway (backend + DB) |

---

## Arquitectura

```
Browser (React)
    │
    │ HTTPS
    ▼
Express API (Railway)
    │
    ├── GET  /api/falabella/search  ──▶  Puppeteer → Falabella.com.pe
    ├── GET  /api/amazon/search     ──▶  Puppeteer → Amazon.com
    ├── GET  /api/products          ──▶  PostgreSQL
    ├── POST /api/products          ──▶  PostgreSQL
    ├── DELETE /api/products/:id    ──▶  PostgreSQL
    ├── PATCH  /api/products/:id/target
    ├── GET  /api/products/:id/history
    └── POST /api/jobs/update-prices  (disparo manual)

GitHub Actions (cron cada 6h)
    └── node src/jobs/run-price-update.js
        └── getProductPrice(url) por cada producto monitorado
            └── si precio ≤ target → email (Nodemailer + Gmail SMTP)
```

---

## Estructura del proyecto

```
price-tracker/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Entry point, monta rutas, corre migración al arrancar
│   │   ├── routes/
│   │   │   ├── products.js        # CRUD de productos + historial
│   │   │   ├── falabella.js       # GET /api/falabella/search
│   │   │   └── amazon.js          # GET /api/amazon/search
│   │   ├── scrapers/
│   │   │   ├── browserHelper.js   # Lanzador Puppeteer compartido (detecta Chrome en Windows/Linux)
│   │   │   ├── falabella.js       # searchProducts + getProductPrice para Falabella
│   │   │   └── amazon.js          # searchProducts + getProductPrice para Amazon
│   │   ├── services/
│   │   │   └── mailer.js          # sendPriceAlert via Nodemailer + Gmail SMTP
│   │   ├── db/
│   │   │   ├── pool.js            # Conexión PostgreSQL (DATABASE_URL o vars individuales)
│   │   │   ├── init.sql           # Schema: products + price_history
│   │   │   └── migrate.js         # Corre init.sql + ALTER TABLE si faltan columnas
│   │   └── jobs/
│   │       ├── priceUpdater.js    # Lógica de actualización: scraping + alertas por email
│   │       └── run-price-update.js # Entry point para GitHub Actions (node src/jobs/run-price-update.js)
│   ├── nixpacks.toml              # Instala Chromium en Railway (Nix packages)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx                # Router, estado global (lang, toast, alertCount)
    │   ├── App.css                # Design system: tokens, componentes, dark theme
    │   ├── pages/
    │   │   ├── Search.jsx         # Búsqueda + resultados + paginación
    │   │   └── Dashboard.jsx      # Lista de productos monitoreados + gráfico + target
    │   ├── components/
    │   │   ├── Button.jsx
    │   │   ├── Icon.jsx
    │   │   ├── Logo.jsx
    │   │   ├── PlatformTag.jsx
    │   │   ├── PriceChart.jsx     # Gráfico SVG de historial de precios
    │   │   └── Thumb.jsx          # Avatar generado desde el nombre del producto
    │   ├── services/
    │   │   └── api.js             # Todas las llamadas HTTP con Axios
    │   └── utils/
    │       └── format.js          # money(), fmtDate()
    └── package.json
```

---

## Instalación local (paso a paso)

### Requisitos previos

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **PostgreSQL 14+** — [postgresql.org](https://www.postgresql.org/download)
- **Google Chrome** instalado (Windows) — los scrapers lo detectan automáticamente. En Linux se usa Chromium del sistema.

Verifica que tienes todo instalado:

```bash
node -v        # v20.x o superior
psql --version # PostgreSQL 14.x o superior
```

---

### 1. Clonar el repositorio

```bash
git clone https://github.com/snowflow594/price-tracker.git
cd price-tracker
```

---

### 2. Configurar la base de datos

Abre `psql` y crea la base de datos:

```bash
psql -U postgres
```

```sql
CREATE DATABASE price_tracker;
\q
```

> Las tablas se crean **automáticamente** la primera vez que arranca el servidor, no necesitas correr ningún SQL manualmente.

---

### 3. Configurar el backend

```bash
cd backend
npm install
```

Crea el archivo `backend/.env` con el siguiente contenido (ajusta los valores a tu entorno):

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=price_tracker
DB_USER=postgres
DB_PASSWORD=tu_password_de_postgres

# Servidor
PORT=3001

# Alertas por email (opcional — ver sección "Alertas por email")
GMAIL_USER=tu_cuenta@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
ALERT_EMAIL=destino@gmail.com
```

Inicia el servidor en modo desarrollo:

```bash
npm run dev
```

Deberías ver:

```
Base de datos lista.
Servidor corriendo en http://localhost:3001
```

Puedes verificar que el servidor está funcionando abriendo:
[http://localhost:3001/health](http://localhost:3001/health)

---

### 4. Configurar el frontend

En una **nueva terminal**:

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

> Por defecto el frontend apunta a `http://localhost:3001`. Si cambiaste el puerto del backend, crea `frontend/.env.local` con:
> ```
> VITE_API_URL=http://localhost:PUERTO
> ```

---

### 5. Uso básico

1. **Buscar** — escribe el nombre de un producto en el buscador y selecciona Falabella o Amazon
2. **Monitorear** — haz clic en "Monitorear" en cualquier resultado para agregarlo al dashboard
3. **Ver historial** — en "Mis Productos", haz clic en un producto para ver su gráfico de precios
4. **Precio objetivo** — escribe un precio objetivo en el campo correspondiente y guárdalo
5. **Actualizar precios** — usa el botón "Actualizar precios" para forzar una actualización inmediata (el cron lo hace automáticamente cada 6 horas)

---

## Alertas por email

Las alertas por email requieren una **Contraseña de aplicación de Gmail** (no tu contraseña normal).

### Cómo obtener la contraseña de aplicación

1. Activa la [verificación en dos pasos](https://myaccount.google.com/signinoptions/two-step-verification) en tu cuenta Google
2. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Selecciona "Otra (nombre personalizado)" → escribe "Price Tracker" → genera
4. Copia las 16 letras generadas y pégalas en `GMAIL_APP_PASSWORD` del `.env`

> **Nota:** Si tu cuenta tiene Google Advanced Protection activada, las contraseñas de aplicación no están disponibles. En ese caso las alertas del navegador siguen funcionando normalmente.

### Alertas del navegador

El navegador pedirá permiso la primera vez que haya un producto con precio igual o menor al objetivo. Una vez concedido el permiso, las notificaciones aparecen aunque la pestaña esté en segundo plano.

---

## API REST

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servidor y conexión a DB |
| `GET` | `/api/falabella/search?q=laptop&limit=10` | Busca en Falabella (máx. 30) |
| `GET` | `/api/amazon/search?q=laptop&limit=10` | Busca en Amazon (máx. 30) |
| `GET` | `/api/products` | Lista todos los productos monitoreados |
| `POST` | `/api/products` | Agrega un producto al monitoreo |
| `DELETE` | `/api/products/:id` | Elimina un producto y su historial |
| `PATCH` | `/api/products/:id/target` | Guarda el precio objetivo |
| `GET` | `/api/products/:id/history` | Historial de precios de un producto |
| `POST` | `/api/jobs/update-prices` | Dispara actualización manual de precios |

### Ejemplo — agregar un producto

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop HP 15.6",
    "url": "https://www.falabella.com.pe/falabella-pe/product/...",
    "source": "falabella",
    "initial_price": 1299,
    "currency": "PEN"
  }'
```

---

## Deploy en producción

El proyecto está desplegado con **Railway** (backend + PostgreSQL) y **Vercel** (frontend).

### Railway (backend)

1. Crea un proyecto en [railway.app](https://railway.app) y conecta el repositorio
2. Agrega un servicio **PostgreSQL** desde el panel de Railway — la variable `DATABASE_URL` se inyecta automáticamente
3. Configura las variables de entorno del backend manualmente:

   | Variable | Valor |
   |---|---|
   | `GMAIL_USER` | tu cuenta de Gmail |
   | `GMAIL_APP_PASSWORD` | contraseña de aplicación |
   | `ALERT_EMAIL` | email donde llegan las alertas |

4. Railway detecta `nixpacks.toml` y instala Chromium automáticamente en el entorno Linux

### GitHub Actions (actualizador de precios)

El cron job de actualización de precios corre en GitHub Actions, no en el servidor. Configura los siguientes **Secrets** en tu repositorio (`Settings → Secrets and variables → Actions`):

| Secret | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL de Railway (formato `postgresql://user:pass@host:port/db`) |
| `GMAIL_USER` | Cuenta Gmail para enviar alertas |
| `GMAIL_APP_PASSWORD` | Contraseña de aplicación de Gmail |
| `ALERT_EMAIL` | Email donde llegan las alertas de precio |

El workflow (`.github/workflows/update-prices.yml`) se ejecuta automáticamente cada 6 horas y también puede dispararse manualmente desde la pestaña **Actions** del repositorio.

### Vercel (frontend)

1. Importa el repositorio en [vercel.com](https://vercel.com)
2. Configura el **Root Directory** como `frontend`
3. Agrega la variable de entorno:

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | `https://tu-app.up.railway.app` (con `https://`) |

4. Vercel detecta Vite automáticamente y despliega en cada push a `main`

---

## Notas técnicas

- **Amazon en producción:** Amazon bloquea búsquedas desde servidores cloud/datacenter. La búsqueda de Amazon funciona en entorno local pero devuelve error 503 en producción (Railway). Falabella funciona correctamente en ambos entornos.
- **Mercado Libre fue descartado:** implementa un sistema antiBOT ("Anubis") con proof-of-work en JavaScript y fingerprinting del navegador que bloquea cualquier instancia de Chrome headless, incluso con el plugin stealth.
- **Precios y descuentos:** Falabella muestra precios diferenciados (precio Internet, precio CMR con tarjeta). El scraper toma el primer precio numérico visible, que corresponde al precio estándar online sin tarjeta.
- **Chromium en Railway:** se instala via `nixpacks.toml` usando Nix packages. La ruta se detecta en runtime con `which chromium` sin necesidad de configurar variables adicionales.
- **Migraciones automáticas:** al arrancar, el servidor corre `init.sql` y aplica `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para que la base de datos siempre esté al día sin intervención manual.
- **Cron en GitHub Actions:** la actualización periódica de precios no corre en Railway sino en GitHub Actions. El servidor Railway es exclusivamente un API REST, sin procesos en background. Esto evita que Railway entre en modo sleep por inactividad y que el plan gratuito se agote por el consumo del scraper.
- **Targets en PostgreSQL:** los precios objetivo se almacenan en la DB (no en localStorage) para que GitHub Actions pueda evaluar y enviar alertas por email sin depender del navegador.

---

## Licencia

MIT
