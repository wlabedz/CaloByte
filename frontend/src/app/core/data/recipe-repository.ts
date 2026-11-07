import { Observable } from 'rxjs';

import {
  CategoryCount,
  Page,
  RecipeDetail,
  RecipeInput,
  RecipeQuery,
  RecipeSummary,
} from '../models';

export abstract class RecipeRepository {
  abstract list(query: RecipeQuery): Observable<Page<RecipeSummary>>;
  abstract categories(): Observable<CategoryCount[]>;
  abstract get(id: string): Observable<RecipeDetail>;
  abstract create(input: RecipeInput): Observable<RecipeDetail>;
  abstract update(id: string, input: RecipeInput): Observable<RecipeDetail>;
  abstract remove(id: string): Observable<void>;
}
