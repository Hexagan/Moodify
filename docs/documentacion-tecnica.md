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

La base de datos se denomina `musica_emociones` y corre en un servidor PostgreSQL local. Contiene la tabla `songs` con los atributos musicales y emocionales de cada canción.

### 3.1 Configuración de Conexión

```
Host:     localhost
Puerto:   5432
Base:     musica_emociones
Usuario:  postgres
ORM URL:  postgresql://postgres:<CONTRASEÑA>@localhost:5432/musica_emociones
```

> La contraseña se configura en `backend/database.py`. No commitear credenciales reales al repositorio.

### 3.2 Tabla `songs`

Contiene aproximadamente **113.549 registros**. El diccionario de datos completo con descripción de cada campo se encuentra en [`docs/diccionario-datos.md`](./diccionario-datos.md).

---

## 4. Backend — API REST

El backend está desarrollado con FastAPI (Python) y expone una API REST que el frontend consume mediante Axios. SQLAlchemy actúa como ORM para mapear los registros de la tabla `songs` a objetos Python.

### 4.1 Estructura de archivos

```
backend/
├── main.py        # Definición de la app, modelos ORM, schemas Pydantic y rutas
└── database.py    # Configuración de la conexión a PostgreSQL
```

### 4.2 Cómo levantar el backend

**Requisitos previos:** Python 3.x, pip, PostgreSQL corriendo con la base `musica_emociones` cargada.

```bash
# 1. Instalar dependencias
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic

# 2. Configurar contraseña en backend/database.py
# SQLALCHEMY_DATABASE_URL = "postgresql://postgres:TU_CONTRASEÑA@localhost:5432/musica_emociones"

# 3. Levantar el servidor
cd backend
uvicorn main:app --reload

# 4. Verificar en el navegador
# http://localhost:8000/docs
```

### 4.3 Endpoints disponibles

La documentación completa de los endpoints se encuentra en [`docs/diccionario-datos.md`](./diccionario-datos.md#2-documentación-de-la-api-rest).

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/canciones` | Retorna las primeras 100 canciones del catálogo |
| `GET` | `/canciones/filtrar` | Filtra por género (`genero`) y/o contenido explícito (`es_explicita`) |

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
