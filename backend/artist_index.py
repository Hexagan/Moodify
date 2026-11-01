from sqlalchemy import text

# Aggregating ~30k artist names out of the semicolon-packed `artists` column takes ~3s, too
# slow per request, so it's materialised into the `artists` table. Upserting by name keeps
# each artist's id stable across refreshes - forum threads point at that id.
_UPSERT = """
    INSERT INTO artists (name, song_count, top_popularity)
    SELECT trim(a), count(DISTINCT (s.track_name, s.artists)), max(s.popularity)
    FROM songs s, unnest(string_to_array(s.artists, ';')) AS a
    WHERE trim(a) <> '' {where}
    GROUP BY trim(a)
    ON CONFLICT (name) DO UPDATE
        SET song_count = EXCLUDED.song_count, top_popularity = EXCLUDED.top_popularity
"""


def split_artists(artists_field):
    return [a.strip() for a in (artists_field or "").split(";") if a.strip()]


def refresh_artists(db, names=None):
    """Rebuild every artist, or just `names` (after an ABM create/edit/delete)."""
    if names is None:
        db.execute(text(_UPSERT.format(where="")))
    else:
        names = sorted(set(names))
        if not names:
            return
        # An artist whose last song was removed gets no row from the aggregate, so zero
        # them first; the upsert then restores counts for anyone who still has songs.
        db.execute(
            text("UPDATE artists SET song_count = 0, top_popularity = 0 WHERE name = ANY(:names)"),
            {"names": names},
        )
        db.execute(text(_UPSERT.format(where="AND trim(a) = ANY(:names)")), {"names": names})
    db.commit()


def ensure_artists_indexed(db):
    if db.execute(text("SELECT 1 FROM artists LIMIT 1")).first() is None:
        refresh_artists(db)
