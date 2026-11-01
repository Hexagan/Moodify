from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, UniqueConstraint, Index, JSON
from sqlalchemy.sql import func
import database

class Cancion(database.Base):
    __tablename__ = "songs"
    __table_args__ = (
        Index("ix_songs_dedup", "track_name", "artists", "popularity", "id"),
        Index("ix_songs_genre", "track_genre"),
    )

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(String)
    artists = Column(String)
    album_name = Column(String)
    track_name = Column(String)
    popularity = Column(Integer)
    duration_ms = Column(Integer)
    explicit = Column(Boolean)
    danceability = Column(Float)
    energy = Column(Float)
    loudness = Column(Float)
    acousticness = Column(Float)
    valence = Column(Float)
    track_genre = Column(String)

class UserProfile(database.Base):
    __tablename__ = "user_profiles"

    uid = Column(String, primary_key=True)
    display_name = Column(String)
    email = Column(String)
    photo_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    role = Column(String, default="user")
    top_genres = Column(String, nullable=True)
    public_email = Column(Boolean, default=False)
    public_bio = Column(Boolean, default=True)
    public_genres = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Friendship(database.Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    requester_uid = Column(String, ForeignKey("user_profiles.uid"))
    addressee_uid = Column(String, ForeignKey("user_profiles.uid"))
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Comment(database.Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    song_id = Column(Integer, ForeignKey("songs.id"))
    user_uid = Column(String, ForeignKey("user_profiles.uid"))
    user_name = Column(String)
    user_photo = Column(String, nullable=True)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Artist(database.Base):
    __tablename__ = "artists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    song_count = Column(Integer, default=0)
    top_popularity = Column(Integer, default=0)
    picture_url = Column(String, nullable=True)
    picture_checked_at = Column(DateTime(timezone=True), nullable=True)
    bio = Column(Text, nullable=True)
    bio_url = Column(String, nullable=True)
    bio_checked_at = Column(DateTime(timezone=True), nullable=True)

class ArtistThread(database.Base):
    __tablename__ = "artist_threads"

    id = Column(Integer, primary_key=True, index=True)
    artist_id = Column(Integer, ForeignKey("artists.id"), index=True, nullable=False)
    author_uid = Column(String, ForeignKey("user_profiles.uid"), nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)
    media_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True)
    reply_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    edited_at = Column(DateTime(timezone=True), nullable=True)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class ArtistPost(database.Base):
    __tablename__ = "artist_posts"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("artist_threads.id"), index=True, nullable=False)
    author_uid = Column(String, ForeignKey("user_profiles.uid"), nullable=False)
    body = Column(Text, nullable=True)
    media_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    edited_at = Column(DateTime(timezone=True), nullable=True)

class SongHistory(database.Base):
    """One row per user and song - a playlist of what they listened to, not an event log."""
    __tablename__ = "song_history"
    __table_args__ = (UniqueConstraint("user_uid", "song_id", name="uix_user_song_history"),)

    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String, ForeignKey("user_profiles.uid"), index=True, nullable=False)
    song_id = Column(Integer, ForeignKey("songs.id"), nullable=False)
    preview_plays = Column(Integer, default=0)
    detail_views = Column(Integer, default=0)
    first_played_at = Column(DateTime(timezone=True), server_default=func.now())
    last_played_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class SongMedia(database.Base):
    __tablename__ = "song_media"

    track_id = Column(String, primary_key=True)
    thumbnail_url = Column(String, nullable=True)
    thumbnail_checked_at = Column(DateTime(timezone=True), nullable=True)
    preview_url = Column(String, nullable=True)
    preview_source = Column(String, nullable=True)
    preview_ref = Column(String, nullable=True)
    preview_artwork_url = Column(String, nullable=True)
    preview_checked_at = Column(DateTime(timezone=True), nullable=True)
    # "api" (found by search), "manual" (set from the ABM) or "none" (searched, nothing usable).
    youtube_id = Column(String, nullable=True)
    youtube_source = Column(String, nullable=True)
    youtube_checked_at = Column(DateTime(timezone=True), nullable=True)

class SongLike(database.Base):
    __tablename__ = "song_likes"
    __table_args__ = (UniqueConstraint("user_uid", "song_id", name="uix_user_song_like"),)

    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String, ForeignKey("user_profiles.uid"))
    song_id = Column(Integer, ForeignKey("songs.id"))
    type = Column(String, default="like")
    reaction = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
class Playlist(database.Base):
    __tablename__ = "playlists"

    id = Column(Integer, primary_key=True, index=True)
    owner_uid = Column(String, ForeignKey("user_profiles.uid"), index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    # "public" (anyone with the link, guests included), "friends" or "private".
    visibility = Column(String, default="private", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class PlaylistSong(database.Base):
    __tablename__ = "playlist_songs"
    __table_args__ = (UniqueConstraint("playlist_id", "song_id", name="uix_playlist_song"),)

    id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"), index=True, nullable=False)
    song_id = Column(Integer, ForeignKey("songs.id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

class UserSettings(database.Base):
    __tablename__ = "user_settings"

    uid = Column(String, ForeignKey("user_profiles.uid"), primary_key=True)
    # Free-form preferences written by the Configuración page (colour profiles, accessibility...).
    data = Column(JSON, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Suggestion(database.Base):
    __tablename__ = "suggestions"

    # Kept even when the email fails, so nothing sent from the contact page is lost.
    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String, ForeignKey("user_profiles.uid", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    emailed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
