from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer

import database
import models
import schemas
from song_queries import deduped_query, rows_to_songs

router = APIRouter(prefix="/stats", tags=["Estadísticas"])

@router.get("/kpis", response_model=schemas.KpiStats)
def kpis(db: Session = Depends(database.get_db)):

    consulta, Rep = deduped_query(db)

    total = consulta.count()
    avg_valence = consulta.with_entities(func.avg(Rep.valence)).scalar() or 0
    avg_energy = consulta.with_entities(func.avg(Rep.energy)).scalar() or 0
    avg_popularity = consulta.with_entities(func.avg(Rep.popularity)).scalar() or 0

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

LOUDNESS_TOP = 8

@router.get("/loudness-by-genre", response_model=list[schemas.GenreStat])
def loudness_by_genre(db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.Cancion.track_genre, func.avg(models.Cancion.loudness))
        .group_by(models.Cancion.track_genre)
        .order_by(func.avg(models.Cancion.loudness).desc())
        .limit(LOUDNESS_TOP)
        .all()
    )
    return [{"genre": genre, "value": round(loudness, 1)} for genre, loudness in rows]

BIO_IMPACT_GENRES = ["jazz", "rock-n-roll", "blues", "gospel", "k-pop", "funk", "electro", "ambient"]

@router.get("/acoustic-index", response_model=list[schemas.GenreStat])
def acoustic_index(db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.Cancion.track_genre, func.avg(models.Cancion.acousticness))
        .filter(models.Cancion.track_genre.in_(BIO_IMPACT_GENRES))
        .group_by(models.Cancion.track_genre)
        .order_by(func.avg(models.Cancion.acousticness).desc())
        .limit(5)
        .all()
    )
    # Plain acousticness (0-1), the same scale the songs themselves use.
    return [{"genre": genre, "value": round(value, 3)} for genre, value in rows]

@router.get("/top-acoustic-songs", response_model=list[schemas.CancionRespuesta])
def top_acoustic_songs(
    limit: int = Query(6, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db)
):
    consulta, Rep = deduped_query(db)
    # id tiebreaker: many songs share the top acousticness values, and paging needs a stable order.
    rows = consulta.order_by(Rep.acousticness.desc(), Rep.id.desc()).offset(offset).limit(limit).all()
    return rows_to_songs(rows)

PSYCH_MAP_GENRES = [
    "classical", "jazz", "acoustic", "sleep", "ambient", "new-age",
    "blues", "gospel", "folk", "singer-songwriter",
    "pop", "latin", "indie-pop", "cantopop", "romance",
    "rock", "hard-rock", "punk-rock", "metal", "edm",
    "hip-hop", "dance", "party", "happy", "sad"
]

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
        .filter(models.Cancion.track_genre.in_(PSYCH_MAP_GENRES))
        .group_by(models.Cancion.track_genre)
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