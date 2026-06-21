# Manual de Usuario — Moodify

**Proyecto:** Moodify — Emociones Musicales  
**Archivo:** `docs/manual-usuario.md`  
**Autor:** Mauro Di Gallo — Visualización / QA / Docs  
**Fecha:** Junio 2026

---

## 1. Introducción

**Moodify** es una aplicación web para explorar un catálogo de más de 113.000 canciones basadas en sus características emocionales y acústicas. Utilizando datos de Spotify, puedes descubrir cómo se relacionan la valencia emocional, la energía y otras características de la música con diferentes géneros musicales.

### ¿Para quién es?

- **Amantes de la música:** Explora y descubre canciones basadas en emociones
- **Analistas / Investigadores:** Visualiza patrones en datos musicales
- **Productores / DJs:** Identifica canciones por características de sonido
- **Estudiantes:** Aprende sobre correlaciones entre música y emociones

---

## 2. Acceso a la Aplicación

### 2.1 URLs disponibles

| Entorno | URL |
|---------|-----|
| Local (desarrollo) | `http://localhost:5173` |
| Producción (Vercel) | `https://moodify-one-rho.vercel.app/` |

### 2.2 Requisitos

- **Navegador:** Chrome, Firefox, Safari o Edge (versiones recientes)
- **Conexión:** Internet (para consumir API desde backend)
- **Sin instalación:** Es una aplicación web, accesible desde cualquier navegador

---

## 3. Interfaz Principal

### 3.1 Layout general

La aplicación tiene una estructura de **3 capas:**

```
┌────────────────────────────────────────┐
│          TOPBAR (Título + Búsqueda)    │ ← Barra superior
├─────────────┬────────────────────────┤
│             │                        │
│  SIDEBAR    │   CONTENIDO PRINCIPAL  │
│  (Menú)     │   (Páginas)            │
│             │                        │
└─────────────┴────────────────────────┘
```

### 3.2 Sidebar (Menú Izquierdo)

El Sidebar contiene las opciones de navegación:

| Opción | Destino | Descripción |
|--------|---------|-------------|
| 📊 Dashboard | `/` | KPIs generales y vista de resumen |
| 📚 Catálogo | `/catalogo` | Exploración completa de canciones |
| 📈 Análisis | `/analisis` | Gráficos psicológicos por género |
| 🎵 Bio-impacto | `/bioimpacto` | Análisis acústico de canciones |

### 3.3 Topbar (Barra Superior)

La barra superior contiene:

| Elemento | Función |
|----------|---------|
| Título de página | Muestra dónde estás actualmente |
| Barra de búsqueda | Busca canciones (futuro: acción directa) |
| Botón "+ Agregar" | Acceso a ABM de canciones (futuro) |

---

## 4. Páginas — Guía Detallada

### 4.1 Dashboard (`/`)

**Propósito:** Vista general de tu catálogo musical.

#### Componentes

**1. Cards de KPI (Indicadores Clave)**

Cuatro tarjetas con información resumida:
- 🎵 **Total de Canciones:** Cantidad de pistas en el catálogo
- 😊 **Valencia Media:** Nivel promedio de "felicidad" (0 = triste, 1 = feliz)
- ⚡ **Energía Promedio:** Intensidad percibida (0 = relajada, 1 = intensa)
- 📊 **Popularidad Media:** Relevancia en Spotify (0–100)

**2. Gráfico de Distribución de Géneros**

Gráfico de barras que muestra:
- X: Géneros musicales
- Y: Popularidad promedio de cada género
- **Interacción:** Hover para ver valores exactos

**3. Gráfico de Crecimiento del Catálogo**

Muestra cómo ha crecido el catálogo a lo largo del tiempo (si hay timestamps).

**4. Tabla de Canciones Recientes**

Lista de 10 canciones aleatorias para exploración rápida.

#### Cómo usar

1. Abre la aplicación → **Automáticamente en Dashboard**
2. Revisa los KPIs para entender el catálogo
3. Haz hover en gráficos para detalles
4. Haz clic en "Catálogo" en el Sidebar para explorar

---

### 4.2 Catálogo (`/catalogo`)

**Propósito:** Exploración detallada de todas las canciones con filtros.

#### Componentes

**1. Barra de Búsqueda**

Busca canciones por nombre o artista:
- Escribe caracteres para filtrar en tiempo real
- Ejemplo: "bohemian" → Muestra "Bohemian Rhapsody"
- **Consejo:** No distingue mayúsculas/minúsculas

**2. Filtros de Género**

Chips (botones) con géneros disponibles:
- Haz clic en un género para filtrar
- El chip seleccionado se resalta
- Haz clic de nuevo para deseleccionar

**3. Ordenamiento**

Dropdown para ordenar por:
- Valencia (emocionalidad)
- Energía (intensidad)
- Popularidad (relevancia en Spotify)
- Duración (tiempo de canción)

**Selecciona:** "Ascendente" (menor a mayor) o "Descendente" (mayor a menor)

**4. Tabla de Canciones**

