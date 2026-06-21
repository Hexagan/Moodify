# Documentación Técnica

**Proyecto:** Moodify — Emociones Musicales  
**Archivo:** `docs/documentacion-tecnica.md`  
**Autor:** Mauro Di Gallo — Visualización / QA / Docs  
**Fecha:** Junio 2026

---

## 1. Descripción General del Sistema

Moodify es una aplicación web orientada al análisis emocional y psicológico de la música. Utiliza datos provenientes de Spotify para permitir la exploración de características como valencia emocional, energía, popularidad, loudness y acousticness mediante dashboards interactivos.

El sistema facilita la identificación de patrones entre géneros musicales y estados emocionales, ofreciendo una interfaz clara y funcional tanto para usuarios finales como para análisis académico.

### 1.1 Objetivos del Sistema

- Visualizar características emocionales y acústicas de un catálogo musical de más de 113.000 canciones.
- Permitir la exploración y filtrado de canciones por género, popularidad y atributos emocionales.
- Ofrecer análisis estadísticos agrupados por género musical.
- Exponer una API REST para consumo de datos desde el frontend.
- Proveer dashboards en Power BI para análisis avanzado de métricas clave.

### 1.2 Alcance

- Módulo de Dashboard con KPIs generales del catálogo.
- Módulo de Catálogo con búsqueda, filtros y paginación.
- Módulo de Análisis con visualizaciones psicológicas y por género.
- Módulo de BioImpacto con análisis acústico y contenido explícito.
- API REST con endpoints de consulta (GET).
- Base de datos PostgreSQL con la tabla `songs`.
- Dashboards complementarios en Power BI.

---

## 2. Arquitectura del Sistema

Moodify sigue una arquitectura de tres capas desacopladas que se comunican a través de HTTP.

```
┌─────────────────────┐        HTTP / JSON       ┌──────────────────────┐        SQL        ┌─────────────────────┐
│   Frontend          │ ──────────────────────▶  │   Backend            │ ────────────────▶ │   Base de Datos     │
│   React 19 + Vite   │ ◀──────────────────────  │   Python + FastAPI   │ ◀──────────────── │   PostgreSQL 18     │
│   localhost:5173    │                           │   localhost:8000     │                   │   localhost:5432    │
└─────────────────────┘                           └──────────────────────┘                   └─────────────────────┘
```

### 2.1 Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Frontend | React | 19.2.6 | Interfaz de usuario reactiva |
| Frontend | Vite | 8.0.x | Bundler y entorno de desarrollo |
| Frontend | React Router | 7.18.0 | Navegación SPA entre páginas |
| Frontend | Recharts | 3.8.1 | Gráficos y visualizaciones |
| Frontend | Bootstrap | 5.3.8 | Sistema de estilos y componentes |
| Frontend | Axios | 1.18.0 | Cliente HTTP para consumo de API |
| Backend | Python | 3.x | Lenguaje principal del servidor |
| Backend | FastAPI | latest | Framework REST de alto rendimiento |
| Backend | SQLAlchemy | latest | ORM para acceso a la base de datos |
| Backend | Pydantic | latest | Validación y serialización de datos |
| Base de Datos | PostgreSQL | 18.4 | Motor de base de datos relacional |
| Visualización | Power BI Desktop | latest | Dashboards de análisis avanzado |

---

## 3. Base de Datos

La base de datos del proyecto se denomina `moodify` y corre en un servidor PostgreSQL local. Contiene la tabla `songs` con los atributos musicales y emocionales de cada canción.

### 3.1 Configuración de Conexión

```
Host:     localhost
Puerto:   5432
Base:     moodify
Usuario:  postgres
ORM URL:  postgresql://postgres:1234@localhost:5432/moodify
```

> La conexión se define en `backend/database.py` usando `SQLALCHEMY_DATABASE_URL`. Cambiar la contraseña o el host allí si se usa otro entorno.

### 3.2 Tabla `songs`

Contiene aproximadamente **113.549 registros**. El diccionario de datos completo con descripción de cada campo se encuentra en [`docs/diccionario-datos.md`](./diccionario-datos.md).

---

## 4. Backend — API REST

El backend está desarrollado con FastAPI (Python) y expone una API REST que el frontend consume mediante Axios. SQLAlchemy actúa como ORM para mapear los registros de la tabla `songs` a objetos Python.

### 4.1 Estructura de archivos

```
backend/
├── main.py               # Definición de la app, registro de routers y middleware CORS
├── database.py           # Configuración de la conexión a PostgreSQL y sesión SQLAlchemy
├── models.py             # Definición del modelo ORM `Cancion`
├── schemas.py            # Schemas Pydantic para peticiones y respuestas
├── requirements.txt      # Dependencias de Python del backend
└── routers/
    ├── canciones.py      # Endpoints CRUD y filtros de canciones
    └── stats.py          # Endpoints de métricas y estadísticas
```

