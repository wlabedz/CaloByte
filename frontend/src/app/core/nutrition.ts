import { Meal } from './models';

export interface MacroTotals {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface DaySummary {
  /** Data lokalna w formacie YYYY-MM-DD. */
  date: string;
  meals: Meal[];
  totals: MacroTotals;
}

export function sumMacros(meals: readonly Meal[]): MacroTotals {
  return meals.reduce<MacroTotals>(
    (totals, meal) => ({
      kcal: totals.kcal + meal.total_kcal,
      protein: totals.protein + meal.total_protein,
      fat: totals.fat + meal.total_fat,
      carbs: totals.carbs + meal.total_carbs,
      fiber: totals.fiber + meal.total_fiber,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
  );
}

/**
 * Dzień liczony w strefie czasowej użytkownika. Nie używamy toISOString(), bo liczy w UTC
 * i posiłek zjedzony w Polsce tuż po północy trafiłby do poprzedniego dnia.
 */
export function toDayKey(value: Date | string): string {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function sortByEatenAt(meals: readonly Meal[]): Meal[] {
  return [...meals].sort((a, b) => Date.parse(a.eaten_at) - Date.parse(b.eaten_at));
}

/** Dni od najnowszego; posiłki w obrębie dnia chronologicznie. */
export function summarizeByDay(meals: readonly Meal[]): DaySummary[] {
  const mealsByDay = new Map<string, Meal[]>();
  for (const meal of sortByEatenAt(meals)) {
    const key = toDayKey(meal.eaten_at);
    const dayMeals = mealsByDay.get(key);
    if (dayMeals) {
      dayMeals.push(meal);
    } else {
      mealsByDay.set(key, [meal]);
    }
  }
  return [...mealsByDay]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dayMeals]) => ({ date, meals: dayMeals, totals: sumMacros(dayMeals) }));
}

export function percentOf(value: number, target: number): number {
  return target > 0 ? Math.round((value / target) * 100) : 0;
}
