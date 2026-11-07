import os
from pathlib import Path
from urllib.parse import urlparse

DEFAULT_TEST_URL = "postgresql://postgres:postgres@localhost:5432/calobyte_test"
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "postgres"}

# Must be set before `db` / `app` are imported (db.py reads CALOBYTE_TESTING at import).
os.environ["CALOBYTE_TESTING"] = "1"
os.environ.setdefault("DATABASE_URL", DEFAULT_TEST_URL)
os.environ.setdefault("DATABASE_URL_UNPOOLED", os.environ["DATABASE_URL"])


def assert_local_database_url(url: str) -> None:
    host = urlparse(url).hostname
    if host not in LOCAL_HOSTS:
        raise RuntimeError(f"Refusing to run tests against non-local database host: {host!r}")


for _name in ("DATABASE_URL", "DATABASE_URL_UNPOOLED"):
    assert_local_database_url(os.environ[_name])

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app import app
from db import database_url, get_db


@pytest.fixture(scope="session")
def engine():
    command.upgrade(Config(str(Path(__file__).parent / "alembic.ini")), "head")
    engine = create_engine(database_url(), poolclass=NullPool)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(engine):
    with sessionmaker(engine)() as session:
        yield session
    with engine.begin() as conn:
        tables = conn.execute(
            text("select tablename from pg_tables where schemaname = 'public' and tablename <> 'alembic_version'")
        ).scalars().all()
        if tables:
            names = ", ".join(f'"{t}"' for t in tables)
            conn.execute(text(f"TRUNCATE {names} CASCADE"))


@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.clear()
