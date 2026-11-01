# Documentación Técnica

**Proyecto:** Moodify — Emociones Musicales  
**Archivo:** `docs/documentacion-tecnica.md`  
**Autor:** Mauro Di Gallo — Visualización / QA / Docs  
**Fecha:** Junio 2026 · **Actualizado:** Noviembre 2026 (despliegue en Vercel + Neon, usuarios, módulos sociales)

---

## 1. Descripción General del Sistema

Moodify es una aplicación web para explorar música según su perfil emocional. Parte de un dataset público de Spotify (113.550 filas) con atributos como valencia, energía, bailabilidad, loudness y acousticness, y los convierte en un catálogo navegable, un mapa emocional, análisis por género y recomendaciones personales.

Se puede usar como invitado (catálogo, análisis, mapa emocional, artistas) o con una cuenta, que suma me gusta, historial, playlists, comentarios, foro de artistas, amigos y configuración personal. Los administradores gestionan el catálogo desde el módulo ABM.

### 1.1 Objetivos del Sistema

- Explorar un catálogo de más de 113.000 canciones con búsqueda, filtros por género, rangos de valencia/energía/popularidad/duración y ordenamiento.
- Relacionar música y emociones: mapa de valencia × energía con cuatro cuadrantes (Intensa, Energética, Relajante, Melancólica).
- Ofrecer análisis estadísticos por género (popularidad, contenido explícito, loudness, acousticness).
- Recomendar canciones a partir de los me gusta y el historial de cada usuario.
- Escuchar previews (iTunes / Deezer / Spotify) y videos de YouTube sin salir del sitio.
- Exponer una API REST documentada y desplegada en la nube.

### 1.2 Alcance actual

| Módulo | Ruta | Acceso |
|--------|------|--------|
| Dashboard (recomendaciones, mapa emocional para invitados) | `/` | Todos |
| Catálogo | `/catalogo` | Todos |
| Detalle de canción (preview, YouTube, comentarios, reacciones) | `/cancion/:id` | Todos (interactuar requiere cuenta) |
| Mapa emocional | `/mapa-emocional` | Usuarios con cuenta (los invitados lo ven en el Dashboard) |
| Artistas y foro por artista | `/artistas`, `/artistas/:id`, `/artistas/:id/hilo/:threadId` | Todos (publicar requiere cuenta) |
| Análisis | `/analisis` | Todos |
| Bio-impacto | `/bioimpacto` | Todos |
| Reportes | `/reportes` | Todos |
| Perfil | `/perfil/:uid` | Todos (editar: el dueño) |
| Playlist | `/playlist/:id` | Según visibilidad (pública, amigos, privada) |
| Configuración | `/configuracion` | Usuarios con cuenta |
| Contacto (sugerencias) | `/contacto` | Usuarios con cuenta |
| ABM de canciones | `/abm` | Administradores |
| Inicio de sesión / registro | `/login` | Todos |
| Política de privacidad | `/privacidad` | Pública, enlazada desde el inicio de sesión |

---

## 2. Arquitectura del Sistema

Arquitectura cliente-servidor de tres capas, desplegada completamente en Vercel:

![Diagrama de arquitectura](./diagramas/arquitectura.png)

Archivo editable: [`docs/diagramas/arquitectura.drawio`](./diagramas/arquitectura.drawio) (abrir con draw.io / diagrams.net).

| Componente | Dónde corre | Función |
|-----------|-------------|---------|
| Frontend (proyecto Vercel `moodify`) | CDN de Vercel — https://moodify-one-rho.vercel.app | SPA en React; todas las rutas se reescriben a `index.html` (`frontend/vercel.json`). |
| Backend (proyecto Vercel `moodify-api`) | Vercel Functions — https://moodify-api-roan.vercel.app | API REST en FastAPI. Cada request se atiende en una función serverless. |
| Base de datos | Neon PostgreSQL (integración del Marketplace de Vercel, región iad1) | 14 tablas. |
| Archivos | Vercel Blob (store `moodify-uploads`, público) | Fotos de perfil, portadas y previews subidas desde el ABM, adjuntos del foro. |
| Autenticación | Firebase Authentication | Google, Facebook y correo/contraseña con verificación obligatoria. |
| Correo | Resend | Envío de las sugerencias de la página de contacto. |
| CI/CD | GitHub (`Hexagan/Moodify`, rama `main`) | Cada push despliega ambos proyectos automáticamente. |

