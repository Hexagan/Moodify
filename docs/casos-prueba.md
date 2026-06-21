# Casos de Prueba — Moodify

**Proyecto:** Moodify — Emociones Musicales  
**Archivo:** `docs/casos-prueba.md`  
**Autor:** Mauro Di Gallo — Visualización / QA / Docs  
**Fecha:** Junio 2026

---

## 1. Estrategia de Pruebas

### 1.1 Niveles de prueba

| Nivel | Enfoque | Herramienta | Responsable |
|-------|---------|-----------|-------------|
| Unitaria | Validación de modelos y schemas | pytest | Backend Developer |
| Integración | Endpoints API con BD | Postman / FastAPI Swagger | Backend Developer |
| E2E (End-to-End) | Flujos de usuario completos | Manual browser testing | QA / Product Owner |
| Performance | Latencia, throughput | Apache JMeter / curl | DevOps / Backend |

### 1.2 Entorno de pruebas

| Componente | Configuración |
|-----------|--------------|
| Backend | `localhost:8000` |
| Frontend | `localhost:5173` |
| Base de Datos | PostgreSQL local con dataset cargado (~113k canciones) |
| Navegador | Chrome/Firefox latest |

---

## 2. Casos de Prueba — Dashboard

### TC-DASH-001: Cargar página Dashboard

**Objetivo:** Verificar que el Dashboard se carga correctamente con todos los KPIs.

**Precondiciones:**
- Backend corriendo en `localhost:8000`
- Frontend corriendo en `localhost:5173`
- Base de datos con datos cargados

**Pasos:**
1. Abrir navegador en `http://localhost:5173`
2. Verificar que se renderiza la página de Dashboard
3. Esperar a que carguen los KPIs (máx 3 segundos)

**Resultado esperado:**
- ✅ Dashboard carga sin errores
- ✅ Se muestran 4 cards de KPI (Total Canciones, Valencia Media, Energía Media, Popularidad Media)
- ✅ Los valores son números positivos realistas
- ✅ No hay errores en consola del navegador

**Criterio de aceptación:** PASS si todos los puntos son cumplidos.

---

### TC-DASH-002: Verificar valores de KPIs

**Objetivo:** Asegurar que los valores de KPI coinciden con cálculos SQL.

**Precondiciones:** Dashboard cargado

**Pasos:**
1. Notar los valores mostrados en las 4 cards
2. Ejecutar en PostgreSQL:
   ```sql
   SELECT COUNT(*) as total, ROUND(AVG(valence), 2), ROUND(AVG(energy), 2), ROUND(AVG(popularity), 2) FROM songs;
   ```
3. Comparar valores con pantalla

**Resultado esperado:**
- ✅ Los números coinciden (con margen de redondeo ±0.01)

**Criterio de aceptación:** PASS si los valores coinciden.

---

### TC-DASH-003: Gráfico de distribución de géneros

**Objetivo:** Verificar que el gráfico de distribución carga y es interactivo.

**Precondiciones:** Dashboard cargado

**Pasos:**
1. Localizar el gráfico "GenreDistributionChart"
2. Hacer hover sobre una barra del gráfico
3. Verificar que aparece tooltip con nombre del género y popularidad media

**Resultado esperado:**
- ✅ Gráfico renderizado correctamente
- ✅ Tooltip aparece al hacer hover
- ✅ Datos coherentes

**Criterio de aceptación:** PASS si el gráfico es interactivo.

---

### TC-DASH-004: Tabla de canciones recientes

**Objetivo:** Verificar que se muestran 10 canciones aleatorias en la tabla.

**Precondiciones:** Dashboard cargado

**Pasos:**
1. Localizar tabla "RecentSongsTable"
2. Contar filas visibles
3. Recargar la página (Ctrl+R)
4. Verificar que aparecen canciones diferentes

**Resultado esperado:**
- ✅ Tabla muestra 10 filas
- ✅ Cada fila tiene: nombre, artista, género, popularidad
- ✅ Las canciones son diferentes cada vez que se recarga (aleatoriedad)

**Criterio de aceptación:** PASS si se muestran 10 filas y son aleatorias.

---

## 3. Casos de Prueba — Catálogo

### TC-CAT-001: Cargar página Catálogo

**Objetivo:** Verificar que el Catálogo se carga con datos.

