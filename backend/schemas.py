from pydantic import BaseModel, field_validator
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