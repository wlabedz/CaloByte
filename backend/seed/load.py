import csv
import json
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from models import Product, ProductSource, Recipe, RecipeSource

csv.field_size_limit(2**31 - 1)

CHUNK = 500


@dataclass
class Counts:
    inserted: int = 0
    updated: int = 0
    unchanged: int = 0


@dataclass
class SeedReport:
    products: Counts
    recipes: Counts


def _dec(value: str, scale: int) -> Decimal | None:
    if value == "":
        return None
    return Decimal(value).quantize(Decimal(1).scaleb(-scale))


def _int(value: str) -> int | None:
    return None if value == "" else int(value)


def _text(value: str) -> str | None:
    return None if value == "" else value


def _product_values(row: dict) -> dict:
    return {
        "name": row["name"],
        "name_en": _text(row["name_en"]),
        "kcal": _dec(row["kcal"], 2),
        "protein": _dec(row["protein"], 2),
        "fat": _dec(row["fat"], 2),
        "carbs": _dec(row["carbs"], 2),
        "fiber": _dec(row["fiber"], 2),
    }


def _recipe_values(row: dict) -> dict:
    return {
        "name": row["name"],
        "category": _text(row["category"]),
        "category_path": _text(row["category_path"]),
        "servings": int(row["servings"]),
        "prep_min": _int(row["prep_min"]),
        "cook_min": _int(row["cook_min"]),
        "total_min": _int(row["total_min"]),
        "ingredients_text": json.loads(row["ingredients_json"]),
        "directions": row["directions"],
        "rating": _dec(row["rating"], 1),
        "source_url": _text(row["source_url"]),
        "kcal": _dec(row["kcal"], 2),
        "protein": _dec(row["protein"], 2),
        "fat": _dec(row["fat"], 2),
        "carbs": _dec(row["carbs"], 2),
        "fiber": _dec(row["fiber"], 2),
    }


def _read(path: Path, to_values) -> dict[str, dict]:
    with path.open(newline="", encoding="utf-8") as f:
        return {row["external_id"]: to_values(row) for row in csv.DictReader(f)}


def _upsert(session: Session, model, source, wanted: dict[str, dict]) -> Counts:
    """Insert new rows and update changed ones, keyed by (source, external_id).

    Only rows of the given seed source are read or written, so user rows are
    never touched. Numeric values are already quantized to column scale.
    """
    columns = list(next(iter(wanted.values())).keys()) if wanted else []
    existing = {
        row.external_id: {c: getattr(row, c) for c in columns}
        for row in session.scalars(select(model).where(model.source == source))
    }
    counts = Counts()
    todo = []
    for external_id, values in wanted.items():
        if external_id not in existing:
            counts.inserted += 1
        elif existing[external_id] != values:
            counts.updated += 1
        else:
            counts.unchanged += 1
            continue
        todo.append({"source": source, "external_id": external_id, **values})

    for i in range(0, len(todo), CHUNK):
        stmt = insert(model).values(todo[i : i + CHUNK])
        stmt = stmt.on_conflict_do_update(
            index_elements=["source", "external_id"],
            set_={**{c: stmt.excluded[c] for c in columns}, "updated_at": func.now()},
        )
        session.execute(stmt)
    session.commit()
    return counts


def load_catalog(session: Session, seed_dir: Path) -> SeedReport:
    seed_dir = Path(seed_dir)
    products = _read(seed_dir / "products.csv", _product_values)
    recipes = _read(seed_dir / "recipes.csv", _recipe_values)
    return SeedReport(
        products=_upsert(session, Product, ProductSource.usda, products),
        recipes=_upsert(session, Recipe, RecipeSource.kaggle, recipes),
    )
