import { Injectable } from '@angular/core';
import { Observable, defer, of } from 'rxjs';

import { DailyTargets, Meal } from '../models';
import { MealRepository } from './meal-repository';
import { SAMPLE_TARGETS, createSampleMeals } from './sample-data';

/** Dane trzymane w pamięci przeglądarki — do pracy nad UI, zanim backend będzie gotowy. */
@Injectable()
export class InMemoryMealRepository extends MealRepository {
  private meals = createSampleMeals(new Date());

  override getTargets(): Observable<DailyTargets> {
    return of(SAMPLE_TARGETS);
  }

  override getMeals(): Observable<Meal[]> {
    return defer(() => of([...this.meals]));
  }

  override deleteMeal(id: string): Observable<void> {
    return defer(() => {
      this.meals = this.meals.filter((meal) => meal.id !== id);
      return of(undefined);
    });
  }
}
