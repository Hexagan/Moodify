import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:1234@localhost:5432/moodify")

# On Vercel every function instance would keep its own pool of idle connections, quickly
# exhausting the database's limit, so there each request opens and closes its own.
if os.environ.get("VERCEL"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, poolclass=NullPool)
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()