**Precondiciones:** Frontend corriendo

**Pasos:**
1. Hacer clic en "Catálogo" en el Sidebar
2. Esperar a que cargue la tabla

**Resultado esperado:**
- ✅ Página `/catalogo` carga sin errores
- ✅ Tabla muestra 10 canciones en la primera página
- ✅ Filtros de género y orden están visibles

**Criterio de aceptación:** PASS si la tabla carga con datos.

---

### TC-CAT-002: Búsqueda de canción por nombre

**Objetivo:** Verificar que la búsqueda filtra canciones por nombre.

**Precondiciones:** Catálogo cargado

**Pasos:**
1. Hacer clic en la barra de búsqueda
2. Escribir "bohemian" (búsqueda lenta)
3. Esperar 500ms (debounce)
4. Verificar que la tabla se actualiza

**Resultado esperado:**
- ✅ La tabla muestra solo canciones con "bohemian" en el nombre
- ✅ Número de resultados es ≤ 10 (paginación)
- ✅ Paginación se resetea a página 1

**Criterio de aceptación:** PASS si la búsqueda filtra correctamente.

---

### TC-CAT-003: Filtro por género

**Objetivo:** Verificar que el filtro de género limita los resultados.

**Precondiciones:** Catálogo cargado

**Pasos:**
1. Localizar los chips de género (GenreFilters)
2. Hacer clic en "Rock"
3. Esperar a que se actualice la tabla

**Resultado esperado:**
- ✅ Tabla muestra solo canciones con `track_genre = 'rock'`
- ✅ Paginación se resetea
- ✅ El chip "Rock" aparece seleccionado (visual)

**Criterio de aceptación:** PASS si se muestran solo canciones del género seleccionado.

---

### TC-CAT-004: Ordenamiento por columna

**Objetivo:** Verificar que se puede ordenar la tabla por diferentes campos.

**Precondiciones:** Catálogo cargado

**Pasos:**
1. Localizar el dropdown "SortFilters"
2. Seleccionar "Popularidad"
3. Seleccionar "Descendente"
4. Esperar a que se actualice la tabla

**Resultado esperado:**
- ✅ Las canciones están ordenadas por popularidad descendente (mayor a menor)
- ✅ La primera canción tiene mayor popularidad que la segunda

**Criterio de aceptación:** PASS si el ordenamiento es correcto.

---

### TC-CAT-005: Paginación

**Objetivo:** Verificar que la navegación entre páginas funciona.

**Precondiciones:** Catálogo cargado, más de 10 canciones disponibles

**Pasos:**
1. Localizar el componente Pagination
2. Hacer clic en botón "Siguiente"
3. Verificar que aparecen canciones diferentes (página 2)
4. Hacer clic en página 1
5. Verificar que vuelve a mostrar las primeras 10

**Resultado esperado:**
- ✅ Página 2 muestra canciones con índices 11–20
- ✅ Volver a página 1 muestra canciones con índices 1–10

**Criterio de aceptación:** PASS si la paginación navega correctamente.

---

### TC-CAT-006: Búsqueda + Filtro combinados

**Objetivo:** Verificar que búsqueda y filtros se pueden combinar.

**Precondiciones:** Catálogo cargado

**Pasos:**
1. Escribir "love" en búsqueda
2. Seleccionar género "pop"
3. Esperar actualización

**Resultado esperado:**
- ✅ Tabla muestra canciones que contienen "love" Y tienen género "pop"
- ✅ Resultados son la intersección de ambos filtros

**Criterio de aceptación:** PASS si los filtros se aplican simultáneamente.

---

## 4. Casos de Prueba — Análisis

### TC-ANA-001: Cargar página Análisis

**Objetivo:** Verificar que la página de Análisis carga todos los gráficos.

**Precondiciones:** Frontend corriendo

**Pasos:**
1. Hacer clic en "Análisis" en el Sidebar
2. Esperar a que carguen todos los gráficos (máx 3s)

**Resultado esperado:**
- ✅ Se muestran 4 componentes: KPIs, TopGenresChart, ExplicitContentChart, LoudnessChart, PsychMap
- ✅ No hay errores en consola

**Criterio de aceptación:** PASS si todos los gráficos cargan.

---

