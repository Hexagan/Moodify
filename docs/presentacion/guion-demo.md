# Guion de la demo — Moodify

Duración objetivo: **10 minutos** de demo, más la muestra de código y las preguntas.
Sitio: https://moodify-one-rho.vercel.app · API: https://moodify-api-roan.vercel.app/docs

---

## Antes de la presentación

### El día anterior

- [ ] Grabar la demo completa (pantalla + audio) siguiendo este guion. Es el plan B si falla la red o un servicio externo.
- [ ] Probar el sitio en la computadora y el navegador que se van a usar, con la resolución del proyector.
- [ ] Confirmar que la cuenta de administrador funciona: `python set_admin.py --list --prod` desde `backend/`.
- [ ] Tener una segunda cuenta común (sin rol de administrador) con algunos me gusta y una playlist, para que el Dashboard muestre recomendaciones.
- [ ] Elegir y anotar: una canción con preview y video que funcionen, un artista con hilos en el foro y una imagen chica (menos de 1 MB) para adjuntar.
- [ ] Si se va a mostrar el registro con correo: una casilla propia abierta en otra pestaña para el correo de verificación.
- [ ] Verificar el estado de Spotify (Premium activo en la cuenta de desarrollador). Si no está activo, usar iTunes en el autocompletado del ABM.

### Pestañas abiertas, en este orden

1. https://moodify-one-rho.vercel.app/login (sesión cerrada)
2. Casilla de correo (si se muestra el registro)
3. https://moodify-api-roan.vercel.app/docs
4. VS Code con: `backend/storage.py`, `backend/recommender.py`, `backend/routers/canciones.py`, `frontend/src/context/AuthContext.jsx`, `frontend/src/pages/Catalog.jsx`
5. `docs/diagramas/arquitectura.png` y `docs/diagramas/der.png`

Zoom del navegador al 100 % o 110 %, sin extensiones que bloqueen scripts (algunas bloquean YouTube).

---

## Recorrido (10 min)

| # | Pantalla | Qué hacer | Qué decir | Tiempo |
|---|----------|-----------|-----------|:------:|
| 1 | Login | Señalar Google, Facebook y correo; mostrar el enlace a la política de privacidad; entrar como invitado | "Se puede usar sin cuenta. El inicio de sesión lo resuelve Firebase; las cuentas de correo tienen que confirmar la dirección antes de entrar." | 0:30 |
| 2 | Dashboard (invitado) | Hacer clic en un cuadrante del mapa emocional | "El eje horizontal es la valencia, qué tan positiva es la canción, y el vertical la energía. El clic se traduce en un punto y el backend busca las canciones más cercanas." | 1:00 |
| 3 | Catálogo | Buscar un artista; elegir un género; filtrar un rango de valencia desde el encabezado; ordenar por popularidad | "Son 113.550 filas del dataset. Una canción aparece una vez por género; la API deduplica al leer. Todos los filtros se resuelven en el servidor con paginación." | 1:30 |
| 4 | Detalle de canción | Reproducir la preview; abrir el video de YouTube; intentar comentar | "La preview se busca en iTunes y, si no está, en Deezer; el resultado queda en caché en la tabla `song_media`. Comentar pide iniciar sesión." | 1:00 |
| 5 | Análisis | Recorrer los cuatro gráficos; hacer clic en un género | "Cada género abre el catálogo ya filtrado; el filtro viaja en la URL, así que se puede compartir el enlace." | 1:00 |
| 6 | Iniciar sesión | Ingresar con la cuenta común preparada; mostrar recomendaciones del Dashboard; dar me gusta; agregar una canción a una playlist | "Las recomendaciones comparan cinco atributos de audio contra lo que el usuario marcó con me gusta y lo que escuchó." | 1:30 |
| 7 | Artistas | Abrir un artista; responder un hilo adjuntando la imagen | "El archivo no pasa por nuestro servidor: el backend da un permiso firmado por 10 minutos y el navegador lo sube directo a Vercel Blob. Así evitamos el límite de 4,5 MB de las funciones." | 1:00 |
| 8 | Configuración | Cambiar a modo claro y volver; mostrar accesibilidad; entrar a Contacto | "La configuración se guarda por usuario en la base. El formulario de contacto envía la sugerencia por correo con Resend y la guarda también en la base." | 1:00 |
| 9 | ABM (cuenta admin) | Cerrar sesión, entrar como administrador; autocompletar una canción desde iTunes; guardarla; editarla; eliminarla | "Solo los administradores ven el ABM. El rol no se puede cambiar desde la API: se asigna con un script directamente en la base." | 1:30 |
| 10 | Swagger `/docs` | Ejecutar `GET /stats/kpis` | "FastAPI genera esta documentación sola a partir del código: 75 endpoints, con sus parámetros y modelos." | 0:30 |

