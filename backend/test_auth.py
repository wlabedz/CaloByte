import uuid


def test_login_by_email_is_case_insensitive(client, make_user):
    user = make_user("Anna@Example.com")
    r = client.post("/auth/login", json={"email": "anna@example.COM"})
    assert r.status_code == 200
    assert r.json()["id"] == str(user.id)


def test_login_unknown_email(client, db_session):
    r = client.post("/auth/login", json={"email": "nikt@example.com"})
    assert r.status_code == 404
    assert r.json()["detail"] == "Nie ma konta z tym adresem e-mail."
    assert client.post("/auth/login", json={"email": "bez-domeny"}).status_code == 422


def test_me(client, auth):
    r = client.get("/auth/me", headers=auth)
    assert r.status_code == 200
    assert r.json()["id"] == auth["X-User-Id"]
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"X-User-Id": str(uuid.uuid4())}).status_code == 401


def test_product_gets_owner(client, auth, db_session):
    body = {"name": "Twaróg", "kcal": 100, "protein": 18, "fat": 1, "carbs": 3, "fiber": 0}
    r = client.post("/products", headers=auth, json=body)
    assert r.status_code == 201
    from models import Product

    assert str(db_session.get(Product, uuid.UUID(r.json()["id"])).user_id) == auth["X-User-Id"]
