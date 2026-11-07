from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from models import Product, ProductSource, Recipe, RecipeItem, RecipeSource


def make_product(name="Mleko", external_id="1", **kw):
    return Product(
        name=name, source=ProductSource.usda, external_id=external_id,
        kcal=Decimal(60), protein=Decimal(3), fat=Decimal(3),
        carbs=Decimal(5), fiber=Decimal(0), **kw,
    )


def make_recipe(name="Omlet", external_id="r1", **kw):
    return Recipe(
        name=name, source=RecipeSource.kaggle, external_id=external_id,
        servings=2, ingredients_text=["2 jajka", "mleko"], directions="Wymieszaj.",
        kcal=Decimal(200), protein=Decimal(10), fat=Decimal(12),
        carbs=Decimal(5), fiber=Decimal(1), **kw,
    )


def test_recipe_items_ordered_by_position(db_session):
    p1, p2 = make_product("A", "1"), make_product("B", "2")
    r = make_recipe()
    r.items = [
        RecipeItem(product=p2, weight_g=Decimal(50), position=1),
        RecipeItem(product=p1, weight_g=Decimal(100), position=0),
    ]
    db_session.add(r)
    db_session.commit()
    db_session.expire_all()
    got = db_session.scalars(select(Recipe)).one()
    assert [i.product.name for i in got.items] == ["A", "B"]
    assert got.ingredients_text == ["2 jajka", "mleko"]
    assert got.id is not None and got.created_at is not None


def test_delete_recipe_deletes_items(db_session):
    r = make_recipe()
    r.items = [RecipeItem(product=make_product(), weight_g=Decimal(10), position=0)]
    db_session.add(r)
    db_session.commit()
    db_session.delete(r)
    db_session.commit()
    assert db_session.scalars(select(RecipeItem)).all() == []
    assert len(db_session.scalars(select(Product)).all()) == 1


def test_delete_used_product_restricted(db_session):
    p = make_product()
    r = make_recipe()
    r.items = [RecipeItem(product=p, weight_g=Decimal(10), position=0)]
    db_session.add(r)
    db_session.commit()
    db_session.delete(p)
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()


def test_duplicate_source_external_id(db_session):
    db_session.add_all([make_product("A", "1"), make_product("B", "1")])
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()
    db_session.add_all([make_recipe("A", "x"), make_recipe("B", "x")])
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()


def test_weight_must_be_positive(db_session):
    r = make_recipe()
    r.items = [RecipeItem(product=make_product(), weight_g=Decimal(0), position=0)]
    db_session.add(r)
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()
