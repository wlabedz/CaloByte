import { Observable } from 'rxjs';

import { DailyTargets, Meal } from '../models';

/**
 * Jedyna droga, którą widoki pobierają i zmieniają dane. Implementację wybiera provider
 * w app.config.ts — teraz dane przykładowe w pamięci, docelowo klient HTTP do FastAPI.
 */
export abstract class MealRepository {
  abstract getTargets(): Observable<DailyTargets>;
  abstract getMeals(): Observable<Meal[]>;
  abstract deleteMeal(id: string): Observable<void>;
}
