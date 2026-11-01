import html
import os
import re
import unicodedata
import uuid
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from typing import Optional
from urllib.parse import quote

import requests
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import database
import models

router = APIRouter(prefix="/media", tags=["Media"])

SPOTIFY_ID = re.compile(r"^[A-Za-z0-9]{22}$")
YOUTUBE_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
HEADERS = {"User-Agent": "Moodify/1.0"}
TIMEOUT = 6
# Deezer preview URLs carry a signed expiry (~24h); iTunes ones don't.
DEEZER_URL_TTL = timedelta(hours=6)
NOT_FOUND_RETRY = timedelta(days=7)

SONG_UPLOAD_DIR = os.path.join("uploads", "songs")
os.makedirs(SONG_UPLOAD_DIR, exist_ok=True)
COVER_MAX_BYTES = 5 * 1024 * 1024
AUDIO_MAX_BYTES = 15 * 1024 * 1024


def _now():
    return datetime.now(timezone.utc)


def _is_fresh(checked_at, ttl):
    return checked_at is not None and _now() - checked_at < ttl


def _normalize(text):
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", text.lower())


def _clean_title(title):
    title = re.split(r"\s+-\s+", title or "")[0]
    return re.sub(r"\s*[(\[](feat|ft|with|from)\b.*?[)\]]", "", title, flags=re.IGNORECASE).strip()


def _is_same_song(want_title, want_artist, got_title, got_artist):
    """Loose search results can return a different artist's song entirely, so both must line up."""
    wa, ga = _normalize(want_artist), _normalize(got_artist)
    if not wa or not ga or (wa not in ga and ga not in wa):
        return False
    wt, gt = _normalize(_clean_title(want_title)), _normalize(_clean_title(got_title))
    if not wt or not gt:
        return False
    return wt in gt or gt in wt or SequenceMatcher(None, wt, gt).ratio() >= 0.7


