# Diagnóstico del proyecto — Price Tracker

> Generado el 2026-06-28. Revisión completa de backend, frontend, esquema de BD y lógica de negocio.

---

## Bugs críticos

### 1. Las alertas de precio van al admin, no al usuario - REALIZADO (FUNCIONANDO EN PRODUCCIÓN)
**Archivo:** `backend/src/jobs/priceUpdater.js:23`

```js
const alertEmail = process.env.ALERT_EMAIL; // hardcodeado
```

Con multi-usuario activo, todos los usuarios comparten el mismo email de alerta. Cada alerta debería ir al email del usuario dueño del producto. Requiere hacer JOIN con la tabla `users` al obtener los productos.

---

### 2. Mercado Libre no actualiza precios automáticamente - NO REALIZADO
**Archivo:** `backend/src/jobs/priceUpdater.js:8-11`

`fetchCurrentPrice` solo maneja `amazon` y `falabella`. Si alguien guarda un producto con `source: 'mercadolibre'`, el cron job lo ignorará silenciosamente. El scraper `mercadolibre.js` ya tiene `getProductPrice` listo para usar.

---

### 3. El estado "En watchlist" se pierde al recargar la página - NO REALIZADO
**Archivo:** `frontend/src/App.jsx:50`

`monitoredUrls` se inicializa como array vacío y nunca se carga desde la API al montar la app. Si el usuario recarga la página y vuelve a buscar, todos los botones muestran "Guardar en watchlist" aunque el producto ya esté guardado.

**Fix:** cargar `getProducts()` al montar `App` y poblar `monitoredUrls` con las URLs existentes.

---

## Inconsistencias de esquema / datos

### 4. `init.sql` no coincide con el schema real - NO REALIZADO
**Archivo:** `backend/src/db/init.sql`

La tabla `products` en `init.sql` no define la columna `user_id`. El `app.js` la agrega con `ALTER TABLE` en cada arranque como parche. Si alguien ejecuta `migrate.js` directamente, queda un schema roto sin la columna de multi-usuario.

**Fix:** agregar `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE` directamente en `init.sql`.

---

### 5. La Política de privacidad contradice la app real - NO REALIZADO
**Archivo:** `frontend/src/App.jsx:15-21`

El texto del modal dice:
- *"No login is required"* → la app ahora requiere login con JWT
- *"prices fetched from Mercado Libre official API"* → la app usa scraping de Falabella con Puppeteer

Esto es un problema visible para evaluadores o reclutadores que revisen el proyecto.

---

## Código muerto

### 6. `ProductCard.jsx` es un componente sin uso - NO REALIZADO
**Archivo:** `frontend/src/components/ProductCard.jsx`

Usa clases CSS antiguas (`card`, `card-header`, `source-badge`) que ya no existen en el diseño Tailwind actual. Ningún componente activo lo importa. El Dashboard usa el componente inline `WatchlistRow`.

---

## UX / Fiabilidad

### 7. El botón de la campana no tiene funcionalidad - NO REALIZADO
**Archivo:** `frontend/src/App.jsx:156-158`

El `<button>` con el ícono de campana está renderizado en el header pero no tiene `onClick`. Es funcionalidad prometida visualmente sin implementar.

---

### 8. El timer de actualización es un hardcode frágil - NO REALIZADO
**Archivo:** `frontend/src/pages/Dashboard.jsx:349`

```js
setTimeout(() => { setUpdating(false); loadAll(); }, 40000);
```

Espera exactamente 40 segundos tras triggerear el updater. Si el scraping termina antes o tarda más, la UX es incorrecta. Debería usarse polling o un endpoint que retorne el estado del job.

---

### 9. Errores silenciosos en delete y setTarget - NO REALIZADO
**Archivo:** `frontend/src/pages/Dashboard.jsx:358, 370`

Ambas operaciones capturan errores con `/* silencioso */`. Si la base de datos falla, el usuario no recibe ningún feedback visual.

---

### 10. No hay manejo de JWT expirado (token de 7 días) - NO REALIZADO
**Archivo:** `frontend/src/services/api.js`

Solo existe un interceptor de **request** para agregar el token. No hay interceptor de **response** para el 401 que limpie el estado de auth y redirija al login cuando el token expira. El usuario queda en una pantalla rota.

---

## Tabla de prioridades

| Prioridad | # | Descripción |
|-----------|---|-------------|
| 🔴 Alta | 1 | Alertas al email del usuario, no al admin |
| 🔴 Alta | 3 | `monitoredUrls` se resetea al recargar |
| 🟡 Media | 2 | ML no actualiza precios en el cron job |
| 🟡 Media | 4 | `init.sql` no tiene `user_id` en products |
| 🟡 Media | 10 | JWT expirado no redirige al login |
| 🟢 Baja | 5 | Actualizar texto de Política de privacidad |
| 🟢 Baja | 7 | Implementar centro de notificaciones (campana) |
| 🟢 Baja | 6 | Eliminar `ProductCard.jsx` (código muerto) |
| 🟢 Baja | 8 | Reemplazar timer hardcoded de 40s |
| 🟢 Baja | 9 | Mostrar errores en delete/setTarget |
