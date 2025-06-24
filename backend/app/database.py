from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DB_URL = os.getenv("DATABASE_URL")
if DB_URL:
    if DB_URL.startswith("mysql://"):
        DB_URL = DB_URL.replace("mysql://", "mysql+pymysql://", 1)
    SQLALCHEMY_DATABASE_URL = DB_URL
else:
    DB_USER = os.getenv("DATABASE_USER")
    DB_PASS = os.getenv("DATABASE_PASSWORD")
    DB_HOST = os.getenv("DATABASE_HOST")
    DB_PORT = os.getenv("DATABASE_PORT")
    DB_NAME = os.getenv("DATABASE_DB")
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
