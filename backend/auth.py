"""Logowanie bez hasła: użytkownik podaje e-mail, a frontend wysyła potem jego id
w nagłówku `X-User-Id`. To identyfikacja, nie uwierzytelnianie — każdy, kto zna
czyjś e-mail, może działać jako ta osoba. Wystarcza na potrzeby projektu."""

import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from models import User

USER_HEADER = "X-User-Id"


def optional_user(
    db: Annotated[Session, Depends(get_db)],
    x_user_id: Annotated[str | None, Header(alias=USER_HEADER)] = None,
) -> User | None:
    if x_user_id is None:
        return None
    try:
        user_id = uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(401, "Nieprawidłowy identyfikator użytkownika.") from None
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(401, "Nie znaleziono zalogowanego użytkownika.")
    return user


def current_user(user: Annotated[User | None, Depends(optional_user)]) -> User:
    if user is None:
        raise HTTPException(401, "Zaloguj się, aby wykonać tę operację.")
    return user


CurrentUser = Annotated[User, Depends(current_user)]
OptionalUser = Annotated[User | None, Depends(optional_user)]
