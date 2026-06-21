# Moodify — Emociones Musicales

**Moodify** es una aplicación web orientada al análisis emocional y psicológico de la música basada en datos de Spotify. Permite explorar características como valencia emocional, energía, popularidad, loudness y acousticness mediante dashboards interactivos, facilitando la identificación de patrones entre géneros musicales y estados emocionales.

---

## 🎵 Características principales

- 📊 **Dashboard interactivo** con KPIs generales del catálogo
- 📚 **Catálogo explorable** con búsqueda, filtros y paginación
- 📈 **Análisis psicológico** con mapa de Valencia vs Energía
- 🎵 **Bio-impacto acústico** análisis de canciones acústicas
- 🔊 **Visualizaciones avanzadas** con Recharts
- ⚡ **API REST completa** para consultas y modificación de datos
- 🗄️ **Base de datos PostgreSQL** con 113.000+ canciones

---

## 🚀 Inicio Rápido

### Requisitos

- Python 3.10+
- Node.js 18+
- PostgreSQL 13+
- Git

### Instalación (5 minutos)

Consulta [guia-instalacion.md](docs/guia-instalacion.md) para instrucciones detalladas.

**En resumen:**

```bash
# 1. Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Frontend (en otra terminal)
cd frontend
npm install
npm run dev

# 3. Abre http://localhost:5173
```

---

## 📖 Documentación

| Documento | Descripción |
|-----------|------------|
| [guia-instalacion.md](docs/guia-instalacion.md) | Setup paso a paso del proyecto completo |
| [manual-usuario.md](docs/manual-usuario.md) | Guía de uso de la aplicación para usuarios finales |
| [documentacion-tecnica.md](docs/documentacion-tecnica.md) | Arquitectura, stack, endpoints, deployment |
| [diccionario-datos.md](docs/diccionario-datos.md) | API REST completa y explicación de campos |
| [modulo-abm.md](docs/modulo-abm.md) | Gestión de canciones (Alta, Baja, Modificación) |
| [pantallas.md](docs/pantallas.md) | Descripción de todas las páginas de la UI |
| [requisitos-funcionales.md](docs/requisitos-funcionales.md) | RF y RNF, matriz de trazabilidad |
| [casos-prueba.md](docs/casos-prueba.md) | Suite completa de pruebas E2E, API, performance |

---

## 🏗️ Arquitectura

```
┌─────────────────────┐        HTTP / JSON       ┌──────────────────────┐        SQL        ┌─────────────────────┐
│   Frontend          │ ──────────────────────▶  │   Backend            │ ────────────────▶ │   Base de Datos     │
│   React 19 + Vite   │ ◀──────────────────────  │   Python + FastAPI   │ ◀──────────────── │   PostgreSQL 18     │
│   localhost:5173    │                           │   localhost:8000     │                   │   localhost:5432    │
└─────────────────────┘                           └──────────────────────┘                   └─────────────────────┘
```

### Stack Tecnológico

**Frontend:**
- React 19 + Vite
- React Router para navegación SPA
- Recharts para visualizaciones
- Bootstrap + CSS personalizados
- Axios para HTTP client

**Backend:**
- Python 3.x + FastAPI
- SQLAlchemy ORM
- Pydantic para validación
- Uvicorn servidor ASGI

**Base de Datos:**
- PostgreSQL 18.4
- 113.549 canciones de Spotify
- 14 campos musicales y emocionales

---

## 📁 Estructura del Proyecto

```
Moodify/
├── backend/                          # Backend FastAPI
│   ├── main.py                       # Aplicación principal
│   ├── database.py                   # Configuración PostgreSQL
│   ├── models.py                     # Modelos ORM
│   ├── schemas.py                    # Schemas Pydantic
│   ├── requirements.txt              # Dependencias Python
│   └── routers/
│       ├── canciones.py              # Endpoints CRUD
│       └── stats.py                  # Endpoints estadísticas
├── frontend/                         # Frontend React
│   ├── src/
│   │   ├── pages/                    # Dashboard, Catalog, Analysis, BioImpact
│   │   ├── components/               # Componentes organizados por módulo
│   │   ├── services/api.js           # Cliente HTTP
│   │   ├── styles/                   # CSS global
│   │   ├── App.jsx                   # Componente raíz
│   │   └── main.jsx                  # Punto de entrada
│   ├── package.json                  # Dependencias Node
│   └── vite.config.js                # Config Vite
├── database/                         # Datos y schema
│   ├── schema.sql                    # Estructura de tabla
│   ├── moodify.backup                # Backup PostgreSQL
│   └── dataset.csv                   # Dataset original
├── docs/                             # Documentación completa
│   ├── guia-instalacion.md
│   ├── manual-usuario.md
│   ├── documentacion-tecnica.md
│   ├── diccionario-datos.md
│   ├── modulo-abm.md
│   ├── pantallas.md
│   ├── requisitos-funcionales.md
│   └── casos-prueba.md
└── README.md                         # Este archivo
```

---

## 🔌 API REST

### Endpoints principales

