from decimal import Decimal as D

from seed.parsing import (
    parse_category,
    parse_minutes,
    parse_nutrition,
    split_ingredients,
)

NUTRITION = (
    "Total Fat 18g 23%, Saturated Fat 7g 34%, Cholesterol 19mg 6%, "
    "Sodium 128mg 6%, Total Carbohydrate 60g 22%, Dietary Fiber 5g 16%, "
    "Total Sugars 40g, Protein 4g, Vitamin C 8mg 42%, Calcium 35mg 3%, "
    "Iron 1mg 6%, Potassium 245mg 5%"
)


def test_parse_minutes():
    assert parse_minutes("") is None
    assert parse_minutes("25 mins") == 25
    assert parse_minutes("1 hrs 30 mins") == 90
    assert parse_minutes("1 hrs") == 60
    assert parse_minutes("1 days 2 hrs") == 1560


def test_parse_nutrition():
    assert parse_nutrition(NUTRITION) == {
        "fat": D(18), "carbs": D(60), "fiber": D(5), "protein": D(4),
    }


def test_parse_nutrition_missing_protein_and_saturated_only():
    got = parse_nutrition("Saturated Fat 7g 34%, Total Carbohydrate 10g 3%")
    assert got == {"fat": D(0), "carbs": D(10), "fiber": D(0), "protein": D(0)}


def test_parse_nutrition_empty():
    assert parse_nutrition("") == {
        "fat": D(0), "carbs": D(0), "fiber": D(0), "protein": D(0),
    }


def test_parse_category():
    assert parse_category("/Desserts/Fruit Desserts/Apple Dessert Recipes/") == (
        "Desserts",
        "Desserts/Fruit Desserts/Apple Dessert Recipes",
    )
    assert parse_category("") == (None, None)


def test_split_ingredients():
    text = (
        "6  apples - peeled, cored, and sliced, 2 tablespoons white sugar, "
        "1 ½ teaspoons ground cinnamon, divided, ¾ cup old-fashioned oats"
    )
    assert split_ingredients(text) == [
        "6 apples - peeled, cored, and sliced",
        "2 tablespoons white sugar",
        "1 ½ teaspoons ground cinnamon, divided",
        "¾ cup old-fashioned oats",
    ]
    assert split_ingredients("") == []
