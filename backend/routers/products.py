import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

import catalog_service
from auth import OptionalUser
from db import get_db
from models import Product, ProductSource, RecipeItem
from schemas_catalog import ProductIn, ProductOut

DbSession = Annotated[Session, Depends(get_db)]

router = APIRouter(prefix="/products", tags=["products"])


def _get_or_404(db: Session, product_id: uuid.UUID) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(404, "Nie znaleziono produktu.")
    return product


def _get_editable(db: Session, product_id: uuid.UUID) -> Product:
    product = _get_or_404(db, product_id)
    if product.source != ProductSource.user:
        raise HTTPException(403, "Produktów z bazy USDA nie można zmieniać.")
    return product


@router.get("", response_model=list[ProductOut])
def list_products(
    db: DbSession,
    q: str | None = None,
    source: ProductSource | None = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
):
    stmt = select(Product)
    if q:
        needle = q.lower()
        stmt = stmt.where(
            or_(
                func.lower(Product.name).contains(needle, autoescape=True),
                func.lower(Product.name_en).contains(needle, autoescape=True),
            )
        )
    if source:
        stmt = stmt.where(Product.source == source)
    return db.scalars(stmt.order_by(Product.name, Product.id).limit(limit)).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: uuid.UUID, db: DbSession):
    return _get_or_404(db, product_id)


@router.post("", response_model=ProductOut, status_code=201)
def create_product(data: ProductIn, db: DbSession, user: OptionalUser):
    product = Product(
        **data.model_dump(), source=ProductSource.user, user_id=user.id if user else None
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: uuid.UUID, data: ProductIn, db: DbSession):
    product = _get_editable(db, product_id)
    for field, value in data.model_dump().items():
        setattr(product, field, value)
    catalog_service.recalculate_recipes_for_product(db, product.id)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: uuid.UUID, db: DbSession):
    product = _get_editable(db, product_id)
    used = db.scalar(select(RecipeItem.id).where(RecipeItem.product_id == product.id).limit(1))
    if used is not None:
        raise HTTPException(409, "Produkt jest używany w przepisie i nie można go usunąć.")
    db.delete(product)
    db.commit()
    return Response(status_code=204)