### 2.1 Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Frontend | React | 19.2 | Interfaz de usuario |
| Frontend | Vite | 8.0 | Bundler y servidor de desarrollo |
| Frontend | React Router | 7.18 | Navegación SPA |
| Frontend | Recharts | 3.8 | Gráficos interactivos |
| Frontend | Bootstrap (CSS) + react-bootstrap-icons | 5.3 / 1.11 | Estilos base e íconos; el resto es CSS propio con variables y container queries |
| Frontend | Firebase JS SDK | 12 | Inicio de sesión y verificación de correo |
| Frontend | @vercel/blob | 2.8 | Subida directa de archivos a Blob |
| Frontend | @vercel/analytics | 2.0 | Métricas de uso |
| Backend | Python + FastAPI | 0.138 | API REST con documentación OpenAPI automática |
| Backend | SQLAlchemy | 2.0 | ORM |
| Backend | Pydantic | 2.13 | Validación de entrada y salida |
| Backend | NumPy | 2.4 | Matriz de atributos para el recomendador |
| Backend | requests | 2.34 | Consumo de APIs externas |
| Base de datos | PostgreSQL (Neon) | 18 en desarrollo local | Persistencia |
| Visualización | Power BI Desktop | — | Dashboards complementarios |

> Las peticiones HTTP del frontend usan `fetch` (`frontend/src/services/api.js`). Axios sigue en `package.json` pero no se usa.

### 2.2 APIs externas consumidas

| Servicio | Uso | Credencial |
|----------|-----|-----------|
| YouTube Data API v3 | Buscar el video de cada canción; autocompletado del ABM | `YOUTUBE_API_KEY` (backend) |
| YouTube IFrame API | Reproductor embebido (modo de privacidad mejorada, `youtube-nocookie.com`) | — |
| Spotify Web API | Autocompletado del ABM (client credentials) y conexión de la cuenta del usuario en Configuración (PKCE) | `SPOTIFY_CLIENT_ID/SECRET` (backend), `VITE_SPOTIFY_CLIENT_ID` (frontend) |
| Spotify oEmbed | Portadas de canciones | — |
| iTunes Search API | Previews de 30 s y autocompletado | — |
| Deezer API | Previews alternativas, autocompletado y fotos de artistas | — |
| Wikipedia REST API | Biografías de artistas | — |
| Firebase Authentication | Cuentas de usuario | `VITE_FIREBASE_*` (frontend) |
| Vercel Blob | Almacenamiento de archivos | `BLOB_READ_WRITE_TOKEN` (backend) |
| Resend | Correos de sugerencias | `RESEND_API_KEY` (backend) |

> Spotify exige que el dueño de la aplicación de desarrollador tenga Spotify Premium para usar la Web API. Sin Premium, el autocompletado desde Spotify devuelve 502 y la conexión de cuentas falla; el resto del sitio no depende de esa API.

---

## 3. Base de Datos

PostgreSQL con 14 tablas. En producción corre en Neon; en desarrollo, en un PostgreSQL local (base `moodify`).

![Diagrama entidad-relación](./diagramas/der.png)

Archivo editable: [`docs/diagramas/der.drawio`](./diagramas/der.drawio). Descripción de cada campo: [`docs/diccionario-datos.md`](./diccionario-datos.md).

### 3.1 Tablas

| Área | Tablas |
|------|--------|
| Catálogo | `songs` (dataset), `song_media` (caché de portada, preview y video por `track_id`) |
| Usuarios | `user_profiles`, `user_settings`, `friendships`, `suggestions` |
| Actividad | `song_likes`, `song_history`, `comments`, `playlists`, `playlist_songs` |
| Artistas | `artists`, `artist_threads`, `artist_posts` |

