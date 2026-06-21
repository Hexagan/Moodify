# Requisitos Funcionales y No Funcionales

**Proyecto:** Moodify — Emociones Musicales  
**Archivo:** `docs/requisitos-funcionales.md`  
**Autor:** Mauro Di Gallo — Visualización / QA / Docs  
**Fecha:** Junio 2026

---

## 1. Requisitos Funcionales (RF)

### 1.1 Gestión del Catálogo de Canciones

#### RF-001: Visualizar catálogo paginado
- **Descripción:** El sistema debe permitir la visualización de canciones en una tabla paginada.
- **Actor:** Usuario
- **Precondición:** Backend corriendo, BD con datos cargados
- **Flujo:** Usuario entra a `/catalogo` → Sistema carga 10 canciones por página
- **Postcondición:** Se muestran canciones con columnas: nombre, artista, género, popularidad, duración
- **Prioridad:** ALTA

#### RF-002: Filtrar canciones por género
- **Descripción:** El usuario puede seleccionar un género para filtrar la tabla.
- **Actor:** Usuario
- **Precondición:** Catálogo cargado, géneros disponibles en BD
- **Flujo:** Usuario selecciona género en chip de filtro → Sistema refiltra tabla
- **Postcondición:** Tabla muestra solo canciones del género seleccionado
- **Prioridad:** ALTA

#### RF-003: Buscar canciones por texto
- **Descripción:** El usuario puede escribir un término de búsqueda para localizar canciones por nombre o artista.
- **Actor:** Usuario
- **Precondición:** Catálogo cargado
- **Flujo:** Usuario escribe en barra de búsqueda → Sistema filtra en tiempo real (debounce)
- **Postcondición:** Tabla muestra coincidencias en `track_name` o `artists`
- **Prioridad:** ALTA

#### RF-004: Ordenar canciones por columnas
- **Descripción:** El usuario puede ordenar el catálogo ascendente/descendente por valencia, energía, popularidad o duración.
- **Actor:** Usuario
- **Precondición:** Catálogo cargado
- **Flujo:** Usuario elige opción en dropdown `SortFilters` → Sistema ordena tabla
- **Postcondición:** Tabla muestra canciones en orden solicitado
- **Prioridad:** MEDIA

#### RF-005: Paginar resultados
- **Descripción:** El usuario puede navegar entre páginas del catálogo.
- **Actor:** Usuario
- **Precondición:** Catálogo con más de 10 canciones
- **Flujo:** Usuario hace clic en botón "Siguiente" o número de página → Sistema carga nueva página
- **Postcondición:** Tabla muestra 10 canciones de la página seleccionada
- **Prioridad:** ALTA

#### RF-006: Crear nueva canción
- **Descripción:** El usuario puede crear una nueva canción en el sistema.
- **Actor:** Usuario (futuro)
- **Precondición:** Formulario ABM implementado
- **Flujo:** Usuario llena formulario → Envía POST /canciones → Backend valida y guarda
- **Postcondición:** Nueva canción aparece en catálogo
- **Prioridad:** MEDIA
- **Estado:** No implementado

#### RF-007: Editar canción existente
- **Descripción:** El usuario puede modificar datos de una canción.
- **Actor:** Usuario (futuro)
- **Precondición:** Botón de edición en tabla, formulario ABM implementado
- **Flujo:** Usuario hace clic en editar → Abre formulario con datos → Modifica campos → Envía PUT
- **Postcondición:** Cambios guardados en BD
- **Prioridad:** MEDIA
- **Estado:** No implementado

#### RF-008: Eliminar canción
- **Descripción:** El usuario puede borrar una canción del catálogo.
- **Actor:** Usuario (futuro)
- **Precondición:** Botón de eliminar en tabla, confirmación
- **Flujo:** Usuario hace clic en eliminar → Confirma acción → Backend ejecuta DELETE
- **Postcondición:** Canción desaparece del catálogo
- **Prioridad:** MEDIA
- **Estado:** No implementado

---

### 1.2 Dashboards y Análisis

#### RF-009: Mostrar KPIs generales
- **Descripción:** El dashboard principal muestra 4 indicadores clave: total canciones, valencia media, energía media, popularidad media.
- **Actor:** Usuario
- **Precondición:** Backend corriendo, endpoint `/stats/kpis` activo
- **Flujo:** Usuario abre `/` → Sistema consulta `/stats/kpis` → Renderiza cards con valores
- **Postcondición:** KPIs visibles en pantalla
- **Prioridad:** ALTA

