# Despliegue CoffePrice

## Arquitectura

- `backend/`: API Express + MongoDB para desplegar en Railway
- `frontend/`: app React/Vite para desplegar en Netlify

## 1. Backend en Railway

### Crear el servicio

1. En Railway crea un proyecto nuevo desde este repositorio.
2. Crea un servicio apuntando al directorio `backend`.
3. Configura:
   - Start command: `npm start`
   - Root directory: `backend`

### Variables de entorno

Carga en Railway las variables que usa `backend/.env`.

Minimas obligatorias:

- `MONGODB_URI`
- `JWT_SECRET`
- `SESSION_SECRET`
- `FRONTEND_URL`

Segun funcionalidades activas, tambien necesitaras:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `JWT_EXPIRES_IN`
- `EMAIL_USER`
- `EMAIL_PASS`
- `OPENAI_API_KEY`
- `NEWSAPI_KEY`
- `GNEWS_API_KEY`
- `THENEWSAPI_TOKEN`
- `NEWSDATA_API_KEY`
- Variables `NOTICIAS_*`

### Valores importantes en produccion

- `NODE_ENV=production`
- `FRONTEND_URL=https://TU-SITIO.netlify.app`
- `GOOGLE_CALLBACK_URL=https://TU-BACKEND.up.railway.app/api/auth/google/callback`

### Dominio del backend

Cuando Railway te entregue la URL publica, guardala. La vamos a usar en Netlify como `VITE_API_URL`.

### Google OAuth

Si usas inicio de sesion con Google, en Google Cloud debes actualizar:

- Authorized JavaScript origins:
  - `https://TU-SITIO.netlify.app`
  - `https://TU-BACKEND.up.railway.app`
- Authorized redirect URIs:
  - `https://TU-BACKEND.up.railway.app/api/auth/google/callback`

## 2. Frontend en Netlify

### Crear el sitio

1. En Netlify importa este mismo repositorio.
2. Configura:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

Tambien puedes dejar que Netlify lea `netlify.toml` desde la raiz del repositorio.

### Variables de entorno

Configura al menos:

- `VITE_API_URL=https://TU-BACKEND.up.railway.app`
- `VITE_MAPBOX_TOKEN=...`
- `VITE_MAPTILER_KEY=...`

### SPA routing

El archivo `netlify.toml` ya incluye un redirect a `index.html` para que rutas como `/login`, `/precios` o `/completar-perfil` funcionen al recargar.

## 3. Orden recomendado

1. Desplegar primero `backend` en Railway.
2. Copiar la URL publica del backend.
3. Configurar `VITE_API_URL` en Netlify con esa URL.
4. Desplegar `frontend`.
5. Volver a Railway y confirmar que `FRONTEND_URL` apunte al dominio real de Netlify.
6. Si usas Google, actualizar los URIs autorizados en Google Cloud.

## 4. Verificaciones rapidas

### Backend

- `GET /`
- `GET /healthz`

Ejemplo:

`https://TU-BACKEND.up.railway.app/healthz`

Debe responder con `status: ok` cuando MongoDB este conectado.

### Frontend

- Abrir la home
- Recargar una ruta interna como `/login`
- Probar login normal
- Probar login con Google

## 5. Notas

- El backend usa cookies `SameSite=None` en produccion, por eso el frontend debe estar en HTTPS.
- Si copiaste secretos reales a archivos `.env`, conviene rotarlos antes del despliegue definitivo.
