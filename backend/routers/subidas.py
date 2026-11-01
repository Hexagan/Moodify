import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import database
import models
import storage

router = APIRouter(prefix="/subidas", tags=["Subidas"])

MB = 1024 * 1024

# What each kind of upload may contain; the routers that receive the URL check the exact
# format and per-type size again from the file's first bytes.
FOLDERS = {
    "avatars": {"types": ["image/jpeg", "image/png", "image/webp", "image/gif"], "max": 5 * MB, "admin": False},
    "songs": {"types": ["image/jpeg", "image/png", "image/webp", "audio/*"], "max": 15 * MB, "admin": True},
    "forum": {"types": ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"], "max": 25 * MB, "admin": False},
}


@router.get("/config")
def config():
    """Tells the frontend whether to upload to Blob first (hosted) or send files to us (local)."""
    return {"direct": storage.uses_blob()}


@router.post("/token")
def generar_token(body: dict, db: Session = Depends(database.get_db)):
    """The handshake @vercel/blob's client `upload()` makes before sending the file."""
    if not storage.uses_blob():
        raise HTTPException(status_code=404, detail="Las subidas directas no están habilitadas.")
    if body.get("type") != "blob.generate-client-token":
        raise HTTPException(status_code=400, detail="Solicitud no válida.")
    payload = body.get("payload") or {}
    try:
        client = json.loads(payload.get("clientPayload") or "{}")
    except (TypeError, ValueError):
        client = {}
    folder = client.get("folder")
    rules = FOLDERS.get(folder)
    if rules is None:
        raise HTTPException(status_code=400, detail="Tipo de subida no válido.")

    user = db.query(models.UserProfile).filter(models.UserProfile.uid == client.get("uid")).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Iniciá sesión para subir archivos.")
    if rules["admin"] and user.role != "dev":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden subir este archivo.")

    token = storage.client_token(folder, str(payload.get("pathname") or ""), rules["types"], rules["max"])
    return {"type": "blob.generate-client-token", "clientToken": token}