### TC-ANA-002: Mapa psicológico (Scatter plot)

**Objetivo:** Verificar que el mapa de Valencia vs Energía se renderiza correctamente.

**Precondiciones:** Página Análisis cargada

**Pasos:**
1. Localizar el gráfico "PsychMap"
2. Hacer hover sobre los puntos (géneros)
3. Verificar que aparecen etiquetas con nombre de género

**Resultado esperado:**
- ✅ Scatter plot renderizado con puntos por género
- ✅ Eje X = Energy (0–1), Eje Y = Valence (0–1)
- ✅ Tooltips muestran nombre del género y valores

**Criterio de aceptación:** PASS si el mapa es interactivo.

---

### TC-ANA-003: Top géneros por energía

**Objetivo:** Verificar que el ranking de géneros por energía es correcto.

**Precondiciones:** Página Análisis cargada

**Pasos:**
1. Localizar gráfico "TopGenresChart"
2. Verificar que aparecen 6 barras
3. Ejecutar SQL para verificar top 6:
   ```sql
   SELECT track_genre, ROUND(AVG(energy), 2) FROM songs 
   GROUP BY track_genre ORDER BY AVG(energy) DESC LIMIT 6;
   ```
4. Comparar con gráfico

**Resultado esperado:**
- ✅ Las 6 barras corresponden a los géneros con mayor energía media
- ✅ Orden coincide con query SQL

**Criterio de aceptación:** PASS si el ranking es exacto.

---

## 5. Casos de Prueba — BioImpacto

### TC-BIO-001: Cargar página BioImpacto

**Objetivo:** Verificar que la página de BioImpacto carga con gráficos acústicos.

**Precondiciones:** Frontend corriendo

**Pasos:**
1. Hacer clic en "Bio-impacto" en el Sidebar
2. Esperar a que carguen los componentes

**Resultado esperado:**
- ✅ Se muestran: AcousticChart, InsightBanner, AcousticSongsList
- ✅ InsightBanner muestra mensaje sobre acousticness y plantas

**Criterio de aceptación:** PASS si los componentes cargan.

---

### TC-BIO-002: Tabla de canciones acústicas

**Objetivo:** Verificar que se muestran las canciones con mayor acousticness.

**Precondiciones:** Página BioImpacto cargada

**Pasos:**
1. Localizar tabla "AcousticSongsList"
2. Contar filas visibles
3. Ejecutar SQL para verificar:
   ```sql
   SELECT DISTINCT ON (track_id) track_name, artists, acousticness 
   FROM songs ORDER BY track_id, acousticness DESC LIMIT 6;
   ```
4. Comparar valores

**Resultado esperado:**
- ✅ Tabla muestra 6 canciones (o menos si hay menos de 6 únicas)
- ✅ Ordenadas por acousticness descendente (mayor a menor)
- ✅ Valores de acousticness coinciden con BD

**Criterio de aceptación:** PASS si la tabla muestra las canciones acústicas correctas.

---

## 6. Casos de Prueba — API REST

### TC-API-001: GET /canciones

**Objetivo:** Verificar que el endpoint retorna canciones paginadas.

**Precondiciones:** Backend corriendo en `localhost:8000`

**Pasos:**
1. Abrir Terminal / Postman
2. Ejecutar:
   ```bash
   curl "http://localhost:8000/canciones?page=1&page_size=10"
   ```
3. Verificar respuesta

**Resultado esperado:**
- ✅ Status 200 OK
- ✅ Respuesta es JSON array con 10 elementos
- ✅ Cada elemento tiene campos: id, track_name, artists, genre, popularity, etc.

**Criterio de aceptación:** PASS si la respuesta tiene status 200 y estructura correcta.

---

### TC-API-002: GET /canciones con filtro género

**Objetivo:** Verificar que el filtro de género funciona en la API.

**Precondiciones:** Backend corriendo

**Pasos:**
1. Ejecutar:
   ```bash
   curl "http://localhost:8000/canciones?genero=rock&page=1&page_size=10"
   ```
2. Verificar que todas las canciones tienen `track_genre = "rock"`

**Resultado esperado:**
- ✅ Status 200 OK
- ✅ Todos los elementos retornados tienen `track_genre = "rock"`
- ✅ Si no hay rock, devuelve array vacío []

