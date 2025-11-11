from collections.abc import Generator

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db


def get_settings():
    return settings


def get_db_session() -> Generator[Session, None, None]:
    yield from get_db()
