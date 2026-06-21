# Guía de Instalación — Moodify

**Proyecto:** Moodify — Emociones Musicales  
**Archivo:** `docs/guia-instalacion.md`  
**Autor:** Mauro Di Gallo — Visualización / QA / Docs  
**Fecha:** Junio 2026

---

## 1. Prerequisitos

### 1.1 Software requerido

| Software | Versión | Propósito | Descargar |
|----------|---------|----------|----------|
| Git | 2.40+ | Control de versiones | https://git-scm.com |
| Python | 3.10+ | Backend | https://www.python.org |
| Node.js | 18+ | Frontend | https://nodejs.org |
| npm | 8+ | Package manager JS | (se instala con Node.js) |
| PostgreSQL | 13+ | Base de datos | https://www.postgresql.org |

### 1.2 Verificar si tienes el software instalado

Abre Terminal (Windows: PowerShell) y ejecuta:

```bash
# Verificar Git
git --version

# Verificar Python
python --version   # o python3 --version

# Verificar Node.js y npm
node --version
npm --version

# Verificar PostgreSQL
psql --version    # si PostgreSQL está en PATH
```

---

## 2. Instalación Base de Datos

### 2.1 Instalar PostgreSQL

#### Windows

1. Descargar instalador: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador
3. Seguir el asistente, anotar la **contraseña del usuario `postgres`** (usaremos `1234` por defecto)
4. Seleccionar puerto: **5432** (default)
5. Finalizar instalación

#### macOS

```bash
# Con Homebrew
brew install postgresql@15
brew services start postgresql@15
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2.2 Verificar que PostgreSQL está corriendo

**Windows (PowerShell):**
```powershell
# Verificar que el servicio está activo
Get-Service PostgreSQL*
```

**macOS / Linux:**
```bash
sudo systemctl status postgresql
```

### 2.3 Crear base de datos y usuario

Abre Terminal y conéctate a PostgreSQL:

```bash
psql -U postgres -h localhost
```

Se te pedirá la contraseña (default: `1234`).

Luego, ejecuta en el prompt `postgres=#`:

```sql
-- Crear base de datos
CREATE DATABASE moodify;

-- Listar bases de datos (verificar)
\l

-- Salir
\q
```

### 2.4 Cargar datos en la base de datos

**Opción A: Desde el schema SQL**

```bash
cd database/
psql -U postgres -h localhost -d moodify -f schema.sql
```

**Opción B: Desde el backup**

```bash
cd database/
psql -U postgres -h localhost -d moodify < moodify.backup
```

**Verificar que se cargaron los datos:**

```bash
psql -U postgres -h localhost -d moodify -c "SELECT COUNT(*) FROM songs;"
```

Deberías ver un número cercano a 113.549 registros.

---

## 3. Instalación Backend

### 3.1 Abrir carpeta del proyecto

```bash
# Navegar al proyecto
cd "d:\01 - Tecnicatura superior en desarrollo de software\2do anio\PPII\Moodify\Moodify"

# O desde PowerShell (si usas rutas con espacios)
cd 'd:\01 - Tecnicatura superior en desarrollo de software\2do anio\PPII\Moodify\Moodify'
```

### 3.2 Crear entorno virtual (recomendado)

**Windows (PowerShell):**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Si ves un error de permisos, ejecuta:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

Deberías ver `(.venv)` al inicio de la línea de comandos.

### 3.3 Instalar dependencias Python

Desde la carpeta `backend/` con el venv activado:

```bash
pip install -r requirements.txt
```

### 3.4 Verificar conectividad a BD

```bash
python -c "from database import SessionLocal; db = SessionLocal(); print('✅ Conexión OK')"
```

Si ves "Conexión OK", ¡estamos bien!

**Si hay error:**
- Verifica que PostgreSQL está corriendo
- Verifica la URL en `backend/database.py`
- Verifica usuario y contraseña

### 3.5 Levantar el backend

Desde `backend/` con venv activado:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Resultado esperado:**

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

