from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

from db import database_url
from seed.load import load_catalog


def main() -> None:
    engine = create_engine(database_url(unpooled=True), poolclass=NullPool)
    with Session(engine) as session:
        report = load_catalog(session, Path(__file__).parent)
    for name in ("products", "recipes"):
        c = getattr(report, name)
        print(f"{name}: inserted={c.inserted} updated={c.updated} unchanged={c.unchanged}")


if __name__ == "__main__":
    main()
