import math
import threading
from collections import defaultdict
from datetime import datetime, timezone

import numpy as np

import models
from artist_index import split_artists
from song_queries import deduped_query, rows_to_songs

# Audio features compared between songs, and how much each matters. Valence and energy drive
# the app's moods, so they weigh most; loudness is normalised from roughly -60..0 dB.
_FEATURES = ("valence", "energy", "danceability", "acousticness", "loudness")
_FEATURE_WEIGHTS = np.array([1.3, 1.3, 0.8, 0.8, 0.6], dtype=np.float32)

LIKE_WEIGHT = 3.0
HISTORY_WEIGHT = 1.0
HISTORY_HALF_LIFE_DAYS = 30
MAX_SEEDS = 30
NEIGHBOURS_PER_SEED = 150
SIM_SCALE = 0.6  # feature distance at which similarity reaches 0
GENRE_BONUS = 0.3
POPULARITY_BONUS = 0.15
MAX_PER_ARTIST = 2
# Likes outweigh history 3:1, which on its own crowds history out of the list entirely.
# Reserve this share of the slots for history-based picks (still ranked below likes).
HISTORY_SHARE = 0.25

_lock = threading.Lock()
_catalog = None


class _Catalog:
    """Every unique song, once, as display dicts plus a weighted feature matrix."""

    def __init__(self, db):
        self.songs = rows_to_songs(deduped_query(db)[0].all())
        raw = np.array(
            [[s.get(f) or 0.0 for f in _FEATURES] for s in self.songs], dtype=np.float32
        )
        raw[:, 4] = np.clip((raw[:, 4] + 60.0) / 60.0, 0.0, 1.0)
        self.features = raw * _FEATURE_WEIGHTS
        self.popularity = np.array([s.get("popularity") or 0 for s in self.songs], dtype=np.float32)
        self.index_by_identity = {(s["track_name"], s["artists"]): i for i, s in enumerate(self.songs)}
        self.genre_sets = [set(s["genres"]) for s in self.songs]


def get_catalog(db):
    global _catalog
    with _lock:
        if _catalog is None:
            _catalog = _Catalog(db)
        return _catalog


def invalidate_catalog():
    global _catalog
    with _lock:
        _catalog = None


def resolve_indices(db, catalog, song_ids):
    """Map stored song row ids (any genre-duplicate of a song) to catalog indices."""
    if not song_ids:
        return {}
    rows = (
        db.query(models.Cancion.id, models.Cancion.track_name, models.Cancion.artists)
        .filter(models.Cancion.id.in_(set(song_ids)))
        .all()
    )
    mapping = {}
    for song_id, name, artists in rows:
        index = catalog.index_by_identity.get((name, artists))
        if index is not None:
            mapping[song_id] = index
    return mapping


def representative_id(db, song_id):
    catalog = get_catalog(db)
    index = resolve_indices(db, catalog, [song_id]).get(song_id)
    return catalog.songs[index]["id"] if index is not None else song_id


def _seeds(db, uid, catalog):
    """{catalog index: (weight, reason)} from the user's likes and listening history."""
    likes = (
        db.query(models.SongLike.song_id, models.SongLike.type)
        .filter(models.SongLike.user_uid == uid)
        .all()
    )
    history = (
        db.query(models.SongHistory.song_id, models.SongHistory.preview_plays,
                 models.SongHistory.detail_views, models.SongHistory.last_played_at)
        .filter(models.SongHistory.user_uid == uid)
        .all()
    )
    mapping = resolve_indices(db, catalog, [s for s, _ in likes] + [h.song_id for h in history])

    seeds, disliked = {}, set()
    now = datetime.now(timezone.utc)
    for row in history:
        index = mapping.get(row.song_id)
        if index is None:
            continue
        plays = (row.preview_plays or 0) + (row.detail_views or 0)
        age_days = max(0.0, (now - row.last_played_at).total_seconds() / 86400) if row.last_played_at else 0.0
        recency = 0.5 ** (age_days / HISTORY_HALF_LIFE_DAYS)
        weight = HISTORY_WEIGHT * (1 + math.log1p(max(plays - 1, 0)) * 0.5) * max(recency, 0.25)
        seeds[index] = (weight, "history")
    for song_id, kind in likes:
        index = mapping.get(song_id)
        if index is None:
            continue
        if kind == "dislike":
            disliked.add(index)
            seeds.pop(index, None)
        else:
            history_part = seeds.get(index, (0.0, None))[0]
            seeds[index] = (LIKE_WEIGHT + history_part, "like")

    strongest = sorted(seeds.items(), key=lambda kv: kv[1][0], reverse=True)[:MAX_SEEDS]
    return dict(strongest), disliked