#### RF-010: Visualizar distribución de géneros
- **Descripción:** Gráfico interactivo que muestra popularidad promedio de cada género.
- **Actor:** Usuario
- **Precondición:** Endpoint `/stats/genre-distribution` activo
- **Flujo:** Usuario ve gráfico en Dashboard → Puede hacer hover para detalles
- **Postcondición:** Gráfico renderizado con datos del backend
- **Prioridad:** ALTA

#### RF-011: Mapa psicológico Valencia vs Energía
- **Descripción:** Scatter plot que relaciona valence (eje Y) con energy (eje X) para cada género.
- **Actor:** Usuario analista
- **Precondición:** Endpoint `/stats/psych-map` activo
- **Flujo:** Usuario abre `/analisis` → Ve mapa con puntos por género
- **Postcondición:** Mapa interactivo visible, puede hacer clic en puntos
- **Prioridad:** ALTA

#### RF-012: Ranking de géneros por energía
- **Descripción:** Gráfico de barras con los top 6 géneros por energía promedio.
- **Actor:** Usuario analista
- **Precondición:** Endpoint `/stats/top-genres` activo
- **Flujo:** Usuario ve gráfico en `/analisis` → Barras ordenadas descendente
- **Postcondición:** Gráfico renderizado correctamente
- **Prioridad:** MEDIA

#### RF-013: Análisis de contenido explícito
- **Descripción:** Gráfico que muestra porcentaje de canciones con contenido explícito por género.
- **Actor:** Usuario analista
- **Precondición:** Endpoint `/stats/explicit-content` activo
- **Flujo:** Usuario ve gráfico en `/analisis` → Pie chart o barras
- **Postcondición:** Distribución visible
- **Prioridad:** MEDIA

#### RF-014: Análisis de acousticness
- **Descripción:** Gráfico que muestra índice acústico (acousticness) para géneros seleccionados (BioImpact).
- **Actor:** Usuario analista
- **Precondición:** Endpoint `/stats/acoustic-index` activo
- **Flujo:** Usuario abre `/bioimpacto` → Ve gráfico de acousticness
- **Postcondición:** Gráfico renderizado, lista de canciones acústicas visible
- **Prioridad:** MEDIA

#### RF-015: Top canciones acústicas
- **Descripción:** Tabla con las 6 canciones con mayor índice de acousticness.
- **Actor:** Usuario analista
- **Precondición:** Endpoint `/stats/top-acoustic-songs` activo
- **Flujo:** Usuario abre `/bioimpacto` → Ve tabla de canciones acústicas
- **Postcondición:** Tabla con canciones ordenadas por acousticness descendente
- **Prioridad:** MEDIA

---

### 1.3 Navegación y Interfaz

#### RF-016: Navegación mediante Sidebar
- **Descripción:** Menú lateral permite acceder a todas las secciones principales.
- **Actor:** Usuario
- **Precondición:** Página cargada
- **Flujo:** Usuario hace clic en opción del Sidebar → Navega a ruta correspondiente
- **Postcondición:** Página cargada con contenido correcto
- **Prioridad:** ALTA

#### RF-017: Barra superior con búsqueda rápida
- **Descripción:** Topbar muestra barra de búsqueda de canciones accesible desde cualquier pantalla.
- **Actor:** Usuario
- **Precondición:** Página cargada
- **Flujo:** Usuario escribe en barra de búsqueda → Sistema filtra (futuro)
- **Postcondición:** Resultados mostrados (o redirección a catálogo filtrado)
- **Prioridad:** MEDIA

#### RF-018: Botón de agregar canciones
- **Descripción:** Topbar incluye botón visual para crear nueva canción.
- **Actor:** Usuario (futuro)
- **Precondición:** ABM implementado
- **Flujo:** Usuario hace clic → Se abre formulario de alta
- **Postcondición:** Formulario visible
- **Prioridad:** MEDIA
- **Estado:** Interfaz presente, funcionalidad no implementada

---

### 1.4 API REST

#### RF-019: Endpoint GET /canciones (paginado)
- **Descripción:** Retorna lista paginada de canciones con filtros.
- **Query params:** `page`, `page_size`, `sort_by`, `order`, `genero`, `busqueda`
- **Respuesta:** Array de objetos `CancionRespuesta`
- **Prioridad:** ALTA

#### RF-020: Endpoint GET /canciones/filtrar
- **Descripción:** Retorna canciones filtradas por criteria específicos (sin paginación).
- **Query params:** `genero`, `min_energia`, `min_valencia`, `es_explicita`
- **Límite:** Máximo 50 resultados
- **Prioridad:** MEDIA