Columnas visibles:
| Columna | Significado |
|---------|------------|
| 🎵 Nombre | Título de la canción |
| 🎤 Artista | Autor(es) |
| 🏷️ Género | Clasificación musical |
| ⭐ Popularidad | Score 0–100 |
| ⏱️ Duración | Tiempo en minutos:segundos |
| ✏️ Editar | Botón para modificar (futuro) |

**5. Paginación**

Navega entre páginas:
- **< Anterior / Siguiente >:** Botones de navegación
- **Números:** Salta directamente a una página
- **Info:** "Mostrando 1–10 de XXXX"

#### Flujo de Uso Típico

**Escenario 1: Encontrar canciones relajantes de rock**

1. Haz clic en "Catálogo"
2. Selecciona el género "Rock" en los chips
3. En el dropdown de orden, selecciona "Valencia" → "Ascendente" (para canciones tristes/relajadas)
4. Revisa la tabla: ahora ves solo rock ordenado por baja valencia

**Escenario 2: Buscar una canción específica**

1. Haz clic en la barra de búsqueda
2. Escribe el nombre o artista: "Adele"
3. La tabla se filtra automáticamente
4. Localiza la canción deseada

**Escenario 3: Explorar géneros populares**

1. En el dropdown de orden, selecciona "Popularidad" → "Descendente"
2. Observa las canciones más populares en todo el catálogo
3. Cambia el género para ver variación

---

### 4.3 Análisis (`/analisis`)

**Propósito:** Visualizaciones avanzadas para entender patrones emocionales en la música.

#### Componentes

**1. KPI de Análisis**

Cuatro cards especializadas:
- Géneros Analizados: Número de géneros únicos en el catálogo
- Género Más Popular: Cuál tiene mayor popularidad promedio
- Mayor Energía Media: Género más "intenso"
- Mayor Potencial Relajante: Género con menor energía (más relajado)

**2. Mapa Psicológico (Scatter Plot)**

Visualización de Valencia vs. Energía:
- **Eje X (Horizontal):** Energía (0 = baja, 1 = alta)
- **Eje Y (Vertical):** Valencia (0 = triste, 1 = feliz)
- **Puntos:** Cada punto es un género
- **Cuadrantes emocionales:**
  - Arriba a la derecha: Feliz + Energético (ej: Dance, Electro)
  - Arriba a la izquierda: Feliz + Relajado (ej: Pop, Indie)
  - Abajo a la derecha: Triste + Energético (ej: Heavy Metal, Rock)
  - Abajo a la izquierda: Triste + Relajado (ej: Blues, Ambient)

**3. Top Géneros por Energía**

Gráfico de barras ordenado descendente:
- Muestra los 6 géneros más "energéticos"
- Útil para identificar música para entrenamientos

**4. Contenido Explícito**

Gráfico de barras:
- X: Géneros
- Y: % de canciones con contenido explícito
- Útil para entender qué géneros tienen mayor contenido adulto

**5. Loudness (Volumen) por Género**

Gráfico de barras:
- X: Géneros
- Y: Loudness promedio (en dB)
- Útil para saber qué géneros "suenan más fuerte"

#### Cómo interpretar

**Ejemplo de uso:**

"Quiero música relajante pero alegre"
1. Ve al Mapa Psicológico
2. Busca puntos en la zona **arriba-izquierda** (alta valencia, baja energía)
3. Identifica géneros en esa zona (ej: Indie, Soft Pop)
4. Ve al Catálogo y filtra por esos géneros

---

### 4.4 Bio-impacto (`/bioimpacto`)

**Propósito:** Exploración del potencial acústico de la música (estudio de efectos en plantas, relajación, etc.).

#### Componentes

**1. Banner de Insights**

Mensaje informativo:
> "Las canciones acústicas tienen propiedades relajantes y se ha estudiado su impacto en el crecimiento de plantas. A continuación, se muestran las canciones con mayor índice de acusticidad."

**2. Gráfico de Acousticness**

Índice acústico (0 = sintética, 1 = acústica 100%) por género.

**3. Top Canciones Acústicas**

Tabla de las 6 canciones más acústicas:
| Campo | Descripción |
|-------|------------|
| Canción | Nombre de la pista |
| Artista | Autor(a) |
| Género | Clasificación |
| Acousticness | Score 0.0–1.0 |

#### Cómo usar

"Necesito música acústica para relajarme"
1. Ve a Bio-impacto
2. Revisa el gráfico de acousticness
3. Identifica géneros acústicos (ej: Folk, Acoustic)
4. Consulta la tabla de top canciones
5. Selecciona las que prefieras

---

## 5. Glosario de Términos

| Término | Explicación |
|---------|------------|
| **Valencia** | Medida de positividad emocional (0=triste, 1=feliz). Influye la armonía, tempo, modo mayor/menor. |
| **Energía** | Intensidad percibida (0=relajada, 1=intensa). Afectan tempo, dinámicas, timbre. |
| **Popularidad** | Score 0–100 calculado por Spotify según reproduciones recientes. |
| **Loudness** | Volumen promedio en dB (decibeles). Rango típico: -10 a 0 dB. |
| **Acousticness** | Probabilidad de que la canción sea acústica (0=sintética, 1=100% acústica). |
| **Danceability** | Probabilidad de ser bailable según beat, regularidad, estabilidad rítmica (0=no bailable, 1=muy bailable). |
| **Género** | Clasificación musical (Rock, Pop, Jazz, Electrónica, etc.). |

