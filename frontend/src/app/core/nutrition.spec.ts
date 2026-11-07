import { buildMeal, daysAgo } from '../../testing/meal-fixtures';
import { buildProduct } from '../../testing/recipe-fixtures';
import { percentOf, recipePerServing, sumMacros, summarizeByDay, toDayKey } from './nutrition';

describe('nutrition', () => {
  it('sums calories and macros of all meals', () => {
    const totals = sumMacros([
      buildMeal({
        id: '1',
        total_kcal: 300,
        total_protein: 20,
        total_fat: 10,
        total_carbs: 30,
        total_fiber: 4,
      }),
      buildMeal({
        id: '2',
        total_kcal: 450,
        total_protein: 35,
        total_fat: 15,
        total_carbs: 40,
        total_fiber: 6,
      }),
    ]);

    expect(totals).toEqual({ kcal: 750, protein: 55, fat: 25, carbs: 70, fiber: 10 });
  });

  it('assigns meals to days in local time', () => {
    expect(toDayKey(new Date(2026, 9, 24, 0, 30))).toBe('2026-10-24');
    expect(toDayKey(new Date(2026, 9, 24, 23, 59))).toBe('2026-10-24');
  });

  it('groups meals by day, newest day first and meals in chronological order', () => {
    const days = summarizeByDay([
      buildMeal({ id: '1', eaten_at: daysAgo(1, 19).toISOString() }),
      buildMeal({ id: '2', eaten_at: daysAgo(0, 13).toISOString() }),
      buildMeal({ id: '3', eaten_at: daysAgo(1, 8).toISOString() }),
    ]);

    expect(days.map((day) => day.date)).toEqual([toDayKey(daysAgo(0)), toDayKey(daysAgo(1))]);
    expect(days[1].meals.map((meal) => meal.id)).toEqual(['3', '1']);
    expect(days[1].totals.kcal).toBe(1000);
  });

  it('calculates percent of a target and treats a missing target as 0%', () => {
    expect(percentOf(1171, 1900)).toBe(62);
    expect(percentOf(50, 0)).toBe(0);
  });

  it('computes recipe macros per serving like the backend', () => {
    const bread = buildProduct({ id: 'b', kcal: 250, protein: 9, fat: 3, carbs: 49, fiber: 7 });
    const butter = buildProduct({
      id: 'u',
      kcal: 717,
      protein: 0.85,
      fat: 81,
      carbs: 0.06,
      fiber: 0,
    });

    const result = recipePerServing(
      [
        { product: bread, weight_g: 100 },
        { product: butter, weight_g: 10 },
      ],
      2,
    );

    expect(result).toEqual({ kcal: 161, protein: 4.54, fat: 5.55, carbs: 24.5, fiber: 3.5 });
  });
});
