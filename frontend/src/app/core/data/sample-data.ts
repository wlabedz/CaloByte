import { DailyTargets, Meal, MealItem, MealType } from '../models';
import { MacroTotals } from '../nutrition';

export const SAMPLE_TARGETS: DailyTargets = { kcal: 1900, protein: 110, fat: 65, carbs: 220 };

const SAMPLE_USER_ID = 'demo-user';

type SampleItem = [
  name: string,
  weightG: number,
  kcal: number,
  protein: number,
  fat: number,
  carbs: number,
  fiber: number,
];

interface SampleMeal {
  name: string;
  prompt: string;
  items: SampleItem[];
}

const OATMEAL: SampleMeal = {
  name: 'Owsianka z bananem i masłem orzechowym',
  prompt: 'owsianka na mleku z bananem i łyżką masła orzechowego',
  items: [
    ['Płatki owsiane', 60, 225, 7.9, 3.9, 35.2, 6.1],
    ['Mleko 2%', 200, 102, 6.8, 4, 9.8, 0],
    ['Banan', 120, 107, 1.3, 0.4, 27.4, 3.1],
    ['Masło orzechowe', 15, 88, 3.8, 7.5, 3, 0.9],
  ],
};

const SKYR: SampleMeal = {
  name: 'Skyr z granolą i borówkami',
  prompt: 'skyr naturalny z granolą i garścią borówek',
  items: [
    ['Skyr naturalny', 150, 95, 16.5, 0.3, 6, 0],
    ['Granola', 60, 283, 6, 12, 38.4, 4.2],
    ['Borówki', 80, 46, 0.6, 0.2, 11.6, 1.9],
  ],
};

const RYE_SANDWICHES: SampleMeal = {
  name: 'Kanapki z mozzarellą light i polędwicą',
  prompt: '2 kromki chleba żytniego z ketchupem, mozzarellą light i 3 plastry polędwicy',
  items: [
    ['Chleb żytni', 80, 207, 6.8, 2.6, 38.6, 4.6],
    ['Ketchup', 20, 20, 0.2, 0, 5, 0.1],
    ['Mozzarella light', 60, 96, 10.8, 5.4, 1, 0],
    ['Polędwica sopocka', 45, 50, 8.6, 1.4, 0.7, 0],
  ],
};

const CHICKEN_RICE: SampleMeal = {
  name: 'Kurczak z ryżem i brokułami',
  prompt: '150 g piersi z kurczaka, 200 g ugotowanego ryżu, brokuły i łyżka oliwy',
  items: [
    ['Pierś z kurczaka', 150, 248, 46.5, 5.4, 0, 0],
    ['Ryż biały, gotowany', 200, 260, 5.4, 0.6, 56.4, 0.8],
    ['Brokuły', 150, 53, 3.6, 0.6, 10.8, 5],
    ['Oliwa z oliwek', 10, 88, 0, 10, 0, 0],
  ],
};

const BOLOGNESE: SampleMeal = {
  name: 'Spaghetti bolognese',
  prompt: 'talerz spaghetti bolognese z parmezanem',
  items: [
    ['Makaron spaghetti, gotowany', 220, 348, 12.8, 2, 68, 4],
    ['Wołowina mielona', 120, 260, 31.2, 14.4, 0, 0],
    ['Sos pomidorowy', 150, 68, 2.3, 1.5, 10.5, 2.3],
    ['Parmezan', 10, 43, 3.8, 2.9, 0.4, 0],
  ],
};

const SALMON: SampleMeal = {
  name: 'Łosoś z ziemniakami i surówką',
  prompt: 'pieczony łosoś, ziemniaki i surówka z marchewki',
  items: [
    ['Łosoś pieczony', 140, 288, 30.8, 17.4, 0, 0],
    ['Ziemniaki gotowane', 250, 218, 4.8, 0.3, 50, 4.5],
    ['Surówka z marchewki', 120, 60, 1, 2.4, 8.4, 3],
  ],
};