Abre en navegador: **http://localhost:8000/docs**

Deberías ver la documentación interactiva de Swagger.

---

## 4. Instalación Frontend

### 4.1 Abre otra Terminal (mantén el backend corriendo)

```bash
# Navega a la carpeta raíz del proyecto
cd "d:\01 - Tecnicatura superior en desarrollo de software\2do anio\PPII\Moodify\Moodify"

# Entra a la carpeta frontend
cd frontend
```

### 4.2 Instalar dependencias Node.js

```bash
npm install
```

Esto crea carpeta `node_modules/` y descarga ~500 MB de paquetes.

### 4.3 Verificar que el backend es accesible

Abre otro terminal (cmd / PowerShell) sin cerrar los anteriores:

```bash
# Verificar que el backend responde
curl http://localhost:8000/canciones
```

Deberías recibir un JSON con canciones.

### 4.4 Levantar el frontend

Desde `frontend/`:

```bash
npm run dev
```

**Resultado esperado:**

```
VITE v8.0.12  ready in 123 ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

---

## 5. Verificación de Instalación Completa

Una vez que **backend**, **frontend** y **PostgreSQL** estén corriendo:

### 5.1 Abrir la aplicación en navegador

Ve a: **http://localhost:5173**

Deberías ver:
- ✅ Sidebar con opciones: Dashboard, Catálogo, Análisis, Bio-impacto
- ✅ Dashboard con KPIs cargados
- ✅ Gráficos visibles

### 5.2 Probar interacciones básicas

1. **Dashboard → Catálogo:**
   - Haz clic en "Catálogo" en el Sidebar
   - Deberías ver una tabla con 10 canciones

2. **Filtrar por género:**
   - Haz clic en un género (ej: "Rock")
   - Tabla se actualiza

3. **Buscar canción:**
   - Escribe en la barra de búsqueda
   - Tabla filtra en tiempo real

### 5.3 Verificar consola de errores

Abre **DevTools** (F12 en navegador):
- **Tab "Console":** No debería haber errores rojos
- **Tab "Network":** Las llamadas a `http://localhost:8000/*` deben tener status 200

---

## 6. Parar y Reiniciar

### 6.1 Parar servicios

**Para el backend (Terminal 1):**
```
Ctrl+C
```

**Para el frontend (Terminal 2):**
```
Ctrl+C
```

**Para PostgreSQL (Windows):**
```powershell
Get-Service PostgreSQL* | Stop-Service
```

### 6.2 Reiniciar desde cero

```bash
# Terminal 1: Backend
cd backend
.\.venv\Scripts\Activate.ps1  # (o source .venv/bin/activate en Mac/Linux)
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev

# El navegador abre automáticamente en localhost:5173
```

---

## 7. Configuración (Cambios Opcionales)

### 7.1 Cambiar puerto del backend

