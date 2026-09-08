from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.sql import func
import database

class Cancion(database.Base):
    __tablename__ = "songs"

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