const SCRAMBLED_EGGS: SampleMeal = {
  name: 'Jajecznica z pomidorem i pieczywem',
  prompt: 'jajecznica z 3 jajek na maśle, pomidor i 2 kromki chleba',
  items: [
    ['Jajka', 150, 215, 18.9, 14.3, 1.1, 0],
    ['Masło', 10, 72, 0.1, 8.1, 0, 0],
    ['Pomidor', 120, 22, 1.1, 0.2, 4.7, 1.4],
    ['Chleb pszenny', 60, 159, 5.4, 1.9, 29.4, 1.6],
  ],
};

const HUMMUS_SANDWICHES: SampleMeal = {
  name: 'Kanapki z hummusem i warzywami',
  prompt: 'kanapki z chleba pełnoziarnistego z hummusem, papryką i ogórkiem',
  items: [
    ['Chleb pełnoziarnisty', 90, 222, 11.7, 3.1, 36.9, 6.3],
    ['Hummus', 60, 100, 4.7, 5.8, 8.6, 3.6],
    ['Papryka czerwona', 80, 25, 0.8, 0.2, 4.8, 1.7],
    ['Ogórek', 80, 12, 0.6, 0.1, 2.9, 0.4],
  ],
};

const PIZZA: SampleMeal = {
  name: 'Pizza margherita',
  prompt: 'pół dużej pizzy margherity',
  items: [['Pizza margherita', 350, 875, 38.5, 31.5, 108.5, 7]],
};

const SCHEDULE: [daysAgo: number, time: string, type: MealType, meal: SampleMeal][] = [
  [0, '08:10', 'breakfast', OATMEAL],
  [0, '13:20', 'lunch', CHICKEN_RICE],
  [1, '07:45', 'breakfast', SKYR],
  [1, '14:00', 'lunch', BOLOGNESE],
  [1, '19:30', 'dinner', RYE_SANDWICHES],
  [2, '08:00', 'breakfast', OATMEAL],
  [2, '13:45', 'lunch', SALMON],
  [2, '20:15', 'dinner', PIZZA],
  [3, '07:30', 'breakfast', SKYR],
  [3, '13:00', 'lunch', CHICKEN_RICE],
  [3, '19:00', 'dinner', SCRAMBLED_EGGS],
  [4, '08:20', 'breakfast', OATMEAL],
  [4, '14:10', 'lunch', BOLOGNESE],
  [4, '20:30', 'dinner', PIZZA],
  [5, '08:05', 'breakfast', SKYR],
  [5, '13:30', 'lunch', SALMON],
  [5, '19:15', 'dinner', HUMMUS_SANDWICHES],
  [6, '07:50', 'breakfast', OATMEAL],
  [6, '13:15', 'lunch', CHICKEN_RICE],
  [6, '19:40', 'dinner', RYE_SANDWICHES],
];

/** Tydzień posiłków liczony od `today`, żeby pulpit zawsze miał dzisiejsze dane. */
export function createSampleMeals(today: Date): Meal[] {
  let itemId = 0;
  return SCHEDULE.map(([daysAgo, time, mealType, sample], index) => {
    const mealId = `meal-${index + 1}`;
    const [hours, minutes] = time.split(':').map(Number);
    const eatenAt = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - daysAgo,
      hours,
      minutes,
    );
    const items = sample.items.map(
      ([ingredient_name, weight_g, kcal, protein, fat, carbs, fiber]): MealItem => ({
        id: `item-${++itemId}`,
        meal_id: mealId,
        ingredient_name,
        weight_g,
        kcal,
        protein,
        fat,
        carbs,
        fiber,
      }),
    );
    return {
      id: mealId,
      user_id: SAMPLE_USER_ID,
      name: sample.name,
      meal_type: mealType,
      eaten_at: eatenAt.toISOString(),
      total_kcal: total(items, 'kcal'),
      total_protein: total(items, 'protein'),
      total_fat: total(items, 'fat'),
      total_carbs: total(items, 'carbs'),
      total_fiber: total(items, 'fiber'),
      raw_prompt: sample.prompt,
      items,
    };
  });
}

function total(items: MealItem[], key: keyof MacroTotals): number {
  return Math.round(items.reduce((sum, item) => sum + item[key], 0) * 10) / 10;
}
