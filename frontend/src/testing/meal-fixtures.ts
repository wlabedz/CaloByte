import { DailyTargets, Meal } from '../app/core/models';

export const TEST_TARGETS: DailyTargets = { kcal: 1500, protein: 120, fat: 60, carbs: 180 };

/** Data lokalna sprzed `days` dni o wskazanej godzinie. */
export function daysAgo(days: number, hours = 12, minutes = 0): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, hours, minutes);
}

export function buildMeal(overrides: Partial<Meal> & Pick<Meal, 'id'>): Meal {
  return {
    user_id: 'test-user',
    name: `Posiłek ${overrides.id}`,
    meal_type: 'lunch',
    eaten_at: daysAgo(0).toISOString(),
    total_kcal: 500,
    total_protein: 30,
    total_fat: 20,
    total_carbs: 50,
    total_fiber: 5,
    raw_prompt: null,
    items: [],
    ...overrides,
  };
}