def _score(db, uid):
    catalog = get_catalog(db)
    seeds, disliked = _seeds(db, uid, catalog)
    if not seeds:
        return catalog, seeds, {}, {}

    scores = defaultdict(float)
    best = {}  # candidate -> (contribution, seed index)
    excluded = set(seeds) | disliked
    # The dataset lists some songs twice under different artist credits ("A;B" vs "A");
    # don't recommend a seed back to the user under its other credit.
    seed_credits = defaultdict(set)
    for index in seeds:
        song = catalog.songs[index]
        seed_credits[song["track_name"].strip().lower()].update(split_artists(song["artists"]))

    for seed, (weight, _) in seeds.items():
        distances = np.linalg.norm(catalog.features - catalog.features[seed], axis=1)
        k = min(NEIGHBOURS_PER_SEED, len(distances) - 1)
        nearest = np.argpartition(distances, k)[:k + 1] if k > 0 else np.arange(len(distances))
        seed_genres = catalog.genre_sets[seed]
        for candidate in nearest:
            candidate = int(candidate)
            if candidate in excluded:
                continue
            song = catalog.songs[candidate]
            credits = seed_credits.get(song["track_name"].strip().lower())
            if credits and credits & set(split_artists(song["artists"])):
                excluded.add(candidate)
                continue
            similarity = max(0.0, 1.0 - float(distances[candidate]) / SIM_SCALE)
            if similarity == 0.0:
                continue
            bonus = GENRE_BONUS if seed_genres & catalog.genre_sets[candidate] else 0.0
            bonus += POPULARITY_BONUS * float(catalog.popularity[candidate]) / 100.0
            contribution = weight * (similarity + bonus)
            scores[candidate] += contribution
            if contribution > best.get(candidate, (0.0, None))[0]:
                best[candidate] = (contribution, seed)
    return catalog, seeds, scores, best


def _reason(catalog, seeds, seed_index):
    seed_song = catalog.songs[seed_index]
    return {
        "type": seeds[seed_index][1],
        "song_id": seed_song["id"],
        "song_title": seed_song["track_name"],
        "song_artist": seed_song["artists"],
    }


def recommend_songs(db, uid, limit=20):
    catalog, seeds, scores, best = _score(db, uid)
    if not seeds:
        return {"cold_start": True, "items": []}

    has_history = any(kind == "history" for _, kind in seeds.values())
    history_slots = math.ceil(limit * HISTORY_SHARE) if has_history else 0
    like_slots = limit - history_slots

    per_artist = defaultdict(int)
    picked = {"like": [], "history": []}
    leftovers = []
    for candidate, score in sorted(scores.items(), key=lambda kv: kv[1], reverse=True):
        song = catalog.songs[candidate]
        lead_artist = (split_artists(song["artists"]) or [""])[0]
        if per_artist[lead_artist] >= MAX_PER_ARTIST:
            continue
        reason = _reason(catalog, seeds, best[candidate][1])
        item = {**song, "score": round(score, 3), "reason": reason}
        bucket = picked[reason["type"]]
        if len(bucket) < (like_slots if reason["type"] == "like" else history_slots):
            bucket.append(item)
            per_artist[lead_artist] += 1
        else:
            leftovers.append(item)
        if len(picked["like"]) + len(picked["history"]) >= limit:
            break

    items = picked["like"] + picked["history"]
    # If one side ran short (e.g. very little history), top up from the best of the rest.
    for item in leftovers:
        if len(items) >= limit:
            break
        items.append(item)
    items.sort(key=lambda i: (i["reason"]["type"] != "like", -i["score"]))
    return {"cold_start": False, "items": items}


def recommend_artists(db, uid, limit=8):
    catalog, seeds, scores, best = _score(db, uid)
    if not seeds:
        return {"cold_start": True, "items": []}

    known = {name for index in seeds for name in split_artists(catalog.songs[index]["artists"])}
    totals = defaultdict(float)
    top_seed = {}
    for candidate, score in scores.items():
        for name in split_artists(catalog.songs[candidate]["artists"]):
            if name in known:
                continue
            totals[name] += score
            if score > top_seed.get(name, (0.0, None))[0]:
                top_seed[name] = (score, best[candidate][1])

    ranked = sorted(totals.items(), key=lambda kv: kv[1], reverse=True)[: limit * 3]
    artists = {
        a.name: a
        for a in db.query(models.Artist).filter(models.Artist.name.in_([n for n, _ in ranked])).all()
    }
    items = []
    for name, score in ranked:
        artist = artists.get(name)
        if artist is None:
            continue
        items.append({
            "id": artist.id,
            "name": artist.name,
            "song_count": artist.song_count,
            "picture_url": artist.picture_url,
            "picture_checked": artist.picture_checked_at is not None,
            "score": round(score, 3),
            "reason": _reason(catalog, seeds, top_seed[name][1]),
        })
        if len(items) >= limit:
            break
    return {"cold_start": False, "items": items}
