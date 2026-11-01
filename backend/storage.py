import base64
import hashlib
import hmac
import json
import os
import re
import time
from urllib.parse import urlparse

import requests
from fastapi import HTTPException

# Uploaded files go to Vercel Blob when BLOB_READ_WRITE_TOKEN is set (the hosted deploy, whose
# disk doesn't persist), otherwise to the local uploads/ folder served at /uploads.
#
# With Blob, browsers upload straight to it (Vercel functions reject bodies over 4.5 MB) using a
# short-lived token from /subidas/token, then send us the resulting URL. That URL is only trusted
# after checking it's ours and probing its first bytes, the same checks a direct upload gets.
LOCAL_DIR = "uploads"
BLOB_API = "https://vercel.com/api/blob"
BLOB_API_VERSION = "13"
TIMEOUT = 30
CLIENT_TOKEN_TTL_S = 10 * 60


def _blob_token():
    return os.environ.get("BLOB_READ_WRITE_TOKEN") or None


def uses_blob():
    return _blob_token() is not None


def _store_id(token):
    parts = token.split("_")
    return parts[3] if len(parts) > 3 else ""


def _blob_headers(token, **extra):
    return {
        "authorization": f"Bearer {token}",
        "x-api-version": BLOB_API_VERSION,
        "x-vercel-blob-store-id": _store_id(token),
        **extra,
    }


def save(folder, name, data, content_type=None):
    """Stores `data` as `folder/name` and returns the URL the frontend should use."""
    path = f"{folder}/{name}" if folder else name
    token = _blob_token()
    if token is None:
        target = os.path.join(LOCAL_DIR, *path.split("/"))
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "wb") as out:
            out.write(data)
        return f"/{LOCAL_DIR}/{path}"

    headers = _blob_headers(
        token,
        **{
            "x-vercel-blob-access": "public",
            "x-add-random-suffix": "0",
            "x-allow-overwrite": "1",
        },
    )
    if content_type:
        headers["x-content-type"] = content_type
    res = requests.put(f"{BLOB_API}/", params={"pathname": path}, data=data, headers=headers, timeout=TIMEOUT)
    res.raise_for_status()
    return res.json()["url"]


def is_own_blob(url, folder=None):
    token = _blob_token()
    if not token or not url:
        return False
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != f"{_store_id(token).lower()}.public.blob.vercel-storage.com":
        return False
    return folder is None or parsed.path.startswith(f"/{folder}/")


def delete(url):
    """Removes a file saved here. Anything else (external links, missing files) is ignored."""
    if not url:
        return
    if url.startswith(f"/{LOCAL_DIR}/"):
        try:
            os.remove(os.path.join(LOCAL_DIR, *url[len(LOCAL_DIR) + 2:].split("/")))
        except OSError:
            pass
        return
    token = _blob_token()
    if token and is_own_blob(url):
        try:
            requests.post(
                f"{BLOB_API}/delete",
                json={"urls": [url]},
                headers=_blob_headers(token, **{"content-type": "application/json"}),
                timeout=TIMEOUT,
            )
        except requests.RequestException:
            pass


# ---------- incoming files ----------

class Incoming:
    """A file that arrived in the request body (`data`) or was uploaded to Blob already (`url`).
    `head` (first 16 bytes) and `size` are enough for the callers' type and size checks."""

    def __init__(self, head, size, data=None, url=None):
        self.head, self.size, self.data, self.url = head, size, data, url


def receive(upload, blob_url, folder, limit):
    """Reads whichever of the two was sent. Returns None when neither was."""
    if upload is not None and upload.filename:
        data = upload.file.read(limit + 1)
        return Incoming(data[:16], len(data), data=data)
    if not blob_url:
        return None
    if not is_own_blob(blob_url, folder):
        raise HTTPException(status_code=400, detail="El archivo subido no es válido.")
    try:
        res = requests.get(blob_url, headers={"Range": "bytes=0-15"}, timeout=TIMEOUT)
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="No se pudo verificar el archivo subido.")
    if res.status_code not in (200, 206):
        raise HTTPException(status_code=400, detail="El archivo subido no existe.")
    total = res.headers.get("content-range", "").rpartition("/")[2]
    size = int(total) if total.isdigit() else int(res.headers.get("content-length") or len(res.content))
    return Incoming(res.content[:16], size, url=blob_url)


def keep(incoming, folder, name, content_type=None):
    """Final URL for an accepted file: Blob uploads are already in place."""
    return incoming.url or save(folder, name, incoming.data, content_type)


def discard(incoming):
    """Drops a rejected file the browser had already put in Blob."""
    if incoming is not None and incoming.url:
        delete(incoming.url)


# ---------- client upload tokens ----------

_PATHNAME = re.compile(r"^[A-Za-z0-9._-]{1,120}$")


def client_token(folder, pathname, allowed_content_types, max_bytes):
    """Same format as @vercel/blob's generateClientTokenFromReadWriteToken: an HMAC-signed,
    base64 JSON payload restricting what (and how much) the browser may upload."""
    token = _blob_token()
    name = pathname[len(folder) + 1:] if pathname.startswith(f"{folder}/") else ""
    if not _PATHNAME.match(name):
        raise HTTPException(status_code=400, detail="Nombre de archivo no válido.")
    payload = base64.b64encode(json.dumps({
        "pathname": pathname,
        "allowedContentTypes": allowed_content_types,
        "maximumSizeInBytes": max_bytes,
        "addRandomSuffix": True,
        "validUntil": int((time.time() + CLIENT_TOKEN_TTL_S) * 1000),
    }, separators=(",", ":")).encode()).decode()
    signature = hmac.new(token.encode(), payload.encode(), hashlib.sha256).hexdigest()
    encoded = base64.b64encode(f"{signature}.{payload}".encode()).decode()
    return f"vercel_blob_client_{_store_id(token)}_{encoded}"
