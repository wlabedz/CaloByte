import uuid
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import catalog_service
from auth import CurrentUser, OptionalUser
from db import get_db
from models import Product, Recipe, RecipeItem, RecipeSource, User
from nutrition import Macros, item_macros
from schemas_catalog import (
    CategoryCount,
    RecipeDetail,
    RecipeIn,
    RecipeItemOut,
    RecipePage,
    RecipeSummary,
)

DbSession = Annotated[Session, Depends(get_db)]

router = APIRouter(prefix="/recipes", tags=["recipes"])


def _get_or_404(db: Session, recipe_id: uuid.UUID) -> Recipe:
    recipe = db.get(Recipe, recipe_id)
    if recipe is None:
        raise HTTPException(404, "Nie znaleziono przepisu.")
    return recipe


def _get_editable(db: Session, recipe_id: uuid.UUID, user: User) -> Recipe:
    recipe = _get_or_404(db, recipe_id)
    if recipe.source != RecipeSource.user:
        raise HTTPException(403, "Przepisów z katalogu nie można zmieniać.")
    if recipe.user_id != user.id:
        raise HTTPException(403, "Możesz zmieniać tylko własne przepisy.")
    return recipe


def _fmt_weight(w: Decimal) -> str:
    return format(w.normalize(), "f")


def _item_out(item: RecipeItem) -> RecipeItemOut:
    p = item.product
    m = item_macros(Macros(p.kcal, p.protein, p.fat, p.carbs, p.fiber), item.weight_g)
    return RecipeItemOut(
        product_id=item.product_id,
        product_name=p.name,
        weight_g=item.weight_g,
        kcal=m.kcal,
        protein=m.protein,
        fat=m.fat,
        carbs=m.carbs,
        fiber=m.fiber,
    )


def _detail(recipe: Recipe) -> RecipeDetail:
    fields = {n: getattr(recipe, n) for n in RecipeDetail.model_fields if n != "items"}
    items = [_item_out(i) for i in recipe.items] if recipe.source == RecipeSource.user else []
    return RecipeDetail(**fields, items=items)


def _apply(db: Session, recipe: Recipe, data: RecipeIn) -> None:
    ids = {i.product_id for i in data.items}
    products = {p.id: p for p in db.scalars(select(Product).where(Product.id.in_(ids)))}
    for n, item in enumerate(data.items, start=1):
        if item.product_id not in products:
            raise HTTPException(422, f"Pozycja {n}: nie znaleziono produktu.")

    recipe.name = data.name
    recipe.servings = data.servings
    recipe.category = data.category
    recipe.prep_min = data.prep_min
    recipe.cook_min = data.cook_min
    recipe.total_min = (
        (data.prep_min or 0) + (data.cook_min or 0)
        if data.prep_min is not None or data.cook_min is not None
        else None
    )
    recipe.directions = data.directions
    recipe.items = [
        RecipeItem(product=products[i.product_id], weight_g=i.weight_g, position=pos)
        for pos, i in enumerate(data.items)
    ]
    recipe.ingredients_text = [
        f"{_fmt_weight(i.weight_g)} g {i.product.name}" for i in recipe.items
    ]
    m = catalog_service.recipe_macros(recipe)
    recipe.kcal, recipe.protein, recipe.fat = m.kcal, m.protein, m.fat
    recipe.carbs, recipe.fiber = m.carbs, m.fiber


@router.get("", response_model=RecipePage)
def list_recipes(
    db: DbSession,
    user: OptionalUser,
    q: str | None = None,
    category: str | None = None,
    source: RecipeSource | None = None,
    mine: bool = False,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    conditions = []
    if q:
        conditions.append(func.lower(Recipe.name).contains(q.lower(), autoescape=True))
    if category:
        conditions.append(Recipe.category == category)
    if source:
        conditions.append(Recipe.source == source)
    if mine:
        if user is None:
            raise HTTPException(401, "Zaloguj się, aby zobaczyć swoje przepisy.")
        conditions.append(Recipe.user_id == user.id)
    total = db.scalar(select(func.count()).select_from(Recipe).where(*conditions)) or 0
    rows = db.scalars(
        select(Recipe)
        .where(*conditions)
        .order_by(Recipe.name, Recipe.id)
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return RecipePage(
        items=[RecipeSummary.model_validate(r) for r in rows],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/categories", response_model=list[CategoryCount])
def list_categories(db: DbSession):
    count = func.count()
    rows = db.execute(
        select(Recipe.category, count)
        .where(Recipe.category.is_not(None))
        .group_by(Recipe.category)
        .order_by(count.desc(), Recipe.category)
    ).all()
    return [CategoryCount(category=c, count=n) for c, n in rows]


@router.get("/{recipe_id}", response_model=RecipeDetail)
def get_recipe(recipe_id: uuid.UUID, db: DbSession):
    return _detail(_get_or_404(db, recipe_id))


@router.post("", response_model=RecipeDetail, status_code=201)
def create_recipe(data: RecipeIn, db: DbSession, user: CurrentUser):
    recipe = Recipe(source=RecipeSource.user, user_id=user.id, ingredients_text=[],
                    kcal=0, protein=0, fat=0, carbs=0, fiber=0)
    _apply(db, recipe, data)
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return _detail(recipe)


@router.put("/{recipe_id}", response_model=RecipeDetail)
def update_recipe(recipe_id: uuid.UUID, data: RecipeIn, db: DbSession, user: CurrentUser):
    recipe = _get_editable(db, recipe_id, user)
    _apply(db, recipe, data)
    db.commit()
    db.refresh(recipe)
    return _detail(recipe)


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: uuid.UUID, db: DbSession, user: CurrentUser):
    recipe = _get_editable(db, recipe_id, user)
    db.delete(recipe)
    db.commit()
    return Response(status_code=204)
