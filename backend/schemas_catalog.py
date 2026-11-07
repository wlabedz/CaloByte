import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, model_validator

from models import ProductSource, RecipeSource

# Decimal internally, JSON number on the wire (Pydantic v2 emits strings by default).
JsonDecimal = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    kcal: Decimal = Field(ge=0, le=900)
    protein: Decimal = Field(ge=0)
    fat: Decimal = Field(ge=0)
    carbs: Decimal = Field(ge=0)
    fiber: Decimal = Field(ge=0)

    @model_validator(mode="after")
    def macros_within_100g(self):
        if self.protein + self.fat + self.carbs > 100:
            raise ValueError("Suma białka, tłuszczu i węglowodanów nie może przekraczać 100 g.")
        return self


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    name_en: str | None
    source: ProductSource
    kcal: JsonDecimal
    protein: JsonDecimal
    fat: JsonDecimal
    carbs: JsonDecimal
    fiber: JsonDecimal


class RecipeItemIn(BaseModel):
    product_id: uuid.UUID
    weight_g: Decimal = Field(gt=0, le=10000)


class RecipeIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    servings: int = Field(ge=1, le=100)
    category: str | None = Field(default=None, max_length=100)
    prep_min: int | None = Field(default=None, ge=0, le=10000)
    cook_min: int | None = Field(default=None, ge=0, le=10000)
    directions: str = Field(default="", max_length=10000)
    items: list[RecipeItemIn] = Field(min_length=1, max_length=50)


class RecipeItemOut(BaseModel):
    product_id: uuid.UUID
    product_name: str
    weight_g: JsonDecimal
    kcal: JsonDecimal
    protein: JsonDecimal
    fat: JsonDecimal
    carbs: JsonDecimal
    fiber: JsonDecimal


class RecipeSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    source: RecipeSource
    category: str | None
    servings: int
    total_min: int | None
    kcal: JsonDecimal
    protein: JsonDecimal
    fat: JsonDecimal
    carbs: JsonDecimal
    fiber: JsonDecimal


class RecipeDetail(RecipeSummary):
    category_path: str | None
    prep_min: int | None
    cook_min: int | None
    ingredients_text: list[str]
    directions: str
    rating: JsonDecimal | None
    source_url: str | None
    items: list[RecipeItemOut]
    created_at: datetime
    updated_at: datetime


class RecipePage(BaseModel):
    items: list[RecipeSummary]
    total: int
    page: int
    limit: int


class CategoryCount(BaseModel):
    category: str
    count: int
