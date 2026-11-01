import re
import uuid
import unicodedata
from typing import Optional

import requests
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import any_, func, or_
from sqlalchemy.orm import Session

import database
import models
import storage
from routers.media import _normalize, _now, _is_fresh, require_admin, NOT_FOUND_RETRY, TIMEOUT
from song_queries import deduped_query, rows_to_songs

router = APIRouter(prefix="/artistas", tags=["Artistas"])

HEADERS = {"User-Agent": "Moodify/1.0 (proyecto academico; https://moodify-one-rho.vercel.app)"}

IMAGE_MAX_BYTES = 5 * 1024 * 1024
VIDEO_MAX_BYTES = 25 * 1024 * 1024
# HEIF/AVIF stills share the MP4 container signature but aren't videos browsers can play.
_STILL_BRANDS = {b"heic", b"heix", b"hevc", b"mif1", b"msf1", b"avif"}

# A Wikipedia match must have the artist's name as its title AND read like a music article:
# loose full-text search happily returns unrelated pages (protests, record companies...).
_MUSIC_WORDS = (
    "music", "músic", "cantante", "singer", "banda", "band", "grupo", "group", "rapero", "rapper",
    "compositor", "composer", "productor", "producer", "dj", "disc jockey", "dúo", "duo", "orquesta",
    "orchestra", "pianist", "guitarr", "guitarist", "drummer", "baterista", "cantautor", "songwriter",
    "vocalist", "trío", "trio", "cuarteto", "quartet", "ensemble", "coro", "choir", "idol",
)


# ---------- helpers ----------

def _strip_accents(text):
    text = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in text if not unicodedata.combining(c))


def _base_title(title):
    return re.sub(r"\s*\([^)]*\)\s*$", "", title or "")


def _get_artist(db, artist_id):
    artist = db.get(models.Artist, artist_id)
    if artist is None:
        raise HTTPException(status_code=404, detail="Artista no encontrado")
    return artist


def _get_user(db, uid):
    user = db.get(models.UserProfile, uid) if uid else None
    if user is None:
        raise HTTPException(status_code=400, detail="Usuario no válido")
    return user


def _can_moderate(db, uid, author_uid):
    if uid == author_uid:
        return True
    user = db.get(models.UserProfile, uid) if uid else None
    return user is not None and user.role == "dev"


