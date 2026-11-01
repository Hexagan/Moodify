# Guía de Instalación — Moodify

**Proyecto:** Moodify — Emociones Musicales  
**Archivo:** `docs/guia-instalacion.md`  
**Autor:** Mauro Di Gallo — Visualización / QA / Docs  
**Fecha:** Junio 2026 · **Actualizado:** Noviembre 2026 (variables de entorno, Firebase, despliegue en Vercel + Neon)

Esta guía cubre dos escenarios: correr Moodify en una computadora para desarrollo (secciones 1–5) y desplegarlo en Vercel (sección 6).

---

## 1. Prerrequisitos

| Software | Versión | Para qué |
|----------|---------|----------|
| Git | cualquiera reciente | Clonar el repositorio |
| Python | 3.10 o superior | Backend |
| Node.js | 20 o superior (con npm) | Frontend |
| PostgreSQL | 15 o superior (el proyecto se desarrolló con 18) | Base de datos local; incluye `psql` y `pg_restore` |

Cuentas necesarias según lo que se quiera probar:

| Servicio | Obligatorio | Para qué |
|----------|:-----------:|----------|
| Firebase (proyecto con Authentication) | Sí, para iniciar sesión | Cuentas de usuario |
| Google Cloud (YouTube Data API v3) | No | Videos de YouTube |
| Spotify for Developers | No | Autocompletado del ABM y conexión de cuentas (requiere Premium del dueño de la app) |
| Resend | No | Envío de sugerencias por correo |
| Vercel | Solo para desplegar | Hosting, Neon y Blob |

Verificar versiones:

```bash
git --version
python --version
node --version
psql --version
```

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/Hexagan/Moodify.git
cd Moodify
```

---

## 3. Base de datos local

### 3.1 Crear la base

```bash
psql -U postgres -h localhost -c "CREATE DATABASE moodify;"
```

### 3.2 Cargar el catálogo

`database/moodify.backup` es un respaldo en formato *custom* de PostgreSQL: se restaura con `pg_restore`, no con `psql`.

```bash
pg_restore -U postgres -h localhost -d moodify --no-owner database/moodify.backup
```

Verificar:

```bash
psql -U postgres -h localhost -d moodify -c "SELECT COUNT(*) FROM songs;"
```

Debe devolver alrededor de 113.550 filas.

> Solo hace falta cargar `songs`. Las otras 13 tablas (usuarios, playlists, foro, etc.) las crea el backend automáticamente la primera vez que arranca.

---

## 4. Backend

### 4.1 Entorno virtual y dependencias

```bash
cd backend
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 4.2 Variables de entorno

Crear `backend/.env` (está excluido de Git). Todas son opcionales en local; sin ellas el backend usa la base `postgresql://postgres:1234@localhost:5432/moodify` y guarda los archivos subidos en `backend/uploads/`.

```ini
# Solo si la base local usa otra contraseña, host o nombre
DATABASE_URL=postgresql://postgres:TU_CLAVE@localhost:5432/moodify

# Videos de YouTube (Google Cloud → YouTube Data API v3 → clave de API)
YOUTUBE_API_KEY=

# Autocompletado desde Spotify en el ABM
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# Página de contacto: destinatario y clave de Resend (permiso "Sending access")
CONTACT_TO=
RESEND_API_KEY=
```

### 4.3 Levantar el servidor

```bash
uvicorn main:app --reload --port 8000
```

Al iniciar, el backend crea las tablas que falten y arma el índice de artistas (la primera vez puede tardar unos segundos). Documentación interactiva: http://localhost:8000/docs

### 4.4 Crear un administrador

El rol de administrador habilita el ABM. La cuenta tiene que haber iniciado sesión en Moodify al menos una vez.

```bash
python set_admin.py persona@mail.com            # dar rol de administrador
python set_admin.py persona@mail.com --remove   # quitarlo
python set_admin.py --list                      # listar administradores
```

Agregar `--prod` usa la base de producción, leída de `backend/.env.local` (se genera con `vercel env pull .env.local` dentro de `backend/`).

---

## 5. Frontend

### 5.1 Dependencias

En otra terminal, desde la raíz del repositorio:

```bash
cd frontend
npm install
```

### 5.2 Variables de entorno

Crear `frontend/.env`. Los valores de Firebase están en Firebase Console → Configuración del proyecto → Tus apps → app web.

```ini
VITE_API_URL=http://localhost:8000

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Opcionales: conectar YouTube y Spotify desde Configuración
VITE_GOOGLE_CLIENT_ID=
VITE_SPOTIFY_CLIENT_ID=
# Spotify no acepta "localhost" como redirect: en local usar 127.0.0.1.
# Sin esta variable se usa el origen actual + /configuracion (lo correcto en producción).
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/configuracion
```

En Firebase Console → Authentication → Sign-in method, habilitar **Correo/contraseña**, **Google** y, si se usa, **Facebook**.

### 5.3 Levantar el servidor de desarrollo

```bash
npm run dev
```

Abrir http://localhost:5173

### 5.4 Verificación