#### RF-021: Endpoint GET /canciones/recomendar/{emocion}
- **Descripción:** Retorna 10 canciones recomendadas según emoción.
- **Path param:** `emocion` → `feliz`, `triste`, `relajado`, `energia`
- **Lógica:** Filtra por energy/valence según la emoción
- **Prioridad:** MEDIA

#### RF-022: Endpoint GET /stats/*
- **Descripción:** Suite de endpoints para estadísticas (KPIs, distribución, psych map, etc.)
- **Prioridad:** ALTA

#### RF-023: Endpoint POST /canciones
- **Descripción:** Crea nueva canción.
- **Body:** JSON con todos los campos de `CancionCreate`
- **Respuesta:** Objeto `CancionRespuesta` creado
- **Prioridad:** MEDIA

#### RF-024: Endpoint PUT /canciones/{cancion_id}
- **Descripción:** Actualiza canción existente.
- **Path param:** `cancion_id` (integer)
- **Body:** JSON con campos a actualizar
- **Respuesta:** Objeto actualizado o error 404
- **Prioridad:** MEDIA

#### RF-025: Endpoint DELETE /canciones/{cancion_id}
- **Descripción:** Elimina canción por ID.
- **Path param:** `cancion_id` (integer)
- **Respuesta:** Mensaje de confirmación o error 404
- **Prioridad:** MEDIA

---

## 2. Requisitos No Funcionales (RNF)

### 2.1 Rendimiento (RNF-P)

#### RNF-P-001: Tiempo de respuesta API
- **Descripción:** Endpoints GET deben responder en menos de 2 segundos bajo carga normal.
- **Métrica:** P95 latency < 2s
- **Prioridad:** ALTA

#### RNF-P-002: Tiempo de carga del frontend
- **Descripción:** Primera carga de página debe completarse en menos de 3 segundos (en conexión 4G).
- **Métrica:** First Contentful Paint < 3s
- **Prioridad:** MEDIA

#### RNF-P-003: Paginación eficiente
- **Descripción:** Queries de DB no deben cargar más datos que los necesarios (`LIMIT`).
- **Métrica:** Consultas optimizadas con índices
- **Prioridad:** ALTA

---

### 2.2 Escalabilidad (RNF-S)

#### RNF-S-001: Soporte para 100.000+ registros
- **Descripción:** Sistema debe manejar al menos 100.000 canciones sin degradación notable.
- **Métrica:** Tiempo de respuesta < 2s incluso con dataset completo
- **Prioridad:** ALTA

#### RNF-S-002: Concurrencia
- **Descripción:** Backend debe soportar al menos 50 usuarios simultáneos.
- **Métrica:** Uvicorn con workers, o Gunicorn con múltiples procesos
- **Prioridad:** MEDIA

---

### 2.3 Seguridad (RNF-Se)

#### RNF-Se-001: Protección CORS
- **Descripción:** CORS debe estar configurado para permitir solo orígenes autorizados.
- **Implementado:** `http://localhost:5173`, `https://moodify-one-rho.vercel.app`
- **Prioridad:** ALTA

#### RNF-Se-002: Validación de entrada
- **Descripción:** Todos los query params y body requests deben validarse con Pydantic.
- **Cobertura:** Tipos de datos, rangos, formato
- **Prioridad:** ALTA

#### RNF-Se-003: Inyección SQL
- **Descripción:** Usar ORM (SQLAlchemy) para prevenir inyección SQL.
- **Implementado:** Sí, ORM utilizado en todos los endpoints
- **Prioridad:** ALTA

#### RNF-Se-004: Manejo de errores sin información sensible
- **Descripción:** Errores API deben no revelar detalles internos de BD o estructura.
- **Implementado:** Parcialmente (algunos endpoints devuelven JSON plano)
- **Mejora:** Usar HTTP status codes apropiados (400, 404, 500)
- **Prioridad:** MEDIA

---

### 2.4 Disponibilidad (RNF-D)

#### RNF-D-001: Uptime objetivo
- **Descripción:** Backend debe estar disponible 99% del tiempo (salvo mantenimiento).
- **Métrica:** Monitoreo con herramientas de alertas
- **Prioridad:** MEDIA

#### RNF-D-002: Recuperación ante fallos
- **Descripción:** En caso de caída, el sistema debe recuperarse automáticamente.
- **Implementado:** Parcialmente (sin re-intentos automáticos actualmente)
- **Prioridad:** BAJA

---

### 2.5 Usabilidad (RNF-U)

#### RNF-U-001: Interfaz responsive
- **Descripción:** Frontend debe funcionar en mobile (320px ancho).
- **Herramienta:** Bootstrap responsive utilities
- **Prioridad:** MEDIA

