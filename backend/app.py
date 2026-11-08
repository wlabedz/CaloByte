from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from chat import AIServiceError, run_chat
from db import get_db
from models import User
from routers import products, recipes
from schemas import ChatRequest, ChatResponse, UserCreate, UserOut

DbSession = Annotated[Session, Depends(get_db)]

app = FastAPI()
app.include_router(products.router)
app.include_router(recipes.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://wlabedz.github.io", 
        "http://localhost:4200",  
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "/hello"}


@app.get("/hello")
def hello():
    return {"message": "Hello World!"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/users", response_model=list[UserOut])
def list_users(db: DbSession):
    return db.scalars(select(User).order_by(User.created_at)).all()


@app.post("/users", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, db: DbSession):
    user = User(**data.model_dump())
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "User with this email already exists") from None
    db.refresh(user)
    return user


@app.post("/chat", response_model=ChatResponse)
def chat(data: ChatRequest, db: DbSession):
    try:
        message, recipes, interaction_id = run_chat(db, data.message, data.interaction_id)
    except AIServiceError:
        # Includes free-tier rate limits (429) and expired conversations.
        raise HTTPException(502, "AI service is unavailable") from None
    return ChatResponse(message=message, recipes=recipes, interaction_id=interaction_id)