**Si algo falla:** decir qué servicio es ("YouTube no está respondiendo") y pasar al paso siguiente o al video de respaldo. No intentar arreglarlo en vivo.

---

## Muestra de código (5 min)

| Archivo | Qué mostrar | Idea a transmitir |
|---------|-------------|-------------------|
| `backend/routers/canciones.py` | `canciones_por_cuadrante`: rangos de cada cuadrante y orden por distancia | La lógica del mapa emocional es una consulta SQL con SQLAlchemy |
| `backend/recommender.py` | Constantes de pesos (`_FEATURES`, `_FEATURE_WEIGHTS`, `LIKE_WEIGHT`) y el cálculo de distancias | Recomendación por similitud, explicable y sin entrenamiento |
| `backend/storage.py` | `client_token` y `receive` | Seguridad de subidas: permiso firmado, tipo y tamaño validados, verificación de los primeros bytes |
| `frontend/src/context/AuthContext.jsx` | `onAuthStateChanged` y `needsEmailVerification` | Cómo el frontend sabe quién es el usuario y bloquea cuentas sin verificar |
| `frontend/src/pages/Catalog.jsx` | `useSearchParams` para el género | El estado del filtro vive en la URL |

---

## Preguntas probables

**¿Por qué FastAPI?**
Valida la entrada con Pydantic, genera la documentación OpenAPI sola y se despliega en Vercel como funciones serverless sin configuración extra. Además, el análisis de datos (NumPy) queda en el mismo lenguaje.

**¿La base está normalizada?**
Las 13 tablas propias sí: claves foráneas, restricciones `UNIQUE` para evitar duplicados y borrado en cascada donde corresponde. `songs` conserva el dataset original, que trae una fila por canción y género y varios artistas en un campo de texto. Decidimos no reescribir 113.550 filas: las consultas deduplican al leer y la tabla `artists` se construye a partir de `songs`. El paso siguiente sería separar `song_genres` y `song_artists`.

**¿Cómo se autentican las peticiones?**
Firebase gestiona contraseñas y sesiones. El backend recibe el `uid` del usuario y verifica el rol en la base para las operaciones de administrador. Limitación conocida: hoy no se valida el token de Firebase en cada request; el siguiente paso es verificarlo con Firebase Admin SDK.

**¿Cómo se crea un administrador?**
Con `backend/set_admin.py email`. La API no acepta cambios de rol, así que nadie puede darse permisos desde el navegador.

**¿Por qué Vercel y no Railway?**
Frontend, backend, base (Neon) y archivos (Blob) quedan en una sola plataforma, con despliegue automático en cada push y sin servidores que mantener. El costo de diseño fue adaptarse a funciones serverless: sin pool de conexiones y con subidas directas a Blob por el límite de 4,5 MB.

**¿Qué pasa si una API externa no responde?**
Las previews y videos encontrados quedan en caché en `song_media`. Para previews hay dos fuentes (iTunes y Deezer). Las sugerencias se guardan en la base aunque falle el correo. Si YouTube no responde, el sitio sigue funcionando sin el video.

**¿Cómo funciona la recomendación?**
Cada canción es un vector de cinco atributos (valencia, energía, bailabilidad, acousticness, loudness), con más peso en valencia y energía. Se buscan las canciones más cercanas a las que el usuario marcó con me gusta (peso 3) y a las que escuchó (peso 1, que pierde valor con el tiempo), con un máximo de dos por artista.

**¿Es responsive?**
Está pensado para escritorio y notebooks. La barra lateral se contrae y la tabla del catálogo oculta columnas secundarias según su propio ancho (container queries), manteniendo las filas alineadas con el encabezado.

**¿Qué datos personales guardan?**
Nombre, correo, foto y la actividad dentro del sitio. Está detallado en la política de privacidad (`/privacidad`), que también explica cómo descargar o eliminar los datos.

**¿Cómo se organizó el trabajo?**
Ver la diapositiva 9: cinco etapas, de junio a noviembre de 2026, con roles por integrante (base de datos, diseño, backend, frontend, documentación y QA).
