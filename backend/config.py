import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


class Config:
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_PORT = os.environ.get("DB_PORT", "3306")
    DB_NAME = os.environ.get("DB_NAME", "kidsfunzone")
    DB_USER = os.environ.get("DB_USER", "CHANGE_ME")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "CHANGE_ME")

    if os.environ.get("USE_SQLITE") == "true":
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{ROOT_DIR / 'kidsfunzone.db'}"
    else:
        SQLALCHEMY_DATABASE_URI = (
            f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "CHANGE_ME")

    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@kidsfunzone.in")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "CHANGE_ME")
