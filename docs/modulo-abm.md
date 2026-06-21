# Módulo ABM de Canciones

## 1. Descripción general

El módulo ABM (Alta, Baja y Modificación) de Moodify gestiona el catálogo de canciones almacenado en la base de datos Postgres. Su implementación principal se encuentra en `backend/routers/canciones.py` y utiliza el modelo de datos `backend/models.py` con los esquemas de entrada/salida definidos en `backend/schemas.py`.

Este módulo ofrece:
- Lectura de canciones paginadas y ordenadas.
- Búsqueda y filtrado por género, texto, energía, valencia y contenido explícito.
- Creación de nuevas canciones.
- Actualización de canciones existentes.
- Eliminación de canciones.
- Consultas auxiliares como conteo, selección aleatoria y listado de géneros.

## 2. Endpoints principales del ABM

### 2.1 `GET /canciones`

Lista canciones con paginación, ordenación y búsqueda.

Query params disponibles:
- `page` (int, mínimo 1) — página actual.
- `page_size` (int, 1–100) — tamaño de página.
- `sort_by` (string) — valores disponibles: `valencia`, `energia`, `popularidad`, `duracion`.
- `order` (string) — `asc` o `desc`.
- `genero` (string) — filtra exacto por `track_genre`.
- `busqueda` (string) — busca en `track_name` o `artists`.

### 2.2 `GET /canciones/filtrar`

Devuelve hasta 50 canciones que cumplan con los filtros proporcionados.

Query params disponibles:
- `genero` (string)
- `min_energia` (float)
- `min_valencia` (float)
- `es_explicita` (boolean)

### 2.3 `POST /canciones`

Crea una nueva canción a partir de los datos recibidos en el cuerpo de la petición.

El backend utiliza `schemas.CancionCreate` para validar los campos y luego hace:
- `models.Cancion(**cancion_entrada.dict())`
- `db.add(nueva_cancion)`
- `db.commit()`
- `db.refresh(nueva_cancion)`

### 2.4 `PUT /canciones/{cancion_id}`

Actualiza una canción existente identificada por `cancion_id`.

El flujo actual es:
- Buscar la canción por `id`.
- Si no existe, devuelve `{ "error": "Canción no encontrada" }`.
- Si existe, iterar sobre los campos y aplicar `setattr`.
- Hacer `db.commit()` y `db.refresh(cancion)`.

### 2.5 `DELETE /canciones/{cancion_id}`

Elimina la canción identificada por `cancion_id` de la base de datos.

Respuesta actual:
```json
{ "mensaje": "La canción con ID 123 fue eliminada con éxito" }
```

## 3. Modelo de datos del módulo ABM

### 3.1 `backend/models.py`

El modelo `Cancion` mapea los campos persistidos en la tabla `songs`:
- `id`
- `track_id`
- `track_name`
- `artists`
- `album_name`
- `track_genre`
- `popularity`
- `duration_ms`
- `explicit`
- `danceability`
- `energy`
- `loudness`
- `acousticness`
- `valence`

### 3.2 `backend/schemas.py`

El esquema `CancionCreate` define la entrada esperada para crear/actualizar canciones, mientras que `CancionRespuesta` describe el objeto devuelto por los endpoints.

## 4. Flujo de datos

1. El frontend solicita datos al backend mediante `fetch` en `frontend/src/services/api.js`.
2. El backend procesa la petición en `backend/routers/canciones.py`.
3. SQLAlchemy ejecuta la consulta o la operación de escritura contra PostgreSQL.
4. El resultado se transforma en JSON mediante FastAPI y los modelos Pydantic.
5. El frontend recibe la respuesta y la muestra en la tabla del catálogo.

## 5. Estado actual del frontend respecto al ABM

El frontend implementa principalmente la lectura de canciones:
- `frontend/src/pages/Catalog.jsx` carga filtros, búsqueda y paginación.
- `frontend/src/components/catalog/SongsTable.jsx` muestra la lista de canciones.
- `frontend/src/services/api.js` define los endpoints de consulta.

Actualmente no se observa una implementación completa de:
- formulario de alta de canción
- edición con envío `PUT`
- eliminación con `DELETE`

Solo existe un botón de edición visual (`EditButton`) en cada fila, pero no está conectado a una acción de actualización.

## 6. Observaciones y mejoras sugeridas

- Mejorar los errores de `PUT`/`DELETE` para usar respuestas HTTP más apropiadas (404 en lugar de devolver JSON plano con `error`).
- Añadir un formulario de alta/edición con `POST /canciones` y `PUT /canciones/{cancion_id}`.
- Implementar confirmación para la eliminación antes de llamar a `DELETE /canciones/{cancion_id}`.
- Refactorizar el frontend para exponer la funcionalidad completa del ABM más allá de la sola visualización.
