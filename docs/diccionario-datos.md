# Diccionario de Datos & Documentación de API

**Proyecto:** Moodify — Emociones Musicales  
**Archivo:** `docs/diccionario-datos.md`  
**Autor:** Mauro Di Gallo — Visualización / QA / Docs  
**Fecha:** Junio 2026

---

## 1. Diccionario de Datos

La tabla `songs` es la única tabla del sistema. Almacena los atributos musicales, emocionales y de identificación de cada canción proveniente del dataset de Spotify.

> **Nota:** Una misma canción puede aparecer en múltiples filas si fue clasificada en varios géneros. Esto es intencional en el diseño del dataset (el organizador limitó a ~1.000 canciones por género).

### 1.1 Tabla: `public.songs`

#### Campos de identificación

| Campo | Tipo SQL | Restricción | Rango / Valores | Descripción |
|-------|----------|-------------|-----------------|-------------|
| `id` | `INTEGER` | PK · NOT NULL · autoincremental | Entero positivo | Clave primaria interna generada por la secuencia `songs_id_seq`. No proviene de Spotify. |
| `track_id` | `TEXT` | Puede duplicarse | String alfanumérico | ID de la pista en Spotify. Una misma `track_id` puede aparecer en múltiples filas si la canción fue clasificada en varios géneros. |
| `track_name` | `TEXT` | NOT NULL | Texto libre | Nombre oficial de la canción tal como figura en Spotify. |
| `artists` | `TEXT` | NOT NULL | Texto libre | Nombre del artista o artistas. Cuando hay varios, aparecen separados por punto y coma o coma según el dataset. |
| `album_name` | `TEXT` | Opcional | Texto libre | Nombre del álbum al que pertenece la canción. |
| `track_genre` | `TEXT` | Opcional | Ej: `'pop'`, `'rock'`, `'jazz'` | Género musical asignado por el organizador del dataset. |

#### Métricas básicas

| Campo | Tipo SQL | Restricción | Rango / Valores | Descripción |
|-------|----------|-------------|-----------------|-------------|
| `popularity` | `SMALLINT` | CHECK 0 ≤ x ≤ 100 | 0 (desconocida) – 100 (viral) | Índice de popularidad calculado por Spotify según reproducciones recientes. No es un valor fijo; cambia con el tiempo. |
| `duration_ms` | `INTEGER` | NOT NULL | Milisegundos (ej: 210000 = 3:30) | Duración total de la canción en milisegundos. |
| `explicit` | `BOOLEAN` | `true` / `false` | true = contiene lenguaje explícito | Indica si Spotify marcó la canción como contenido explícito. |

#### Atributos emocionales / psicológicos

| Campo | Tipo SQL | Restricción | Rango / Valores | Descripción |
|-------|----------|-------------|-----------------|-------------|
| `valence` | `NUMERIC(5,4)` | CHECK 0.0000 – 1.0000 | 0 = muy triste / 1 = muy feliz | Medida de positividad musical. Valores altos suenan alegres y eufóricos; valores bajos suenan tristes o tensos. |
| `energy` | `NUMERIC(4,3)` | CHECK 0.000 – 1.000 | 0 = tranquila / 1 = muy intensa | Percepción de intensidad y actividad. Géneros como metal o EDM tienen energía alta; música clásica o ambient, baja. |
| `danceability` | `NUMERIC(4,3)` | CHECK 0.000 – 1.000 | 0 = no bailable / 1 = muy bailable | Qué tan adecuada es la canción para bailar según tempo, estabilidad rítmica y regularidad del beat. |

#### Atributos acústicos / técnicos

| Campo | Tipo SQL | Restricción | Rango / Valores | Descripción |
|-------|----------|-------------|-----------------|-------------|
| `loudness` | `NUMERIC(6,3)` | Valores negativos (dB) | Típico: -60 a 0 dB | Volumen general en decibeles, promediado en toda la canción. Valores cercanos a 0 son más fuertes. |
| `acousticness` | `NUMERIC(5,4)` | CHECK 0.0000 – 1.0000 | 0 = eléctrica / 1 = acústica | Confianza de que la canción es acústica (sin amplificación eléctrica). |
| `instrumentalness` | `NUMERIC(8,7)` | CHECK 0.0000000 – 1.0000000 | 0 = vocal / 1 = instrumental | Probabilidad de que la canción no contenga voz. Valores > 0.5 se interpretan como instrumentales. |
| `speechiness` | `NUMERIC(5,4)` | CHECK 0.0000 – 1.0000 | > 0.66 = spoken word | Detecta la presencia de palabras habladas. Valores muy altos corresponden a podcasts o rap. |
| `liveness` | `NUMERIC(5,4)` | CHECK 0.0000 – 1.0000 | > 0.8 = probablemente en vivo | Detecta si hay audiencia en la grabación. Valores altos sugieren grabación en vivo. |
| `tempo` | `NUMERIC(6,2)` | BPM estimado | Típico: 60 – 200 BPM | Beats por minuto estimados. Representa la velocidad general de la canción. |

