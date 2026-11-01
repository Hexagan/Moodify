from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import database
import models
from recommender import representative_id
from routers.musica import _playlist_items

router = APIRouter(prefix="/playlists", tags=["Playlists"])

Visibility = Literal["public", "friends", "private"]
MAX_PLAYLISTS = 50
MAX_SONGS = 500
COVER_SONGS = 4


class PlaylistIn(BaseModel):
    owner_uid: str
    name: str = Field(min_length=1, max_length=80)
    description: Optional[str] = Field(None, max_length=500)
    visibility: Visibility = "private"


class PlaylistSongIn(BaseModel):
    uid: str
    song_id: int


def _are_friends(db, a, b):
    if not a or not b:
        return False
    return db.query(models.Friendship.id).filter(
        models.Friendship.status == "accepted",
        or_(
            and_(models.Friendship.requester_uid == a, models.Friendship.addressee_uid == b),
            and_(models.Friendship.requester_uid == b, models.Friendship.addressee_uid == a),
        ),
    ).first() is not None


def _visible_levels(db, owner_uid, viewer_uid):
    if viewer_uid and viewer_uid == owner_uid:
        return ("public", "friends", "private")
    if _are_friends(db, owner_uid, viewer_uid):
        return ("public", "friends")
    return ("public",)


def _get_owned(db, playlist_id, uid):
    playlist = db.get(models.Playlist, playlist_id)
    if playlist is None:
        raise HTTPException(status_code=404, detail="Playlist no encontrada")
    if playlist.owner_uid != uid:
        raise HTTPException(status_code=403, detail="Solo quien creó la playlist puede modificarla.")
    return playlist


def _owner_dict(profile):
    return {
        "uid": profile.uid if profile else None,
        "name": profile.display_name if profile else "Usuario eliminado",
        "photo_url": profile.photo_url if profile else None,
    }


def _summaries(db, playlists, song_id=None):
    """Card data for many playlists in three queries: counts, cover songs and owners."""
    ids = [p.id for p in playlists]
    if not ids:
        return []
    counts = dict(
        db.query(models.PlaylistSong.playlist_id, func.count(models.PlaylistSong.id))
        .filter(models.PlaylistSong.playlist_id.in_(ids))
        .group_by(models.PlaylistSong.playlist_id)
    )
    ranked = (
        db.query(
            models.PlaylistSong.playlist_id,
            models.Cancion.track_id,
            models.Cancion.track_genre,
            func.row_number().over(
                partition_by=models.PlaylistSong.playlist_id,
                order_by=models.PlaylistSong.added_at.desc(),
            ).label("n"),
        )
        .join(models.Cancion, models.Cancion.id == models.PlaylistSong.song_id)
        .filter(models.PlaylistSong.playlist_id.in_(ids))
        .subquery()
    )
    covers = {}
    for pid, track_id, genre, _ in db.query(ranked).filter(ranked.c.n <= COVER_SONGS):
        covers.setdefault(pid, []).append({"track_id": track_id, "genre": genre})
    contains = set()
    if song_id is not None:
        rep = representative_id(db, song_id)
        contains = {pid for (pid,) in db.query(models.PlaylistSong.playlist_id).filter(
            models.PlaylistSong.playlist_id.in_(ids), models.PlaylistSong.song_id == rep)}
    owners = {u.uid: u for u in db.query(models.UserProfile).filter(
        models.UserProfile.uid.in_({p.owner_uid for p in playlists}))}
    return [{
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "visibility": p.visibility,
        "song_count": counts.get(p.id, 0),
        "covers": covers.get(p.id, []),
        "owner": _owner_dict(owners.get(p.owner_uid)),
        "updated_at": p.updated_at,
        **({"contains_song": p.id in contains} if song_id is not None else {}),
    } for p in playlists]


@router.get("/usuario/{uid}")
def playlists_de_usuario(
    uid: str,
    viewer_uid: Optional[str] = None,
    song_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
):
    """The playlists `viewer_uid` may see: all for the owner, public + friends for friends,
    public only for everyone else (guests included). `song_id` marks which already hold it."""
    levels = _visible_levels(db, uid, viewer_uid)
    playlists = (
        db.query(models.Playlist)
        .filter(models.Playlist.owner_uid == uid, models.Playlist.visibility.in_(levels))
        .order_by(models.Playlist.updated_at.desc(), models.Playlist.id.desc())
        .all()
    )
    return _summaries(db, playlists, song_id if viewer_uid == uid else None)


