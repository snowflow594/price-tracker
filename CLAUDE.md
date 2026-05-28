# Price Tracker — CLAUDE.md

## Descripción del proyecto
Dashboard de monitoreo de precios con scraping de sitios de e-commerce (Mercado Libre, Amazon, Alibaba, Facebook Marketplace) e indicadores de tendencia de precios. Proyecto personal para CV — buscando prácticas de ingeniería informática en Lima, Perú.

## Stack tecnológico
- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Scraping:** Puppeteer (Amazon, otros) + API oficial de Mercado Libre
- **Deploy:** Vercel (frontend) + Railway (backend + DB)

## Entorno de desarrollo
- OS: Windows 11 Pro
- Node.js: v24.16.0
- Git: v2.45.1
- Editor: VS Code
- Shell: PowerShell

## Estructura de carpetas
```
price-tracker/
├── backend/
│   ├── src/
│   │   ├── routes/        # endpoints de la API REST
│   │   ├── scrapers/      # lógica de scraping por sitio
│   │   ├── db/            # conexión y queries PostgreSQL
│   │   └── jobs/          # cron jobs para scraping automático
│   ├── package.json
│   └── .env               # variables de entorno (no subir a GitHub)
├── frontend/
│   ├── src/
│   │   ├── components/    # componentes React
│   │   ├── pages/         # vistas principales
│   │   └── services/      # llamadas a la API
│   └── package.json
└── CLAUDE.md
```

## Dependencias del backend instaladas
- `express` — servidor web / API REST
- `pg` — cliente PostgreSQL
- `dotenv` — variables de entorno
- `cors` — comunicación entre React y la API
- `node-cron` — scraping automático programado
- `puppeteer` — scraping de Amazon y otros sitios
- `axios` — llamadas HTTP a la API de Mercado Libre
- `nodemon` (dev) — reinicio automático del servidor

## Fases del proyecto
- [x] Fase 0: Setup del entorno (Node, Git, PostgreSQL, VSC)
- [x] Fase 1: Repositorio GitHub + estructura de carpetas + dependencias backend
- [ ] Fase 2: Configurar Express server + conexión a PostgreSQL + crear tablas
- [ ] Fase 3: Integración con API oficial de Mercado Libre
- [ ] Fase 4: Scraper Amazon con Puppeteer
- [ ] Fase 5: Cron job para recolección automática de precios
- [ ] Fase 6: Frontend React — dashboard con gráficos de tendencia
- [ ] Fase 7: Alertas de alza de precio
- [ ] Fase 8: Deploy en Vercel + Railway

## Arquitectura general
```
React (UI) ──▶ Express API ──▶ PostgreSQL
                    │
              Scraper Service
              - Mercado Libre API (oficial)
              - Amazon (Puppeteer)
              - Cron job cada X horas
```

## Notas importantes
- Mercado Libre tiene API oficial gratuita — usar en lugar de scraping directo
- El archivo .env nunca debe subirse a GitHub (agregar a .gitignore)
- PostgreSQL local corre en puerto 5432