#### RNF-U-002: Accesibilidad
- **Descripción:** Cumplir con WCAG 2.0 nivel A (colores contrastantes, etiquetas, navegación por teclado).
- **Prioridad:** BAJA

#### RNF-U-003: Documentación de usuario
- **Descripción:** Manual de usuario disponible en `docs/manual-usuario.md`
- **Prioridad:** MEDIA

---

### 2.6 Mantenibilidad (RNF-M)

#### RNF-M-001: Código documentado
- **Descripción:** Docstrings en funciones Python, comentarios en componentes complejos React.
- **Cobertura:** 80% mínimo
- **Prioridad:** MEDIA

#### RNF-M-002: Estructura modular
- **Descripción:** Separación clara de responsabilidades (frontend: pages/components/services; backend: routers/models/schemas).
- **Prioridad:** ALTA

#### RNF-M-003: Versionado y control de cambios
- **Descripción:** Usar Git con commits semánticos (feat, fix, docs, etc.)
- **Prioridad:** MEDIA

---

### 2.7 Compatibilidad (RNF-C)

#### RNF-C-001: Navegadores soportados
- **Descripción:** Frontend debe funcionar en:
  - Chrome/Chromium 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- **Prioridad:** MEDIA

#### RNF-C-002: Backend Python
- **Descripción:** Backend requiere Python 3.9+.
- **Prioridad:** ALTA

#### RNF-C-003: Base de datos PostgreSQL
- **Descripción:** Requiere PostgreSQL 12+.
- **Prioridad:** ALTA

---

## 3. Matriz de Trazabilidad

| ID | Descripción | RF/RNF | Estado | Módulo | Prioridad |
|----|----|--------|--------|--------|-----------|
| RF-001 | Visualizar catálogo paginado | RF | ✅ Done | Catalog | ALTA |
| RF-002 | Filtrar por género | RF | ✅ Done | Catalog | ALTA |
| RF-003 | Búsqueda de texto | RF | ✅ Done | Catalog | ALTA |
| RF-004 | Ordenamiento de columnas | RF | ✅ Done | Catalog | MEDIA |
| RF-005 | Paginación | RF | ✅ Done | Catalog | ALTA |
| RF-006 | Crear canción | RF | ⏳ Pendiente | ABM | MEDIA |
| RF-007 | Editar canción | RF | ⏳ Pendiente | ABM | MEDIA |
| RF-008 | Eliminar canción | RF | ⏳ Pendiente | ABM | MEDIA |
| RF-009 | KPIs generales | RF | ✅ Done | Dashboard | ALTA |
| RF-010 | Distribución de géneros | RF | ✅ Done | Dashboard | ALTA |
| RF-011 | Mapa psicológico | RF | ✅ Done | Analysis | ALTA |
| RF-012 | Ranking de géneros | RF | ✅ Done | Analysis | MEDIA |
| RF-013 | Contenido explícito | RF | ✅ Done | Analysis | MEDIA |
| RF-014 | Acousticness | RF | ✅ Done | BioImpact | MEDIA |
| RF-015 | Top acústicas | RF | ✅ Done | BioImpact | MEDIA |
| RF-016 | Navegación Sidebar | RF | ✅ Done | Layout | ALTA |
| RF-017 | Búsqueda en Topbar | RF | ⏳ Pendiente | Layout | MEDIA |
| RF-018 | Botón agregar | RF | 🟡 UI Ready | Layout | MEDIA |
| RF-019 | GET /canciones | RF | ✅ Done | API | ALTA |
| RF-020 | GET /canciones/filtrar | RF | ✅ Done | API | MEDIA |
| RF-021 | GET /recomendar | RF | ✅ Done | API | MEDIA |
| RF-022 | GET /stats/* | RF | ✅ Done | API | ALTA |
| RF-023 | POST /canciones | RF | ✅ Done | API | MEDIA |
| RF-024 | PUT /canciones/{id} | RF | ✅ Done | API | MEDIA |
| RF-025 | DELETE /canciones/{id} | RF | ✅ Done | API | MEDIA |
| RNF-P-001 | Latency < 2s | RNF | ✅ Met | Backend | ALTA |
| RNF-P-002 | FCP < 3s | RNF | 🟡 Target | Frontend | MEDIA |
| RNF-S-001 | 100k+ registros | RNF | ✅ Soportado | Database | ALTA |
| RNF-Se-001 | CORS protegido | RNF | ✅ Done | Backend | ALTA |
| RNF-Se-002 | Validación input | RNF | ✅ Pydantic | Backend | ALTA |

---

*Mauro Di Gallo — Visualización / QA / Docs — Moodify · Junio 2026*
