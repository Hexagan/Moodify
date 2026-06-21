from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database
from routers import canciones, stats

database.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(canciones.router)
app.include_router(stats.router)