import json

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

import database
import models

router = APIRouter(prefix="/configuracion", tags=["Configuración"])

# Colour profiles + accessibility + preferences are a few KB at most; anything bigger is a bug or abuse.
MAX_BYTES = 32 * 1024


@router.get("/{uid}")
def obtener_configuracion(uid: str, db: Session = Depends(database.get_db)):
    row = db.get(models.UserSettings, uid)
    return {"data": row.data if row else None, "updated_at": row.updated_at if row else None}


@router.put("/{uid}")
def guardar_configuracion(uid: str, data: dict = Body(...), db: Session = Depends(database.get_db)):
    if db.get(models.UserProfile, uid) is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if len(json.dumps(data)) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="La configuración es demasiado grande.")
    row = db.get(models.UserSettings, uid)
    if row is None:
        row = models.UserSettings(uid=uid, data=data)
        db.add(row)
    else:
        row.data = data
    db.commit()
    db.refresh(row)
    return {"data": row.data, "updated_at": row.updated_at}
