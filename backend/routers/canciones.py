from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc
from typing import Optional

import database
import models
import schemas

router = APIRouter(prefix="/canciones", tags=["Canciones"])

SORT_FIELDS = {
    "valencia": models.Cancion.valence,
    "energia": models.Cancion.energy,
    "popularidad": models.Cancion.popularity,
    "duracion": models.Cancion.duration_ms,
}

@router.get("", response_model=list[schemas.CancionRespuesta])
def obtener_canciones(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: Optional[str] = Query(None),
    order: Optional[str] = Query("asc"),
    genero: Optional[str] = None,
    busqueda: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    consulta = db.query(models.Cancion)

    if genero and genero != "todos":
        consulta = consulta.filter(models.Cancion.track_genre == genero)

    if busqueda:
        like = f"%{busqueda}%"
        consulta = consulta.filter(
            (models.Cancion.track_name.ilike(like)) |
            (models.Cancion.artists.ilike(like))
        )

    if sort_by in SORT_FIELDS:
        column = SORT_FIELDS[sort_by]
        consulta = consulta.order_by(desc(column) if order == "desc" else asc(column))

    offset = (page - 1) * page_size
    return consulta.offset(offset).limit(page_size).all()

@router.get("/filtrar", response_model=list[schemas.CancionRespuesta])
def filtrar_canciones(
    genero: Optional[str] = None,
    min_energia: Optional[float] = None,
    min_valencia: Optional[float] = None,
    es_explicita: Optional[bool] = None,
    db: Session = Depends(database.get_db)
):
    consulta = db.query(models.Cancion)

    if genero:
        consulta = consulta.filter(models.Cancion.track_genre == genero)
    if min_energia is not None:
        consulta = consulta.filter(models.Cancion.energy >= min_energia)
    if min_valencia is not None:
        consulta = consulta.filter(models.Cancion.valence >= min_valencia)
    if es_explicita is not None:
        consulta = consulta.filter(models.Cancion.explicit == es_explicita)

    return consulta.limit(50).all()

@router.post("", response_model=schemas.CancionRespuesta)
def crear_cancion(cancion_entrada: schemas.CancionCreate, db: Session = Depends(database.get_db)):
    nueva_cancion = models.Cancion(**cancion_entrada.dict())
    db.add(nueva_cancion)
    db.commit()
    db.refresh(nueva_cancion)
    return nueva_cancion

@router.put("/{cancion_id}", response_model=schemas.CancionRespuesta)
def modificar_cancion(cancion_id: int, cancion_actualizada: schemas.CancionCreate, db: Session = Depends(database.get_db)):
    cancion = db.query(models.Cancion).filter(models.Cancion.id == cancion_id).first()
    if not cancion:
        return {"error": "Canción no encontrada"}

    for campo, valor in cancion_actualizada.dict().items():
        setattr(cancion, campo, valor)

    db.commit()
    db.refresh(cancion)
    return cancion

@router.delete("/{cancion_id}")
def eliminar_cancion(cancion_id: int, db: Session = Depends(database.get_db)):
    cancion = db.query(models.Cancion).filter(models.Cancion.id == cancion_id).first()
    if not cancion:
        return {"error": "Canción no encontrada"}

    db.delete(cancion)
    db.commit()
    return {"mensaje": f"La canción con ID {cancion_id} fue eliminada con éxito"}

@router.get("/recomendar/{emocion}", response_model=list[schemas.CancionRespuesta])
def recomendar_canciones(emocion: str, db: Session = Depends(database.get_db)):
    consulta = db.query(models.Cancion)
    emocion = emocion.lower()

    if emocion in ["feliz", "alegria", "alegre"]:
        consulta = consulta.filter(models.Cancion.valence > 0.7, models.Cancion.energy > 0.6)
    elif emocion in ["triste", "melancolia", "tristeza"]:
        consulta = consulta.filter(models.Cancion.valence < 0.4, models.Cancion.energy < 0.5)
    elif emocion in ["relajado", "calma", "paz"]:
        consulta = consulta.filter(models.Cancion.energy < 0.3)
    elif emocion in ["energia", "euforia", "intenso"]:
        consulta = consulta.filter(models.Cancion.energy > 0.8)
    else:
        return []

    return consulta.order_by(models.Cancion.popularity.desc()).limit(10).all()

@router.get("/count")
def contar_canciones(
    genero: Optional[str] = None,
    busqueda: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    consulta = db.query(models.Cancion)

    if genero and genero != "todos":
        consulta = consulta.filter(models.Cancion.track_genre == genero)

    if busqueda:
        like = f"%{busqueda}%"
        consulta = consulta.filter(
            (models.Cancion.track_name.ilike(like)) |
            (models.Cancion.artists.ilike(like))
        )

    return {"total": consulta.count()}

@router.get("/random", response_model=list[schemas.CancionRespuesta])
def canciones_aleatorias(db: Session = Depends(database.get_db)):
    return (
        db.query(models.Cancion)
        .order_by(func.random())
        .limit(10)
        .all()
    )

@router.get("/generos")
def obtener_generos(db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.Cancion.track_genre)
        .distinct()
        .order_by(models.Cancion.track_genre)
        .all()
    )
    return [g[0] for g in rows]