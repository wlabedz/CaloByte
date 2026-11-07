"""One-off script: build cleaned recipes.csv and products.csv seed files.

Raw Kaggle / USDA files are read as plain data via csv and never copied.
Usage (from backend/):
  python -m seed.prepare --kaggle <recipes.csv> --usda-dir <SR Legacy dir> --out seed
"""

import argparse
import csv
import json
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

from nutrition import kcal_from_macros
from seed.parsing import (
    parse_category,
    parse_minutes,
    parse_nutrition,
    split_ingredients,
)

RECIPE_COLUMNS = [
    "external_id", "name", "category", "category_path", "servings", "prep_min",
    "cook_min", "total_min", "ingredients_json", "directions", "rating",
    "source_url", "kcal", "protein", "fat", "carbs", "fiber",
]
PRODUCT_COLUMNS = [
    "external_id", "name", "name_en", "kcal", "protein", "fat", "carbs", "fiber",
]
NUTRIENT_IDS = {
    "kcal": "1008", "protein": "1003", "fat": "1004", "carbs": "1005",
    "fiber": "1079",
}

csv.field_size_limit(2**31 - 1)


def _num(value: Decimal) -> str:
    return format(value.normalize(), "f") if value else "0"


def _minutes(text: str) -> str:
    m = parse_minutes(text)
    return "" if m is None else str(m)


def prepare_recipes(kaggle_path: Path, out_path: Path) -> int:
    count = 0
    with open(kaggle_path, newline="", encoding="utf-8") as src, open(
        out_path, "w", newline="", encoding="utf-8"
    ) as dst:
        reader = csv.reader(src)
        header = next(reader)
        idx = {name: i for i, name in enumerate(header)}
        writer = csv.DictWriter(dst, fieldnames=RECIPE_COLUMNS)
        writer.writeheader()
        for row in reader:
            fields = {name: row[i] for name, i in idx.items()}

            def col(name: str, fields: dict[str, str] = fields) -> str:
                return fields[name]

            category, category_path = parse_category(col("cuisine_path"))
            macros = parse_nutrition(col("nutrition"))
            kcal = kcal_from_macros(
                macros["protein"], macros["carbs"], macros["fat"]
            ).quantize(Decimal(1), rounding=ROUND_HALF_UP)
            writer.writerow({
                "external_id": row[0],
                "name": col("recipe_name").strip(),
                "category": category or "",
                "category_path": category_path or "",
                "servings": col("servings").strip(),
                "prep_min": _minutes(col("prep_time")),
                "cook_min": _minutes(col("cook_time")),
                "total_min": _minutes(col("total_time")),
                "ingredients_json": json.dumps(
                    split_ingredients(col("ingredients")), ensure_ascii=False
                ),
                "directions": col("directions"),
                "rating": col("rating").strip(),
                "source_url": col("url"),
                "kcal": str(kcal),
                "protein": _num(macros["protein"]),
                "fat": _num(macros["fat"]),
                "carbs": _num(macros["carbs"]),
                "fiber": _num(macros["fiber"]),
            })
            count += 1
    return count


def prepare_products(usda_dir: Path, selection_path: Path, out_path: Path) -> int:
    with open(selection_path, newline="", encoding="utf-8") as f:
        selection = list(csv.DictReader(f))
    for r in selection:
        if None in r or r.get("name_pl") is None:
            raise ValueError(
                f"malformed row in {selection_path.name} for fdc_id "
                f"{r.get('fdc_id')}: unquoted comma or missing field"
            )
    wanted = {r["fdc_id"] for r in selection}

    descriptions: dict[str, str] = {}
    with open(usda_dir / "food.csv", newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["fdc_id"] in wanted:
                descriptions[r["fdc_id"]] = r["description"]

    by_nutrient = {v: k for k, v in NUTRIENT_IDS.items()}
    values: dict[str, dict[str, Decimal]] = {}
    with open(usda_dir / "food_nutrient.csv", newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["fdc_id"] in wanted and r["nutrient_id"] in by_nutrient:
                values.setdefault(r["fdc_id"], {})[
                    by_nutrient[r["nutrient_id"]]
                ] = Decimal(r["amount"])

    with open(out_path, "w", newline="", encoding="utf-8") as dst:
        writer = csv.DictWriter(dst, fieldnames=PRODUCT_COLUMNS)
        writer.writeheader()
        for r in selection:
            fdc = r["fdc_id"]
            if fdc not in descriptions:
                raise ValueError(f"fdc_id {fdc} not found in USDA food.csv")
            vals = values.get(fdc, {})
            if "kcal" not in vals:
                raise ValueError(f"fdc_id {fdc} has no Energy value")
            writer.writerow({
                "external_id": fdc,
                "name": r["name_pl"],
                "name_en": descriptions[fdc],
                **{k: _num(vals.get(k, Decimal(0))) for k in NUTRIENT_IDS},
            })
    return len(selection)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kaggle", type=Path, required=True)
    ap.add_argument("--usda-dir", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    n = prepare_recipes(args.kaggle, args.out / "recipes.csv")
    m = prepare_products(
        args.usda_dir, args.out / "usda_selection.csv", args.out / "products.csv"
    )
    print(f"recipes: {n}, products: {m}")


if __name__ == "__main__":
    main()
