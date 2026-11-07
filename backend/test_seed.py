import csv
import json
from pathlib import Path

import pytest
from sqlalchemy import select

from models import Product, ProductSource, Recipe, RecipeSource
from seed.load import load_catalog
from seed.prepare import PRODUCT_COLUMNS, RECIPE_COLUMNS


def _write(path: Path, columns, rows):
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=columns)
        w.writeheader()
        w.writerows(rows)


def _product(i, **kw):
    row = {"external_id": str(i), "name": f"Produkt {i}", "name_en": f"Product {i}",
           "kcal": "100", "protein": "4.8", "fat": "1", "carbs": "20", "fiber": "2"}
    row.update(kw)
    return row


def _recipe(i, **kw):
    row = {"external_id": str(i), "name": f"Przepis {i}", "category": "Desserts",
           "category_path": "Desserts/Fruit", "servings": "4", "prep_min": "10",
           "cook_min": "", "total_min": "", "ingredients_json": json.dumps(["1 egg", "2 cups, flour"]),
           "directions": "Mix.", "rating": "4.8", "source_url": "http://x/1",
           "kcal": "250.5", "protein": "5", "fat": "6", "carbs": "30", "fiber": "1"}
    row.update(kw)
    return row


@pytest.fixture
def seed_dir(tmp_path):
    _write(tmp_path / "products.csv", PRODUCT_COLUMNS, [_product(1), _product(2)])
    _write(tmp_path / "recipes.csv", RECIPE_COLUMNS, [_recipe(1), _recipe(2), _recipe(3)])
    return tmp_path


def test_first_run_inserts_all(db_session, seed_dir):
    report = load_catalog(db_session, seed_dir)
    assert (report.products.inserted, report.products.updated, report.products.unchanged) == (2, 0, 0)
    assert (report.recipes.inserted, report.recipes.updated, report.recipes.unchanged) == (3, 0, 0)
    r = db_session.scalars(select(Recipe).where(Recipe.external_id == "1")).one()
    assert r.ingredients_text == ["1 egg", "2 cups, flour"]
    assert r.cook_min is None
    assert r.source == RecipeSource.kaggle


def test_seed_is_idempotent(db_session, seed_dir):
    load_catalog(db_session, seed_dir)
    before = {r.external_id: r.updated_at for r in db_session.scalars(select(Recipe))}
    report = load_catalog(db_session, seed_dir)
    assert (report.products.inserted, report.products.updated, report.products.unchanged) == (0, 0, 2)
    assert (report.recipes.inserted, report.recipes.updated, report.recipes.unchanged) == (0, 0, 3)
    db_session.expire_all()
    after = {r.external_id: r.updated_at for r in db_session.scalars(select(Recipe))}
    assert before == after


def test_seed_updates_changed_row_only(db_session, seed_dir):
    load_catalog(db_session, seed_dir)
    user_recipe = Recipe(name="Moje", source=RecipeSource.user, servings=1,
                         ingredients_text=[], directions="x", kcal=1, protein=0, fat=0, carbs=0, fiber=0)
    db_session.add(user_recipe)
    db_session.commit()
    _write(seed_dir / "recipes.csv", RECIPE_COLUMNS,
           [_recipe(1), _recipe(2, name="Nowa nazwa"), _recipe(3)])
    report = load_catalog(db_session, seed_dir)
    assert (report.recipes.inserted, report.recipes.updated, report.recipes.unchanged) == (0, 1, 2)
    db_session.expire_all()
    assert db_session.scalars(select(Recipe).where(Recipe.external_id == "2")).one().name == "Nowa nazwa"
    assert db_session.get(Recipe, user_recipe.id).name == "Moje"


def test_seed_creates_no_user_records(db_session, seed_dir):
    load_catalog(db_session, seed_dir)
    assert db_session.scalars(select(Recipe).where(Recipe.source == RecipeSource.user)).all() == []
    assert db_session.scalars(select(Product).where(Product.source == ProductSource.user)).all() == []