### 4.2 Cómo levantar el backend

**Requisitos previos:** Python 3.x, pip, PostgreSQL corriendo con la base `moodify` cargada.

```bash
# 1. Crear y activar un entorno virtual (recomendado)
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar la conexión en backend/database.py
# SQLALCHEMY_DATABASE_URL = "postgresql://postgres:1234@localhost:5432/moodify"

# 4. Levantar el servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 5. Verificar en el navegador
# http://localhost:8000/docs
```

> El backend habilita CORS para `http://localhost:5173` y la URL de despliegue Vercel usada en el frontend.

### 4.3 Endpoints disponibles

La documentación completa de los endpoints se encuentra en [`docs/diccionario-datos.md`](./diccionario-datos.md#2-documentación-de-la-api-rest), pero los principales endpoints del backend son los siguientes.

#### Endpoints de canciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/canciones` | Devuelve una lista paginada de canciones. Soporta `page`, `page_size`, `sort_by`, `order`, `genero` y `busqueda`. |
| `GET` | `/canciones/filtrar` | Filtra canciones por `genero`, `min_energia`, `min_valencia` y `es_explicita`. |
| `GET` | `/canciones/recomendar/{emocion}` | Devuelve hasta 10 canciones recomendadas según una emoción (`feliz`, `triste`, `relajado`, `energia`). |
| `GET` | `/canciones/count` | Cuenta canciones totales según filtros `genero` y `busqueda`. |
| `GET` | `/canciones/random` | Devuelve 10 canciones aleatorias. |
| `GET` | `/canciones/generos` | Devuelve la lista de géneros disponibles en el catálogo. |
| `POST` | `/canciones` | Crea una nueva canción en la base de datos. |
| `PUT` | `/canciones/{cancion_id}` | Actualiza los datos de una canción existente. |
| `DELETE` | `/canciones/{cancion_id}` | Elimina una canción por ID. |

#### Endpoints de estadísticas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/stats/kpis` | KPIs generales del catálogo. |
| `GET` | `/stats/genre-distribution` | Distribución de popularidad por género. |
| `GET` | `/stats/top-genres` | Top 6 géneros por popularidad promedio. |
| `GET` | `/stats/explicit-content` | Porcentaje de contenido explícito por género. |
| `GET` | `/stats/loudness-by-genre` | Loudness promedio por género. |
| `GET` | `/stats/acoustic-index` | Acousticness promedio para géneros BioImpact seleccionados. |
| `GET` | `/stats/top-acoustic-songs` | Top 6 canciones con mayor acousticness. |
| `GET` | `/stats/psych-map` | Mapa psicológico de valencia y energía por género. |

### 4.4 Parámetros clave de los endpoints

##### `/canciones`
- `page`: página actual (entero, mínimo 1). Default: 1.
- `page_size`: cantidad de resultados por página (1–100). Default: 10.
- `sort_by`: ordena por `valencia`, `energia`, `popularidad` o `duracion`.
- `order`: `asc` o `desc`. Default: `asc`.
- `genero`: filtro exacto de género musical.
- `busqueda`: búsqueda parcial en `track_name` y `artists`.

##### `/canciones/filtrar`
- `genero`: filtro exacto de género.
- `min_energia`: valor mínimo de energy.
- `min_valencia`: valor mínimo de valence.
- `es_explicita`: `true` o `false`.

> El endpoint `/canciones/filtrar` limita el resultado a 50 canciones.

---

## 5. Frontend — Interfaz de Usuario

El frontend es una SPA (Single Page Application) construida con React 19 y Vite. La navegación entre secciones se maneja con React Router y los gráficos se renderizan con Recharts.

### 5.1 Estructura de archivos

```
frontend/
├── src/
│   ├── pages/              # Páginas principales (Dashboard, Catalog, Analysis, BioImpact)
│   ├── components/         # Componentes reutilizables organizados por sección
│   │   ├── dashboard/
│   │   ├── catalog/
│   │   ├── analysis/
│   │   ├── bioimpact/
│   │   ├── common/
│   │   └── layout/
│   ├── services/
│   │   └── api.js          # Configuración de Axios (baseURL: http://localhost:8000)
│   └── styles/             # Variables CSS y estilos globales
├── index.html
├── vite.config.js
└── package.json
```

### 5.2 Páginas y rutas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `Dashboard.jsx` | KPIs generales: total canciones, valencia, energía, popularidad |
| `/catalogo` | `Catalog.jsx` | Tabla de canciones con búsqueda, filtros por género y paginación |
| `/analisis` | `Analysis.jsx` | Gráficos psicológicos: valencia/energía por género, loudness, contenido explícito |
| `/bioimpacto` | `BioImpact.jsx` | Análisis acústico: canciones acústicas destacadas e insights |

### 5.3 Cómo levantar el frontend

**Requisitos previos:** Node.js 18+, npm, backend corriendo en `http://localhost:8000`.

```bash
# 1. Instalar dependencias
cd frontend
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Acceder en el navegador
# http://localhost:5173

# 4. Build para producción
npm run build
```

### 5.4 Dependencias principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` | ^19.2.6 | Librería principal de UI |
| `react-router-dom` | ^7.18.0 | Enrutado SPA |
| `recharts` | ^3.8.1 | Gráficos interactivos |
| `bootstrap` | ^5.3.8 | Estilos y componentes visuales |
| `axios` | ^1.18.0 | Peticiones HTTP al backend |

---

## 6. Módulos Funcionales

### 6.1 Dashboard (`/`)

Pantalla principal del sistema. Muestra indicadores globales del catálogo.

- KPIs: cantidad total de canciones, popularidad media, valencia media, energía media.
- Gráfico de distribución de géneros musicales.
- Gráfico de crecimiento del catálogo.
- Tabla de canciones recientes (top por popularidad).
- Barra de búsqueda y acceso rápido al catálogo.

### 6.2 Catálogo (`/catalogo`)

Exploración completa del catálogo con herramientas de filtrado.

- Tabla paginada con columnas: nombre, artista, género, popularidad, estado.
- Barra de búsqueda por nombre de canción.
- Filtros por género musical (chips seleccionables).
- Ordenamiento por columnas.
- Botón de edición por fila (módulo ABM).

### 6.3 Análisis (`/analisis`)

Visualizaciones orientadas al análisis psicológico y musical.

- Mapa psicológico Valencia vs. Energía por género.
- Ranking de géneros por valencia emocional.
- Distribución de contenido explícito vs. no explícito.
- Loudness promedio por género musical.

### 6.4 BioImpacto (`/bioimpacto`)

Módulo especializado en el impacto acústico de la música.

- Gráfico de acousticness por género.
- Lista de canciones con mayor índice de acousticness.
- Banner de insights con correlaciones entre características y estados emocionales.

---

## 7. Dashboards Power BI

Los dashboards de Power BI complementan el sistema web con análisis exportable. Se conectan directamente a PostgreSQL mediante el conector oficial.

### 7.1 Configuración de conexión

| Propiedad | Valor |
|-----------|-------|
| Conector | PostgreSQL (nativo en Power BI Desktop) |
| Servidor | `localhost:5432` |
| Base de datos | `musica_emociones` |
| Tabla principal | `public.songs` |
| Modo de importación | Import |

### 7.2 Dashboards planificados

| Dashboard | Métricas principales | Gráficos sugeridos |
|-----------|---------------------|--------------------|
| Emociones | Valencia media, energía media, distribución emocional | Scatter plot, barras agrupadas |
| Géneros Musicales | Canciones por género, loudness por género, top géneros | Treemap, barras, donut |
| Popularidad | Top 10 canciones, top artistas, popularidad promedio | Tabla, gauge, barras horizontales |

### 7.3 Consultas SQL para Power BI

#### KPIs generales

```sql
SELECT
  COUNT(*) AS total_canciones,
  ROUND(AVG(popularity), 2) AS popularidad_media,
  ROUND(AVG(valence), 2) AS valencia_media,
  ROUND(AVG(energy), 2) AS energia_media,
  ROUND(AVG(loudness), 2) AS loudness_promedio
FROM songs;
```

#### Valencia y energía por género

```sql
SELECT
  track_genre,
  ROUND(AVG(valence), 2) AS valencia,
  ROUND(AVG(energy), 2) AS energia,
  COUNT(*) AS total_canciones
FROM songs
GROUP BY track_genre
ORDER BY energia DESC;
```

#### Top 10 canciones más populares

```sql
SELECT DISTINCT ON (track_id)
  track_name, artists, popularity, track_genre
FROM songs
ORDER BY track_id, popularity DESC
LIMIT 10;
```

---

## 8. Equipo de Desarrollo

| Integrante | Rol | Tecnología | Responsabilidades |
|-----------|-----|-----------|-------------------|
| Jonathan (Jony) | Base de Datos | PostgreSQL | Diseño del schema, carga del dataset, consultas SQL |
| Valentín (Valen) | Diseño / Frontend | Figma / React | UI/UX, maquetado Figma, componentes visuales |
| Lucas | Backend | Python / FastAPI | API REST, lógica de negocio, integración con BD |
| Fede | Frontend | React / Bootstrap | Implementación de páginas, gráficos, catálogo |
| Mauro Di Gallo | Visualización / QA / Docs | Power BI | Dashboards, documentación técnica, casos de prueba |

---

*Mauro Di Gallo — Visualización / QA / Docs — Moodify · Junio 2026*
