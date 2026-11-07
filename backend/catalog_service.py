import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Recipe, RecipeItem, RecipeSource
from nutrition import Macros, recipe_per_serving


def _product_macros(product) -> Macros:
    return Macros(product.kcal, product.protein, product.fat, product.carbs, product.fiber)


def recipe_macros(recipe: Recipe) -> Macros:
    """Per-serving macros computed from the recipe's items."""
    return recipe_per_serving(
        [(_product_macros(i.product), i.weight_g) for i in recipe.items],
        recipe.servings,
    )


def recalculate_recipes_for_product(session: Session, product_id: uuid.UUID) -> int:
    """Recompute macros of user recipes using the product. Does not commit."""
    session.flush()
    recipes = session.scalars(
        select(Recipe)
        .where(
            Recipe.source == RecipeSource.user,
            Recipe.items.any(RecipeItem.product_id == product_id),
        )
        .execution_options(populate_existing=True)
    ).all()
    for recipe in recipes:
        m = recipe_macros(recipe)
        recipe.kcal, recipe.protein, recipe.fat = m.kcal, m.protein, m.fat
        recipe.carbs, recipe.fiber = m.carbs, m.fiber
    return len(recipes)
