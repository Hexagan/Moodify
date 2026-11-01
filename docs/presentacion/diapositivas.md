# Diapositivas — Moodify

Texto para 10 diapositivas. Cada una tiene el contenido en pantalla (poco texto, para leer de un vistazo), una sugerencia visual y las notas para hablar. Duración estimada: 8–10 minutos antes de la demo.

---

## 1. Moodify: la música según cómo te sentís

**En pantalla**
- Moodify — Emociones Musicales
- Proyecto Integrador · IFTS 18 · 2026
- Equipo: Jonathan · Valentín · Lucas · Federico · Mauro
- moodify-one-rho.vercel.app

**El problema**
- Las plataformas organizan la música por artista, álbum o género
- Pero muchas veces elegimos qué escuchar según el estado de ánimo
- Los datos para hacerlo existen (valencia, energía, acousticness) pero no son visibles para el usuario

**Visual:** logo de Moodify y una captura del mapa emocional de fondo.

**Notas:** Presentarse y presentar al equipo. Plantear la pregunta: "¿Cuántas veces buscaron música para concentrarse, para entrenar o para relajarse?". Las plataformas tienen esos datos de cada canción pero no los muestran.

---

## 2. La propuesta

**En pantalla**
- Un catálogo de 113.000+ canciones explorable por emoción
- Mapa emocional: valencia × energía, cuatro estados de ánimo
- Análisis por género con gráficos interactivos
- Recomendaciones personales según lo que te gusta y escuchás
- Comunidad: perfiles, playlists, comentarios y foro por artista

**Visual:** cuatro capturas pequeñas: mapa emocional, catálogo, análisis y detalle de canción.

**Notas:** Explicar valencia (qué tan positiva suena una canción, de 0 a 1) y energía (intensidad y actividad). Con esos dos ejes se arma el mapa: arriba a la derecha lo enérgico y alegre, abajo lo tranquilo. Usuario objetivo: cualquier persona que escuche música; también sirve para análisis académico de géneros.

---

## 3. Arquitectura

**En pantalla**
- Frontend: React 19 + Vite → Vercel (CDN)
- Backend: Python + FastAPI → Vercel Functions
- Base de datos: PostgreSQL en Neon
- Archivos: Vercel Blob · Autenticación: Firebase
- Despliegue automático con cada push a GitHub

**Visual:** `docs/diagramas/arquitectura.png` ocupando casi toda la diapositiva.

**Notas:** Recorrer el diagrama de izquierda a derecha: el usuario entra al frontend, que llama a la API REST; la API consulta Neon y las APIs externas. Explicar la elección: todo en una sola plataforma, sin servidores que mantener, con HTTPS y despliegue automático. Mencionar que empezó en local y en Railway y se migró a Vercel + Neon.

---

## 4. Base de datos

**En pantalla**
- PostgreSQL · 14 tablas
- Catálogo: `songs`, `song_media`
- Usuarios: `user_profiles`, `user_settings`, `friendships`, `suggestions`
- Actividad: `song_likes`, `song_history`, `comments`, `playlists`, `playlist_songs`
- Foro: `artists`, `artist_threads`, `artist_posts`

**Visual:** `docs/diagramas/der.png`.

**Notas:** Las tablas propias están normalizadas: claves foráneas, restricciones UNIQUE (un me gusta por usuario y canción, una canción por playlist) y borrado en cascada. `songs` conserva el dataset original de Spotify, con una fila por canción y género: en vez de reescribir 113.550 filas, deduplicamos al consultar y armamos `artists` a partir de `songs`. Es una decisión consciente; la mejora sería separar géneros y artistas en tablas propias.

---

## 5. Cómo funciona por dentro

**En pantalla**
- **Mapa emocional:** clic → punto (valencia, energía) → canciones más cercanas por distancia euclídea
- **Recomendaciones:** similitud entre canciones con 5 atributos de audio, a partir de tus me gusta y tu historial
- **Subida de archivos:** permiso firmado por 10 minutos → el navegador sube directo a Vercel Blob → el backend verifica el archivo
- **Medios:** preview de iTunes o Deezer y video de YouTube, guardados en caché

**Visual:** un diagrama de secuencia simple del flujo de subida (navegador → backend: pide token → navegador → Blob: sube → backend: verifica).

**Notas:** Detenerse en la subida, porque muestra un problema real: las funciones de Vercel no aceptan más de 4,5 MB por request. La solución fue que el archivo no pase por el backend, sin perder el control: el backend decide quién puede subir, qué tipo y qué tamaño, y después revisa los primeros bytes del archivo.

