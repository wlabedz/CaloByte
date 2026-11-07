// Encje mają pola nazwane jak kolumny w bazie (snake_case), żeby odpowiedzi z FastAPI
// dało się używać bezpośrednio, bez warstwy mapowania. Identyfikatory to UUID, jak users.id.

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Śniadanie',
  lunch: 'Obiad',
  dinner: 'Kolacja',
};

/** Dzienny cel użytkownika — backend może go trzymać w bazie albo liczyć z profilu. */
export interface DailyTargets {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface MealItem {
  id: string;
  meal_id: string;
  ingredient_name: string;
  weight_g: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  meal_type: MealType;
  /** Znacznik czasu ISO 8601. */
  eaten_at: string;
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_fiber: number;
  raw_prompt: string | null;
  items: MealItem[];
}
