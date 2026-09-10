# Guía de Despliegue en Render - SaludPública Connect

Esta guía explica cómo desplegar la plataforma completa (**Backend**, **Frontend**, **Base de Datos PostgreSQL** y **Redis**) en [Render](https://render.com).

---

## Opción 1: Despliegue Automático con Render Blueprint (Recomendado)

El proyecto incluye un archivo `render.yaml` en la raíz que define la arquitectura completa.

1. Ve a tu panel de **[Render Dashboard](https://dashboard.render.com/)**.
2. Haz clic en **New +** y selecciona **Blueprint**.
3. Conecta tu repositorio de GitHub: `Actividad-proyecto-final-Sanare-Sistema-de-Salud-Kamilo`.
4. Render detectará automáticamente el archivo `render.yaml` y creará:
   - **Base de Datos:** `saludpublica-db` (PostgreSQL administrado gratuito).
   - **Backend Web Service:** `saludpublica-backend` (Node.js NestJS).
   - **Frontend Static Site:** `saludpublica-frontend` (React 19 Vite).
5. Completa la variable de entorno secreta solicitada:
   - `GEMINI_API_KEY`: tu clave de API de Google Gemini (Google AI Studio).
6. Haz clic en **Apply**. Render aprovisionará la base de datos, compilará el backend, aplicará las migraciones de Prisma y construirá el frontend.

---

## Opción 2: Despliegue Manual Servicio por Servicio

Si prefieres configurar cada servicio manualmente desde el panel de Render:

### 1. Crear la Base de Datos PostgreSQL
1. En Render: **New +** -> **PostgreSQL**.
2. Nombre: `saludpublica-db`.
3. Base de datos: `saludpublica`.
4. Plan: **Free**.
5. Guarda la **Internal Database URL** generada.

### 2. Desplegar el Backend (Web Service)
1. En Render: **New +** -> **Web Service**.
2. Conecta tu repositorio de GitHub.
3. Configuración del servicio:
   - **Name:** `saludpublica-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && npm run start:prod`
4. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(pegar la Internal Database URL de PostgreSQL de Render)*
   - `JWT_SECRET`: *(cadena aleatoria segura para firmar tokens)*
   - `GEMINI_API_KEY`: *(tu API Key de Google Gemini)*
   - `REDIS_URL`: *(URL de tu instancia de Redis en Render o Upstash)*
   - `FRONTEND_URL`: `https://tu-frontend.onrender.com,http://localhost:3000`

### 3. Cargar Datos Iniciales (Seed de Demo)
Una vez que el backend esté desplegado:
1. En el servicio backend de Render, ve a la pestaña **Shell**.
2. Ejecuta:
   ```bash
   npm run prisma:seed
   ```
   Esto creará los usuarios demo (`admin@saludpublica.com`, `doctor1@email.com`, `paciente1@email.com`) y las especialidades iniciales.

### 4. Desplegar el Frontend (Static Site)
1. En Render: **New +** -> **Static Site**.
2. Conecta tu repositorio de GitHub.
3. Configuración:
   - **Name:** `saludpublica-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. **Redirects/Rewrites** (vital para React Router):
   - **Type:** `Rewrite`
   - **Source:** `/*`
   - **Destination:** `/index.html`
5. **Environment Variables**:
   - `VITE_API_URL`: `https://saludpublica-backend.onrender.com` *(la URL de tu backend en Render)*

---

## Notas de Configuración de Redis en la Nube

En entornos locales se usa el contenedor Docker `saludpublica-redis`. Para producción en la nube:
- Puedes crear un servicio **Redis** en Render (disponible en planes pagos de Render).
- Alternativa gratuita recomendada: **[Upstash Redis](https://upstash.com/)** (provee un `REDIS_URL` gratuito compatible al 100% con Bull y este backend).
