# Price Tracker

Dashboard de monitoreo de precios para productos de **Falabella.com.pe**. Busca productos, agrégalos al watchlist, define un precio objetivo y recibe una alerta por email cuando el precio baje.

**Demo en producción:** [price-tracker-pearl-iota.vercel.app](https://price-tracker-pearl-iota.vercel.app)

---

## Características

- **Autenticación multi-usuario** — registro e inicio de sesión con JWT. Cada usuario tiene su propio watchlist aislado
- **Búsqueda en tiempo real** en Falabella con hasta 30 resultados paginados
- **Monitoreo de productos** — agrega cualquier producto y rastrea su historial de precios
- **Gráfico de historial** SVG interactivo con rangos de 7, 30 y 90 días
- **Precio objetivo** — define un target y la app te notifica cuando el precio lo alcanza
- **Alertas por email** enviadas al correo de cada usuario via Resend
- **Actualización automática** de precios cada 6 horas via GitHub Actions
- **Soporte bilingüe** español / inglés
- **Dark theme** con design system propio basado en Material Design 3

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 6 + Tailwind CSS v4 |
| Backend | Node.js 24 + Express 5 |
| Base de datos | PostgreSQL |
| Autenticación | JWT + bcrypt |
| Scraping | Puppeteer 24 + puppeteer-extra-plugin-stealth |
| Automatización | GitHub Actions (cron schedule cada 6 horas) |
| Email | Resend API |
| Deploy | Vercel (frontend) + Railway (backend + DB) |

---

## Arquitectura

```
Browser (React)
    │
    │ HTTPS + JWT Bearer Token
    ▼
Express API (Railway)
    │
    ├── POST /api/auth/register     ──▶  Crea usuario (bcrypt + JWT)
    ├── POST /api/auth/login        ──▶  Autentica usuario (bcrypt + JWT)
    │
    ├── GET  /api/falabella/search  ──▶  Puppeteer → Falabella.com.pe
    │
    ├── GET    /api/products              ──▶  PostgreSQL (solo productos del usuario)
    ├── POST   /api/products              ──▶  PostgreSQL
    ├── DELETE /api/products/:id          ──▶  PostgreSQL
    ├── PATCH  /api/products/:id/target   ──▶  PostgreSQL
    ├── GET    /api/products/:id/history  ──▶  PostgreSQL
    └── POST   /api/jobs/update-prices    ──▶  Disparo manual (requiere auth)

GitHub Actions (cron cada 6h)
    └── node src/jobs/run-price-update.js
        └── getProductPrice(url) por cada producto
            └── si precio ≤ target → email via Resend al dueño del producto
```

---

## Estructura del proyecto

```
price-tracker/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Entry point, monta rutas, corre migración al arrancar
│   │   ├── middleware/
│   │   │   └── auth.js               # Middleware JWT (verifyToken)
│   │   ├── routes/
│   │   │   ├── auth.js               # POST /register, POST /login
│   │   │   ├── products.js           # CRUD de productos + historial (requiere auth)
│   │   │   ├── falabella.js          # GET /api/falabella/search
│   │   │   └── amazon.js             # GET /api/amazon/search
│   │   ├── scrapers/
│   │   │   ├── browserHelper.js      # Lanzador Puppeteer (detecta Chrome en Windows/Linux)
│   │   │   ├── falabella.js          # searchProducts + getProductPrice para Falabella
│   │   │   └── amazon.js             # searchProducts + getProductPrice para Amazon
│   │   ├── services/
│   │   │   └── mailer.js             # sendPriceAlert via Resend API
│   │   ├── db/
│   │   │   ├── pool.js               # Conexión PostgreSQL (DATABASE_URL o vars individuales)
│   │   │   ├── init.sql              # Schema: users + products + price_history
│   │   │   └── migrate.js            # Corre init.sql al arrancar
│   │   └── jobs/
│   │       ├── priceUpdater.js       # Scraping + alertas por email (JOIN con users)
│   │       └── run-price-update.js   # Entry point para GitHub Actions
│   ├── nixpacks.toml                 # Instala Chromium en Railway (Nix packages)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Router, navbar, toast, modals de footer
│   │   ├── App.css                   # Componentes globales (modals, toasts, chart)
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Estado global de autenticación
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Formulario de inicio de sesión
│   │   │   ├── Register.jsx          # Formulario de registro
│   │   │   ├── Search.jsx            # Búsqueda + resultados + paginación
│   │   │   └── Dashboard.jsx         # Watchlist + gráfico + precio objetivo
│   │   ├── components/
│   │   │   ├── Icon.jsx
│   │   │   ├── PriceChart.jsx        # Gráfico SVG de historial de precios
│   │   │   └── Sparkline.jsx         # Mini gráfico de tendencia 7D
│   │   ├── services/
│   │   │   └── api.js                # Todas las llamadas HTTP con Axios + interceptor JWT
│   │   └── utils/
│   │       └── format.js             # money(), fmtDate(), thumbHue()
│   └── package.json
└── docs/
    └── diagnostico.md                # Diagnóstico técnico del proyecto
```

---

## Instalación local

### Requisitos previos

- **Node.js 24+** — [nodejs.org](https://nodejs.org)
- **PostgreSQL 14+** — [postgresql.org](https://www.postgresql.org/download)
- **Google Chrome** instalado (Windows) — los scrapers lo detectan automáticamente. En Linux se usa Chromium del sistema.

```bash
node -v        # v24.x o superior
psql --version # PostgreSQL 14.x o superior
```

### 1. Clonar el repositorio

```bash
git clone https://github.com/snowflow594/price-tracker.git
cd price-tracker
```

### 2. Configurar la base de datos

```bash
psql -U postgres
```

```sql
CREATE DATABASE price_tracker;
\q
```

> Las tablas se crean automáticamente la primera vez que arranca el servidor.

### 3. Configurar el backend

```bash
cd backend
npm install
```

Crea el archivo `backend/.env`:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=price_tracker
DB_USER=postgres
DB_PASSWORD=tu_password_de_postgres

# Servidor
PORT=3001

# Autenticación
JWT_SECRET=una_cadena_larga_y_aleatoria

# Alertas por email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
```

```bash
npm run dev
```

Verifica que el servidor está funcionando: [http://localhost:3001/health](http://localhost:3001/health)

### 4. Configurar el frontend

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

> Si cambiaste el puerto del backend, crea `frontend/.env.local` con:
> ```
> VITE_API_URL=http://localhost:PUERTO
> ```

---

## Alertas por email

Las alertas se envían via **Resend** al email del usuario registrado, cuando el precio de un producto cae por debajo de su precio objetivo.

### Configuración

1. Crea una cuenta gratuita en [resend.com](https://resend.com) (3,000 emails/mes gratis)
2. Ve a **API Keys** → **Create API Key**
3. Agrega la clave en `.env` como `RESEND_API_KEY=re_...`
4. En producción, agrega la misma variable en Railway

> En el plan gratuito sin dominio verificado, los emails salen desde `onboarding@resend.dev`. Para usar tu propio dominio como remitente, verifica un dominio en el dashboard de Resend.

---

## API REST

Todos los endpoints excepto `/health`, `/api/auth/login` y `/api/auth/register` requieren el header:
```
Authorization: Bearer <token>
```

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servidor y conexión a DB |
| `POST` | `/api/auth/register` | Registra un nuevo usuario |
| `POST` | `/api/auth/login` | Inicia sesión, retorna JWT |
| `GET` | `/api/falabella/search?q=laptop&limit=10` | Busca en Falabella (máx. 30) |
| `GET` | `/api/products` | Lista productos del usuario autenticado |
| `POST` | `/api/products` | Agrega un producto al watchlist |
| `DELETE` | `/api/products/:id` | Elimina un producto y su historial |
| `PATCH` | `/api/products/:id/target` | Guarda el precio objetivo |
| `GET` | `/api/products/:id/history` | Historial de precios de un producto |
| `POST` | `/api/jobs/update-prices` | Dispara actualización manual de precios |

---

## Deploy en producción

### Railway (backend)

1. Crea un proyecto en [railway.app](https://railway.app) y conecta el repositorio
2. Agrega un servicio **PostgreSQL** — la variable `DATABASE_URL` se inyecta automáticamente
3. Configura las variables de entorno:

| Variable | Descripción |
|---|---|
| `JWT_SECRET` | Cadena secreta larga para firmar tokens |
| `RESEND_API_KEY` | API key de Resend para emails |
| `FRONTEND_URL` | URL de Vercel (para CORS) |
| `DB_SSL_REJECT_UNAUTHORIZED` | `false` (Railway usa certificados self-signed) |

4. Railway detecta `nixpacks.toml` e instala Chromium automáticamente

### GitHub Actions (actualizador de precios)

Configura los siguientes **Secrets** en `Settings → Secrets and variables → Actions`:

| Secret | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL de Railway |
| `RESEND_API_KEY` | API key de Resend para alertas |
| `DB_SSL_REJECT_UNAUTHORIZED` | `false` |

El workflow corre automáticamente cada 6 horas y puede dispararse manualmente desde la pestaña **Actions**.

### Vercel (frontend)

1. Importa el repositorio en [vercel.com](https://vercel.com)
2. Configura el **Root Directory** como `frontend`
3. Agrega la variable de entorno:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://tu-app.up.railway.app` |

---

## Notas técnicas

- **Amazon en producción:** Amazon bloquea búsquedas desde servidores cloud. La búsqueda de Amazon funciona en local pero no en Railway. Falabella funciona en ambos entornos.
- **Mercado Libre:** implementa un sistema antiBOT con proof-of-work y fingerprinting que bloquea Chrome headless incluso con el plugin stealth.
- **Chromium en Railway:** se instala via `nixpacks.toml` con Nix packages. La ruta se detecta en runtime con `which chromium`.
- **Migraciones automáticas:** al arrancar, el servidor corre `init.sql` y aplica `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para mantener el schema al día.
- **Cron en GitHub Actions:** el actualizador de precios corre en GitHub Actions, no en Railway. El servidor es exclusivamente un API REST. Esto evita que Railway entre en modo sleep y que el plan gratuito se agote por el scraper.
- **Alertas por usuario:** el cron hace JOIN con la tabla `users` para enviar cada alerta al email del dueño del producto, no a un email global de administrador.
- **Rate limiting:** los endpoints de auth tienen límite de 10 intentos por 15 minutos para prevenir fuerza bruta.
- **SMTP bloqueado en Railway:** Railway no permite conexiones SMTP salientes. Por eso se usa Resend (HTTP API) en lugar de Nodemailer.

---

## Licencia

MIT
