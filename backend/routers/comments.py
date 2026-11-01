from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import database, models, schemas

router = APIRouter(prefix="/comentarios", tags=["Comentarios"])


def _with_author(comment, author):
    """The name and photo stored with a comment are a snapshot from when it was posted, so a
    later profile change (or a photo moved to new storage) wouldn't show. Prefer the author's
    current profile and fall back to the snapshot only if the profile is gone."""
    return {
        "id": comment.id,
        "song_id": comment.song_id,
        "user_uid": comment.user_uid,
        "user_name": (author.display_name if author else None) or comment.user_name,
        "user_photo": author.photo_url if author else comment.user_photo,
        "content": comment.content,
        "created_at": comment.created_at,
    }


@router.get("/{song_id}", response_model=list[schemas.CommentResponse])
def obtener_comentarios(song_id: int, db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.Comment, models.UserProfile)
        .outerjoin(models.UserProfile, models.UserProfile.uid == models.Comment.user_uid)
        .filter(models.Comment.song_id == song_id)
        .order_by(models.Comment.created_at.desc())
        .all()
    )
    return [_with_author(comment, author) for comment, author in rows]

@router.post("", response_model=schemas.CommentResponse)
def crear_comentario(data: schemas.CommentCreate, db: Session = Depends(database.get_db)):
    comment = models.Comment(**data.dict())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _with_author(comment, db.get(models.UserProfile, comment.user_uid))

@router.delete("/{comment_id}")
def eliminar_comentario(comment_id: int, db: Session = Depends(database.get_db)):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        return {"error": "No encontrado"}
    db.delete(comment)
    db.commit()
    return {"mensaje": "Comentario eliminado"}