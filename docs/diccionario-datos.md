# Diccionario de Datos & Documentación de API

**Proyecto:** Moodify — Emociones Musicales  
**Archivo:** `docs/diccionario-datos.md`  
**Autor:** Mauro Di Gallo — Visualización / QA / Docs  
**Fecha:** Junio 2026

---

## 1. Diccionario de Datos

La tabla `songs` es la única tabla del sistema. Almacena los atributos musicales, emocionales y de identificación de cada canción proveniente del dataset de Spotify.

> **Nota:** Una misma canción puede aparecer en múltiples filas si fue clasificada en varios géneros. Esto es intencional en el diseño del dataset (el organizador limitó a ~1.000 canciones por género).

### 1.1 Tabla: `songs`

#### Campos principales

| Campo | Tipo SQL | Restricción | Descripción |
|-------|----------|-------------|-------------|
| `id` | `INTEGER` | PK · NOT NULL · autoincremental | Identificador único interno generado por la base de datos. |
| `track_id` | `TEXT` | Puede duplicarse | ID de la pista en Spotify. Puede repetirse si la misma canción aparece en varios géneros. |
| `track_name` | `TEXT` | NOT NULL | Nombre de la canción. |
| `artists` | `TEXT` | NOT NULL | Artista(s) de la canción. |
| `album_name` | `TEXT` | Opcional | Nombre del álbum. |
| `track_genre` | `TEXT` | Opcional | Género musical. |
| `popularity` | `INTEGER` | 0–100 | Puntaje de popularidad. |
| `duration_ms` | `INTEGER` | NOT NULL | Duración en milisegundos. |
| `explicit` | `BOOLEAN` | true / false | Indica contenido explícito. |
| `danceability` | `FLOAT` | 0.0–1.0 | Bailabilidad de la canción. |
| `energy` | `FLOAT` | 0.0–1.0 | Nivel de energía percibido. |
| `loudness` | `FLOAT` | dB negativos | Loudness promedio. |
| `acousticness` | `FLOAT` | 0.0–1.0 | Probabilidad de que la canción sea acústica. |
| `valence` | `FLOAT` | 0.0–1.0 | Nivel de positividad emocional. |

> El backend actual solo mapea estos 13 campos. Si se requieren análisis adicionales, actualizar `backend/models.py` y `backend/schemas.py`.

---

### 1.2 Campos expuestos en la API vs. campos en la BD

El modelo ORM (`Cancion`) y el schema de respuesta (`CancionRespuesta`) solo exponen los campos usados por el backend actual.

| Campo | En BD | En API | Nota |
|-------|:-----:|:------:|------|
| `id` | ✅ | ✅ | Identificador interno |
| `track_id` | ✅ | ✅ | ID de Spotify |
| `track_name` | ✅ | ✅ | |
| `artists` | ✅ | ✅ | |
| `album_name` | ✅ | ✅ | |
| `track_genre` | ✅ | ✅ | Filtro de género |
| `popularity` | ✅ | ✅ | |
| `duration_ms` | ✅ | ✅ | |
| `explicit` | ✅ | ✅ | |
| `danceability` | ✅ | ✅ | |
| `energy` | ✅ | ✅ | |
| `loudness` | ✅ | ✅ | |
| `acousticness` | ✅ | ✅ | |
| `valence` | ✅ | ✅ | |

> El backend actual omite campos adicionales como `instrumentalness`, `speechiness`, `liveness`, `tempo`, `key`, `mode` y `time_signature`.

---

## 2. Documentación de la API REST

La API se ejecuta en `http://localhost:8000` y devuelve JSON. FastAPI expone documentación interactiva en `http://localhost:8000/docs`.

### 2.1 Información general

| Propiedad | Valor |
|-----------|-------|
| URL base | `http://localhost:8000` |
| Formato de respuesta | JSON |
| Autenticación | No hay |
| CORS | Permitido para `http://localhost:5173` y Vercel |
| Backend | `backend/main.py` |
| Configuración BD | `backend/database.py` |

---

### 2.2 Endpoints de canciones

#### `GET /canciones`

Retorna canciones paginadas.

Query params:
- `page` (int, mínimo 1). Default: 1.
- `page_size` (int, 1–100). Default: 10.
- `sort_by` (string): `valencia`, `energia`, `popularidad`, `duracion`.
- `order` (string): `asc` o `desc`. Default: `asc`.
- `genero` (string): filtro exacto por `track_genre`.
- `busqueda` (string): busca texto en `track_name` y `artists`.

Ejemplo:
```
GET http://localhost:8000/canciones?page=2&page_size=20&sort_by=popularidad&order=desc&genero=rock
```

Respuesta: arreglo de objetos `CancionRespuesta`.