Si el puerto 8000 está ocupado, modifica en `backend/main.py`:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 9000
```

Luego, actualiza la URL en `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:9000';
```

### 7.2 Cambiar contraseña PostgreSQL

Si usas otra contraseña en PostgreSQL, actualiza en `backend/database.py`:

```python
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:TU_CONTRASEÑA@localhost:5432/moodify"
```

### 7.3 Usar base de datos remota

Si usas un servidor PostgreSQL remoto:

```python
SQLALCHEMY_DATABASE_URL = "postgresql://usuario:contraseña@mi.servidor.com:5432/moodify"
```

---

## 8. Troubleshooting de Instalación

### 8.1 Error: "Python no encontrado"

**Problema:** `python: command not found` o `python is not recognized`

**Solución:**
1. Desinstala Python completamente
2. Reinstala desde https://www.python.org
3. **Marca la opción "Add Python to PATH"**
4. Reinicia Terminal / PowerShell

### 8.2 Error: "PostgreSQL no puede conectar"

**Problema:** `ConnectionRefusedError: 111` en backend

**Solución:**
1. Verifica que PostgreSQL está corriendo:
   ```bash
   psql -U postgres -h localhost -c "SELECT 1;"
   ```
2. Si no abre: Inicia PostgreSQL
3. Si persiste: Verifica contraseña en `database.py`

### 8.3 Error: "Puerto 5173 ya en uso"

**Problema:** `Error: Port 5173 is already in use`

**Solución:**
1. Mata el proceso en ese puerto:
   ```bash
   # Windows PowerShell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
   
   # macOS/Linux
   lsof -ti:5173 | xargs kill -9
   ```
2. O usa otro puerto:
   ```bash
   # En frontend/vite.config.js, cambia:
   # port: 5174
   ```

### 8.4 Error: "npm: command not found"

**Problema:** npm no está instalado

**Solución:**
1. Desinstala Node.js completamente
2. Reinstala desde https://nodejs.org (LTS)
3. Reinicia Terminal

### 8.5 Error: "modules not found" en backend

**Problema:** `ModuleNotFoundError: No module named 'fastapi'`

**Solución:**
1. Verifica que el venv está activado (deberías ver `(.venv)` en el prompt)
2. Reinstala dependencias:
   ```bash
   pip install -r requirements.txt
   ```

### 8.6 Error: "Database moodify does not exist"

**Problema:** Backend no puede conectar a base de datos

**Solución:**
1. Crea la BD si no existe:
   ```bash
   psql -U postgres -h localhost -c "CREATE DATABASE moodify;"
   ```
2. Carga el schema:
   ```bash
   psql -U postgres -h localhost -d moodify -f database/schema.sql
   ```

---

## 9. Build para Producción

### 9.1 Build del frontend

```bash
cd frontend
npm run build
```

Genera carpeta `dist/` con archivos optimizados.

### 9.2 Deploy a Vercel (opcional)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desde la raíz del proyecto
vercel

# Sigue los pasos
```

---

## 10. Estructura de Carpetas Esperada

Después de la instalación, tu carpeta debe verse así:

```
Moodify/
├── backend/
│   ├── .venv/                 ← Entorno virtual Python
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── routers/
├── frontend/
│   ├── node_modules/          ← Paquetes Node.js
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   ├── package.json
│   └── package-lock.json
├── database/
│   ├── schema.sql
│   ├── moodify.backup
│   └── dataset.csv
├── docs/
│   ├── README.md
│   ├── diccionario-datos.md
│   ├── documentacion-tecnica.md
│   ├── manual-usuario.md
│   ├── guia-instalacion.md
│   └── casos-prueba.md
└── README.md
```

---

## 11. Comandos Rápidos (Cheat Sheet)

| Acción | Comando |
|--------|---------|
| Activar venv Python (Windows) | `.\.venv\Scripts\Activate.ps1` |
| Activar venv Python (Mac/Linux) | `source .venv/bin/activate` |
| Instalar dependencias Python | `pip install -r requirements.txt` |
| Instalar dependencias Node | `npm install` |
| Iniciar backend | `uvicorn main:app --reload --host 127.0.0.1 --port 8000` |
| Iniciar frontend | `npm run dev` |
| Build frontend prod | `npm run build` |
| Lint frontend | `npm run lint` |
| Conectar a PostgreSQL | `psql -U postgres -h localhost -d moodify` |
| Crear DB | `psql -U postgres -c "CREATE DATABASE moodify;"` |
| Cargar schema | `psql -U postgres -d moodify -f database/schema.sql` |

---

## 12. Obtener Ayuda

Si encuentras problemas:

1. **Revisa los logs:**
   - Backend: Mira la salida en Terminal donde corre uvicorn
   - Frontend: Abre DevTools (F12) → Console

2. **Contacta al equipo:**
   - Backend: Lucas
   - Frontend: Fede
   - Documentación: Mauro Di Gallo

3. **Check común:**
   - ¿PostgreSQL corriendo? ¿Datos cargados? ¿Venv activado? ¿Puertos correctos?

---

*Mauro Di Gallo — Visualización / QA / Docs — Moodify · Junio 2026*