- El Dashboard y el Catálogo muestran datos.
- Análisis muestra los cuatro gráficos; un clic en un género abre el catálogo filtrado.
- Registrarse con correo envía un correo de verificación; después de confirmarlo se puede ingresar.
- La consola del navegador (F12) no muestra errores de CORS.

---

## 6. Despliegue en Vercel

El proyecto usa dos proyectos de Vercel conectados al mismo repositorio de GitHub. Cada push a `main` despliega ambos.

### 6.1 Backend (`moodify-api`)

1. Vercel → **Add New → Project** → importar el repositorio.
2. **Root Directory:** `backend`. Vercel detecta FastAPI.
3. **Storage → Create Database → Neon**, conectada a este proyecto. Agrega `DATABASE_URL` y `DATABASE_URL_UNPOOLED`.
4. **Storage → Create → Blob** (acceso público), conectado a este proyecto. Agrega `BLOB_READ_WRITE_TOKEN`.
5. **Settings → Environment Variables** (Production, marcadas como *Sensitive*): `YOUTUBE_API_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `RESEND_API_KEY`, `CONTACT_TO`. Si el frontend usa un dominio propio, agregarlo en `CORS_ORIGINS`.
6. Desplegar y comprobar `https://<backend>.vercel.app/docs`.

### 6.2 Cargar los datos en Neon

Desde una base local ya cargada (sección 3), con la URL **sin pool** de Neon (`DATABASE_URL_UNPOOLED`, se ve en Vercel → Storage → Neon):

```bash
pg_dump -U postgres -h localhost -Fc --no-owner --no-acl moodify -f moodify-local.dump
pg_restore --no-owner --no-acl -d "URL_SIN_POOL_DE_NEON" moodify-local.dump
```

### 6.3 Frontend (`moodify`)

1. Vercel → **Add New → Project** → mismo repositorio.
2. **Root Directory:** `frontend`. Framework: Vite (`frontend/vercel.json` ya redirige todas las rutas a `index.html`).
3. Variables de entorno: `VITE_API_URL` con la URL del backend y todas las `VITE_FIREBASE_*`. Vercel puede marcar `VITE_FIREBASE_API_KEY` como credencial: agregarla como variable de tipo *config*, porque la configuración web de Firebase es pública por diseño.
4. Desplegar.

### 6.4 Configuración en servicios externos

| Servicio | Dónde | Qué agregar |
|----------|-------|-------------|
| Firebase | Authentication → Settings → Authorized domains | El dominio del frontend (`moodify-one-rho.vercel.app`) |
| Firebase | Authentication → Templates → Verificación de correo | Nombre del remitente "Moodify" y texto en español (opcional, mejora la entrega) |
| Google Cloud | Credenciales → cliente OAuth → Orígenes autorizados | `https://moodify-one-rho.vercel.app` |
| Spotify | Dashboard de la app → Redirect URIs | `https://moodify-one-rho.vercel.app/configuracion` |
| Resend | API Keys | Clave con permiso "Sending access". Sin dominio propio, solo entrega al correo con que se creó la cuenta de Resend |

### 6.5 Verificación en producción

```bash
curl -I https://moodify-one-rho.vercel.app/
curl https://moodify-api-roan.vercel.app/subidas/config      # {"direct":true} si Blob está configurado
curl https://moodify-api-roan.vercel.app/stats/kpis
```

Rollback: Vercel → Deployments → deployment anterior → **Promote to Production**.

---

## 7. Troubleshooting

| Problema | Solución |
|----------|----------|
| `pg_restore: error: input file does not appear to be a valid archive` | Verificar la ruta a `database/moodify.backup`; `psql < moodify.backup` no funciona con este formato. |
| `connection refused` al iniciar el backend | PostgreSQL no está corriendo, o `DATABASE_URL` apunta a otro host o contraseña. |
| `ModuleNotFoundError` en el backend | Activar el entorno virtual y repetir `pip install -r requirements.txt`. |
| El frontend no muestra datos | Revisar `VITE_API_URL` y que el backend responda en `/docs`. Reiniciar `npm run dev` después de cambiar `.env`. |
| `auth/unauthorized-domain` al iniciar sesión | Agregar el dominio en los dominios autorizados de Firebase. |
| `auth/configuration-not-found` | El método de inicio de sesión no está habilitado en Firebase. |
| El puerto 5173 está ocupado | `npm run dev -- --port 5174` (y agregar ese origen a `CORS_ORIGINS`). |
| 502 en el autocompletado de Spotify | La app de Spotify requiere Premium del dueño; usar las otras fuentes. |
| Error de CORS en producción | El dominio del frontend debe estar en la lista de `backend/main.py` o en `CORS_ORIGINS`. |

---

## 8. Comandos rápidos

```bash
# Backend
cd backend && .\.venv\Scripts\Activate.ps1 && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev

# Lint y build del frontend
cd frontend && npm run lint && npm run build

# Administradores
cd backend && python set_admin.py --list
```

---

*Mauro Di Gallo — Visualización / QA / Docs — Moodify · Junio 2026 · Actualizado en noviembre de 2026*
