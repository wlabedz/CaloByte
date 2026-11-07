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

export type RecipeSource = 'kaggle' | 'user';
export type ProductSource = 'usda' | 'user';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface RecipeQuery {
  q?: string;
  category?: string;
  source?: RecipeSource;
  page: number;
  limit: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

/** Makroskładniki na 1 porcję. */
export interface RecipeSummary {
  id: string;
  name: string;
  source: RecipeSource;
  category: string | null;
  servings: number;
  total_min: number | null;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

/** Składnik przepisu; makra dotyczą podanej wagi, nie 100 g. */
export interface RecipeItem {
  product_id: string;
  product_name: string;
  weight_g: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface RecipeDetail extends RecipeSummary {
  category_path: string | null;
  prep_min: number | null;
  cook_min: number | null;
  ingredients_text: string[];
  directions: string;
  rating: number | null;
  source_url: string | null;
  items: RecipeItem[];
  /** Znaczniki czasu ISO 8601. */
  created_at: string;
  updated_at: string;
}

export interface RecipeItemInput {
  product_id: string;
  weight_g: number;
}

export interface RecipeInput {
  name: string;
  servings: number;
  category?: string | null;
  prep_min?: number | null;
  cook_min?: number | null;
  directions: string;
  items: RecipeItemInput[];
}

/** Wartości odżywcze na 100 g. */
export interface Product {
  id: string;
  name: string;
  name_en: string | null;
  source: ProductSource;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface ProductInput {
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}
