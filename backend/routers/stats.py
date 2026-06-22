from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer

import database
import models
import schemas

router = APIRouter(prefix="/stats", tags=["Estadísticas"])

@router.get("/kpis", response_model=schemas.KpiStats)
def kpis(db: Session = Depends(database.get_db)):
    total = db.query(func.count(models.Cancion.id)).scalar()
    avg_valence = db.query(func.avg(models.Cancion.valence)).scalar() or 0
    avg_energy = db.query(func.avg(models.Cancion.energy)).scalar() or 0
    avg_popularity = db.query(func.avg(models.Cancion.popularity)).scalar() or 0

    return {
        "total_songs": total,
        "avg_valence": round(avg_valence, 2),
        "avg_energy": round(avg_energy, 2),
        "avg_popularity": round(avg_popularity, 1),
    }

@router.get("/genre-distribution", response_model=list[schemas.GenreStat])
def genre_distribution(db: Session = Depends(database.get_db)):
    total_popularity = db.query(func.sum(models.Cancion.popularity)).scalar() or 1

    rows = (
        db.query(models.Cancion.track_genre, func.sum(models.Cancion.popularity))
        .group_by(models.Cancion.track_genre)
        .order_by(func.sum(models.Cancion.popularity).desc())
        .limit(5)
        .all()
    )

    return [
        {"genre": genre, "value": round((pop_sum / total_popularity) * 100, 1)}
        for genre, pop_sum in rows
    ]

TOP_GENRES = [
    "k-pop", "dubstep", "gospel", "electro", "hard-rock", "alt-rock",
    "rock-n-roll", "metalcore", "disco", "hardcore", "punk-rock"
]

@router.get("/top-genres", response_model=list[schemas.GenreStat])
def top_genres(db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.Cancion.track_genre, func.avg(models.Cancion.popularity))
        .filter(models.Cancion.track_genre.in_(TOP_GENRES))
        .group_by(models.Cancion.track_genre)
        .order_by(func.avg(models.Cancion.popularity).desc())
        .limit(6)
        .all()
    )
    return [{"genre": genre, "value": round(pop, 1)} for genre, pop in rows]

@router.get("/explicit-content", response_model=list[schemas.GenreStat])
def explicit_content(db: Session = Depends(database.get_db)):
    rows = (
        db.query(
            models.Cancion.track_genre,
            (func.avg(models.Cancion.explicit.cast(Integer)) * 100).label("pct")
        )
        .group_by(models.Cancion.track_genre)
        .order_by(func.avg(models.Cancion.explicit.cast(Integer)).desc())
        .limit(6)
        .all()
    )
    return [{"genre": genre, "value": round(pct, 1)} for genre, pct in rows]

LOUDNESS_GENRES = [
    "jazz", "rock-n-roll", "blues", "electronic", "disco", "gospel",
    "rock", "k-pop", "hard-rock", "black-metal", "funk", "alt-rock",
    "electro", "industrial", "punk-rock", "hardcore", "heavy-metal",
    "death-metal", "dance", "dubstep", "metal", "metalcore"
]

@router.get("/loudness-by-genre", response_model=list[schemas.GenreStat])
def loudness_by_genre(db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.Cancion.track_genre, func.avg(models.Cancion.loudness))
        .filter(models.Cancion.track_genre.in_(LOUDNESS_GENRES))
        .group_by(models.Cancion.track_genre)
        .order_by(func.avg(models.Cancion.loudness).asc())
        .limit(len(LOUDNESS_GENRES))
        .all()
    )
    return [{"genre": genre, "value": round(loudness, 1)} for genre, loudness in rows]

BIO_IMPACT_GENRES = ["jazz", "rock-n-roll", "blues", "gospel", "k-pop", "funk", "electro", "ambient"]

@router.get("/acoustic-index", response_model=list[schemas.GenreStat])
def acoustic_index(db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.Cancion.track_genre, func.avg(models.Cancion.acousticness) * 100)
        .filter(models.Cancion.track_genre.in_(BIO_IMPACT_GENRES))
        .group_by(models.Cancion.track_genre)
        .order_by(func.avg(models.Cancion.acousticness).desc())
        .limit(5)
        .all()
    )
    return [{"genre": genre, "value": round(value, 1)} for genre, value in rows]

@router.get("/top-acoustic-songs", response_model=list[schemas.CancionRespuesta])
def top_acoustic_songs(db: Session = Depends(database.get_db)):
    return (
        db.query(models.Cancion)
        .order_by(models.Cancion.acousticness.desc())
        .limit(6)
        .all()
    )

@router.get("/psych-map")
def psych_map(db: Session = Depends(database.get_db)):
    avg_valence = (db.query(func.avg(models.Cancion.valence)).scalar() or 0) * 100
    avg_energy = (db.query(func.avg(models.Cancion.energy)).scalar() or 0) * 100

    rows = (
        db.query(
            models.Cancion.track_genre,
            func.avg(models.Cancion.valence),
            func.avg(models.Cancion.energy)
        )
        .group_by(models.Cancion.track_genre)
        .limit(20)
        .all()
    )

    points = [
        {"genre": genre, "valencia": round(v * 100, 1), "energia": round(e * 100, 1)}
        for genre, v, e in rows
    ]

    return {
        "points": points,
        "avg_valence": round(avg_valence, 1),
        "avg_energy": round(avg_energy, 1)
    }