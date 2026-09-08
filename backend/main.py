from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

import database
from routers import canciones, stats, users, friends, comments, likes

database.Base.metadata.create_all(bind=database.engine)

with database.engine.connect() as conn:
    conn.execute(text("ALTER TABLE song_likes ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'like'"))
    conn.execute(text("ALTER TABLE song_likes ADD COLUMN IF NOT EXISTS reaction VARCHAR"))
    conn.commit()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://moodify-one-rho.vercel.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(canciones.router)
app.include_router(stats.router)
app.include_router(canciones.router)
app.include_router(stats.router)
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(comments.router)
app.include_router(likes.router)