### 3.2 Decisiones de diseño

- **`songs` conserva el dataset original.** Una canción aparece una vez por cada género en que fue clasificada y `artists` guarda varios nombres separados por `;`. En lugar de reescribir 113.550 filas, las consultas deduplican al leer (`backend/song_queries.py`, índice `ix_songs_dedup`) y la tabla `artists` se construye a partir de `songs` al iniciar el backend (`backend/artist_index.py`).
- **Las tablas propias de la aplicación están normalizadas:** claves foráneas hacia `songs` y `user_profiles`, restricciones `UNIQUE` para impedir me gusta, entradas de historial o canciones de playlist duplicadas, y `ON DELETE CASCADE` donde corresponde.
- **El `uid` de usuario lo genera Firebase.** `user_profiles` se crea en el primer inicio de sesión (con el correo ya verificado en cuentas de correo/contraseña).
- **Roles:** `user_profiles.role` vale `user` o `dev` (administrador). Solo se cambia con `backend/set_admin.py`; la API no acepta `role` en la edición de perfil.

### 3.3 Creación y migraciones

`backend/main.py` ejecuta `Base.metadata.create_all()` al iniciar, de modo que las tablas nuevas se crean solas, y aplica con `ALTER TABLE … IF NOT EXISTS` las columnas agregadas después. La carga inicial de `songs` se hace con `database/moodify.backup` (ver la [guía de instalación](./guia-instalacion.md)).

### 3.4 Conexión

La URL se lee de la variable `DATABASE_URL` (`backend/database.py`); si no existe, usa `postgresql://postgres:1234@localhost:5432/moodify`. En Vercel cada request abre y cierra su propia conexión (`NullPool`) para no agotar las conexiones de Neon con funciones en paralelo.

---

## 4. Backend — API REST

### 4.1 Estructura de archivos

```
backend/
├── main.py            # App FastAPI, CORS, routers, creación de tablas y columnas
├── database.py        # Conexión a PostgreSQL (DATABASE_URL)
├── models.py          # 14 modelos SQLAlchemy
├── schemas.py         # Schemas Pydantic
├── song_queries.py    # Consultas deduplicadas del catálogo
├── recommender.py     # Recomendaciones por similitud de atributos
├── artist_index.py    # Construye la tabla artists a partir de songs
├── storage.py         # Archivos: Vercel Blob en producción, carpeta uploads/ en local
├── set_admin.py       # Script para otorgar o quitar el rol de administrador
├── requirements.txt
└── routers/
    ├── canciones.py   # /canciones — catálogo, filtros, ABM, mapa emocional
    ├── stats.py       # /stats — KPIs y estadísticas por género
    ├── media.py       # /media — portadas, previews, YouTube, autocompletado del ABM
    ├── usuarios: users.py, friends.py, settings.py
    ├── actividad: likes.py, comments.py, musica.py (historial, recomendaciones), playlists.py
    ├── artistas.py    # /artistas — artistas destacados, foro (hilos y respuestas)
    ├── subidas.py     # /subidas — tokens para subir archivos a Blob
    └── contacto.py    # /contacto — sugerencias por correo
```

### 4.2 Endpoints

La referencia completa e interactiva la genera FastAPI en **https://moodify-api-roan.vercel.app/docs** (o `http://localhost:8000/docs` en local). Resumen por grupo (75 endpoints):

