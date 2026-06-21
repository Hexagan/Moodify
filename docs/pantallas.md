# Pantallas Moodify

## 1. Navegación general

La aplicación utiliza un `Sidebar` lateral y un `Topbar` superior en todas las pantallas.

### Sidebar

Menú principal:
- `Dashboard` → `/`
- `Catálogo` → `/catalogo`
- `Análisis` → `/analisis`
- `Bio-impacto` → `/bioimpacto`
- `ABM Canciones` → `/abm` (presente en la UI, pero no hay ruta implementada en `frontend/src/App.jsx`).

Sección sistema:
- `Reportes` → navegación visual sin ruta implementada.
- `Configuración` → navegación visual sin ruta implementada.
- `Cerrar sesión` → navegación visual sin ruta implementada.

### Topbar

La barra superior muestra:
- título de la pantalla actual.
- caja de búsqueda de canciones.
- botón `+ Agregar canciones`.

Actualmente el botón `Agregar canciones` es visual; no se detecta un formulario o ruta activa para alta de canciones.

---

## 2. Pantalla Dashboard

Ruta: `/`

### Propósito
Mostrar indicadores generales del catálogo musical y métricas clave de rendimiento.

### Componentes visibles
- `KpiCard` con:
  - Canciones Totales
  - Valencia media
  - Energía promedio
  - Popularidad media
- `CatalogGrowthChart` mostrando nuevas canciones por mes.
- `RecentSongsTable` con diez canciones aleatorias.
- `GenreDistributionChart` con popularidad promedio por género.

### Funcionalidad
- Presenta un resumen estático de las métricas del catálogo.
- Navegación hacia otras secciones del dashboard.

---

## 3. Pantalla Catálogo

Ruta: `/catalogo`

### Propósito
Permitir la exploración del catálogo de canciones con filtros, búsqueda y paginación.

### Componentes visibles
- `GenreFilters` para seleccionar género.
- `SortFilters` para ordenar por campos como valencia, energía, popularidad y duración.
- `SongsTable` que muestra la lista de canciones.
- `Pagination` para navegar entre páginas.

### Funcionalidad
- Búsqueda de canciones por texto en título o artista.
- Filtrado por género.
- Ordenación ascendente/descendente.
- Paginación con tamaño fijo de 10 canciones.
- Carga de datos desde `frontend/src/services/api.js` mediante `GET /canciones`.

### Estado actual
- El catálogo muestra datos de solo lectura.
- No hay formulario visible para crear, editar o eliminar canciones.

---

## 4. Pantalla Análisis

Ruta: `/analisis`

### Propósito
Exponer perfiles bio-emocionales y métricas analíticas del catálogo.

### Componentes visibles
- `KpiCard` con:
  - Géneros analizados
  - Género más popular
  - Mayor energía media
  - Mayor potencial relajante
- `TopGenresChart` con los géneros más populares.
- `ExplicitContentChart` mostrando los géneros con mayor contenido explícito.
- `LoudnessChart` con loudness promedio por género.
- `PsychMap` con energía vs valencia.

### Funcionalidad
- Muestra una vista analítica de la colección musical.
- Relaciona atributos sonoros con respuestas emocionales.

---

## 5. Pantalla Bio-impacto

Ruta: `/bioimpacto`

### Propósito
Destacar el impacto acústico y bio-emocional de canciones seleccionadas.

### Componentes visibles
- `AcousticChart` con índice acústico para bioimpacto.
- `InsightBanner` con un mensaje explicativo sobre acusticidad y crecimiento vegetal.
- `AcousticSongsList` con las canciones que tienen mayor índice acústico.

### Funcionalidad
- Visualiza el potencial de canciones para aplicaciones de bioacústica.
- Presenta un documento de insights y selección de canciones con mayores valores acústicos.

---

## 6. Observaciones

- La navegación incluye secciones adicionales (`ABM Canciones`, `Reportes`, `Configuración`, `Cerrar sesión`) que no están implementadas como rutas en `frontend/src/App.jsx`.
- La pantalla `Catálogo` es la única vista que consume datos directamente desde la API de canciones con filtros y paginación.
- El botón `+ Agregar canciones` aparece en el `Topbar`, pero no hay formulario asociado en las pantallas actuales.