**Criterio de aceptación:** PASS si el filtro funciona correctamente.

---

### TC-API-003: GET /canciones/filtrar

**Objetivo:** Verificar que el endpoint de filtrado avanzado funciona.

**Precondiciones:** Backend corriendo

**Pasos:**
1. Ejecutar:
   ```bash
   curl "http://localhost:8000/canciones/filtrar?genero=pop&min_energia=0.7&es_explicita=false"
   ```
2. Verificar que la respuesta cumple criterios

**Resultado esperado:**
- ✅ Status 200 OK
- ✅ Todas las canciones tienen: género = "pop", energy ≥ 0.7, explicit = false
- ✅ Máximo 50 resultados

**Criterio de aceptación:** PASS si los filtros se aplican correctamente.

---

### TC-API-004: GET /stats/kpis

**Objetivo:** Verificar que el endpoint de KPIs devuelve datos correctos.

**Precondiciones:** Backend corriendo

**Pasos:**
1. Ejecutar:
   ```bash
   curl "http://localhost:8000/stats/kpis"
   ```
2. Verificar respuesta

**Resultado esperado:**
- ✅ Status 200 OK
- ✅ Respuesta contiene: total_canciones, valencia_media, energia_media, popularidad_media
- ✅ Valores son números reales positivos

**Criterio de aceptación:** PASS si la respuesta es válida.

---

### TC-API-005: POST /canciones

**Objetivo:** Verificar que se puede crear una canción.

**Precondiciones:** Backend corriendo

**Pasos:**
1. Ejecutar (formato largo para claridad):
   ```bash
   curl -X POST "http://localhost:8000/canciones" \
   -H "Content-Type: application/json" \
   -d '{
     "track_id": "test123",
     "track_name": "Test Song",
     "artists": "Test Artist",
     "album_name": "Test Album",
     "track_genre": "rock",
     "popularity": 50,
     "duration_ms": 180000,
     "explicit": false,
     "danceability": 0.5,
     "energy": 0.7,
     "loudness": -5.5,
     "acousticness": 0.2,
     "valence": 0.6
   }'
   ```
2. Verificar que se retorna la canción creada con ID

**Resultado esperado:**
- ✅ Status 200 OK (o 201 Created)
- ✅ Respuesta contiene el objeto con `id` asignado por BD
- ✅ La canción aparece en GET /canciones

**Criterio de aceptación:** PASS si la canción se crea correctamente.

---

### TC-API-006: PUT /canciones/{id}

**Objetivo:** Verificar que se puede actualizar una canción.

**Precondiciones:** Backend corriendo, canción con ID 1 existe

**Pasos:**
1. Ejecutar:
   ```bash
   curl -X PUT "http://localhost:8000/canciones/1" \
   -H "Content-Type: application/json" \
   -d '{"popularity": 99}'
   ```
2. Verificar que la canción se actualiza

**Resultado esperado:**
- ✅ Status 200 OK
- ✅ Respuesta muestra `popularity: 99`
- ✅ GET /canciones/1 muestra el nuevo valor

**Criterio de aceptación:** PASS si la actualización funciona.

---

### TC-API-007: DELETE /canciones/{id}

**Objetivo:** Verificar que se puede eliminar una canción.

**Precondiciones:** Backend corriendo, canción con ID 9999 existe

**Pasos:**
1. Ejecutar:
   ```bash
   curl -X DELETE "http://localhost:8000/canciones/9999"
   ```
2. Verificar que se elimina

**Resultado esperado:**
- ✅ Status 200 OK
- ✅ Respuesta es: `{ "mensaje": "La canción con ID 9999 fue eliminada con éxito" }`
- ✅ GET /canciones/9999 ahora retorna 404 (o no aparece en listados)

**Criterio de aceptación:** PASS si la eliminación funciona.

---

### TC-API-008: Error handling — ID no existe

**Objetivo:** Verificar que la API retorna errores correctos.

**Precondiciones:** Backend corriendo

**Pasos:**
1. Ejecutar:
   ```bash
   curl "http://localhost:8000/canciones/999999999"
   ```
2. Verificar respuesta

**Resultado esperado:**
- ✅ Status 404 Not Found (ideal) o 200 con vacío
- ✅ Respuesta no expone detalles internos de BD

**Criterio de aceptación:** PASS si el error es apropiado.

