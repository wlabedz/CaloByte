import csv
import json

import pytest

from seed.prepare import prepare_products, prepare_recipes

KAGGLE_HEADER = [
    "", "recipe_name", "prep_time", "cook_time", "total_time", "servings",
    "yield", "ingredients", "directions", "rating", "url", "cuisine_path",
    "nutrition", "timing", "img_src",
]


def _write(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def _read(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def test_prepare_recipes(tmp_path):
    src = tmp_path / "kaggle.csv"
    _write(src, KAGGLE_HEADER, [
        ["0", " Apple Pie ", "15 mins", "1 hrs 30 mins", "1 hrs 45 mins", "8",
         "8 servings", "2 cups flour, 1 egg, Salt", "Mix.", "4.5",
         "http://x/1", "/Desserts/Pies/",
         "Total Fat 10g, Total Carbohydrate 20g, Protein 5g, Dietary Fiber 2g",
         "t", "http://img"],
        ["1", "Plain", "", "", "", "2", "", "water", "Boil.", "", "http://x/2",
         "/Drinks/", "", "", ""],
    ])
    out = tmp_path / "recipes.csv"
    prepare_recipes(src, out)
    rows = _read(out)
    assert "img_src" not in rows[0]
    assert list(rows[0]) == [
        "external_id", "name", "category", "category_path", "servings",
        "prep_min", "cook_min", "total_min", "ingredients_json", "directions",
        "rating", "source_url", "kcal", "protein", "fat", "carbs", "fiber",
    ]
    r = rows[0]
    assert r["external_id"] == "0"
    assert r["name"] == "Apple Pie"
    assert r["category"] == "Desserts"
    assert r["category_path"] == "Desserts/Pies"
    assert (r["prep_min"], r["cook_min"], r["total_min"]) == ("15", "90", "105")
    assert json.loads(r["ingredients_json"]) == ["2 cups flour", "1 egg, Salt"]
    assert r["kcal"] == "190"  # 4*5 + 4*20 + 9*10
    assert r["source_url"] == "http://x/1"
    assert rows[1]["prep_min"] == ""
    assert rows[1]["kcal"] == "0"


def _usda(tmp_path, with_fdc=True):
    d = tmp_path / "usda"
    d.mkdir()
    _write(d / "food.csv", ["fdc_id", "data_type", "description"],
           [["100", "sr_legacy_food", "Apples, raw, with skin"]])
    _write(d / "nutrient.csv", ["id", "name", "unit_name"], [
        ["1008", "Energy", "KCAL"], ["1003", "Protein", "G"],
        ["1004", "Total lipid (fat)", "G"],
        ["1005", "Carbohydrate, by difference", "G"],
        ["1079", "Fiber, total dietary", "G"],
    ])
    _write(d / "food_nutrient.csv", ["id", "fdc_id", "nutrient_id", "amount"], [
        ["1", "100", "1008", "52"], ["2", "100", "1003", "0.26"],
        ["3", "100", "1004", "0.17"], ["4", "100", "1005", "13.8"],
    ])
    return d


def test_prepare_products(tmp_path):
    d = _usda(tmp_path)
    sel = tmp_path / "sel.csv"
    _write(sel, ["fdc_id", "name_pl"], [["100", "Jabłko"]])
    out = tmp_path / "products.csv"
    prepare_products(d, sel, out)
    rows = _read(out)
    assert rows == [{
        "external_id": "100", "name": "Jabłko", "name_en": "Apples, raw, with skin",
        "kcal": "52", "protein": "0.26", "fat": "0.17", "carbs": "13.8",
        "fiber": "0",
    }]


def test_missing_fdc_id(tmp_path):
    d = _usda(tmp_path)
    sel = tmp_path / "sel.csv"
    _write(sel, ["fdc_id", "name_pl"], [["999", "Nic"]])
    with pytest.raises(ValueError, match="999"):
        prepare_products(d, sel, tmp_path / "p.csv")
