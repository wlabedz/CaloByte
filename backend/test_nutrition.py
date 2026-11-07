from decimal import Decimal as D

import pytest

from nutrition import Macros, item_macros, kcal_from_macros, recipe_per_serving


def test_item_macros_scales_per_100g():
    got = item_macros(Macros(D(100), D(10), D(5), D(20), D(2)), D(150))
    assert got == Macros(D(150), D(15), D("7.5"), D(30), D(3))


def test_recipe_per_serving_sums_divides_and_rounds():
    bread = Macros(D(265), D("9.1"), D("3.2"), D(49), D("2.7"))
    butter = Macros(D(717), D("0.85"), D(81), D("0.06"), D(0))
    got = recipe_per_serving([(bread, D(100)), (butter, D(10))], servings=2)
    kcal = (D(265) + D("71.7")) / 2
    protein = (D("9.1") + D("0.085")) / 2
    fat = (D("3.2") + D("8.1")) / 2
    carbs = (D(49) + D("0.006")) / 2
    fiber = D("2.7") / 2
    assert got.kcal == kcal.quantize(D(1), rounding="ROUND_HALF_UP") == D(168)
    assert got.protein == protein.quantize(D("0.01"), rounding="ROUND_HALF_UP")
    assert got.fat == fat.quantize(D("0.01"), rounding="ROUND_HALF_UP")
    assert got.carbs == carbs.quantize(D("0.01"), rounding="ROUND_HALF_UP")
    assert got.fiber == fiber.quantize(D("0.01"), rounding="ROUND_HALF_UP")


def test_recipe_per_serving_half_up():
    m = Macros(D(1), D(0), D("0.05"), D(0), D(0))
    got = recipe_per_serving([(m, D(100))], servings=2)
    assert got.kcal == D(1)  # 0.5 -> 1
    assert got.fat == D("0.03")  # 0.025 -> 0.03


def test_recipe_per_serving_empty_raises():
    with pytest.raises(ValueError):
        recipe_per_serving([], 1)


def test_kcal_from_macros():
    assert kcal_from_macros(D(4), D(60), D(18)) == D(418)