#### Tonalidad

| Campo | Tipo SQL | Restricción | Rango / Valores | Descripción |
|-------|----------|-------------|-----------------|-------------|
| `key` | `SMALLINT` | CHECK 0 – 11 | 0=Do, 1=Do#, 2=Re … 11=Si | Tonalidad estimada usando notación de clase de tono (Pitch Class). -1 si no se detectó. |
| `mode` | `SMALLINT` | CHECK 0 o 1 | 0 = menor / 1 = mayor | Modalidad de la escala. Mayor suele sonar más alegre; menor, más melancólico. |
| `time_signature` | `SMALLINT` | Entero positivo | Típico: 3, 4 o 5 | Compás estimado. Indica cuántos tiempos tiene cada compás (ej: 4 = compás 4/4, el más común en música popular). |

---

### 1.2 Campos expuestos en la API vs. campos en la BD

El modelo ORM (`Cancion`) y el schema de respuesta (`CancionRespuesta`) no exponen todos los campos de la tabla.

| Campo | En BD | En API | Nota |
|-------|:-----:|:------:|------|
| `id` | ✅ | ✅ | Siempre presente como clave de identificación |
| `track_id` | ✅ | ✅ | Puede estar duplicado entre filas |
| `track_name` | ✅ | ✅ | |
| `artists` | ✅ | ✅ | |
| `album_name` | ✅ | ✅ | |
| `track_genre` | ✅ | ✅ | También usado como parámetro de filtro |
| `popularity` | ✅ | ✅ | |
| `duration_ms` | ✅ | ✅ | |
| `explicit` | ✅ | ✅ | También usado como parámetro de filtro |
| `danceability` | ✅ | ✅ | |
| `energy` | ✅ | ✅ | |
| `loudness` | ✅ | ✅ | |
| `acousticness` | ✅ | ✅ | |
| `valence` | ✅ | ✅ | |
| `instrumentalness` | ✅ | ❌ | Existe en BD pero no está en el modelo ORM ni en la respuesta |
| `speechiness` | ✅ | ❌ | Existe en BD pero no está en el modelo ORM ni en la respuesta |
| `liveness` | ✅ | ❌ | Existe en BD pero no está en el modelo ORM ni en la respuesta |
| `tempo` | ✅ | ❌ | Existe en BD pero no está en el modelo ORM ni en la respuesta |
| `key` | ✅ | ❌ | Existe en BD pero no está en el modelo ORM ni en la respuesta |
| `mode` | ✅ | ❌ | Existe en BD pero no está en el modelo ORM ni en la respuesta |
| `time_signature` | ✅ | ❌ | Existe en BD pero no está en el modelo ORM ni en la respuesta |

> **Recomendación para Lucas:** los 7 campos marcados con ❌ deberían agregarse al modelo `Cancion` y a `CancionRespuesta` en `main.py` si los módulos de Análisis o BioImpacto los necesitan en el frontend.

---

## 2. Documentación de la API REST

La API está construida con FastAPI (Python) y se comunica con PostgreSQL mediante SQLAlchemy. Todos los endpoints devuelven JSON y están disponibles en `http://localhost:8000`.

FastAPI genera automáticamente una interfaz Swagger interactiva en **http://localhost:8000/docs** donde se pueden probar los endpoints sin herramientas externas.

### 2.1 Información General

| Propiedad | Valor |
|-----------|-------|
| URL base | `http://localhost:8000` |
| Formato de respuesta | JSON (`application/json`) |
| Autenticación | Sin autenticación (acceso libre en entorno local) |
| CORS | Habilitado para todos los orígenes (`*`) |
| Documentación interactiva | `http://localhost:8000/docs` |
| Límite de resultados | 100 registros en `/canciones` · 50 en `/canciones/filtrar` |

