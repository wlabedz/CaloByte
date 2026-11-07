from decimal import Decimal

from models import Product, ProductSource, Recipe, RecipeItem, RecipeSource


def make_product(db, name="Chleb", source=ProductSource.user, name_en=None, **kw):
    vals = {"kcal": Decimal(250), "protein": Decimal(10), "fat": Decimal(5),
            "carbs": Decimal(40), "fiber": Decimal(3)}
    vals.update(kw)
    p = Product(name=name, name_en=name_en, source=source,
                external_id="x-" + name if source == ProductSource.usda else None, **vals)
    db.add(p)
    db.commit()
    return p


def make_recipe(db, product, weight="200", servings=2):
    r = Recipe(name="Moje", source=RecipeSource.user, servings=servings,
               ingredients_text=[], directions="",
               kcal=0, protein=0, fat=0, carbs=0, fiber=0)
    r.items.append(RecipeItem(product_id=product.id, weight_g=Decimal(weight), position=0))
    db.add(r)
    db.commit()
    return r


BODY = {"name": "Masło", "kcal": 717, "protein": 1, "fat": 81, "carbs": 1, "fiber": 0}


def test_search_sorted_and_limit(client, db_session):
    make_product(db_session, "Chleb żytni")
    make_product(db_session, "Chleb pszenny")
    make_product(db_session, "Ser")
    r = client.get("/products", params={"q": "chleb"})
    assert r.status_code == 200
    assert [p["name"] for p in r.json()] == ["Chleb pszenny", "Chleb żytni"]
    assert client.get("/products", params={"limit": 51}).status_code == 422


def test_search_products_case_insensitive_polish(client, db_session):
    make_product(db_session, "żółtko jaja", name_en="egg yolk")
    assert len(client.get("/products", params={"q": "ŻÓŁ"}).json()) == 1
    assert len(client.get("/products", params={"q": "egg"}).json()) == 1


def test_get_product_and_404(client, db_session):
    p = make_product(db_session)
    assert client.get(f"/products/{p.id}").json()["name"] == "Chleb"
    r = client.get("/products/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
    assert r.json()["detail"] == "Nie znaleziono produktu."


def test_create_product(client):
    r = client.post("/products", json=BODY)
    assert r.status_code == 201
    assert r.json()["source"] == "user"


def test_create_product_validation(client):
    assert client.post("/products", json={**BODY, "protein": 50, "fat": 50, "carbs": 1}).status_code == 422
    assert client.post("/products", json={**BODY, "kcal": 901}).status_code == 422


def test_usda_is_read_only(client, db_session):
    p = make_product(db_session, "Mleko", source=ProductSource.usda)
    r = client.put(f"/products/{p.id}", json=BODY)
    assert r.status_code == 403
    assert r.json()["detail"] == "Produktów z bazy USDA nie można zmieniać."
    assert client.delete(f"/products/{p.id}").status_code == 403


def test_delete_used_and_unused(client, db_session):
    used = make_product(db_session, "Użyty")
    make_recipe(db_session, used)
    r = client.delete(f"/products/{used.id}")
    assert r.status_code == 409
    assert r.json()["detail"] == "Produkt jest używany w przepisie i nie można go usunąć."
    free = make_product(db_session, "Wolny")
    assert client.delete(f"/products/{free.id}").status_code == 204
    assert client.get(f"/products/{free.id}").status_code == 404


def test_update_product_recalculates_recipes(client, db_session):
    p = make_product(db_session)
    recipe = make_recipe(db_session, p, weight="200", servings=2)
    r = client.put(f"/products/{p.id}", json={**BODY, "name": "Chleb", "protein": 20,
                                              "fat": 5, "carbs": 40, "kcal": 250, "fiber": 3})
    assert r.status_code == 200
    db_session.refresh(recipe)
    # 20g/100g * 200g / 2 servings = 20
    assert recipe.protein == Decimal("20.00")
    assert recipe.kcal == Decimal(250)
