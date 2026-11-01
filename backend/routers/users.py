import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

import database, models, schemas, storage

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


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

PHOTO_MAX_BYTES = 5 * 1024 * 1024
_PHOTO_FORMATS = (
    ("jpg", "image/jpeg", lambda h: h[:3] == b"\xff\xd8\xff"),
    ("png", "image/png", lambda h: h[:8] == b"\x89PNG\r\n\x1a\n"),
    ("gif", "image/gif", lambda h: h[:6] in (b"GIF87a", b"GIF89a")),
    ("webp", "image/webp", lambda h: h[:4] == b"RIFF" and h[8:12] == b"WEBP"),
)


@router.post("/{uid}/foto", response_model=schemas.UserProfileResponse)
def actualizar_foto(
    uid: str,
    file: Optional[UploadFile] = File(None),
    file_blob: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
):
    """The photo comes with the form, or (hosted) as the Blob URL the browser uploaded it to."""
    user = db.query(models.UserProfile).filter(models.UserProfile.uid == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if file_blob and db.query(models.UserProfile.uid).filter(models.UserProfile.photo_url == file_blob).first():
        raise HTTPException(status_code=400, detail="El archivo subido no es válido.")
    incoming = storage.receive(file, file_blob, "avatars", PHOTO_MAX_BYTES)
    if incoming is None:
        raise HTTPException(status_code=422, detail="Elegí una imagen.")
    fmt = next((f for f in _PHOTO_FORMATS if f[2](incoming.head)), None)
    if fmt is None or incoming.size > PHOTO_MAX_BYTES:
        storage.discard(incoming)
        if fmt is None:
            raise HTTPException(status_code=415, detail="Formato no admitido. Usá JPG, PNG, GIF o WEBP.")
        raise HTTPException(status_code=413, detail="La imagen supera el máximo de 5 MB.")
    old = user.photo_url
    user.photo_url = storage.keep(incoming, "avatars", f"{uid}-{uuid.uuid4().hex[:8]}.{fmt[0]}", fmt[1])
    db.commit()
    db.refresh(user)
    if old and old != user.photo_url:
        storage.delete(old)
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