import uuid
from decimal import Decimal

from models import Product, ProductSource, Recipe, RecipeItem, RecipeSource
from nutrition import Macros, recipe_per_serving


def make_product(db, name, **kw):
    vals = {"kcal": Decimal(250), "protein": Decimal(10), "fat": Decimal(5),
            "carbs": Decimal(40), "fiber": Decimal(3)}
    vals.update(kw)
    p = Product(name=name, source=ProductSource.user, **vals)
    db.add(p)
    db.commit()
    return p


def make_seed_recipe(db, name, category=None, source=RecipeSource.kaggle, **kw):
    r = Recipe(name=name, source=source, external_id="k-" + name, category=category,
               servings=2, ingredients_text=["a", "b"], directions="d",
               kcal=100, protein=1, fat=1, carbs=1, fiber=1, **kw)
    db.add(r)
    db.commit()
    return r


def two_items(db):
    bread = make_product(db, "chleb")
    butter = make_product(db, "masło", kcal=Decimal(717), protein=Decimal(1),
                          fat=Decimal(81), carbs=Decimal(1), fiber=Decimal(0))
    return bread, butter, [
        {"product_id": str(bread.id), "weight_g": 150},
        {"product_id": str(butter.id), "weight_g": 10},
    ]


def body(items, **kw):
    return {"name": "Kanapka", "servings": 2, "directions": "Smaruj.", "items": items, **kw}


def test_list_filters(client, db_session):
    make_seed_recipe(db_session, "Szarlotka", category="Ciasta")
    make_seed_recipe(db_session, "Sernik", category="Ciasta")
    make_seed_recipe(db_session, "Zupa", category="Zupy", source=RecipeSource.user)
    r = client.get("/recipes", params={"q": "SER"}).json()
    assert [x["name"] for x in r["items"]] == ["Sernik"]
    assert r["total"] == 1
    assert client.get("/recipes", params={"category": "Ciasta"}).json()["total"] == 2
    assert client.get("/recipes", params={"source": "user"}).json()["total"] == 1


def test_pagination(client, db_session):
    for n in ("A", "B", "C"):
        make_seed_recipe(db_session, n)
    r = client.get("/recipes", params={"page": 2, "limit": 1}).json()
    assert [x["name"] for x in r["items"]] == ["B"]
    assert (r["total"], r["page"], r["limit"]) == (3, 2, 1)
    assert client.get("/recipes", params={"limit": 101}).status_code == 422
    assert client.get("/recipes", params={"page": 0}).status_code == 422


def test_categories(client, db_session):
    make_seed_recipe(db_session, "A", category="Zupy")
    make_seed_recipe(db_session, "B", category="Ciasta")
    make_seed_recipe(db_session, "C", category="Ciasta")
    make_seed_recipe(db_session, "D")
    r = client.get("/recipes/categories")
    assert r.status_code == 200
    assert r.json() == [{"category": "Ciasta", "count": 2}, {"category": "Zupy", "count": 1}]


def test_detail_kaggle_and_404(client, db_session):
    rec = make_seed_recipe(db_session, "Sernik", source_url="http://x", rating=Decimal("4.5"))
    d = client.get(f"/recipes/{rec.id}").json()
    assert d["items"] == []
    assert d["source_url"] == "http://x"
    assert d["rating"] == 4.5
    r = client.get(f"/recipes/{uuid.uuid4()}")
    assert r.status_code == 404
    assert r.json()["detail"] == "Nie znaleziono przepisu."


def test_create_recipe(client, db_session, auth):
    bread, butter, items = two_items(db_session)
    r = client.post("/recipes", headers=auth, json=body(items, prep_min=5, cook_min=10))
    assert r.status_code == 201
    d = r.json()
    expected = recipe_per_serving(
        [(Macros(bread.kcal, bread.protein, bread.fat, bread.carbs, bread.fiber), Decimal(150)),
         (Macros(butter.kcal, butter.protein, butter.fat, butter.carbs, butter.fiber), Decimal(10))], 2)
    assert isinstance(d["kcal"], (int, float))
    assert d["kcal"] == float(expected.kcal)
    assert d["protein"] == float(expected.protein)
    assert d["fat"] == float(expected.fat)
    assert d["ingredients_text"] == ["150 g chleb", "10 g masło"]
    assert d["source"] == "user"
    assert d["user_id"] == auth["X-User-Id"]
    assert d["total_min"] == 15
    assert [i["product_name"] for i in d["items"]] == ["chleb", "masło"]
    assert d["items"][0]["kcal"] == 375


