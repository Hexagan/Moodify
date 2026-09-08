from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import database, models, schemas

router = APIRouter(prefix="/comentarios", tags=["Comentarios"])

@router.get("/{song_id}", response_model=list[schemas.CommentResponse])
def obtener_comentarios(song_id: int, db: Session = Depends(database.get_db)):
    return (
        db.query(models.Comment)
        .filter(models.Comment.song_id == song_id)
        .order_by(models.Comment.created_at.desc())
        .all()
    )

@router.post("", response_model=schemas.CommentResponse)
def crear_comentario(data: schemas.CommentCreate, db: Session = Depends(database.get_db)):
    comment = models.Comment(**data.dict())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

@router.delete("/{comment_id}")
def eliminar_comentario(comment_id: int, db: Session = Depends(database.get_db)):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        return {"error": "No encontrado"}
    db.delete(comment)
    db.commit()
    return {"mensaje": "Comentario eliminado"}