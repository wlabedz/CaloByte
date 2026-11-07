import { Product, RecipeDetail, RecipeSummary } from '../app/core/models';

export function buildRecipeSummary(
  overrides: Partial<RecipeSummary> & Pick<RecipeSummary, 'id'>,
): RecipeSummary {
  return {
    name: `Przepis ${overrides.id}`,
    source: 'kaggle',
    category: 'Zupy',
    servings: 4,
    total_min: 45,
    kcal: 320,
    protein: 18.5,
    fat: 12.25,
    carbs: 35,
    fiber: 6.5,
    ...overrides,
  };
}

export function buildRecipeDetail(
  overrides: Partial<RecipeDetail> & Pick<RecipeDetail, 'id'>,
): RecipeDetail {
  return {
    ...buildRecipeSummary({ id: overrides.id }),
    category_path: 'Dania główne > Zupy',
    prep_min: 15,
    cook_min: 30,
    ingredients_text: ['1 szklanka mąki'],
    directions: 'Wymieszaj i ugotuj.',
    rating: null,
    source_url: null,
    items: [],
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
    ...overrides,
  };
}

export function buildProduct(overrides: Partial<Product> & Pick<Product, 'id'>): Product {
  return {
    name: `Produkt ${overrides.id}`,
    name_en: null,
    source: 'usda',
    kcal: 100,
    protein: 5,
    fat: 2,
    carbs: 15,
    fiber: 1,
    ...overrides,
  };
}