| Prefijo | Endpoints | Contenido |
|---------|:---------:|-----------|
| `/canciones` | 11 | Listado paginado con filtros, conteo, detalle, alta/modificación/baja, géneros, aleatorias, recomendaciones por emoción y por cuadrante del mapa |
| `/stats` | 8 | KPIs, distribución por género, top géneros, contenido explícito, loudness (top 8), acousticness, mapa psicológico |
| `/media` | 7 | Portada, preview y video de cada canción; datos de medios para el ABM; autocompletado (iTunes, Deezer, Spotify, YouTube) |
| `/usuarios` | 5 | Alta/sincronización del perfil, lectura, edición, foto, búsqueda |
| `/amigos` | 5 | Solicitudes, aceptar, eliminar, listar |
| `/likes` | 5 | Me gusta, reacciones y notas |
| `/comentarios` | 3 | Comentarios por canción |
| `/musica` | 6 | Historial, me gusta, recomendaciones de canciones y de artistas |
| `/playlists` | 7 | CRUD de playlists y de sus canciones |
| `/configuracion` | 2 | Preferencias guardadas por usuario |
| `/artistas` | 13 | Listado, destacados, detalle, foto, canciones, hilos y respuestas del foro |
| `/subidas` | 2 | Modo de subida y token firmado para Blob |
| `/contacto` | 1 | Enviar una sugerencia |

### 4.3 Funcionamiento destacado

**Subida de archivos.** Las Vercel Functions rechazan cuerpos de más de 4,5 MB, así que los archivos no pasan por el backend:

1. El navegador pide un token a `POST /subidas/token` indicando la carpeta (`avatars`, `songs` o `forum`).
2. El backend verifica que el usuario exista, que tenga permiso (solo administradores en `songs`) y fija tipos y tamaño máximo: 5 MB en avatares, 15 MB en canciones y 25 MB en el foro. Devuelve un token firmado válido 10 minutos.
3. El navegador sube el archivo directo a Vercel Blob y envía al backend solo la URL.
4. El backend lee los primeros bytes del archivo, comprueba que el formato real coincida con el declarado y lo borra si no coincide.

En desarrollo local, sin `BLOB_READ_WRITE_TOKEN`, los archivos se envían al backend y se guardan en `backend/uploads/`.

**Recomendaciones** (`recommender.py`). Cada canción se representa con cinco atributos ponderados: valencia y energía (peso 1,3), bailabilidad y acousticness (0,8) y loudness normalizado (0,6). Las semillas son los me gusta del usuario (peso 3) y su historial (peso 1, con vida media de 30 días). Se buscan las canciones más cercanas a cada semilla, con un bonus por mismo género y por popularidad, un máximo de 2 canciones por artista y un 25 % de lugares reservados para lo que surge del historial.

**Mapa emocional.** Un clic en el mapa se traduce en un punto de valencia y energía (0–1). `GET /canciones/mapa-emocional/{cuadrante}` filtra las canciones del rango del cuadrante (por ejemplo, Energética: valencia y energía entre 0,6 y 1) y las ordena por distancia euclídea al punto; sin punto, por popularidad.

**Previews y videos.** La primera vez que se pide la preview de una canción, el backend la busca en iTunes y luego en Deezer, y guarda el resultado en `song_media`. Lo mismo con el video de YouTube. Los administradores pueden fijar valores manuales desde el ABM.

### 4.4 Seguridad

- Contraseñas y sesiones gestionadas por Firebase; el sistema nunca recibe contraseñas.
- Las cuentas de correo/contraseña deben verificar su dirección antes de ingresar.
- Rol de administrador solo asignable con `set_admin.py` (acceso directo a la base).
- CORS limitado a `localhost:5173` y al dominio de producción (más los que se agreguen en `CORS_ORIGINS`).
- Validación de entrada con Pydantic y consultas con el ORM (sin SQL armado a mano con datos del usuario).
- Subidas con tipo y tamaño validados antes y después de subir.
- Contacto con límite de 5 sugerencias por usuario por hora; el destinatario solo existe en variables de entorno del backend.
- Secretos en variables de entorno (archivos `.env` excluidos de Git; en Vercel marcados como sensibles).

**Limitación conocida:** la API identifica al usuario por el `uid` que envía el frontend y no verifica el token de Firebase en cada request. El siguiente paso es validar el ID token con Firebase Admin SDK en el backend.

### 4.5 Variables de entorno del backend