def _resolve_picture(db, artist):
    if artist.picture_url or _is_fresh(artist.picture_checked_at, NOT_FOUND_RETRY):
        return artist.picture_url
    try:
        res = requests.get(
            "https://api.deezer.com/search/artist",
            params={"q": artist.name, "limit": 5},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        res.raise_for_status()
        candidates = res.json().get("data", [])
    except (requests.RequestException, ValueError):
        return None
    want = _normalize(artist.name)
    for item in candidates:
        picture = item.get("picture_big") or ""
        # Deezer's "no photo" placeholder has an empty hash: .../images/artist//500x500-...
        if _normalize(item.get("name")) == want and picture and "/artist//" not in picture:
            artist.picture_url = picture
            break
    artist.picture_checked_at = _now()
    db.commit()
    return artist.picture_url


def _wikipedia_summary(lang, name):
    search = requests.get(
        f"https://{lang}.wikipedia.org/w/api.php",
        params={
            "action": "query", "list": "search", "format": "json", "srlimit": 5,
            "srsearch": f"{name} {'música' if lang == 'es' else 'music'}",
        },
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    search.raise_for_status()
    want = _normalize(name)
    for hit in search.json().get("query", {}).get("search", []):
        title = hit.get("title", "")
        if _normalize(_base_title(title)) != want:
            continue
        summary = requests.get(
            f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/" + requests.utils.quote(title.replace(" ", "_")),
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        if not summary.ok:
            continue
        data = summary.json()
        text = f"{data.get('description') or ''} {data.get('extract') or ''}".lower()
        if data.get("type") == "standard" and any(word in text for word in _MUSIC_WORDS):
            return data.get("extract"), data.get("content_urls", {}).get("desktop", {}).get("page")
    return None, None


def _resolve_bio(db, artist):
    if artist.bio_manual or artist.bio or _is_fresh(artist.bio_checked_at, NOT_FOUND_RETRY):
        return
    try:
        for lang in ("es", "en"):
            bio, url = _wikipedia_summary(lang, artist.name)
            if bio:
                artist.bio, artist.bio_url = bio, url
                break
    except (requests.RequestException, ValueError):
        return
    artist.bio_checked_at = _now()
    db.commit()


def _save_upload(db, upload, blob_url):
    """A file sent with the form, or (hosted) the Blob URL the browser uploaded it to."""
    if blob_url and _media_in_use(db, blob_url):
        raise HTTPException(status_code=400, detail="El archivo subido no es válido.")
    incoming = storage.receive(upload, blob_url, "forum", VIDEO_MAX_BYTES)
    if incoming is None:
        return None, None
    try:
        return _accept_upload(incoming)
    except HTTPException:
        storage.discard(incoming)
        raise


def _media_in_use(db, url):
    return (
        db.query(models.ArtistThread.id).filter(models.ArtistThread.media_url == url).first() is not None
        or db.query(models.ArtistPost.id).filter(models.ArtistPost.media_url == url).first() is not None
    )


def _accept_upload(incoming):
    head = incoming.head
    if head[:3] == b"\xff\xd8\xff":
        kind, ext = "image", "jpg"
    elif head[:8] == b"\x89PNG\r\n\x1a\n":
        kind, ext = "image", "png"
    elif head[:6] in (b"GIF87a", b"GIF89a"):
        kind, ext = "image", "gif"
    elif head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        kind, ext = "image", "webp"
    elif head[4:8] == b"ftyp" and head[8:12] not in _STILL_BRANDS:
        kind, ext = "video", "mp4"
    elif head[:4] == b"\x1a\x45\xdf\xa3":
        kind, ext = "video", "webm"
    else:
        raise HTTPException(status_code=415, detail="Formato no admitido. Usá JPG, PNG, GIF, WEBP, MP4 o WEBM.")
    limit = IMAGE_MAX_BYTES if kind == "image" else VIDEO_MAX_BYTES
    if incoming.size > limit:
        raise HTTPException(status_code=413, detail=f"El archivo supera el máximo de {limit // (1024 * 1024)} MB.")
    content_type = f"{kind}/{'jpeg' if ext == 'jpg' else ext}"
    return storage.keep(incoming, "forum", f"{uuid.uuid4().hex}.{ext}", content_type), kind


def _delete_upload(media_url):
    storage.delete(media_url)


def _author(profile):
    return {
        "uid": profile.uid if profile else None,
        "name": profile.display_name if profile else "Usuario eliminado",
        "photo_url": profile.photo_url if profile else None,
        "is_admin": bool(profile and profile.role == "dev"),
    }


def _thread_stats(db):
    return (
        db.query(
            models.ArtistThread.artist_id,
            func.count(models.ArtistThread.id).label("threads"),
            func.max(models.ArtistThread.last_activity_at).label("last_activity"),
        )
        .group_by(models.ArtistThread.artist_id)
        .subquery()
    )


def _card(artist, threads, last_activity):
    return {
        "id": artist.id,
        "name": artist.name,
        "song_count": artist.song_count,
        "thread_count": threads or 0,
        "last_activity_at": last_activity,
        "picture_url": artist.picture_url,
        "picture_checked": artist.picture_checked_at is not None,
    }


def _thread_dict(thread, author, excerpt=False):
    body = thread.body or ""
    return {
        "id": thread.id,
        "artist_id": thread.artist_id,
        "title": thread.title,
        "body": (body[:220] + "…" if len(body) > 220 else body) if excerpt else body,
        "media_url": thread.media_url,
        "media_type": thread.media_type,
        "reply_count": thread.reply_count,
        "created_at": thread.created_at,
        "edited_at": thread.edited_at,
        "last_activity_at": thread.last_activity_at,
        "author": _author(author),
    }


def _post_dict(post, author):
    return {
        "id": post.id,
        "thread_id": post.thread_id,
        "body": post.body,
        "media_url": post.media_url,
        "media_type": post.media_type,
        "created_at": post.created_at,
        "edited_at": post.edited_at,
        "author": _author(author),
    }


def _apply_media_edit(db, record, remove_media, media, media_blob):
    """Swap or drop a post's attachment. Returns the replaced file's URL so the caller can
    delete it from disk once the edit is committed."""
    new_url, new_type = _save_upload(db, media, media_blob)
    if new_url:
        old = record.media_url
        record.media_url, record.media_type = new_url, new_type
        return old
    if remove_media and record.media_url:
        old = record.media_url
        record.media_url = record.media_type = None
        return old
    return None


# ---------- artists ----------

@router.get("")
def listar_artistas(
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=60),
    db: Session = Depends(database.get_db),
):
    stats = _thread_stats(db)
    query = (
        db.query(models.Artist, stats.c.threads, stats.c.last_activity)
        .outerjoin(stats, stats.c.artist_id == models.Artist.id)
        .filter(or_(models.Artist.song_count > 0, stats.c.threads > 0))
    )
    if q and q.strip():
        needle = _strip_accents(q.strip().lower())
        query = query.filter(func.unaccent(func.lower(models.Artist.name)).contains(needle, autoescape=True))

    total = query.count()
    rows = (
        query.order_by(
            stats.c.last_activity.desc().nullslast(),
            models.Artist.top_popularity.desc(),
            models.Artist.name,
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {"total": total, "items": [_card(a, t, la) for a, t, la in rows]}


@router.get("/destacados")
def artistas_destacados(limit: int = Query(8, ge=1, le=12), db: Session = Depends(database.get_db)):
    """Most-discussed artists first; topped up with the most popular ones while the forum is quiet."""
    stats = _thread_stats(db)
    discussed = (
        db.query(models.Artist, stats.c.threads, stats.c.last_activity)
        .join(stats, stats.c.artist_id == models.Artist.id)
        .order_by(stats.c.last_activity.desc())
        .limit(limit)
        .all()
    )
    rows = list(discussed)
    if len(rows) < limit:
        taken = [a.id for a, _, _ in rows] or [-1]
        popular = (
            db.query(models.Artist)
            .filter(models.Artist.song_count > 0, models.Artist.id.notin_(taken))
            .order_by(models.Artist.top_popularity.desc(), models.Artist.song_count.desc())
            .limit(limit - len(rows))
            .all()
        )
        rows += [(a, 0, None) for a in popular]

    ids = [a.id for a, _, _ in rows]
    latest = {
        t.artist_id: {"id": t.id, "title": t.title}
        for t in (
            db.query(models.ArtistThread)
            .filter(models.ArtistThread.artist_id.in_(ids))
            .distinct(models.ArtistThread.artist_id)
            .order_by(models.ArtistThread.artist_id, models.ArtistThread.last_activity_at.desc())
            .all()
        )
    }
    return {"items": [{**_card(a, t, la), "latest_thread": latest.get(a.id)} for a, t, la in rows]}


@router.get("/hilos/{thread_id}")
def obtener_hilo(thread_id: int, db: Session = Depends(database.get_db)):
    thread = db.get(models.ArtistThread, thread_id)
    if thread is None:
        raise HTTPException(status_code=404, detail="Hilo no encontrado")
    artist = db.get(models.Artist, thread.artist_id)
    posts = (
        db.query(models.ArtistPost, models.UserProfile)
        .outerjoin(models.UserProfile, models.UserProfile.uid == models.ArtistPost.author_uid)
        .filter(models.ArtistPost.thread_id == thread_id)
        .order_by(models.ArtistPost.created_at)
        .all()
    )
    return {
        **_thread_dict(thread, db.get(models.UserProfile, thread.author_uid)),
        "artist": {"id": artist.id, "name": artist.name, "picture_url": artist.picture_url},
        "posts": [_post_dict(p, author) for p, author in posts],
    }


@router.post("/hilos/{thread_id}/respuestas")
def responder_hilo(
    thread_id: int,
    author_uid: str = Form(...),
    body: str = Form(""),
    media: Optional[UploadFile] = File(None),
    media_blob: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
):
    thread = db.get(models.ArtistThread, thread_id)
    if thread is None:
        raise HTTPException(status_code=404, detail="Hilo no encontrado")
    author = _get_user(db, author_uid)
    body = body.strip()
    if len(body) > 5000:
        raise HTTPException(status_code=422, detail="La respuesta supera los 5000 caracteres.")
    media_url, media_type = _save_upload(db, media, media_blob)
    if not body and not media_url:
        raise HTTPException(status_code=422, detail="Escribí algo o adjuntá una imagen o video.")

    post = models.ArtistPost(thread_id=thread_id, author_uid=author.uid, body=body or None,
                             media_url=media_url, media_type=media_type)
    db.add(post)
    thread.reply_count = (thread.reply_count or 0) + 1
    thread.last_activity_at = func.now()
    db.commit()
    db.refresh(post)
    return _post_dict(post, author)


@router.put("/hilos/{thread_id}")
def editar_hilo(
    thread_id: int,
    author_uid: str = Form(...),
    title: str = Form(...),
    body: str = Form(""),
    remove_media: bool = Form(False),
    media: Optional[UploadFile] = File(None),
    media_blob: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
):
    thread = db.get(models.ArtistThread, thread_id)
    if thread is None:
        raise HTTPException(status_code=404, detail="Hilo no encontrado")
    if thread.author_uid != author_uid:
        raise HTTPException(status_code=403, detail="Solo quien abrió el hilo puede editarlo.")
    title, body = title.strip(), body.strip()
    if not 3 <= len(title) <= 120:
        raise HTTPException(status_code=422, detail="El título debe tener entre 3 y 120 caracteres.")
    if len(body) > 5000:
        raise HTTPException(status_code=422, detail="El mensaje supera los 5000 caracteres.")

    replaced = _apply_media_edit(db, thread, remove_media, media, media_blob)
    thread.title, thread.body = title, body or None
    thread.edited_at = func.now()
    db.commit()
    db.refresh(thread)
    _delete_upload(replaced)
    return _thread_dict(thread, db.get(models.UserProfile, thread.author_uid))


@router.put("/respuestas/{post_id}")
def editar_respuesta(
    post_id: int,
    author_uid: str = Form(...),
    body: str = Form(""),
    remove_media: bool = Form(False),
    media: Optional[UploadFile] = File(None),
    media_blob: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
):
    post = db.get(models.ArtistPost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Respuesta no encontrada")
    if post.author_uid != author_uid:
        raise HTTPException(status_code=403, detail="Solo quien escribió la respuesta puede editarla.")
    body = body.strip()
    if len(body) > 5000:
        raise HTTPException(status_code=422, detail="La respuesta supera los 5000 caracteres.")
    keeps_media = bool(post.media_url) and not remove_media
    if not body and not keeps_media and not (media and media.filename) and not media_blob:
        raise HTTPException(status_code=422, detail="La respuesta no puede quedar vacía.")

    replaced = _apply_media_edit(db, post, remove_media, media, media_blob)
    post.body = body or None
    post.edited_at = func.now()
    db.commit()
    db.refresh(post)
    _delete_upload(replaced)
    return _post_dict(post, db.get(models.UserProfile, post.author_uid))


@router.delete("/hilos/{thread_id}")
def eliminar_hilo(thread_id: int, uid: str, db: Session = Depends(database.get_db)):
    thread = db.get(models.ArtistThread, thread_id)
    if thread is None:
        raise HTTPException(status_code=404, detail="Hilo no encontrado")
    if not _can_moderate(db, uid, thread.author_uid):
        raise HTTPException(status_code=403, detail="Solo el autor o un administrador puede eliminar este hilo.")
    posts = db.query(models.ArtistPost).filter(models.ArtistPost.thread_id == thread_id).all()
    media = [thread.media_url] + [p.media_url for p in posts]
    for p in posts:
        db.delete(p)
    db.delete(thread)
    db.commit()
    for url in media:
        _delete_upload(url)
    return {"mensaje": "Hilo eliminado"}


@router.delete("/respuestas/{post_id}")
def eliminar_respuesta(post_id: int, uid: str, db: Session = Depends(database.get_db)):
    post = db.get(models.ArtistPost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Respuesta no encontrada")
    if not _can_moderate(db, uid, post.author_uid):
        raise HTTPException(status_code=403, detail="Solo el autor o un administrador puede eliminar esta respuesta.")
    thread = db.get(models.ArtistThread, post.thread_id)
    thread.reply_count = max(0, (thread.reply_count or 1) - 1)
    media_url = post.media_url
    db.delete(post)
    db.commit()
    _delete_upload(media_url)
    return {"mensaje": "Respuesta eliminada"}


@router.get("/{artist_id}")
def obtener_artista(artist_id: int, db: Session = Depends(database.get_db)):
    artist = _get_artist(db, artist_id)
    _resolve_picture(db, artist)
    _resolve_bio(db, artist)
    threads = db.query(func.count(models.ArtistThread.id)).filter(models.ArtistThread.artist_id == artist_id).scalar()
    return {**_card(artist, threads, None), "bio": artist.bio, "bio_url": artist.bio_url}


class ArtistBioIn(BaseModel):
    admin_uid: str
    bio: str = Field("", max_length=3000)
    bio_url: str = Field("", max_length=500)


@router.put("/{artist_id}/bio")
def editar_bio(artist_id: int, body: ArtistBioIn, db: Session = Depends(database.get_db)):
    """Admins replace (or clear) the description; it stays as written from then on."""
    require_admin(db, body.admin_uid)
    artist = _get_artist(db, artist_id)
    bio_url = body.bio_url.strip()
    if bio_url and not re.match(r"^https?://\S+$", bio_url):
        raise HTTPException(status_code=422, detail="La fuente tiene que ser un enlace que empiece con http:// o https://.")
    bio = body.bio.strip()
    artist.bio = bio or None
    artist.bio_url = (bio_url or None) if bio else None
    artist.bio_manual = True
    artist.bio_checked_at = _now()
    db.commit()
    return {"bio": artist.bio, "bio_url": artist.bio_url}


@router.get("/{artist_id}/foto")
def foto_artista(artist_id: int, db: Session = Depends(database.get_db)):
    return {"picture_url": _resolve_picture(db, _get_artist(db, artist_id))}


@router.get("/{artist_id}/canciones")
def canciones_artista(artist_id: int, limit: int = Query(12, ge=1, le=50), db: Session = Depends(database.get_db)):
    artist = _get_artist(db, artist_id)
    consulta, Rep = deduped_query(db)
    rows = (
        consulta.filter(artist.name == any_(func.string_to_array(Rep.artists, ";")))
        .order_by(Rep.popularity.desc(), Rep.id.desc())
        .limit(limit)
        .all()
    )
    return rows_to_songs(rows)


@router.get("/{artist_id}/hilos")
def hilos_artista(artist_id: int, db: Session = Depends(database.get_db)):
    _get_artist(db, artist_id)
    rows = (
        db.query(models.ArtistThread, models.UserProfile)
        .outerjoin(models.UserProfile, models.UserProfile.uid == models.ArtistThread.author_uid)
        .filter(models.ArtistThread.artist_id == artist_id)
        .order_by(models.ArtistThread.last_activity_at.desc())
        .limit(100)
        .all()
    )
    return [_thread_dict(t, author, excerpt=True) for t, author in rows]


@router.post("/{artist_id}/hilos")
def crear_hilo(
    artist_id: int,
    author_uid: str = Form(...),
    title: str = Form(...),
    body: str = Form(""),
    media: Optional[UploadFile] = File(None),
    media_blob: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
):
    _get_artist(db, artist_id)
    author = _get_user(db, author_uid)
    title, body = title.strip(), body.strip()
    if not 3 <= len(title) <= 120:
        raise HTTPException(status_code=422, detail="El título debe tener entre 3 y 120 caracteres.")
    if len(body) > 5000:
        raise HTTPException(status_code=422, detail="El mensaje supera los 5000 caracteres.")
    media_url, media_type = _save_upload(db, media, media_blob)

    thread = models.ArtistThread(artist_id=artist_id, author_uid=author.uid, title=title,
                                 body=body or None, media_url=media_url, media_type=media_type)
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return _thread_dict(thread, author)