---

## 7. Casos de Prueba — Integración Backend-Frontend

### TC-INT-001: Frontend consume datos correctamente

**Objetivo:** Verificar que el frontend descodifica respuestas JSON correctamente.

**Precondiciones:** Backend y frontend corriendo

**Pasos:**
1. Abrir DevTools (F12) → Network tab
2. Navegar a Catálogo
3. Capturar la llamada a GET /canciones
4. Verificar que el navegador recibe la respuesta completa
5. Abrir la tabla y verificar que se muestran los datos

**Resultado esperado:**
- ✅ Request muestra status 200 OK
- ✅ Response contiene JSON válido
- ✅ Frontend renderiza la tabla correctamente

**Criterio de aceptación:** PASS si los datos se muestran en UI.

---

### TC-INT-002: Filtro frontend a backend

**Objetivo:** Verificar que los parámetros del frontend se envían correctamente al backend.

**Precondiciones:** Backend y frontend corriendo

**Pasos:**
1. Abrir DevTools → Network tab
2. En Catálogo: escribir "test" en búsqueda y seleccionar "rock"
3. Capturar la llamada GET /canciones
4. Verificar query string en URL

**Resultado esperado:**
- ✅ URL incluye parámetros: `?busqueda=test&genero=rock&page=1&page_size=10`
- ✅ Backend retorna solo canciones que coinciden
- ✅ Tabla se actualiza en frontend

**Criterio de aceptación:** PASS si los parámetros se envían correctamente.

---

## 8. Casos de Prueba — Performance

### TC-PERF-001: Latencia GET /canciones

**Objetivo:** Verificar que el endpoint responde en menos de 2 segundos.

**Precondiciones:** Backend corriendo, BD cargada con ~113k canciones

**Pasos:**
1. Ejecutar 10 veces:
   ```bash
   time curl "http://localhost:8000/canciones?page=1&page_size=10"
   ```
2. Notar el tiempo de respuesta (real)

**Resultado esperado:**
- ✅ Promedio < 2 segundos
- ✅ P95 latency < 2.5 segundos

**Criterio de aceptación:** PASS si todas las respuestas < 2s.

---

### TC-PERF-002: Latencia GET /stats/kpis

**Objetivo:** Verificar que stats también responden rápido.

**Precondiciones:** Backend corriendo, BD cargada

**Pasos:**
1. Ejecutar:
   ```bash
   time curl "http://localhost:8000/stats/kpis"
   ```

**Resultado esperado:**
- ✅ < 1.5 segundos (stats pueden caché-arse)

**Criterio de aceptación:** PASS si la respuesta es rápida.

---

## 9. Checklist de Ejecución

Antes de hacer release, ejecutar:

- [ ] TC-DASH-001 ✅ PASS
- [ ] TC-DASH-002 ✅ PASS
- [ ] TC-DASH-003 ✅ PASS
- [ ] TC-DASH-004 ✅ PASS
- [ ] TC-CAT-001 ✅ PASS
- [ ] TC-CAT-002 ✅ PASS
- [ ] TC-CAT-003 ✅ PASS
- [ ] TC-CAT-004 ✅ PASS
- [ ] TC-CAT-005 ✅ PASS
- [ ] TC-CAT-006 ✅ PASS
- [ ] TC-ANA-001 ✅ PASS
- [ ] TC-ANA-002 ✅ PASS
- [ ] TC-ANA-003 ✅ PASS
- [ ] TC-BIO-001 ✅ PASS
- [ ] TC-BIO-002 ✅ PASS
- [ ] TC-API-001 ✅ PASS
- [ ] TC-API-002 ✅ PASS
- [ ] TC-API-003 ✅ PASS
- [ ] TC-API-004 ✅ PASS
- [ ] TC-API-005 ✅ PASS
- [ ] TC-API-006 ✅ PASS
- [ ] TC-API-007 ✅ PASS
- [ ] TC-API-008 ✅ PASS
- [ ] TC-INT-001 ✅ PASS
- [ ] TC-INT-002 ✅ PASS
- [ ] TC-PERF-001 ✅ PASS
- [ ] TC-PERF-002 ✅ PASS

---

*Mauro Di Gallo — Visualización / QA / Docs — Moodify · Junio 2026*
