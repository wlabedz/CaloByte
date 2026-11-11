from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from models import ActivityLevel, Sex


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    surname: str = Field(min_length=1, max_length=100)
    email: EmailStr
    birth_date: date
    weight_kg: float = Field(gt=0, lt=500)
    height_cm: float = Field(gt=0, lt=300)
    activity: ActivityLevel = ActivityLevel.moderate
    sex: Sex


class UserOut(UserCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bmi: float
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    # Id of the previous Gemini interaction; None starts a new conversation.
    interaction_id: str | None = Field(default=None, max_length=200)


class RecipeOut(BaseModel):
    # A recipe from the `recipes` table; id links to /recipes/{id}, macros are per serving.
    id: UUID
    meal: str
    title: str
    original_title: str
    category: str | None
    url: str | None
    ready_in_minutes: int | None
    servings: int | None
    calories: int | None
    protein_g: int | None
    carbs_g: int | None
    fat_g: int | None


class ChatResponse(BaseModel):
    message: str
    recipes: list[RecipeOut]
    interaction_id: str