def _search_itunes(title, artist):
    res = requests.get(
        "https://itunes.apple.com/search",
        params={"term": f"{artist} {_clean_title(title)}", "entity": "song", "limit": 5},
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    res.raise_for_status()
    for item in res.json().get("results", []):
        if item.get("previewUrl") and _is_same_song(title, artist, item.get("trackName"), item.get("artistName")):
            artwork = item.get("artworkUrl100")
            return {
                "source": "itunes",
                "ref": str(item.get("trackId")),
                "url": item["previewUrl"],
                "artwork": artwork.replace("100x100bb", "600x600bb") if artwork else None,
            }
    return None


def _search_deezer(title, artist):
    res = requests.get(
        "https://api.deezer.com/search",
        params={"q": f"{artist} {_clean_title(title)}", "limit": 5},
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    res.raise_for_status()
    body = res.json()
    if "error" in body:
        raise requests.RequestException(body["error"])
    for item in body.get("data", []):
        if item.get("preview") and _is_same_song(title, artist, item.get("title"), item.get("artist", {}).get("name")):
            return {
                "source": "deezer",
                "ref": str(item["id"]),
                "url": item["preview"],
                "artwork": item.get("album", {}).get("cover_xl"),
            }
    return None


def _refresh_deezer_url(ref):
    res = requests.get(f"https://api.deezer.com/track/{ref}", headers=HEADERS, timeout=TIMEOUT)
    res.raise_for_status()
    return res.json().get("preview") or None


def _get_media(db, track_id):
    media = db.get(models.SongMedia, track_id)
    if media is None:
        media = models.SongMedia(track_id=track_id)
        db.add(media)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            media = db.get(models.SongMedia, track_id)
    return media


def _save(db):
    try:
        db.commit()
    except IntegrityError:
        # Another request cached the same track first - its result is just as good.
        db.rollback()


def _resolve_preview(db, track_id):
    media = _get_media(db, track_id)

    if media.preview_source in ("itunes", "manual"):
        return media
    if media.preview_source == "none" and _is_fresh(media.preview_checked_at, NOT_FOUND_RETRY):
        return media
    if media.preview_source == "deezer":
        if _is_fresh(media.preview_checked_at, DEEZER_URL_TTL):
            return media
        try:
            url = _refresh_deezer_url(media.preview_ref)
        except requests.RequestException:
            raise HTTPException(status_code=502, detail="No se pudo contactar al proveedor de audio")
        if url:
            media.preview_url = url
            media.preview_checked_at = _now()
            _save(db)
            return media

    song = db.query(models.Cancion).filter(models.Cancion.track_id == track_id).first()
    if song is None:
        raise HTTPException(status_code=404, detail="Canción no encontrada")

    artist = (song.artists or "").split(";")[0]
    match = None
    any_search_completed = False
    for search in (_search_itunes, _search_deezer):
        try:
            match = search(song.track_name, artist)
            any_search_completed = True
        except (requests.RequestException, ValueError):
            continue
        if match:
            break

    if not any_search_completed:
        raise HTTPException(status_code=502, detail="No se pudo contactar al proveedor de audio")

    media.preview_source = match["source"] if match else "none"
    media.preview_ref = match["ref"] if match else None
    media.preview_url = match["url"] if match else None
    media.preview_artwork_url = match["artwork"] if match else None
    media.preview_checked_at = _now()
    _save(db)
    return media


def _resolve_thumbnail(db, track_id):
    media = _get_media(db, track_id)
    if media.thumbnail_url or _is_fresh(media.thumbnail_checked_at, NOT_FOUND_RETRY):
        return media.thumbnail_url

    if SPOTIFY_ID.match(track_id):
        try:
            res = requests.get(
                "https://open.spotify.com/oembed",
                params={"url": f"https://open.spotify.com/track/{track_id}"},
                headers=HEADERS,
                timeout=TIMEOUT,
            )
        except requests.RequestException:
            raise HTTPException(status_code=502, detail="No se pudo contactar a Spotify")
        if res.ok:
            media.thumbnail_url = res.json().get("thumbnail_url")

    if not media.thumbnail_url:
        try:
            _resolve_preview(db, track_id)
        except HTTPException:
            pass
        media.thumbnail_url = media.preview_artwork_url

    media.thumbnail_checked_at = _now()
    _save(db)
    return media.thumbnail_url


@router.get("/{track_id}/thumbnail")
def obtener_miniatura(track_id: str, db: Session = Depends(database.get_db)):
    return {"thumbnail_url": _resolve_thumbnail(db, track_id)}


@router.get("/{track_id}/preview")
def obtener_preview(track_id: str, db: Session = Depends(database.get_db)):
    media = _resolve_preview(db, track_id)
    return {"preview_url": media.preview_url, "source": media.preview_source if media.preview_url else None}


# ---------- YouTube ----------

def youtube_key():
    # Read per call so a key added to .env only needs a restart, not a code change.
    return os.environ.get("YOUTUBE_API_KEY") or None


def _music_search_url(title, artist):
    return "https://music.youtube.com/search?q=" + quote(f"{artist} {_clean_title(title)}".strip())


def search_youtube(query, max_results=8):
    """One search.list call costs 100 of the free 10,000 daily quota units. Only embeddable
    music videos come back, so whatever is picked can play inside the site."""
    res = requests.get(
        "https://www.googleapis.com/youtube/v3/search",
        params={
            "part": "snippet",
            "q": query,
            "type": "video",
            "videoCategoryId": "10",
            "videoEmbeddable": "true",
            "maxResults": max_results,
            "key": youtube_key(),
        },
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    res.raise_for_status()
    out = []
    for item in res.json().get("items", []):
        snippet = item.get("snippet", {})
        video_id = item.get("id", {}).get("videoId")
        if not video_id:
            continue
        thumbs = snippet.get("thumbnails", {})
        out.append({
            "video_id": video_id,
            "title": html.unescape(snippet.get("title", "")),
            "channel": html.unescape(snippet.get("channelTitle", "")),
            "thumbnail": (thumbs.get("high") or thumbs.get("medium") or thumbs.get("default") or {}).get("url"),
        })
    return out


def _pick_youtube(title, artist, candidates):
    """Prefers YouTube Music's auto-generated "Artist - Topic" uploads (the studio track, no video
    intro), then the artist's own channel; a result whose title doesn't match is never picked."""
    want_artist = _normalize(artist)
    want_title = _normalize(_clean_title(title))
    best, best_score = None, 0
    for c in candidates:
        channel = c["channel"]
        topic = channel.endswith(" - Topic")
        got_channel = _normalize(channel[:-len(" - Topic")] if topic else channel)
        got_title = _normalize(_clean_title(c["title"]))
        if not want_title or not got_title or not want_artist:
            continue
        title_ok = want_title in got_title or SequenceMatcher(None, want_title, got_title).ratio() >= 0.7
        artist_ok = want_artist in got_channel or (got_channel and got_channel in want_artist) or want_artist in got_title
        if not (title_ok and artist_ok):
            continue
        score = 3 if topic else 2 if want_artist in got_channel else 1
        if score > best_score:
            best, best_score = c, score
    return best


def _youtube_payload(media, song):
    video_id = media.youtube_id
    search_url = _music_search_url(song.track_name, (song.artists or "").split(";")[0])
    return {
        "video_id": video_id,
        "music_url": f"https://music.youtube.com/watch?v={video_id}" if video_id else search_url,
        "search_url": search_url,
        "configured": youtube_key() is not None,
    }


@router.get("/{track_id}/youtube")
def obtener_youtube(track_id: str, db: Session = Depends(database.get_db)):
    song = db.query(models.Cancion).filter(models.Cancion.track_id == track_id).first()
    if song is None:
        raise HTTPException(status_code=404, detail="Canción no encontrada")

    media = _get_media(db, track_id)
    settled = media.youtube_source in ("api", "manual") or (
        media.youtube_source == "none" and _is_fresh(media.youtube_checked_at, NOT_FOUND_RETRY)
    )
    if settled or youtube_key() is None:
        return _youtube_payload(media, song)

    artist = (song.artists or "").split(";")[0]
    try:
        match = _pick_youtube(song.track_name, artist, search_youtube(f"{artist} {_clean_title(song.track_name)}"))
    except (requests.RequestException, ValueError):
        # Quota exhausted or network trouble: answer with the search link, but don't cache a miss.
        return _youtube_payload(media, song)

    media.youtube_id = match["video_id"] if match else None
    media.youtube_source = "api" if match else "none"
    media.youtube_checked_at = _now()
    _save(db)
    return _youtube_payload(media, song)


def _parse_youtube_ref(value):
    """Accepts a bare video id or any youtube.com / music.youtube.com / youtu.be link."""
    value = (value or "").strip()
    if YOUTUBE_ID.match(value):
        return value
    match = re.search(r"(?:[?&]v=|youtu\.be/|/embed/|/shorts/)([A-Za-z0-9_-]{11})", value)
    if match:
        return match.group(1)
    raise HTTPException(status_code=422, detail="No se reconoce el enlace de YouTube.")


# ---------- ABM: manual cover, preview and YouTube link ----------

def require_admin(db, uid):
    user = db.get(models.UserProfile, uid) if uid else None
    if user is None or user.role != "dev":
        raise HTTPException(status_code=403, detail="Solo un administrador puede modificar el contenido de las canciones.")


_SIGNATURES = {
    "jpg": lambda h: h[:3] == b"\xff\xd8\xff",
    "png": lambda h: h[:8] == b"\x89PNG\r\n\x1a\n",
    "webp": lambda h: h[:4] == b"RIFF" and h[8:12] == b"WEBP",
    "mp3": lambda h: h[:3] == b"ID3" or (len(h) > 1 and h[0] == 0xFF and (h[1] & 0xE0) == 0xE0),
    "m4a": lambda h: h[4:8] == b"ftyp" and h[8:11] == b"M4A",
    "ogg": lambda h: h[:4] == b"OggS",
    "wav": lambda h: h[:4] == b"RIFF" and h[8:12] == b"WAVE",
}


def _store_upload(upload, allowed, limit):
    # Judged by content, not by the file name or the browser-supplied type.
    data = upload.file.read(limit + 1)
    ext = next((k for k in allowed if _SIGNATURES[k](data[:16])), None)
    if ext is None:
        raise HTTPException(status_code=415, detail=f"Formato no admitido. Usá {', '.join(a.upper() for a in allowed)}.")
    if len(data) > limit:
        raise HTTPException(status_code=413, detail=f"El archivo supera el máximo de {limit // (1024 * 1024)} MB.")
    name = f"{uuid.uuid4().hex}.{ext}"
    with open(os.path.join(SONG_UPLOAD_DIR, name), "wb") as out:
        out.write(data)
    return f"/uploads/songs/{name}"


def _delete_song_upload(url):
    if url and url.startswith("/uploads/songs/"):
        try:
            os.remove(os.path.join(SONG_UPLOAD_DIR, os.path.basename(url)))
        except OSError:
            pass


def _media_dict(media, track_id):
    return {
        "track_id": track_id,
        "thumbnail_url": media.thumbnail_url if media else None,
        "preview_url": media.preview_url if media else None,
        "preview_source": media.preview_source if media and media.preview_url else None,
        "youtube_id": media.youtube_id if media else None,
        "youtube_source": media.youtube_source if media and media.youtube_id else None,
    }


@router.get("/{track_id}/admin")
def obtener_media_admin(track_id: str, db: Session = Depends(database.get_db)):
    """What's stored for a song, without triggering any lookup, so the ABM can show it."""
    return _media_dict(db.get(models.SongMedia, track_id), track_id)


@router.put("/{track_id}")
def actualizar_media(
    track_id: str,
    admin_uid: str = Form(...),
    cover: Optional[UploadFile] = File(None),
    cover_url: Optional[str] = Form(None),
    remove_cover: bool = Form(False),
    preview: Optional[UploadFile] = File(None),
    preview_url: Optional[str] = Form(None),
    remove_preview: bool = Form(False),
    youtube: Optional[str] = Form(None),
    remove_youtube: bool = Form(False),
    db: Session = Depends(database.get_db),
):
    """Every field is optional: what's left out keeps its current (possibly auto-found) value.
    Removing a value hands it back to the automatic lookup rather than blanking it for good."""
    require_admin(db, admin_uid)
    if db.query(models.Cancion.id).filter(models.Cancion.track_id == track_id).first() is None:
        raise HTTPException(status_code=404, detail="Canción no encontrada")

    youtube_id = _parse_youtube_ref(youtube) if youtube and youtube.strip() else None

    # Everything is validated and stored before the row changes; if the second file is
    # rejected, the first one is removed again instead of being left orphaned on disk.
    new_cover = new_preview = None
    try:
        if cover is not None and cover.filename:
            new_cover = _store_upload(cover, ("jpg", "png", "webp"), COVER_MAX_BYTES)
        if preview is not None and preview.filename:
            new_preview = _store_upload(preview, ("mp3", "m4a", "ogg", "wav"), AUDIO_MAX_BYTES)
    except HTTPException:
        _delete_song_upload(new_cover)
        raise
    if not new_cover and cover_url and cover_url.startswith("https://"):
        new_cover = cover_url
    if not new_preview and preview_url and preview_url.startswith("https://"):
        new_preview = preview_url

    media = _get_media(db, track_id)
    replaced = []

    if new_cover:
        replaced.append(media.thumbnail_url)
        media.thumbnail_url, media.thumbnail_checked_at = new_cover, _now()
    elif remove_cover:
        replaced.append(media.thumbnail_url)
        media.thumbnail_url = media.thumbnail_checked_at = None

    if new_preview:
        replaced.append(media.preview_url)
        media.preview_url = new_preview
        media.preview_source, media.preview_ref, media.preview_checked_at = "manual", None, _now()
    elif remove_preview:
        replaced.append(media.preview_url)
        media.preview_url = media.preview_source = media.preview_ref = media.preview_checked_at = None

    if youtube_id:
        media.youtube_id, media.youtube_source, media.youtube_checked_at = youtube_id, "manual", _now()
    elif remove_youtube:
        media.youtube_id = media.youtube_source = media.youtube_checked_at = None

    db.commit()
    for url in replaced:
        _delete_song_upload(url)
    return _media_dict(media, track_id)


# ---------- ABM autocompletion ----------

_spotify_token = {"value": None, "expires": None}


def _spotify_credentials():
    cid, secret = os.environ.get("SPOTIFY_CLIENT_ID"), os.environ.get("SPOTIFY_CLIENT_SECRET")
    return (cid, secret) if cid and secret else None


def _spotify_access_token():
    if _spotify_token["value"] and _spotify_token["expires"] > _now():
        return _spotify_token["value"]
    res = requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "client_credentials"},
        auth=_spotify_credentials(),
        timeout=TIMEOUT,
    )
    res.raise_for_status()
    body = res.json()
    _spotify_token["value"] = body["access_token"]
    # A minute of margin so a token never expires mid-request.
    _spotify_token["expires"] = _now() + timedelta(seconds=body.get("expires_in", 3600) - 60)
    return _spotify_token["value"]


def _suggest_itunes(query):
    res = requests.get(
        "https://itunes.apple.com/search",
        params={"term": query, "entity": "song", "limit": 8},
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    res.raise_for_status()
    out = []
    for item in res.json().get("results", []):
        artwork = item.get("artworkUrl100")
        out.append({
            "title": item.get("trackName"),
            "artist": item.get("artistName"),
            "album": item.get("collectionName"),
            "duration_ms": item.get("trackTimeMillis"),
            "explicit": item.get("trackExplicitness") == "explicit",
            "genre": item.get("primaryGenreName"),
            "cover_url": artwork.replace("100x100bb", "600x600bb") if artwork else None,
            "preview_url": item.get("previewUrl"),
        })
    return out


def _suggest_deezer(query):
    res = requests.get("https://api.deezer.com/search", params={"q": query, "limit": 8}, headers=HEADERS, timeout=TIMEOUT)
    res.raise_for_status()
    body = res.json()
    if "error" in body:
        raise requests.RequestException(body["error"])
    return [{
        "title": item.get("title"),
        "artist": item.get("artist", {}).get("name"),
        "album": item.get("album", {}).get("title"),
        "duration_ms": (item.get("duration") or 0) * 1000 or None,
        "explicit": bool(item.get("explicit_lyrics")),
        "cover_url": item.get("album", {}).get("cover_xl"),
        # Deezer preview links expire within a day, so they're never stored as a manual
        # preview; the automatic lookup refreshes them on its own.
        "preview_url": None,
    } for item in body.get("data", [])]


def _suggest_spotify(query):
    res = requests.get(
        "https://api.spotify.com/v1/search",
        params={"q": query, "type": "track", "limit": 8},
        headers={"Authorization": f"Bearer {_spotify_access_token()}"},
        timeout=TIMEOUT,
    )
    res.raise_for_status()
    out = []
    for item in res.json().get("tracks", {}).get("items", []):
        images = item.get("album", {}).get("images") or []
        out.append({
            "title": item.get("name"),
            # The dataset separates credited artists with ";".
            "artist": ";".join(a.get("name", "") for a in item.get("artists", [])),
            "album": item.get("album", {}).get("name"),
            "duration_ms": item.get("duration_ms"),
            "explicit": bool(item.get("explicit")),
            "popularity": item.get("popularity"),
            "cover_url": images[0]["url"] if images else None,
            "preview_url": item.get("preview_url"),
            "spotify_id": item.get("id"),
        })
    return out


def _suggest_youtube(query):
    return [{
        "title": c["title"],
        "artist": c["channel"][:-len(" - Topic")] if c["channel"].endswith(" - Topic") else c["channel"],
        "cover_url": c["thumbnail"],
        "youtube_id": c["video_id"],
    } for c in search_youtube(query)]


_SUGGESTERS = {
    "itunes": (_suggest_itunes, lambda: True),
    "deezer": (_suggest_deezer, lambda: True),
    "spotify": (_suggest_spotify, lambda: _spotify_credentials() is not None),
    "youtube": (_suggest_youtube, lambda: youtube_key() is not None),
}


@router.get("/autocompletar/fuentes")
def fuentes_autocompletar():
    """Which search sources this server can use (Spotify and YouTube need API credentials)."""
    return {name: available() for name, (_, available) in _SUGGESTERS.items()}


@router.get("/autocompletar/buscar")
def autocompletar(q: str, fuente: str = "itunes", admin_uid: str = "", db: Session = Depends(database.get_db)):
    # Admin-only: the YouTube source spends shared API quota on every call.
    require_admin(db, admin_uid)
    suggester = _SUGGESTERS.get(fuente)
    if suggester is None:
        raise HTTPException(status_code=404, detail="Fuente desconocida")
    search, available = suggester
    if not available():
        raise HTTPException(status_code=503, detail="Esta fuente no está configurada en el servidor.")
    q = q.strip()
    if len(q) < 2:
        return []
    try:
        results = search(q)
    except (requests.RequestException, ValueError, KeyError):
        raise HTTPException(status_code=502, detail="No se pudo contactar al servicio de búsqueda.")
    return [dict(r, source=fuente) for r in results]
