from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware 
from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import database

app = FastAPI()

# 0. CONFIGURACIÓN CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# 1. MODELO DE BASE DE DATOS (TABLA REAL)
class Cancion(database.Base):
    __tablename__ = "songs" 

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(String)
    artists = Column(String)
    album_name = Column(String) 
    track_name = Column(String)
    popularity = Column(Integer)
    duration_ms = Column(Integer)
    explicit = Column(Boolean)
    danceability = Column(Float)
    energy = Column(Float)
    loudness = Column(Float)         
    acousticness = Column(Float)
    valence = Column(Float) 
    track_genre = Column(String) 

# 2. ESQUEMAS PYDANTIC (MOLDES DE DATOS)
class CancionRespuesta(BaseModel):
    id: int 
    track_id: Optional[str] = None
    track_name: Optional[str] = None
    artists: Optional[str] = None
    album_name: Optional[str] = None
    track_genre: Optional[str] = None
    popularity: Optional[int] = 0
    duration_ms: Optional[int] = 0
    explicit: Optional[bool] = False
    danceability: Optional[float] = 0.0
    energy: Optional[float] = 0.0
    loudness: Optional[float] = 0.0   
    acousticness: Optional[float] = 0.0
    valence: Optional[float] = 0.0

    class Config:
        from_attributes = True

# 3. RUTAS API (GET)
@app.get("/canciones", response_model=list[CancionRespuesta])
def obtener_canciones(db: Session = Depends(database.get_db)):
    return db.query(Cancion).limit(100).all()

@app.get("/canciones/filtrar", response_model=list[CancionRespuesta])
def filtrar_canciones(
    genero: Optional[str] = None,
    es_explicita: Optional[bool] = None,
    db: Session = Depends(database.get_db)
):
    consulta = db.query(Cancion)
    if genero:
        consulta = consulta.filter(Cancion.track_genre == genero)
    if es_explicita is not None:
        consulta = consulta.filter(Cancion.explicit == es_explicita)
    return consulta.limit(50).all()
