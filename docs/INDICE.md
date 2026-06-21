# Índice de Documentación — Moodify

**Proyecto:** Moodify — Emociones Musicales  
**Fecha:** Junio 2026

---

## 📚 Documentación Disponible

Guía completa de toda la documentación del proyecto Moodify.

---

## 🎯 Por Rol / Audiencia

### 👤 Usuario Final (No técnico)

**Empezar aquí:**
1. [manual-usuario.md](manual-usuario.md) — Cómo usar la aplicación
2. [pantallas.md](pantallas.md) — Descripción de todas las páginas

**Temas:**
- Cómo acceder a Moodify
- Exploración del catálogo
- Interpretación de gráficos
- Casos de uso comunes
- FAQ y troubleshooting básico

---

### 💻 Developer (Frontend)

**Empezar aquí:**
1. [guia-instalacion.md](guia-instalacion.md) — Setup del proyecto
2. [documentacion-tecnica.md](documentacion-tecnica.md#5-frontend--interfaz-de-usuario) — Sección Frontend

**Temas:**
- Instalación del entorno local
- Estructura de componentes
- Llamadas a API desde React
- Rutas y navegación
- Estilos y temas

**Archivos clave:**
- `frontend/src/services/api.js` — Cliente HTTP
- `frontend/src/pages/` — Páginas principales
- `frontend/src/components/` — Componentes reutilizables

---

### 🔧 Developer (Backend)

**Empezar aquí:**
1. [guia-instalacion.md](guia-instalacion.md) — Setup del proyecto
2. [documentacion-tecnica.md](documentacion-tecnica.md#4-backend--api-rest) — Sección Backend
3. [diccionario-datos.md](diccionario-datos.md) — API REST completa

**Temas:**
- Setup del backend con FastAPI
- Modelos y schemas ORM
- Endpoints CRUD
- Estadísticas y queries complejas
- CORS y middlewares

**Archivos clave:**
- `backend/main.py` — Aplicación principal
- `backend/database.py` — Configuración PostgreSQL
- `backend/models.py` — Modelos ORM
- `backend/schemas.py` — Schemas Pydantic
- `backend/routers/` — Endpoints

---

### 📊 DevOps / DevSecOps

**Empezar aquí:**
1. [documentacion-tecnica.md](documentacion-tecnica.md#9-despliegue) — Despliegue
2. [documentacion-tecnica.md](documentacion-tecnica.md#10-troubleshooting) — Troubleshooting

**Temas:**
- Deployment en producción
- Configuración de base de datos
- Variables de entorno
- CORS y seguridad
- Monitoreo y alertas

---

### 🧪 QA / Tester

**Empezar aquí:**
1. [casos-prueba.md](casos-prueba.md) — Suite completa de pruebas
2. [requisitos-funcionales.md](requisitos-funcionales.md) — RF para traceability

**Temas:**
- Casos de prueba E2E (Dashboard, Catálogo, Análisis, BioImpacto)
- Pruebas de API REST
- Pruebas de integración
- Pruebas de performance
- Matriz de trazabilidad RF-Test

**Estructura:**
- TC-DASH-* → Tests Dashboard
- TC-CAT-* → Tests Catálogo
- TC-ANA-* → Tests Análisis
- TC-BIO-* → Tests BioImpacto
- TC-API-* → Tests API REST
- TC-INT-* → Tests Integración
- TC-PERF-* → Tests Performance

---

### 📋 Product Owner / Manager

**Empezar aquí:**
1. [README.md](../README.md) — Visión general
2. [requisitos-funcionales.md](requisitos-funcionales.md) — RF y RNF
3. [casos-prueba.md](casos-prueba.md#9-checklist-de-ejecución) — Checklist de release

**Temas:**
- Features implementadas vs pendientes
- Stack tecnológico
- Roadmap
- Matriz de trazabilidad
- Checklist de calidad

---

### 👨‍🎓 Estudiante / Investigador

**Empezar aquí:**
1. [manual-usuario.md](manual-usuario.md) — Cómo usar Moodify
2. [documentacion-tecnica.md](documentacion-tecnica.md#1-descripción-general-del-sistema) — Contexto técnico
3. [diccionario-datos.md](diccionario-datos.md#1-diccionario-de-datos) — Dataset explicado

**Temas:**
- Interpretación de emociones musicales
- Datos de Spotify y su significado
- Análisis de géneros musicales
- Glosario de términos musicales

---

## 📄 Archivos Principales

### Documentación Técnica

| Archivo | Tipo | Audiencia | Contenido |
|---------|------|-----------|----------|
| [README.md](../README.md) | Markdown | Todos | Visión general, inicio rápido, stack |
| [documentacion-tecnica.md](documentacion-tecnica.md) | Markdown | Developers | Arquitectura, deployment, troubleshooting |
| [guia-instalacion.md](guia-instalacion.md) | Markdown | Developers | Setup paso a paso |
| [diccionario-datos.md](diccionario-datos.md) | Markdown | Backend Dev / API User | Endpoints REST, modelos, campos |
| [modulo-abm.md](modulo-abm.md) | Markdown | Backend Dev | Gestión de canciones (CRUD) |

### Documentación de Producto

| Archivo | Tipo | Audiencia | Contenido |
|---------|------|-----------|----------|
| [manual-usuario.md](manual-usuario.md) | Markdown | Usuario Final | Guía de uso de la aplicación |
| [pantallas.md](pantallas.md) | Markdown | Usuario Final / PO | Descripción de todas las páginas |
| [requisitos-funcionales.md](requisitos-funcionales.md) | Markdown | PO / Developer | RF, RNF, matriz de trazabilidad |

### Documentación de QA

| Archivo | Tipo | Audiencia | Contenido |
|---------|------|-----------|----------|
| [casos-prueba.md](casos-prueba.md) | Markdown | QA / Tester | Suite de 28 casos de prueba |

---

## 🗺️ Mapa Mental de Documentación

```
MOODIFY
├── README.md (Start here)
│   └── Visión general, stack, links a docs
│
├── USUARIOS FINALES
│   ├── manual-usuario.md
│   │   ├── Cómo acceder
│   │   ├── Interface principal
│   │   ├── Dashboard / Catálogo / Análisis / BioImpacto
│   │   ├── Glosario
│   │   ├── Casos de uso
│   │   └── Troubleshooting
│   │
│   └── pantallas.md
│       ├── Navegación general
│       ├── Dashboard
│       ├── Catálogo
│       ├── Análisis
│       └── BioImpacto
│
├── DEVELOPERS
│   ├── guia-instalacion.md
│   │   ├── Prerequisitos
│   │   ├── PostgreSQL setup
│   │   ├── Backend setup
│   │   ├── Frontend setup
│   │   ├── Verificación
│   │   └── Troubleshooting
│   │
│   ├── documentacion-tecnica.md
│   │   ├── Arquitectura (3 capas)
│   │   ├── Stack tecnológico
│   │   ├── Base de datos
│   │   ├── Backend API
│   │   ├── Frontend UI
│   │   ├── Módulos funcionales
│   │   ├── Power BI
│   │   ├── Testing
│   │   ├── Despliegue
│   │   ├── Troubleshooting
│   │   └── Roadmap
│   │
│   ├── diccionario-datos.md
│   │   ├── Diccionario de datos (tabla songs)
│   │   └── Documentación API REST
│   │       ├── GET /canciones
│   │       ├── GET /canciones/filtrar
│   │       ├── GET /canciones/recomendar
│   │       ├── GET /stats/*
│   │       ├── POST /canciones
│   │       ├── PUT /canciones/{id}
│   │       └── DELETE /canciones/{id}
│   │
│   ├── modulo-abm.md
│   │   ├── Descripción general
│   │   ├── Endpoints CRUD
│   │   ├── Modelo de datos
│   │   ├── Flujo de datos
│   │   └── Estado actual
│   │
│   └── requisitos-funcionales.md
│       ├── 25 Requisitos funcionales
│       ├── 7 Requisitos no-funcionales
│       └── Matriz de trazabilidad
│
├── QA / TESTING
│   └── casos-prueba.md
│       ├── 4 Test Dashboard
│       ├── 6 Test Catálogo
│       ├── 3 Test Análisis
│       ├── 2 Test BioImpacto
│       ├── 8 Test API
│       ├── 2 Test Integración
│       ├── 2 Test Performance
│       └── Checklist de release
│
└── REFERENCIAS
    ├── todo.txt (Progress tracking)
    └── INDICE.md (This file)
```

---

## 🔗 Links Rápidos

### Empezar Desarrollo

1. **Instalación:** [guia-instalacion.md](guia-instalacion.md)
2. **Arquitectura:** [documentacion-tecnica.md](documentacion-tecnica.md#2-arquitectura-del-sistema)
3. **API Docs:** [diccionario-datos.md](diccionario-datos.md#2-documentación-de-la-api-rest)

### Testing

1. **Casos de Prueba:** [casos-prueba.md](casos-prueba.md)
2. **Requisitos:** [requisitos-funcionales.md](requisitos-funcionales.md)
3. **Checklist Release:** [casos-prueba.md](casos-prueba.md#9-checklist-de-ejecución)

### Despliegue

1. **Deployment:** [documentacion-tecnica.md](documentacion-tecnica.md#9-despliegue)
2. **Troubleshooting:** [documentacion-tecnica.md](documentacion-tecnica.md#10-troubleshooting)

---

## 📊 Estadísticas de Documentación

| Métrica | Valor |
|---------|-------|
| Documentos | 9 archivos Markdown |
| Palabras totales | ~45,000 |
| Código incluido | ~200 snippets |
| Casos de prueba | 28 TC |
| Requisitos funcionales | 25 RF |
| Requisitos no-funcionales | 7 RNF |
| Endpoints API documentados | 15+ |
| Pantallas documentadas | 4 |

---

## ✅ Documentación Completa

Todos los archivos marcados con ✅ fueron generados/completados en Junio 2026:

- ✅ README.md (expandido)
- ✅ guia-instalacion.md (creado)
- ✅ manual-usuario.md (creado)
- ✅ documentacion-tecnica.md (completado)
- ✅ diccionario-datos.md (completado)
- ✅ modulo-abm.md (existente)
- ✅ pantallas.md (existente)
- ✅ requisitos-funcionales.md (creado)
- ✅ casos-prueba.md (creado)

---

## 🎯 Próximos Pasos

Para completar la documentación del proyecto:

1. **Capturas de pantalla:** Agregar `docs/screenshots/` con imágenes de cada página
2. **Videos de demostración:** Grabar walkthroughs de cada módulo
3. **Presentación:** Crear slides de presentación final
4. **Dossier académico:** Compilar informe final del proyecto

---

## 📞 Contacto

**Documentación:** Mauro Di Gallo  
**Preguntas técnicas:** Equipo de desarrollo

---

*Índice generado — Junio 2026*
*Última actualización: Junio 2026*