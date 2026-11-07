import os
from functools import cache

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

if not os.environ.get("CALOBYTE_TESTING"):
    load_dotenv(".env.local")


def database_url(unpooled: bool = False) -> str:
    url = os.environ["DATABASE_URL_UNPOOLED" if unpooled else "DATABASE_URL"]
    return url.replace("postgresql://", "postgresql+psycopg://", 1)


class Base(DeclarativeBase):
    pass


@cache
def make_session():
    engine = create_engine(database_url(), poolclass=NullPool)
    return sessionmaker(engine)


def get_db():
    with make_session()() as session:
        yield session