from sqlalchemy import Column, Integer, String, Float, Boolean
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