| Variable | Obligatoria | Uso |
|----------|:-----------:|-----|
| `DATABASE_URL` | En producción | Conexión a PostgreSQL |
| `BLOB_READ_WRITE_TOKEN` | En producción | Vercel Blob (sin ella, se usa la carpeta `uploads/`) |
| `YOUTUBE_API_KEY` | No | Búsqueda de videos |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | No | Autocompletado desde Spotify |
| `RESEND_API_KEY`, `CONTACT_TO` | No | Envío de sugerencias por correo (sin ellas se guardan igual en la base) |
| `RESEND_FROM` | No | Remitente; por defecto `Moodify <onboarding@resend.dev>` |
| `CORS_ORIGINS` | No | Orígenes extra separados por coma |
| `VERCEL` | Automática | La define Vercel; activa el modo sin pool de conexiones |

---

## 5. Frontend — Interfaz de Usuario

### 5.1 Estructura de archivos

```
frontend/
├── src/
│   ├── pages/            # Una página por ruta (ver 1.2)
│   ├── components/       # Por módulo: abm, analysis, artists, auth, bioimpact, catalog,
│   │                     # common, dashboard, emotionmap, layout, player, playlists, settings
│   ├── context/          # AuthContext (sesión y perfil), PlayerContext, SettingsContext
│   ├── services/api.js   # Todas las llamadas al backend (fetch, VITE_API_URL)
│   ├── utils/            # Integraciones, subidas, rangos del catálogo, verificación de correo…
│   ├── firebase.js       # Inicialización de Firebase Auth
│   └── styles/
├── vercel.json           # Reescritura de rutas a index.html
└── package.json
```

### 5.2 Variables de entorno del frontend

| Variable | Uso |
|----------|-----|
| `VITE_API_URL` | URL del backend (por defecto `http://localhost:8000`) |
| `VITE_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID`, `_MEASUREMENT_ID` | Configuración web de Firebase (son públicas por diseño) |
| `VITE_GOOGLE_CLIENT_ID` | Conexión de YouTube en Configuración |
| `VITE_SPOTIFY_CLIENT_ID`, `VITE_SPOTIFY_REDIRECT_URI` | Conexión de Spotify en Configuración |

### 5.3 Visualizaciones (Recharts)

| Componente | Tipo | Endpoint | Detalle |
|-----------|------|----------|---------|
| `GenreDistributionChart` | Barras horizontales | `/stats/genre-distribution` | Dashboard |
| `TopGenresChart` | Barras horizontales | `/stats/top-genres` | Análisis |
| `ExplicitContentChart` | Barras horizontales | `/stats/explicit-content` | Análisis |
| `LoudnessChart` | Barras horizontales | `/stats/loudness-by-genre` | Análisis — los 8 géneros más fuertes; la barra mide la distancia sobre un piso 2 dB por debajo del más suave, para que el más fuerte tenga la barra más larga |
| `PsychMap` | Dispersión | `/stats/psych-map` | Análisis — cuadrantes con `ReferenceArea` según la media de valencia y energía |
| `AcousticChart` | Barras con forma propia (lollipop) | `/stats/acoustic-index` | Bio-impacto |

En Análisis, cada género de los gráficos (nombre, barra o punto) y de las tarjetas de KPI abre el catálogo filtrado (`/catalogo?genero=…`).

### 5.4 Interfaz y accesibilidad

- Modo claro y oscuro, y tres perfiles de color personalizables.
- Escala de texto y opciones de accesibilidad en Configuración.
- Barra lateral contraíble; la tabla del catálogo oculta columnas secundarias según el ancho disponible (container queries) y mantiene alineadas las filas.
- Elementos interactivos de los gráficos accesibles con teclado (Tab + Enter).

---

## 6. Despliegue en Producción (Vercel)

Ambos proyectos están en el equipo `grupo-015` de Vercel y se despliegan automáticamente con cada push a `main`.

