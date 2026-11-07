// Encje mają pola nazwane jak kolumny w bazie (snake_case), żeby odpowiedzi z FastAPI
// dało się używać bezpośrednio, bez warstwy mapowania. Identyfikatory to UUID, jak users.id.

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Śniadanie',
  lunch: 'Obiad',
  dinner: 'Kolacja',
};

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type Sex = 'male' | 'female' | 'other';

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Siedzący tryb życia',
  light: 'Niska aktywność',
  moderate: 'Umiarkowana aktywność',
  active: 'Wysoka aktywność',
  very_active: 'Bardzo wysoka aktywność',
};

export const SEX_LABELS: Record<Sex, string> = {
  male: 'Mężczyzna',
  female: 'Kobieta',
  other: 'Inna',
};

/** Treść POST /users (UserCreate w backend/schemas.py). */
export interface NewUser {
  name: string;
  surname: string;
  email: string;
  /** Data w formacie YYYY-MM-DD. */
  birth_date: string;
  weight_kg: number;
  height_cm: number;
  activity: ActivityLevel;
  sex: Sex;
}

/** Odpowiedź GET/POST /users (UserOut); BMI liczy baza. */
export interface User extends NewUser {
  id: string;
  bmi: number;
  created_at: string;
}

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
