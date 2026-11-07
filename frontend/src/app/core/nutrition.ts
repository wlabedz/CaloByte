import { Meal, Product } from './models';

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

/**
 * Zaokrąglenie half-up (jak ROUND_HALF_UP w backendzie), nie half-to-even. Epsilon 1e-9
 * koryguje błąd zmiennoprzecinkowy: np. 1.005 * 100 = 100.49999999999999.
 */
function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.floor(value * factor + 0.5 + 1e-9) / factor;
}

/**
 * Makra na porcję — lustro recipe_per_serving z backendu: makro składnika = na 100 g × waga / 100,
 * suma składników ÷ porcje, dopiero wynik zaokrąglony (kcal do 0, reszta do 2 miejsc).
 */
export function recipePerServing(
  items: readonly { product: Product; weight_g: number }[],
  servings: number,
): MacroTotals {
  const total = items.reduce<MacroTotals>(
    (sum, { product, weight_g }) => ({
      kcal: sum.kcal + (product.kcal * weight_g) / 100,
      protein: sum.protein + (product.protein * weight_g) / 100,
      fat: sum.fat + (product.fat * weight_g) / 100,
      carbs: sum.carbs + (product.carbs * weight_g) / 100,
      fiber: sum.fiber + (product.fiber * weight_g) / 100,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
  );
  const perServing = (value: number, decimals: number) =>
    roundHalfUp(servings > 0 ? value / servings : 0, decimals);
  return {
    kcal: perServing(total.kcal, 0),
    protein: perServing(total.protein, 2),
    fat: perServing(total.fat, 2),
    carbs: perServing(total.carbs, 2),
    fiber: perServing(total.fiber, 2),
  };
}
