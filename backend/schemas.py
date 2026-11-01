from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

class CancionRespuesta(BaseModel):
    id: int
    track_id: Optional[str] = None
    track_name: Optional[str] = None
    artists: Optional[str] = None
    album_name: Optional[str] = None
    track_genre: Optional[str] = None
    popularity: Optional[int] = 0
    duration_ms: Optional[int] = 0
    explicit: Optional[bool] = False
    danceability: Optional[float] = 0.0
    energy: Optional[float] = 0.0
    loudness: Optional[float] = 0.0
    acousticness: Optional[float] = 0.0
    valence: Optional[float] = 0.0
    genres: Optional[list[str]] = None
    estado: Optional[str] = None

    class Config:
        from_attributes = True

class CancionCreate(BaseModel):
    track_id: str
    track_name: str
    artists: str
    album_name: str
    track_genre: str
    popularity: int
    duration_ms: int
    explicit: bool
    danceability: float
    energy: float
    loudness: float
    acousticness: float
    valence: float

    @field_validator("loudness")
    @classmethod
    def loudness_must_be_negative(cls, v):
        if v > 0:
            raise ValueError("loudness debe ser un valor negativo o cero")
        return v

    @field_validator("popularity")
    @classmethod
    def popularity_range(cls, v):
        if not (0 <= v <= 100):
            raise ValueError("popularity debe estar entre 0 y 100")
        return v

    @field_validator("danceability", "energy", "acousticness", "valence")
    @classmethod
    def normalized_range(cls, v):
        if not (0.0 <= v <= 1.0):
            raise ValueError("debe estar entre 0.0 y 1.0")
        return v

class GenreStat(BaseModel):
    genre: str
    value: float

class KpiStats(BaseModel):
    total_songs: int
    avg_valence: float
    avg_energy: float
    avg_popularity: float

class UserProfileCreate(BaseModel):
    uid: str
    display_name: str
    email: str
    photo_url: Optional[str] = None

class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    public_email: Optional[bool] = None
    public_bio: Optional[bool] = None
    public_genres: Optional[bool] = None
    role: Optional[str] = None

class UserProfileResponse(BaseModel):
    uid: str
    display_name: str
    email: Optional[str] = None
    photo_url: Optional[str] = None
    bio: Optional[str] = None
    role: str
    top_genres: Optional[str] = None
    public_email: bool
    public_bio: bool
    public_genres: bool

    class Config:
        from_attributes = True

class FriendshipResponse(BaseModel):
    id: int
    requester_uid: str
    addressee_uid: str
    status: str

    class Config:
        from_attributes = True

class FriendRequestResponse(BaseModel):
    id: int
    requester_uid: str
    requester_name: str
    requester_photo: Optional[str] = None
    created_at: datetime

class CommentCreate(BaseModel):
    song_id: int
    user_uid: str
    user_name: str
    user_photo: Optional[str] = None
    content: str

class CommentResponse(BaseModel):
    id: int
    song_id: int
    user_uid: str
    user_name: str
    user_photo: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class LikeCreate(BaseModel):
    user_uid: str
    song_id: int
    type: str = "like"
    reaction: Optional[str] = None

class LikeUpdate(BaseModel):
    note: Optional[str] = None

class LikeResponse(BaseModel):
    id: int
    user_uid: str
    song_id: int
    type: str
    reaction: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LikeWithSongResponse(BaseModel):
    id: int
    song_id: int
    type: str
    reaction: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime
    track_name: Optional[str] = None
    artists: Optional[str] = None
    track_genre: Optional[str] = None