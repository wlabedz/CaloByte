import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Computed,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class ActivityLevel(enum.Enum):
    sedentary = "sedentary"
    light = "light"
    moderate = "moderate"
    active = "active"
    very_active = "very_active"

class Sex(enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(100))
    surname: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255))
    birth_date: Mapped[date]
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    height_cm: Mapped[Decimal] = mapped_column(Numeric(5, 1))
    activity: Mapped[ActivityLevel] = mapped_column(
        Enum(ActivityLevel, name="activity_level"),
        server_default=ActivityLevel.moderate.value,
    )
    sex: Mapped[Sex] = mapped_column(
        Enum(Sex, name="sex"), server_default=Sex.male.value
    )
    bmi: Mapped[Decimal] = mapped_column(
        Numeric(4, 1),
        Computed("weight_kg / ((height_cm / 100) ^ 2)", persisted=True),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint("weight_kg > 0 AND weight_kg < 500", name="weight_range"),
        CheckConstraint("height_cm > 0 AND height_cm < 300", name="height_range"),
    )


Index("users_email_key", func.lower(User.email), unique=True)


class ProductSource(enum.Enum):
    usda = "usda"
    user = "user"


class RecipeSource(enum.Enum):
    kaggle = "kaggle"
    user = "user"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(200))
    name_en: Mapped[str | None] = mapped_column(String(200))
    source: Mapped[ProductSource] = mapped_column(
        Enum(ProductSource, name="product_source")
    )
    external_id: Mapped[str | None] = mapped_column(String(50))
    kcal: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    protein: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    fat: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    carbs: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    fiber: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("source", "external_id", name="products_source_external_key"),
        CheckConstraint(
            "kcal >= 0 AND protein >= 0 AND fat >= 0 AND carbs >= 0 AND fiber >= 0",
            name="product_macros_nonneg",
        ),
    )


Index("products_name_lower_idx", func.lower(Product.name))


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(200))
    source: Mapped[RecipeSource] = mapped_column(
        Enum(RecipeSource, name="recipe_source")
    )
    external_id: Mapped[str | None] = mapped_column(String(50))
    category: Mapped[str | None] = mapped_column(String(100))
    category_path: Mapped[str | None] = mapped_column(String(300))
    servings: Mapped[int] = mapped_column(Integer)
    prep_min: Mapped[int | None] = mapped_column(Integer)
    cook_min: Mapped[int | None] = mapped_column(Integer)
    total_min: Mapped[int | None] = mapped_column(Integer)
    ingredients_text: Mapped[list[str]] = mapped_column(ARRAY(Text))
    directions: Mapped[str] = mapped_column(Text)
    rating: Mapped[Decimal | None] = mapped_column(Numeric(2, 1))
    source_url: Mapped[str | None] = mapped_column(String(300))
    kcal: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    protein: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    fat: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    carbs: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    fiber: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    items: Mapped[list["RecipeItem"]] = relationship(
        back_populates="recipe",
        order_by="RecipeItem.position",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("source", "external_id", name="recipes_source_external_key"),
        CheckConstraint("servings >= 1", name="recipe_servings_min"),
        CheckConstraint("prep_min >= 0", name="recipe_prep_min_nonneg"),
        CheckConstraint("cook_min >= 0", name="recipe_cook_min_nonneg"),
        CheckConstraint("total_min >= 0", name="recipe_total_min_nonneg"),
        Index("recipes_category_idx", "category"),
    )


Index("recipes_name_lower_idx", func.lower(Recipe.name))


class RecipeItem(Base):
    __tablename__ = "recipe_items"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, server_default=text("gen_random_uuid()")
    )
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE")
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT")
    )
    weight_g: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    position: Mapped[int] = mapped_column(Integer)

    recipe: Mapped["Recipe"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()

    __table_args__ = (
        CheckConstraint("weight_g > 0", name="recipe_item_weight_pos"),
    )