---

#### `GET /canciones/filtrar`

Filtra canciones según los criterios indicados.

Query params:
- `genero` (string)
- `min_energia` (float)
- `min_valencia` (float)
- `es_explicita` (boolean)

Ejemplos:
```
GET http://localhost:8000/canciones/filtrar?genero=pop&min_energia=0.6
GET http://localhost:8000/canciones/filtrar?es_explicita=false
```

Respuesta: arreglo de hasta 50 objetos `CancionRespuesta`.

---

#### `GET /canciones/recomendar/{emocion}`

Recomienda canciones según emoción.

Valores válidos:
- `feliz`, `alegria`, `alegre`
- `triste`, `melancolia`, `tristeza`
- `relajado`, `calma`, `paz`
- `energia`, `euforia`, `intenso`

Ejemplo:
```
GET http://localhost:8000/canciones/recomendar/feliz
```

Respuesta: hasta 10 canciones ordenadas por popularidad.

---

#### `GET /canciones/count`

Cuenta canciones según filtros.

Query params:
- `genero` (string)
- `busqueda` (string)

Respuesta:
```json
{ "total": 1234 }
```

---

#### `GET /canciones/random`

Devuelve 10 canciones al azar.

---

#### `GET /canciones/generos`

Devuelve la lista de géneros únicos.

Respuesta: arreglo de strings.

---

#### `POST /canciones`

Crea una canción nueva.

Body JSON requerido:
```json
{
  "track_id": "string",
  "track_name": "string",
  "artists": "string",
  "album_name": "string",
  "track_genre": "string",
  "popularity": 0,
  "duration_ms": 0,
  "explicit": false,
  "danceability": 0.0,
  "energy": 0.0,
  "loudness": 0.0,
  "acousticness": 0.0,
  "valence": 0.0
}
```

Respuesta: objeto `CancionRespuesta`.

---

#### `PUT /canciones/{cancion_id}`

Actualiza una canción existente.

Body JSON: igual que `POST /canciones`.

Respuesta: objeto `CancionRespuesta` actualizado.

Si no existe el ID, devuelve:
```json
{ "error": "Canción no encontrada" }
```

---

#### `DELETE /canciones/{cancion_id}`

Elimina una canción por ID.

Respuesta:
```json
{ "mensaje": "La canción con ID 123 fue eliminada con éxito" }
```

---

### 2.3 Endpoints de estadísticas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/stats/kpis` | KPIs generales del catálogo. |
| `GET` | `/stats/genre-distribution` | Distribución de popularidad por género. |
| `GET` | `/stats/top-genres` | Top 6 géneros por popularidad promedio. |
| `GET` | `/stats/explicit-content` | Porcentaje de contenido explícito por género. |
| `GET` | `/stats/loudness-by-genre` | Loudness promedio por género. |
| `GET` | `/stats/acoustic-index` | Acousticness promedio para géneros BioImpact específicos. |
| `GET` | `/stats/top-acoustic-songs` | Top 6 canciones con mayor acousticness. |
| `GET` | `/stats/psych-map` | Valores promedio de valence y energy por género. |

---

### 2.4 Modelo de respuesta — `CancionRespuesta`

Campos devueltos por los endpoints de canciones:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer | Identificador interno |
| `track_id` | string | ID de Spotify |
| `track_name` | string | Nombre de la canción |
| `artists` | string | Artista(s) |
| `album_name` | string | Álbum |
| `track_genre` | string | Género |
| `popularity` | integer | Popularidad 0–100 |
| `duration_ms` | integer | Duración en ms |
| `explicit` | boolean | Contenido explícito |
| `danceability` | number | Bailabilidad 0.0–1.0 |
| `energy` | number | Energía 0.0–1.0 |
| `loudness` | number | Loudness en dB |
| `acousticness` | number | Acousticness 0.0–1.0 |
| `valence` | number | Valencia 0.0–1.0 |

---

### 2.5 Consideraciones de uso

- `genero` es un filtro exacto.
- `es_explicita` debe enviarse como booleano (`true`/`false`).
- `/canciones/filtrar` no admite `page` ni `page_size`.
- `/canciones/recomendar/{emocion}` utiliza reglas internas de `energy` y `valence`.

---

### 2.6 Errores comunes

| Código | Causa | Solución |
|-------|-------|----------|
| `500` | No se puede conectar a PostgreSQL | Verificar `backend/database.py` y el servidor PostgreSQL. |
| `422` | Parámetro mal formado | Corregir el tipo del query. |
| `200` con `[]` | No hay coincidencias | Probar otro filtro o quitar condiciones. |

---

*Mauro Di Gallo — Visualización / QA / Docs — Moodify · Junio 2026*
