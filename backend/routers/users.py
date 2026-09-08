import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

import database, models, schemas

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=schemas.UserProfileResponse)
def crear_o_actualizar_usuario(data: schemas.UserProfileCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.UserProfile).filter(models.UserProfile.uid == data.uid).first()
    if existing:
        existing.display_name = data.display_name
        if not existing.photo_url and data.photo_url:
            existing.photo_url = data.photo_url
        db.commit()
        db.refresh(existing)
        return existing
    nuevo = models.UserProfile(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.post("/{uid}/foto", response_model=schemas.UserProfileResponse)
def actualizar_foto(uid: str, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    user = db.query(models.UserProfile).filter(models.UserProfile.uid == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uid}{ext}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(file.file.read())
    user.photo_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(user)
    return user

@router.get("/{uid}", response_model=schemas.UserProfileResponse)
def obtener_usuario(uid: str, viewer_uid: Optional[str] = None, db: Session = Depends(database.get_db)):
    user = db.query(models.UserProfile).filter(models.UserProfile.uid == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if viewer_uid != uid:
        if not user.public_email:
            user.email = None
        if not user.public_bio:
            user.bio = None
        if not user.public_genres:
            user.top_genres = None
    return user

@router.put("/{uid}", response_model=schemas.UserProfileResponse)
def actualizar_usuario(uid: str, data: schemas.UserProfileUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.UserProfile).filter(models.UserProfile.uid == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    for campo, valor in data.dict(exclude_none=True).items():
        setattr(user, campo, valor)
    db.commit()
    db.refresh(user)
    return user

@router.get("")
def buscar_usuarios(q: str, db: Session = Depends(database.get_db)):
    results = (
        db.query(models.UserProfile)
        .filter(models.UserProfile.display_name.ilike(f"%{q}%"))
        .limit(10)
        .all()
    )
    return results