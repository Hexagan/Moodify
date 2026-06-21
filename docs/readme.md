# Moodify — Documentación del proyecto

Este directorio agrupa la documentación del proyecto Moodify: guías, especificaciones y manuales.

Estructura relevante:
- `backend/` — código del servidor (FastAPI, SQLAlchemy).
- `frontend/` — aplicación cliente (React + Vite).
- `docs/` — documentación (diccionario de datos, documentación técnica, pantallas, ABM).

Requisitos mínimos
- Python 3.10+ (recomendado) para el backend
- Node.js 18+ y npm para el frontend
- PostgreSQL 13+ para la base de datos

Arrancar el backend (desarrollo)
1. Crear y activar un virtualenv:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Instalar dependencias:

```powershell
pip install -r backend/requirements.txt
```

3. Asegurarse de que PostgreSQL esté corriendo y que exista la base de datos `moodify`.

4. Iniciar el servidor FastAPI:

```powershell
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Nota: `backend/database.py` contiene la configuración de conexión; actualizarla si es necesario.

Arrancar el frontend (desarrollo)
1. Entrar a la carpeta `frontend` e instalar dependencias:

```bash
cd frontend
npm install
```

2. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Consumir la API
- La API base está en `http://localhost:8000`.
- FastAPI expone documentación interactiva en `http://localhost:8000/docs`.
- Ver `docs/diccionario-datos.md` y `docs/modulo-abm.md` para detalles de endpoints y modelos.

Buenas prácticas
- Mantener la DB local en una instancia dedicada para desarrollo.
- No versionar credenciales en `backend/database.py`.

Contribuir a la documentación
- Editar los archivos bajo `docs/` y crear una MR/PR con los cambios.

Contacto
- Mauro Di Gallo — Visualización / QA / Docs
