from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DB_USER = os.getenv("DATABASE_USER", "root")
DB_PASS = os.getenv("DATABASE_PASSWORD", "root")
DB_HOST = os.getenv("DATABASE_HOST", "db")
DB_NAME = os.getenv("DATABASE_DB", "main")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
