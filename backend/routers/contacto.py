import os
from datetime import datetime, timedelta, timezone

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import database
import models

router = APIRouter(prefix="/contacto", tags=["Contacto"])

# Suggestions are emailed through Resend (send-only API key). Both values live only in the
# environment, so the address never reaches the frontend. Without a verified domain, Resend only
# delivers from its onboarding sender to the address the Resend account was created with.
RESEND_URL = "https://api.resend.com/emails"
RESEND_FROM = os.environ.get("RESEND_FROM", "Moodify <onboarding@resend.dev>")
HOURLY_LIMIT = 5


class SuggestionIn(BaseModel):
    uid: str
    title: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=4000)


def _send(user, title, message):
    api_key = os.environ.get("RESEND_API_KEY")
    to = os.environ.get("CONTACT_TO")
    if not (api_key and to):
        raise RuntimeError("Resend sin configurar")

    body = {
        "from": RESEND_FROM,
        "to": [to],
        "subject": f"[Moodify] {title}",
        "text": f"{message}\n\n--\nDe: {user.display_name or 'Sin nombre'} <{user.email or 'sin correo'}>\nUID: {user.uid}\n",
    }
    if user.email:
        body["reply_to"] = user.email
    res = requests.post(RESEND_URL, json=body, headers={"Authorization": f"Bearer {api_key}"}, timeout=15)
    res.raise_for_status()


@router.post("")
def enviar_sugerencia(body: SuggestionIn, db: Session = Depends(database.get_db)):
    user = db.query(models.UserProfile).filter(models.UserProfile.uid == body.uid).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Iniciá sesión para enviar sugerencias.")

    title, message = body.title.strip(), body.message.strip()
    if not title or not message:
        raise HTTPException(status_code=422, detail="Completá el título y el mensaje.")

    since = datetime.now(timezone.utc) - timedelta(hours=1)
    recent = db.query(models.Suggestion).filter(
        models.Suggestion.uid == user.uid, models.Suggestion.created_at >= since
    ).count()
    if recent >= HOURLY_LIMIT:
        raise HTTPException(status_code=429, detail="Enviaste varias sugerencias seguidas. Probá de nuevo en un rato.")

    suggestion = models.Suggestion(uid=user.uid, title=title, message=message)
    db.add(suggestion)
    db.commit()

    try:
        _send(user, title, message)
    except Exception as err:  # saved anyway; the user doesn't need the mail details
        print(f"No se pudo enviar la sugerencia {suggestion.id} por correo: {type(err).__name__}")
        return {"ok": True, "emailed": False}

    suggestion.emailed = True
    db.commit()
    return {"ok": True, "emailed": True}
