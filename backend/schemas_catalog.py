import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from models import ProductSource


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
    kcal: Decimal
    protein: Decimal
    fat: Decimal
    carbs: Decimal
    fiber: Decimal
