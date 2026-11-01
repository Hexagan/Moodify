from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import database
import models
from recommender import get_catalog, resolve_indices, representative_id, recommend_songs, recommend_artists

router = APIRouter(prefix="/musica", tags=["Música personal"])

# Re-opening a song within this window (double clicks, React StrictMode re-running effects
# in development) refreshes its position in the history without counting another listen.
REPEAT_WINDOW = timedelta(seconds=30)


class HistoryEvent(BaseModel):
    user_uid: str
    song_id: int
    source: Literal["preview", "detail"]


def _playlist_items(db, rows, extra):
    """Turn rows pointing at any genre-duplicate into one display entry per song."""
    catalog = get_catalog(db)
    mapping = resolve_indices(db, catalog, [r.song_id for r in rows])
    items, seen = [], set()
    for row in rows:
        index = mapping.get(row.song_id)
        if index is None or index in seen:
            continue
        seen.add(index)
        items.append({**catalog.songs[index], **extra(row)})
    return items


@router.post("/historial")
def registrar_escucha(event: HistoryEvent, db: Session = Depends(database.get_db)):
    if db.get(models.UserProfile, event.user_uid) is None:
        raise HTTPException(status_code=400, detail="Usuario no válido")
    song_id = representative_id(db, event.song_id)
    if db.get(models.Cancion, song_id) is None:
        raise HTTPException(status_code=404, detail="Canción no encontrada")

    now = datetime.now(timezone.utc)
    entry = (
        db.query(models.SongHistory)
        .filter(models.SongHistory.user_uid == event.user_uid, models.SongHistory.song_id == song_id)
        .first()
    )
    if entry is None:
        entry = models.SongHistory(user_uid=event.user_uid, song_id=song_id, preview_plays=0, detail_views=0)
        db.add(entry)
    elif entry.last_played_at and now - entry.last_played_at < REPEAT_WINDOW:
        entry.last_played_at = now
        db.commit()
        return {"counted": False}

    if event.source == "preview":
        entry.preview_plays = (entry.preview_plays or 0) + 1
    else:
        entry.detail_views = (entry.detail_views or 0) + 1
    entry.last_played_at = now
    try:
        db.commit()
    except IntegrityError:
        db.rollback()  # a concurrent first listen of the same song already created the row
    return {"counted": True}


@router.get("/historial/{uid}")
def historial(uid: str, limit: int = Query(50, ge=1, le=200), db: Session = Depends(database.get_db)):
    query = db.query(models.SongHistory).filter(models.SongHistory.user_uid == uid)
    total = query.count()
    rows = query.order_by(models.SongHistory.last_played_at.desc()).limit(limit).all()
    items = _playlist_items(db, rows, lambda r: {
        "plays": (r.preview_plays or 0) + (r.detail_views or 0),
        "last_played_at": r.last_played_at,
    })
    return {"total": total, "items": items}


@router.delete("/historial/{uid}")
def borrar_historial(uid: str, requester: str, db: Session = Depends(database.get_db)):
    if requester != uid:
        raise HTTPException(status_code=403, detail="Solo podés borrar tu propio historial.")
    db.query(models.SongHistory).filter(models.SongHistory.user_uid == uid).delete()
    db.commit()
    return {"mensaje": "Historial borrado"}


@router.get("/me-gusta/{uid}")
def me_gusta(uid: str, limit: int = Query(50, ge=1, le=200), db: Session = Depends(database.get_db)):
    query = db.query(models.SongLike).filter(models.SongLike.user_uid == uid, models.SongLike.type == "like")
    total = query.count()
    rows = query.order_by(models.SongLike.created_at.desc()).limit(limit).all()
    items = _playlist_items(db, rows, lambda r: {"liked_at": r.created_at, "reaction": r.reaction})
    return {"total": total, "items": items}


@router.get("/recomendaciones/{uid}")
def recomendaciones(uid: str, limit: int = Query(20, ge=1, le=50), db: Session = Depends(database.get_db)):
    return recommend_songs(db, uid, limit)


@router.get("/artistas-recomendados/{uid}")
def artistas_recomendados(uid: str, limit: int = Query(8, ge=1, le=24), db: Session = Depends(database.get_db)):
    return recommend_artists(db, uid, limit)