---

## 6. Casos de Uso Comunes

### 6.1 "Quiero música para entrenar"

1. Ve a **Análisis**
2. Observa el **Mapa Psicológico**: busca puntos en **arriba-derecha** (alta energía, alta valencia)
3. Ve a **Catálogo**
4. Filtra por esos géneros
5. Ordena por Energía descendente
6. ¡Listo! Tienes una playlist de entrenamiento

### 6.2 "Necesito relajarme antes de dormir"

1. Ve a **Bio-impacto**
2. Revisa las **Top Canciones Acústicas**
3. Ve al **Catálogo**
4. Filtra por los géneros con baja energía (Folk, Ambient, etc.)
5. Ordena por Valencia ascendente (música más "neutral")
6. ¡Relájate!

### 6.3 "¿Qué géneros son los más populares?"

1. Ve a **Dashboard**
2. Revisa el gráfico **Distribución de Géneros**
3. Los géneros con barras más altas son los más populares

### 6.4 "¿Qué género es el más 'energético'?"

1. Ve a **Análisis**
2. Revisa el gráfico **Top Géneros por Energía**
3. El primero de la lista es el más energético

### 6.5 "Quiero entender la relación entre energía y valencia"

1. Ve a **Análisis**
2. Estudia el **Mapa Psicológico**
3. Observa cómo los géneros se distribuyen en los 4 cuadrantes
4. Puedes intuir las características emocionales de cada género

---

## 7. Troubleshooting

### 7.1 "La página no carga"

**Problema:** Cuando entro a la app, veo una página en blanco o error.

**Solución:**
1. Verifica que tienes internet
2. Intenta recargar (Ctrl+R o Cmd+R)
3. Limpia caché del navegador (Ctrl+Shift+Delete)
4. Intenta en otra pestaña anónima/privada
5. Intenta otro navegador

### 7.2 "La tabla de Catálogo está vacía"

**Problema:** No veo canciones en el catálogo.

**Solución:**
1. Verifica que el filtro de género no está activado restrictivamente
2. Borra la búsqueda (barra de búsqueda vacía)
3. Intenta recargar la página
4. Verifica que el backend está corriendo (en desarrollo)

### 7.3 "Los gráficos no aparecen"

**Problema:** Las visualizaciones están vacías o no cargan.

**Solución:**
1. Espera unos segundos a que carguen
2. Abre la consola (F12) para ver errores
3. Intenta recargar la página
4. Intenta en otro navegador

### 7.4 "¿Por qué hay canciones duplicadas?"

**Causa:** Una misma canción aparece en múltiples géneros. Esto es **intencional** en el dataset de Spotify.

**Explicación:** Si "Bohemian Rhapsody" es rock, pop y clásica, aparecerá 3 veces en el catálogo para análisis multi-género.

---

## 8. Preguntas Frecuentes (FAQ)

### ¿Qué tan actualizado está el catálogo?

El dataset es una recopilación de Spotify de ~113.000 canciones. Se actualiza según el período de recopilación (consulta con el equipo técnico).

### ¿Puedo descargar los datos?

No desde la UI actual. Puedes contactar al equipo técnico si necesitas exportar datos.

### ¿Hay autenticación o login?

No, la aplicación es pública. No requiere credenciales.

### ¿Puedo crear playlists dentro de Moodify?

No en la versión actual, pero es una feature futura.

### ¿Por qué algunos géneros tienen pocos datos?

Porque el dataset limitó ~1.000 canciones por género. Géneros menores pueden estar sub-representados.

### ¿Qué es ese botón de edición en la tabla de Catálogo?

Es un feature futuro (ABM - Alta, Baja, Modificación). Actualmente no funciona.

---

## 9. Consejos Prácticos

1. **Explora el Mapa Psicológico primero:** Te da intuición sobre cómo se distribuyen las emociones por género.

2. **Combina filtros:** Búsqueda + Género + Ordenamiento juntos son más poderosos.

3. **Usa los análisis para categorizar:** Si quieres una "playlist de estudio", usa Análisis para encontrar géneros con energía moderada y baja valencia.

4. **Descubre outliers:** Algunos géneros pueden sorprenderte en el Mapa Psicológico. Explóralos.

5. **Toma notas:** Si encuentras combinaciones de filtros útiles, anotálas.

---

## 10. Contacto y Soporte

| Rol | Persona | Email |
|-----|---------|-------|
| Visualización / QA / Docs | Mauro Di Gallo | mauro@example.com |
| Frontend | Fede | fede@example.com |
| Backend | Lucas | lucas@example.com |

---

*Mauro Di Gallo — Visualización / QA / Docs — Moodify · Junio 2026*
