import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { MealRepository } from '../../core/data/meal-repository';
import { DailyTargets, MEAL_TYPE_LABELS, Meal } from '../../core/models';
import { sortByEatenAt, sumMacros, toDayKey } from '../../core/nutrition';
import { MacroProgressComponent } from '../../shared/macro-progress/macro-progress.component';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, MacroProgressComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly repository = inject(MealRepository);

  protected readonly today = new Date();
  protected readonly mealTypeLabels = MEAL_TYPE_LABELS;

  protected readonly targets = signal<DailyTargets | undefined>(undefined);
  private readonly meals = signal<Meal[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly todayMeals = computed(() => {
    const todayKey = toDayKey(this.today);
    return sortByEatenAt(this.meals().filter((meal) => toDayKey(meal.eaten_at) === todayKey));
  });
  protected readonly totals = computed(() => sumMacros(this.todayMeals()));

  constructor() {
    forkJoin({ targets: this.repository.getTargets(), meals: this.repository.getMeals() })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ targets, meals }) => {
          this.targets.set(targets);
          this.meals.set(meals);
        },
        error: () =>
          this.errorMessage.set('Nie udało się wczytać danych. Spróbuj odświeżyć stronę.'),
      });
  }

  protected deleteMeal(meal: Meal): void {
    if (!confirm(`Usunąć posiłek „${meal.name}”?`)) {
      return;
    }
    this.errorMessage.set(null);
    this.repository.deleteMeal(meal.id).subscribe({
      next: () => this.meals.update((meals) => meals.filter(({ id }) => id !== meal.id)),
      error: () => this.errorMessage.set('Nie udało się usunąć posiłku. Spróbuj ponownie.'),
    });
  }
}