def test_create_validation(client, db_session, auth):
    _, _, items = two_items(db_session)
    assert client.post("/recipes", headers=auth, json=body([])).status_code == 422
    bad = [{**items[0], "weight_g": 0}]
    assert client.post("/recipes", headers=auth, json=body(bad)).status_code == 422
    unknown = [items[0], {"product_id": str(uuid.uuid4()), "weight_g": 5}]
    r = client.post("/recipes", headers=auth, json=body(unknown))
    assert r.status_code == 422
    assert "2" in r.json()["detail"]


def test_update_replaces_items(client, db_session, auth):
    _, _, items = two_items(db_session)
    rid = client.post("/recipes", headers=auth, json=body(items)).json()["id"]
    r = client.put(f"/recipes/{rid}", headers=auth, json=body([items[0]], servings=1, name="Chleb"))
    assert r.status_code == 200
    d = r.json()
    assert len(d["items"]) == 1
    assert d["kcal"] == 375
    assert d["name"] == "Chleb"
    assert d["ingredients_text"] == ["150 g chleb"]
    assert d["total_min"] is None
    assert db_session.query(RecipeItem).count() == 1


def test_seed_recipe_read_only(client, db_session, auth):
    rec = make_seed_recipe(db_session, "Sernik")
    _, _, items = two_items(db_session)
    r = client.put(f"/recipes/{rec.id}", headers=auth, json=body(items))
    assert r.status_code == 403
    assert r.json()["detail"] == "Przepisów z katalogu nie można zmieniać."
    assert client.delete(f"/recipes/{rec.id}", headers=auth).status_code == 403
    assert client.put(f"/recipes/{uuid.uuid4()}", headers=auth, json=body(items)).status_code == 404


def test_delete_recipe(client, db_session, auth):
    _, _, items = two_items(db_session)
    rid = client.post("/recipes", headers=auth, json=body(items)).json()["id"]
    assert client.delete(f"/recipes/{rid}", headers=auth).status_code == 204
    db_session.expire_all()
    assert db_session.query(RecipeItem).count() == 0
    assert client.get(f"/recipes/{rid}").status_code == 404


def test_recipe_requires_login(client, db_session):
    _, _, items = two_items(db_session)
    r = client.post("/recipes", json=body(items))
    assert r.status_code == 401
    bad = client.post("/recipes", json=body(items), headers={"X-User-Id": "nie-uuid"})
    assert bad.status_code == 401
    unknown = client.post("/recipes", json=body(items), headers={"X-User-Id": str(uuid.uuid4())})
    assert unknown.status_code == 401


def test_only_owner_can_change_recipe(client, db_session, auth, make_user):
    _, _, items = two_items(db_session)
    rid = client.post("/recipes", headers=auth, json=body(items)).json()["id"]
    other = {"X-User-Id": str(make_user("jan@example.com", "Jan").id)}
    r = client.put(f"/recipes/{rid}", headers=other, json=body(items))
    assert r.status_code == 403
    assert r.json()["detail"] == "Możesz zmieniać tylko własne przepisy."
    assert client.delete(f"/recipes/{rid}", headers=other).status_code == 403
    # Cudze przepisy można oglądać.
    assert client.get(f"/recipes/{rid}", headers=other).status_code == 200


def test_list_mine(client, db_session, auth, make_user):
    make_seed_recipe(db_session, "Sernik")
    _, _, items = two_items(db_session)
    client.post("/recipes", headers=auth, json=body(items, name="Moja"))
    other = {"X-User-Id": str(make_user("jan@example.com", "Jan").id)}
    client.post("/recipes", headers=other, json=body(items, name="Jana"))
    mine = client.get("/recipes", headers=auth, params={"mine": True}).json()
    assert [x["name"] for x in mine["items"]] == ["Moja"]
    assert client.get("/recipes", params={"mine": True}).status_code == 401
    assert client.get("/recipes").json()["total"] == 3