**Canciones:**
- `GET /canciones` — Lista paginada con filtros
- `GET /canciones/filtrar` — Filtrado avanzado
- `GET /canciones/recomendar/{emocion}` — Recomendaciones
- `POST /canciones` — Crear canción
- `PUT /canciones/{id}` — Actualizar canción
- `DELETE /canciones/{id}` — Eliminar canción

**Estadísticas:**
- `GET /stats/kpis` — KPIs generales
- `GET /stats/genre-distribution` — Distribución de popularidad
- `GET /stats/top-genres` — Top géneros por energía
- `GET /stats/explicit-content` — Contenido explícito por género
- `GET /stats/loudness-by-genre` — Loudness promedio
- `GET /stats/acoustic-index` — Índice acústico
- `GET /stats/top-acoustic-songs` — Top canciones acústicas
- `GET /stats/psych-map` — Mapa psicológico de emociones

📚 Documentación interactiva: **http://localhost:8000/docs**

---

## 📊 Pantallas

| Pantalla | Ruta | Descripción |
|----------|------|------------|
| Dashboard | `/` | KPIs, gráficos de distribución, canciones recientes |
| Catálogo | `/catalogo` | Tabla de canciones con búsqueda, filtros, paginación |
| Análisis | `/analisis` | Mapa psicológico, rankings, análisis de géneros |
| Bio-impacto | `/bioimpacto` | Análisis acústico, canciones acústicas destacadas |

---

## 🧪 Pruebas

Consulta [casos-prueba.md](docs/casos-prueba.md) para:
- Casos de prueba E2E (28 test cases)
- Pruebas de API (GET, POST, PUT, DELETE)
- Pruebas de integración Frontend-Backend
- Pruebas de performance

**Ejecutar pruebas manuales:**
```bash
# Frontend: ESLint
cd frontend
npm run lint

# Backend: Verificar conectividad (manual)
curl http://localhost:8000/docs
```

---

## 🚢 Despliegue

### Desarrollo local

```bash
cd backend && uvicorn main:app --reload --port 8000
cd frontend && npm run dev
```

### Producción

**Backend:** Gunicorn + Uvicorn workers
```bash
gunicorn -w 4 -b 0.0.0.0:8000 backend.main:app
```

**Frontend:** Build estático
```bash
npm run build
# Servir dist/ con Nginx o Vercel
```

Consulta [documentacion-tecnica.md](docs/documentacion-tecnica.md#9-despliegue) para detalles.

---

## 👥 Equipo

| Integrante | Rol | Tecnología |
|-----------|-----|-----------|
| Jonathan (Jony) | Base de Datos | PostgreSQL, SQL |
| Valentín (Valen) | Diseño / Frontend | Figma, React |
| Lucas | Backend | Python, FastAPI |
| Fede | Frontend | React, Recharts |
| Mauro Di Gallo | Visualización / QA / Docs | Power BI, Testing |

---

## ✅ Requisitos Implementados

### Funcionales (25 RF)
- ✅ Visualizar catálogo paginado
- ✅ Filtrar por género
- ✅ Buscar por texto
- ✅ Ordenar por columnas
- ✅ Navegar páginas
- ✅ Dashboard con KPIs
- ✅ Gráficos psicológicos
- ✅ API REST completa
- ⏳ ABM (crear/editar/eliminar desde UI)

### No-funcionales
- ✅ Latencia API < 2 segundos
- ✅ Soporta 113k+ registros
- ✅ CORS protegido
- ✅ Validación con Pydantic
- ✅ ORM contra inyección SQL
- ✅ Responsive design

Ver [requisitos-funcionales.md](docs/requisitos-funcionales.md) para la matriz completa.

---

## 🐛 Troubleshooting

### Backend no conecta a PostgreSQL
```bash
# Verifica que PostgreSQL está corriendo y DB existe
psql -U postgres -h localhost -c "SELECT 1;"
```

### Frontend no ve datos
```bash
# Verifica que el backend responde
curl http://localhost:8000/canciones
```

### Puerto ocupado
```bash
# Mata el proceso en puerto 5173 (frontend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

Consulta [guia-instalacion.md](docs/guia-instalacion.md#8-troubleshooting-de-instalación) para más soluciones.

---

## 📋 Roadmap

**Corto plazo:**
- [ ] ABM desde UI (create, read, update, delete)
- [ ] Tests unitarios con pytest
- [ ] Integración continua (GitHub Actions)

**Mediano plazo:**
- [ ] Autenticación de usuarios
- [ ] Playlists personalizadas
- [ ] Integración con Spotify API
- [ ] Exportación de reportes (PDF, CSV)

**Largo plazo:**
- [ ] Recomendaciones personalizadas con ML
- [ ] Análisis en tiempo real
- [ ] Aplicación mobile
- [ ] Websockets para datos en vivo

---

## 📝 Licencia

Proyecto académico. Derechos reservados.

---

## 📞 Contacto

**Documentación técnica:** Mauro Di Gallo  
**Backend:** Lucas  
**Frontend:** Fede  
**QA / Testing:** Mauro Di Gallo  

---

**Última actualización:** Junio 2026  
**Versión:** 1.0.0 (MVP)