---

## 6. Datos y APIs consumidas

**En pantalla**
- API propia: 75 endpoints REST documentados en `/docs` (OpenAPI)
- YouTube Data API · Spotify Web API y oEmbed
- iTunes Search · Deezer · Wikipedia
- Firebase Authentication · Resend (correo)

**Visual:** logos de cada servicio alrededor del logo de Moodify; captura de Swagger UI.

**Notas:** Distinguir entre la API que construimos (el backend) y las que consumimos. Para cada una, una línea de para qué: YouTube para el video, iTunes y Deezer para la preview de 30 segundos, Wikipedia para la biografía del artista, Resend para las sugerencias. Los resultados se guardan en caché para no depender de que el servicio responda siempre.

---

## 7. Usuarios, seguridad y privacidad

**En pantalla**
- Inicio de sesión con Google, Facebook o correo verificado (Firebase)
- Roles: usuario y administrador; el rol solo se asigna desde la base
- Validación de datos con Pydantic y consultas con ORM
- CORS restringido, secretos en variables de entorno
- Política de privacidad pública y descarga de datos personales

**Visual:** captura del login y de la sección "Datos y cuenta" de Configuración.

**Notas:** Las contraseñas nunca pasan por nuestro servidor. Un usuario no puede darse permisos de administrador porque la API no acepta cambios de rol. Ser honestos con la limitación: el backend todavía no verifica el token de Firebase en cada request; es el próximo paso.

---

## 8. Demo

**En pantalla**
- Demo en vivo
- moodify-one-rho.vercel.app

**Visual:** solo el título y la URL.

**Notas:** Seguir `docs/presentacion/guion-demo.md`. Tener el video de respaldo listo en otra pestaña.

---

## 9. Organización del trabajo

**En pantalla**

| Etapa | Fecha | Resultado |
|-------|-------|-----------|
| 1. Planificación | Junio | Roles, diccionario de datos, diagramas de pantallas |
| 2. MVP | Junio | Base de datos, API, Dashboard, Catálogo, Análisis, Bio-impacto, ABM |
| 3. Usuarios | Septiembre | Firebase, perfiles, comentarios, reacciones, amigos |
| 4. Comunidad y medios | Octubre | Artistas y foro, playlists, YouTube y Spotify, migración a Vercel + Neon |
| 5. Cierre | Noviembre | Análisis enlazado, privacidad, contacto, verificación de correo |

- Roles: base de datos · diseño · backend · frontend · documentación y QA

**Visual:** la tabla como línea de tiempo horizontal (Gantt simple).

**Notas:** Las fechas salen del historial de Git. Contar qué se priorizó en cada etapa y por qué el MVP se centró primero en los datos y la visualización, y después en los usuarios.

---

## 10. Aprendizajes y próximos pasos

**En pantalla**

*Aprendizajes*
- Pasar a serverless cambia el diseño: conexiones a la base y tamaño de los archivos
- Los datasets reales traen duplicados y hay que decidir cómo tratarlos
- Depender de APIs externas exige caché y alternativas (Spotify pasó a exigir Premium)

*Próximos pasos*
- Verificar el token de Firebase en el backend
- Tests automatizados
- Normalizar géneros y artistas del dataset
- Aplicación móvil

**Visual:** dos columnas.

**Notas:** Elegir uno o dos aprendizajes propios y contarlos como experiencia personal. Cerrar con una frase sobre el objetivo: hacer visible la relación entre música y emoción. Agradecer y abrir a preguntas.

---

## Cobertura de las pautas

| Requisito de las pautas | Dónde se cubre |
|-------------------------|----------------|
| Sistema en marcha, full stack, deployado | Diapositivas 3 y 8 |
| Tecnologías y frameworks | Diapositiva 3 |
| Base de datos: ABM / CRUD, normalización | Diapositiva 4; ABM en la demo |
| Front end dinámico con interacción al servidor | Demo |
| Consumo de datos mediante APIs | Diapositiva 6 |
| Responsive | Demo (barra lateral, catálogo); pregunta probable en el guion |
| Estimación y organización del proyecto | Diapositiva 9 |
| Documentación | `docs/` y Swagger (diapositiva 6) |
| Login / registro | Diapositiva 7; demo |
| Diagrama de arquitectura | Diapositiva 3 |
| Opcionales: formulario de contacto, UX/UI | Demo (Contacto, Configuración) |
