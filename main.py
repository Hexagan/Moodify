from fastapi import FastAPI, Depends, Query
from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import database

app = FastAPI()

# 1. MODELO DE BASE DE DATOS (TABLA REAL)
class Cancion(database.Base):
    __tablename__ = "songs" 

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(String)
    artists = Column(String)
    album_name = Column(String) 
    track_name = Column(String)
    popularity = Column(Integer)
    danceability = Column(Float)
    energy = Column(Float)
    valence = Column(Float) 
    track_genre = Column(String) 

# 2. ESQUEMAS PYDANTIC (MOLDES DE DATOS)

# Molde para enviar datos al Frontend
class CancionRespuesta(BaseModel):
    id: int 
    track_id: Optional[str] = "Desconocido"
    track_name: Optional[str] = "Desconocido"
    artists: Optional[str] = "Desconocido"
    album_name: Optional[str] = "Desconocido"
    track_genre: Optional[str] = "Desconocido"
    popularity: Optional[int] = 0
    danceability: Optional[float] = 0.0
    energy: Optional[float] = 0.0
    valence: Optional[float] = 0.0

    class Config:
        from_attributes = True

# Molde para recibir datos (ABM)
class CancionCreate(BaseModel):
    track_id: str
    track_name: str
    artists: str
    album_name: str
    track_genre: str
    popularity: int
    danceability: float
    energy: float
    valence: float


# 3. API CONSULTA DE CANCIONES (GET)
@app.get("/canciones", response_model=list[CancionRespuesta])
def obtener_canciones(db: Session = Depends(database.get_db)):
    # Limitamos a 100 para que tu PC no explote cargando 113,000 canciones de golpe
    return db.query(Cancion).limit(100).all()

# 4. API FILTROS POR GÉNERO Y MÉTRICAS (GET)
@app.get("/canciones/filtrar", response_model=list[CancionRespuesta])
def filtrar_canciones(
    genero: Optional[str] = Query(None, description="Ej: pop, rock, acoustic"),
    min_energia: Optional[float] = Query(None, description="Nivel mínimo de energía (0.0 a 1.0)"),
    db: Session = Depends(database.get_db)
):
    consulta = db.query(Cancion)
    
    if genero:
        consulta = consulta.filter(Cancion.track_genre == genero)
    if min_energia is not None:
        consulta = consulta.filter(Cancion.energy >= min_energia)
        
    return consulta.limit(50).all()


# 5. API ABM (POST, PUT, DELETE)

# A) ALTA (Crear)
@app.post("/canciones", response_model=CancionRespuesta)
def crear_cancion(cancion_entrada: CancionCreate, db: Session = Depends(database.get_db)):
    nueva_cancion = Cancion(
        track_id=cancion_entrada.track_id,
        track_name=cancion_entrada.track_name,
        artists=cancion_entrada.artists,
        album_name=cancion_entrada.album_name,
        track_genre=cancion_entrada.track_genre,
        popularity=cancion_entrada.popularity,
        danceability=cancion_entrada.danceability,
        energy=cancion_entrada.energy,
        valence=cancion_entrada.valence
    )
    db.add(nueva_cancion)
    db.commit()
    db.refresh(nueva_cancion)
    return nueva_cancion

# B) MODIFICACIÓN (Editar)
@app.put("/canciones/{cancion_id}", response_model=CancionRespuesta)
def modificar_cancion(cancion_id: int, cancion_actualizada: CancionCreate, db: Session = Depends(database.get_db)):
    cancion = db.query(Cancion).filter(Cancion.id == cancion_id).first()
    if not cancion:
        return {"error": "Canción no encontrada"}
    
    cancion.track_id = cancion_actualizada.track_id
    cancion.track_name = cancion_actualizada.track_name
    cancion.artists = cancion_actualizada.artists
    cancion.album_name = cancion_actualizada.album_name
    cancion.track_genre = cancion_actualizada.track_genre
    cancion.popularity = cancion_actualizada.popularity
    cancion.danceability = cancion_actualizada.danceability
    cancion.energy = cancion_actualizada.energy
    cancion.valence = cancion_actualizada.valence
    
    db.commit()
    db.refresh(cancion)
    return cancion

# C) BAJA (Eliminar)
@app.delete("/canciones/{cancion_id}")
def eliminar_cancion(cancion_id: int, db: Session = Depends(database.get_db)):
    cancion = db.query(Cancion).filter(Cancion.id == cancion_id).first()
    if not cancion:
        return {"error": "Canción no encontrada"}
    
    db.delete(cancion)
    db.commit()
    return {"mensaje": f"La canción con ID {cancion_id} fue eliminada con éxito"}


# 6. API RECOMENDACIONES EMOCIONALES
@app.get("/canciones/recomendar/{emocion}", response_model=list[CancionRespuesta])
def recomendar_canciones(emocion: str, db: Session = Depends(database.get_db)):
    consulta = db.query(Cancion)
    emocion = emocion.lower()
    
    # Lógica de emociones usando métricas reales de Spotify
    if emocion in ["feliz", "alegria", "alegre"]:
        consulta = consulta.filter(Cancion.valence > 0.7, Cancion.energy > 0.6)
    elif emocion in ["triste", "melancolia", "tristeza"]:
        consulta = consulta.filter(Cancion.valence < 0.4, Cancion.energy < 0.5)
    elif emocion in ["relajado", "calma", "paz"]:
        consulta = consulta.filter(Cancion.energy < 0.3)
    elif emocion in ["energia", "euforia", "intenso"]:
        consulta = consulta.filter(Cancion.energy > 0.8)
    else:
        return [] 
        
    return consulta.order_by(Cancion.popularity.desc()).limit(10).all()