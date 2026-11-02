from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

import database, models, schemas

router = APIRouter(prefix="/amigos", tags=["Amigos"])

def _between(db, uid_a, uid_b):
    return db.query(models.Friendship).filter(
        or_(
            (models.Friendship.requester_uid == uid_a) & (models.Friendship.addressee_uid == uid_b),
            (models.Friendship.requester_uid == uid_b) & (models.Friendship.addressee_uid == uid_a)
        )
    ).first()


def _estado(friendship, uid):
    """How `uid` relates to the other person: none | sent | received | friends."""
    if friendship is None:
        return {"status": "none", "friendship_id": None}
    if friendship.status == "accepted":
        status = "friends"
    else:
        status = "sent" if friendship.requester_uid == uid else "received"
    return {"status": status, "friendship_id": friendship.id}


@router.post("/solicitar")
def solicitar_amistad(requester_uid: str, addressee_uid: str, db: Session = Depends(database.get_db)):
    if requester_uid == addressee_uid:
        raise HTTPException(status_code=400, detail="No podés agregarte a vos mismo")
    existing = _between(db, requester_uid, addressee_uid)
    if existing:
        return {"mensaje": "Ya existe una solicitud o amistad", **_estado(existing, requester_uid)}
    friendship = models.Friendship(requester_uid=requester_uid, addressee_uid=addressee_uid)
    db.add(friendship)
    db.commit()
    return {"mensaje": "Solicitud enviada", **_estado(friendship, requester_uid)}


@router.get("/estado/{uid}/{other_uid}")
def estado_amistad(uid: str, other_uid: str, db: Session = Depends(database.get_db)):
    return _estado(_between(db, uid, other_uid), uid)

@router.put("/aceptar/{friendship_id}")
def aceptar_amistad(friendship_id: int, db: Session = Depends(database.get_db)):
    friendship = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    friendship.status = "accepted"
    db.commit()
    return {"mensaje": "Amistad aceptada"}

@router.delete("/{friendship_id}")
def eliminar_amistad(friendship_id: int, db: Session = Depends(database.get_db)):
    friendship = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(friendship)
    db.commit()
    return {"mensaje": "Eliminado"}

@router.get("/{uid}", response_model=list[schemas.UserProfileResponse])
def obtener_amigos(uid: str, db: Session = Depends(database.get_db)):
    friendships = db.query(models.Friendship).filter(
        or_(models.Friendship.requester_uid == uid, models.Friendship.addressee_uid == uid),
        models.Friendship.status == "accepted"
    ).all()
    friend_uids = [
        f.addressee_uid if f.requester_uid == uid else f.requester_uid
        for f in friendships
    ]
    friends = db.query(models.UserProfile).filter(models.UserProfile.uid.in_(friend_uids)).all()
    return friends

@router.get("/solicitudes/{uid}", response_model=list[schemas.FriendRequestResponse])
def obtener_solicitudes(uid: str, db: Session = Depends(database.get_db)):
    solicitudes = db.query(models.Friendship).filter(
        models.Friendship.addressee_uid == uid,
        models.Friendship.status == "pending"
    ).all()
    result = []
    for s in solicitudes:
        requester = db.query(models.UserProfile).filter(models.UserProfile.uid == s.requester_uid).first()
        result.append({
            "id": s.id,
            "requester_uid": s.requester_uid,
            "requester_name": requester.display_name if requester else "Usuario",
            "requester_photo": requester.photo_url if requester else None,
            "created_at": s.created_at,
        })
    return result