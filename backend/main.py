import os

from dotenv import load_dotenv

# Before anything reads os.environ: DATABASE_URL, YOUTUBE_API_KEY, SPOTIFY_CLIENT_ID/SECRET.
# Real environment variables win over the file, so hosted deploys are unaffected.
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

import database
import storage
from artist_index import ensure_artists_indexed
from routers import canciones, stats, users, friends, comments, likes, media, artistas, musica, playlists, settings, subidas

database.Base.metadata.create_all(bind=database.engine)

with database.engine.connect() as conn:
    conn.execute(text("ALTER TABLE song_likes ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'like'"))
    conn.execute(text("ALTER TABLE song_likes ADD COLUMN IF NOT EXISTS reaction VARCHAR"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_songs_dedup ON songs (track_name, artists, popularity, id)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_songs_genre ON songs (track_genre)"))
    conn.execute(text("ALTER TABLE artist_threads ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ"))
    conn.execute(text("ALTER TABLE artist_posts ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ"))
    conn.execute(text("ALTER TABLE song_media ADD COLUMN IF NOT EXISTS youtube_id VARCHAR"))
    conn.execute(text("ALTER TABLE song_media ADD COLUMN IF NOT EXISTS youtube_source VARCHAR"))
    conn.execute(text("ALTER TABLE song_media ADD COLUMN IF NOT EXISTS youtube_checked_at TIMESTAMPTZ"))
    conn.commit()

with database.SessionLocal() as db:
    ensure_artists_indexed(db)

app = FastAPI()

# Extra frontend addresses (e.g. a custom domain) go in CORS_ORIGINS, comma-separated.
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://moodify-one-rho.vercel.app",
    *(o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# With Vercel Blob the files are served from its own URLs; uploads/ only exists in local dev.
if not storage.uses_blob():
    os.makedirs(storage.LOCAL_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=storage.LOCAL_DIR), name="uploads")

app.include_router(canciones.router)
app.include_router(stats.router)
app.include_router(canciones.router)
app.include_router(stats.router)
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(comments.router)
app.include_router(likes.router)
app.include_router(media.router)
app.include_router(artistas.router)
app.include_router(musica.router)
app.include_router(playlists.router)
app.include_router(settings.router)
app.include_router(subidas.router)