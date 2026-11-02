from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc, tuple_
from typing import Optional

import database
import models
import schemas
import storage
from artist_index import refresh_artists, split_artists
from routers.media import require_admin
from recommender import invalidate_catalog
from song_queries import (
    ESTADOS, estado_expr, deduped_query, genre_pairs, apply_search, rows_to_songs, song_with_details
)

router = APIRouter(prefix="/canciones", tags=["Canciones"])

SORT_FIELD_NAMES = {
    "valencia": "valence",
    "energia": "energy",
    "popularidad": "popularity",
    "duracion": "duration_ms",
}

def apply_ranges(consulta, Rep, request: Request):
    """Applies the catalogue's range filters: <campo>_min / <campo>_max for every sortable field."""
    for name, field in SORT_FIELD_NAMES.items():
        column = getattr(Rep, field)
        for suffix, compare in (("_min", column.__ge__), ("_max", column.__le__)):
            raw = request.query_params.get(name + suffix)
            if raw is None or raw == "":
                continue
            try:
                value = float(raw)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"{name + suffix} debe ser numérico")
            consulta = consulta.filter(compare(value))
    return consulta

@router.get("", response_model=list[schemas.CancionRespuesta])
def obtener_canciones(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: Optional[str] = Query(None),
    order: Optional[str] = Query("asc"),
    genero: Optional[str] = None,
    busqueda: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    consulta, Rep = deduped_query(db)
    consulta = apply_ranges(consulta, Rep, request)

    if genero and genero != "todos":
        consulta = consulta.filter(tuple_(Rep.track_name, Rep.artists).in_(genre_pairs(db, genero)))

    if busqueda:
        consulta = apply_search(consulta, Rep.track_name, Rep.artists, busqueda)

    if estado in ESTADOS:
        consulta = consulta.filter(estado_expr(Rep) == estado)

    if sort_by in SORT_FIELD_NAMES:
        column = getattr(Rep, SORT_FIELD_NAMES[sort_by])
        # The id tiebreaker keeps offset pages stable: without it, songs sharing a value
        # can shift between pages and repeat (visible as duplicates in infinite scroll).
        consulta = consulta.order_by(desc(column) if order == "desc" else asc(column), Rep.id.desc())
    else:
        consulta = consulta.order_by(Rep.id.desc())

    offset = (page - 1) * page_size
    rows = consulta.offset(offset).limit(page_size).all()
    return rows_to_songs(rows)

@router.get("/count")
def contar_canciones(
    request: Request,
    genero: Optional[str] = None,
    busqueda: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    consulta, Rep = deduped_query(db)
    consulta = apply_ranges(consulta, Rep, request)

    if genero and genero != "todos":
        consulta = consulta.filter(tuple_(Rep.track_name, Rep.artists).in_(genre_pairs(db, genero)))

    if busqueda:
        consulta = apply_search(consulta, Rep.track_name, Rep.artists, busqueda)

    if estado in ESTADOS:
        consulta = consulta.filter(estado_expr(Rep) == estado)

    return {"total": consulta.count()}

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
def crear_cancion(
    cancion_entrada: schemas.CancionCreate,
    admin_uid: str = Query(""),
    db: Session = Depends(database.get_db),
):
    require_admin(db, admin_uid)
    nueva_cancion = models.Cancion(**cancion_entrada.dict())
    db.add(nueva_cancion)
    db.commit()
    db.refresh(nueva_cancion)
    refresh_artists(db, split_artists(nueva_cancion.artists))
    invalidate_catalog()
    return nueva_cancion

@router.put("/{cancion_id}", response_model=schemas.CancionRespuesta)
def modificar_cancion(
    cancion_id: int,
    cancion_actualizada: schemas.CancionCreate,
    admin_uid: str = Query(""),
    db: Session = Depends(database.get_db),
):
    require_admin(db, admin_uid)
    cancion = db.query(models.Cancion).filter(models.Cancion.id == cancion_id).first()
    if not cancion:
        raise HTTPException(status_code=404, detail="Canción no encontrada")

    previous_artists = split_artists(cancion.artists)
    for campo, valor in cancion_actualizada.dict().items():
        setattr(cancion, campo, valor)

    db.commit()
    db.refresh(cancion)
    refresh_artists(db, previous_artists + split_artists(cancion.artists))
    invalidate_catalog()
    return cancion

@router.delete("/{cancion_id}")
def eliminar_cancion(cancion_id: int, admin_uid: str = Query(""), db: Session = Depends(database.get_db)):
    require_admin(db, admin_uid)
    cancion = db.query(models.Cancion).filter(models.Cancion.id == cancion_id).first()
    if not cancion:
        raise HTTPException(status_code=404, detail="Canción no encontrada")

    # Comments, likes and history reference songs without ON DELETE CASCADE, so the database
    # refuses to delete a song anyone interacted with: remove those rows first.
    for model in (models.Comment, models.SongLike, models.SongHistory, models.PlaylistSong):
        db.query(model).filter(model.song_id == cancion_id).delete(synchronize_session=False)

    # The media cache (and any cover or preview uploaded from the ABM) is per track; keep it
    # while another genre row of the same song still uses it.
    uploads = []
    shared = db.query(models.Cancion.id).filter(
        models.Cancion.track_id == cancion.track_id, models.Cancion.id != cancion_id
    ).first()
    media = None if shared else db.get(models.SongMedia, cancion.track_id)
    if media is not None:
        uploads = [media.thumbnail_url, media.preview_url]
        db.delete(media)

    removed_artists = split_artists(cancion.artists)
    db.delete(cancion)
    db.commit()
    for url in uploads:
        storage.delete(url)  # ignores external links (Spotify, iTunes, Deezer)
    refresh_artists(db, removed_artists)
    invalidate_catalog()
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

QUADRANT_RANGES = {
    "energetica": (0.6, 1.0, 0.6, 1.0),
    "intensa": (0.0, 0.4, 0.6, 1.0),
    "relajante": (0.0, 0.4, 0.0, 0.4),
    "melancolica": (0.6, 1.0, 0.0, 0.4),
}

@router.get("/mapa-emocional/{cuadrante}", response_model=list[schemas.CancionRespuesta])
def canciones_por_cuadrante(
    cuadrante: str,
    valencia: Optional[float] = Query(None, ge=0, le=1),
    energia: Optional[float] = Query(None, ge=0, le=1),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(database.get_db)
):
    rango = QUADRANT_RANGES.get(cuadrante.lower())
    if not rango:
        raise HTTPException(status_code=404, detail="Cuadrante no encontrado")

    min_v, max_v, min_e, max_e = rango
    consulta, Rep = deduped_query(db)
    consulta = consulta.filter(
        Rep.valence >= min_v,
        Rep.valence <= max_v,
        Rep.energy >= min_e,
        Rep.energy <= max_e,
    )

    if valencia is not None and energia is not None:
        distancia = func.pow(Rep.valence - valencia, 2) + func.pow(Rep.energy - energia, 2)
        consulta = consulta.order_by(distancia.asc())
    else:
        consulta = consulta.order_by(Rep.popularity.desc())

    rows = consulta.limit(limit).all()
    return rows_to_songs(rows)

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

@router.get("/{cancion_id}", response_model=schemas.CancionRespuesta)
def obtener_cancion(cancion_id: int, db: Session = Depends(database.get_db)):
    cancion = db.query(models.Cancion).filter(models.Cancion.id == cancion_id).first()
    if not cancion:
        raise HTTPException(status_code=404, detail="Canción no encontrada")
    song = song_with_details(db, cancion)
    # Artist pages are keyed by id; match the credited names (in credit order) to the index.
    names = split_artists(cancion.artists)
    ids = dict(
        db.query(models.Artist.name, models.Artist.id).filter(models.Artist.name.in_(names)).all()
    ) if names else {}
    song["artist_refs"] = [{"id": ids[n], "name": n} for n in names if n in ids]
    return song