from sqlalchemy.orm import aliased
from sqlalchemy import func, or_, and_, case

import models

ESTADOS = ("Enérgico", "Intenso", "Relajante", "Melancólico", "Mixto")
# Songs within this distance of the neutral center (0.5, 0.5) on BOTH axes are
# "Mixto" (~11% of the catalog); everything else takes its valence/energy quadrant.
MIXTO_RADIUS = 0.15


def estado_expr(song):
    """`song` is models.Cancion or an alias of it."""
    valence, energy = song.valence, song.energy
    # Rain / white-noise recordings: their dense spectrum scores near-max energy, but they
    # have no tonal content (valence ~0), no rhythm, and are mixed quiet - unlike real intense
    # music. Catches ~91% of "sleep" tracks that would otherwise land in Intenso, at the cost
    # of ~0.5% of hard genres (mostly lo-fi atmospheric black metal).
    noise_like = or_(
        and_(valence < 0.1, song.danceability < 0.3, song.loudness < -10),
        and_(valence < 0.05, song.loudness < -15),
    )
    return case(
        (noise_like, "Relajante"),
        (and_(func.abs(valence - 0.5) < MIXTO_RADIUS, func.abs(energy - 0.5) < MIXTO_RADIUS), "Mixto"),
        (and_(valence >= 0.5, energy >= 0.5), "Enérgico"),
        (and_(valence < 0.5, energy >= 0.5), "Intenso"),
        (and_(valence < 0.5, energy < 0.5), "Relajante"),
        else_="Melancólico",
    )


def deduped_query(db):
    """
    The source dataset repeats a song once per genre it's tagged with, so
    (track_name, artists) is the real identity of a song, not its row id.
    Picking "the row with max popularity" breaks when duplicates share the
    exact same popularity (the common case, since it's the same track) -
    DISTINCT ON with a deterministic tiebreaker (id) guarantees exactly one
    row per song. Every duplicate's genre is collected in dataset order via a
    window function computed in the same pass.
    """
    genres_window = (
        func.array_agg(models.Cancion.track_genre)
        .over(
            partition_by=(models.Cancion.track_name, models.Cancion.artists),
            order_by=models.Cancion.id,
            rows=(None, None),
        )
        .label("genres")
    )
    representative = (
        db.query(models.Cancion, genres_window)
        .distinct(models.Cancion.track_name, models.Cancion.artists)
        .order_by(
            models.Cancion.track_name,
            models.Cancion.artists,
            models.Cancion.popularity.desc(),
            models.Cancion.id.asc(),
        )
        .subquery()
    )
    Rep = aliased(models.Cancion, representative)
    query = db.query(Rep, representative.c.genres, estado_expr(Rep).label("estado"))
    return query, Rep


def genre_pairs(db, genero):
    """(track_name, artists) pairs where at least one duplicate row has this genre."""
    return (
        db.query(models.Cancion.track_name, models.Cancion.artists)
        .filter(models.Cancion.track_genre == genero)
        .distinct()
    )


def apply_search(consulta, column_track_name, column_artists, busqueda: str):
    normalized = func.unaccent(func.lower(busqueda))
    return consulta.filter(
        or_(
            func.unaccent(func.lower(column_track_name)).contains(normalized),
            func.unaccent(func.lower(column_artists)).contains(normalized)
        )
    )


def rows_to_songs(rows):
    """
    track_genre stays this specific row's own genre - the ABM edit form writes it
    back - while `genres` lists every genre the song is tagged with, for display.
    """
    result = []
    for song, genres, estado in rows:
        data = {c.name: getattr(song, c.name) for c in models.Cancion.__table__.columns}
        data["genres"] = list(dict.fromkeys(genres or [song.track_genre]))
        data["estado"] = estado
        result.append(data)
    return result


def song_with_details(db, song):
    """Single-song equivalent of deduped_query + rows_to_songs."""
    genres = [
        g for (g,) in db.query(models.Cancion.track_genre)
        .filter(models.Cancion.track_name == song.track_name, models.Cancion.artists == song.artists)
        .order_by(models.Cancion.id)
    ]
    estado = (
        db.query(estado_expr(models.Cancion))
        .filter(models.Cancion.id == song.id)
        .scalar()
    )
    return rows_to_songs([(song, genres, estado)])[0]
