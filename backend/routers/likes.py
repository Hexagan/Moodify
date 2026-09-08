from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import database, models, schemas

router = APIRouter(prefix="/likes", tags=["Likes"])

@router.post("", response_model=schemas.LikeResponse)
def crear_like(data: schemas.LikeCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.SongLike).filter(
        models.SongLike.user_uid == data.user_uid,
        models.SongLike.song_id == data.song_id
    ).first()
    if existing:
        existing.type = data.type
        existing.reaction = data.reaction
        db.commit()
        db.refresh(existing)
        return existing
    like = models.SongLike(**data.dict())
    db.add(like)
    db.commit()
    db.refresh(like)
    return like

@router.get("/check")
def verificar_like(user_uid: str, song_id: int, db: Session = Depends(database.get_db)):
    like = db.query(models.SongLike).filter(
        models.SongLike.user_uid == user_uid,
        models.SongLike.song_id == song_id
    ).first()
    return {
        "liked": like is not None,
        "like_id": like.id if like else None,
        "type": like.type if like else None,
        "reaction": like.reaction if like else None,
        "note": like.note if like else None
    }

@router.get("/usuario/{uid}", response_model=list[schemas.LikeWithSongResponse])
def obtener_likes(uid: str, db: Session = Depends(database.get_db)):
    likes = (
        db.query(models.SongLike)
        .filter(models.SongLike.user_uid == uid, models.SongLike.type == "like")
        .order_by(models.SongLike.created_at.desc())
        .all()
    )
    result = []
    for like in likes:
        song = db.query(models.Cancion).filter(models.Cancion.id == like.song_id).first()
        result.append({
            "id": like.id,
            "song_id": like.song_id,
            "type": like.type,
            "reaction": like.reaction,
            "note": like.note,
            "created_at": like.created_at,
            "track_name": song.track_name if song else None,
            "artists": song.artists if song else None,
            "track_genre": song.track_genre if song else None,
        })
    return result

@router.put("/{like_id}", response_model=schemas.LikeResponse)
def actualizar_nota(like_id: int, data: schemas.LikeUpdate, db: Session = Depends(database.get_db)):
    like = db.query(models.SongLike).filter(models.SongLike.id == like_id).first()
    if not like:
        raise HTTPException(status_code=404, detail="No encontrado")
    like.note = data.note
    db.commit()
    db.refresh(like)
    return like

@router.delete("/{like_id}")
def eliminar_like(like_id: int, db: Session = Depends(database.get_db)):
    like = db.query(models.SongLike).filter(models.SongLike.id == like_id).first()
    if not like:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(like)
    db.commit()
    return {"mensaje": "Eliminado"}