@router.post("")
def crear_playlist(data: PlaylistIn, db: Session = Depends(database.get_db)):
    if db.get(models.UserProfile, data.owner_uid) is None:
        raise HTTPException(status_code=400, detail="Usuario no válido")
    owned = db.query(models.Playlist).filter(models.Playlist.owner_uid == data.owner_uid).count()
    if owned >= MAX_PLAYLISTS:
        raise HTTPException(status_code=400, detail=f"Podés tener hasta {MAX_PLAYLISTS} playlists.")
    playlist = models.Playlist(
        owner_uid=data.owner_uid,
        name=data.name.strip(),
        description=(data.description or "").strip() or None,
        visibility=data.visibility,
    )
    db.add(playlist)
    db.commit()
    db.refresh(playlist)
    return _summaries(db, [playlist])[0]


@router.get("/{playlist_id}")
def obtener_playlist(playlist_id: int, viewer_uid: Optional[str] = None, db: Session = Depends(database.get_db)):
    playlist = db.get(models.Playlist, playlist_id)
    # Hidden and missing look the same, so a private playlist's existence isn't revealed.
    if playlist is None or playlist.visibility not in _visible_levels(db, playlist.owner_uid, viewer_uid):
        raise HTTPException(status_code=404, detail="Playlist no encontrada o no es visible para vos.")
    rows = (
        db.query(models.PlaylistSong)
        .filter(models.PlaylistSong.playlist_id == playlist_id)
        .order_by(models.PlaylistSong.added_at.asc(), models.PlaylistSong.id.asc())
        .all()
    )
    summary = _summaries(db, [playlist])[0]
    summary["created_at"] = playlist.created_at
    summary["is_owner"] = viewer_uid == playlist.owner_uid
    summary["songs"] = _playlist_items(db, rows, lambda r: {"added_at": r.added_at})
    return summary


@router.put("/{playlist_id}")
def editar_playlist(playlist_id: int, data: PlaylistIn, db: Session = Depends(database.get_db)):
    playlist = _get_owned(db, playlist_id, data.owner_uid)
    playlist.name = data.name.strip()
    playlist.description = (data.description or "").strip() or None
    playlist.visibility = data.visibility
    db.commit()
    db.refresh(playlist)
    return _summaries(db, [playlist])[0]


@router.delete("/{playlist_id}")
def eliminar_playlist(playlist_id: int, uid: str, db: Session = Depends(database.get_db)):
    playlist = _get_owned(db, playlist_id, uid)
    db.query(models.PlaylistSong).filter(models.PlaylistSong.playlist_id == playlist_id).delete()
    db.delete(playlist)
    db.commit()
    return {"mensaje": "Playlist eliminada"}


@router.post("/{playlist_id}/canciones")
def agregar_cancion(playlist_id: int, data: PlaylistSongIn, db: Session = Depends(database.get_db)):
    playlist = _get_owned(db, playlist_id, data.uid)
    # Stored as the song's representative row, so the same song from another genre page is
    # recognised as already being in the playlist.
    song_id = representative_id(db, data.song_id)
    if db.get(models.Cancion, song_id) is None:
        raise HTTPException(status_code=404, detail="Canción no encontrada")
    count = db.query(models.PlaylistSong).filter(models.PlaylistSong.playlist_id == playlist_id).count()
    if count >= MAX_SONGS:
        raise HTTPException(status_code=400, detail=f"Una playlist puede tener hasta {MAX_SONGS} canciones.")
    db.add(models.PlaylistSong(playlist_id=playlist_id, song_id=song_id))
    playlist.updated_at = func.now()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()  # already there - adding twice is a no-op
    return {"added": True}


@router.delete("/{playlist_id}/canciones/{song_id}")
def quitar_cancion(playlist_id: int, song_id: int, uid: str = Query(...), db: Session = Depends(database.get_db)):
    playlist = _get_owned(db, playlist_id, uid)
    rep = representative_id(db, song_id)
    db.query(models.PlaylistSong).filter(
        models.PlaylistSong.playlist_id == playlist_id,
        models.PlaylistSong.song_id.in_({song_id, rep}),
    ).delete(synchronize_session=False)
    playlist.updated_at = func.now()
    db.commit()
    return {"removed": True}