| Proyecto | Directorio raíz | Framework | URL |
|----------|-----------------|-----------|-----|
| `moodify` | `frontend` | Vite | https://moodify-one-rho.vercel.app |
| `moodify-api` | `backend` | FastAPI | https://moodify-api-roan.vercel.app |

- **Base de datos:** Neon, creada desde la pestaña Storage de Vercel; inyecta `DATABASE_URL` y `DATABASE_URL_UNPOOLED` en `moodify-api`.
- **Archivos:** store de Vercel Blob `moodify-uploads` conectado a `moodify-api` (`BLOB_READ_WRITE_TOKEN`).
- **Configuraciones externas necesarias:** el dominio de producción en los dominios autorizados de Firebase, en los orígenes de OAuth de Google y la URL `/configuracion` como redirect en el panel de Spotify.
- **Rollback:** Vercel → Deployments → elegir un deployment anterior → *Promote to Production*.

Pasos detallados: [guía de instalación, sección 6](./guia-instalacion.md#6-despliegue-en-vercel).

---

## 7. Dashboards Power BI

Los dashboards de Power BI complementan el sistema web y se conectan a PostgreSQL con el conector nativo (modo Import), tabla `public.songs` de la base `moodify`.

| Dashboard | Métricas principales |
|-----------|---------------------|
| Emociones | Valencia media, energía media, distribución emocional |
| Géneros musicales | Canciones por género, loudness, top géneros |
| Popularidad | Top 10 canciones, top artistas, popularidad promedio |

Consultas de ejemplo en `database/Consultas SQL Moodify.txt`.

---

## 8. Testing y Validación

| Nivel | Herramienta | Cobertura |
|-------|-------------|-----------|
| Estático | ESLint (`npm run lint` en `frontend/`) | Frontend |
| API | Swagger UI (`/docs`), curl | Endpoints |
| E2E manual | Navegador | Flujos de usuario — ver [`casos-prueba.md`](./casos-prueba.md) |

---

## 9. Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| El backend no conecta a la base | PostgreSQL apagado o `DATABASE_URL` incorrecta | Iniciar PostgreSQL; revisar `backend/.env` |
| Error de CORS en el navegador | Origen no permitido | Agregarlo a `CORS_ORIGINS` |
| El inicio con Google/Facebook falla en producción | Dominio no autorizado en Firebase | Firebase → Authentication → Settings → Authorized domains |
| No llega el correo de verificación | Filtro de spam | Revisar spam; usar "Reenviar el correo de confirmación" en el login |
| 502 en el autocompletado de Spotify | La app de Spotify requiere Premium del dueño | Ver nota en 2.2 |
| Las sugerencias no llegan por correo | Falta `RESEND_API_KEY` o `CONTACT_TO` | Configurarlas; las sugerencias quedan guardadas en `suggestions` |

---

## 10. Roadmap

- Verificar el ID token de Firebase en el backend (ver 4.4).
- Tests automatizados con pytest para los routers principales.
- Normalizar `songs` en `songs` + `song_genres` + `song_artists` si el catálogo deja de depender del dataset original.
- Vista de sugerencias recibidas dentro del ABM.
- Exportación de reportes (PDF / CSV).

---

## 11. Equipo de Desarrollo

| Integrante | Rol | Tecnología | Responsabilidades |
|-----------|-----|-----------|-------------------|
| Jonathan (Jony) | Base de Datos | PostgreSQL | Diseño del schema, carga del dataset, consultas SQL |
| Valentín (Valen) | Diseño / Frontend | Figma / React | UI/UX, maquetado Figma, componentes visuales |
| Lucas | Backend | Python / FastAPI | API REST, lógica de negocio, integración con BD |
| Fede | Frontend | React / Bootstrap | Implementación de páginas, gráficos, catálogo |
| Mauro Di Gallo | Visualización / QA / Docs | Power BI | Dashboards, documentación técnica, casos de prueba |

---

*Mauro Di Gallo — Visualización / QA / Docs — Moodify · Junio 2026 · Actualizado en noviembre de 2026*