---

### 2.2 Endpoints

---

#### `GET /canciones`

Retorna las primeras 100 canciones del catálogo sin aplicar ningún filtro.

**Parámetros:** ninguno

**Ejemplo de llamada:**
```
GET http://localhost:8000/canciones
```

**Respuesta:** Array JSON con hasta 100 objetos `CancionRespuesta`. Si la base de datos está vacía, retorna `[]`.

> ⚠️ El límite de 100 registros es fijo. Para paginación completa se recomienda agregar parámetros `skip` y `limit` en futuras versiones.

---

#### `GET /canciones/filtrar`

Retorna canciones filtradas por género musical y/o contenido explícito. Los parámetros son opcionales e independientes entre sí.

**Parámetros de query:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|:---------:|-------------|
| `genero` | `string` | No | Filtra por género musical exacto. Ej: `pop`, `rock`, `jazz`. La comparación es case-sensitive. |
| `es_explicita` | `boolean` | No | Filtra por contenido explícito. `true` = solo explícitas · `false` = solo no explícitas. |

**Ejemplos de llamada:**
```
GET http://localhost:8000/canciones/filtrar?genero=pop
GET http://localhost:8000/canciones/filtrar?es_explicita=false
GET http://localhost:8000/canciones/filtrar?genero=pop&es_explicita=false
```

**Respuesta:** Array JSON con hasta 50 objetos `CancionRespuesta` que cumplan los filtros aplicados.

> ⚠️ Si no se pasa ningún parámetro, devuelve las primeras 50 canciones sin filtrar. El parámetro `genero` distingue mayúsculas de minúsculas — verificar con `SELECT DISTINCT track_genre FROM songs` los valores exactos disponibles.

---

### 2.3 Modelo de Respuesta — `CancionRespuesta`

Todos los endpoints devuelven objetos con esta estructura:

```json
{
  "id": 1,
  "track_id": "4BJqT0PrAfrxzMOxytFOIz",
  "track_name": "Bohemian Rhapsody",
  "artists": "Queen",
  "album_name": "A Night at the Opera",
  "track_genre": "rock",
  "popularity": 87,
  "duration_ms": 354000,
  "explicit": false,
  "danceability": 0.387,
  "energy": 0.599,
  "loudness": -7.255,
  "acousticness": 0.0724,
  "valence": 0.233
}
```

**Detalle de campos:**

| Campo | Tipo JSON | Default si null | Descripción |
|-------|-----------|:---------------:|-------------|
| `id` | `integer` | — | Identificador único (siempre presente) |
| `track_id` | `string` | `null` | ID de la pista en Spotify |
| `track_name` | `string` | `null` | Nombre de la canción |
| `artists` | `string` | `null` | Artista(s) |
| `album_name` | `string` | `null` | Álbum |
| `track_genre` | `string` | `null` | Género musical |
| `popularity` | `integer` | `0` | Popularidad (0–100) |
| `duration_ms` | `integer` | `0` | Duración en milisegundos |
| `explicit` | `boolean` | `false` | Contenido explícito |
| `danceability` | `number` | `0.0` | Bailabilidad (0.0–1.0) |
| `energy` | `number` | `0.0` | Energía (0.0–1.0) |
| `loudness` | `number` | `0.0` | Volumen en dB (valor negativo) |
| `acousticness` | `number` | `0.0` | Acousticness (0.0–1.0) |
| `valence` | `number` | `0.0` | Valencia emocional (0.0–1.0) |

---

### 2.4 Errores comunes

| Código HTTP | Causa | Solución |
|-------------|-------|----------|
| `500` | El backend no puede conectarse a PostgreSQL | Verificar que PostgreSQL esté corriendo y que la contraseña en `database.py` sea correcta. |
| `422` | `es_explicita` recibido como string en lugar de boolean | Pasar sin comillas: `?es_explicita=true` |
| `200` con `[]` | El género solicitado no existe en la BD | Verificar con `SELECT DISTINCT track_genre FROM songs` los valores exactos. |
| CORS error | El frontend no puede llegar al backend | Confirmar que el backend esté en `http://localhost:8000` y que CORS esté habilitado. |

---

*Mauro Di Gallo — Visualización / QA / Docs — Moodify · Junio 2026*
