import { DatePipe, DecimalPipe, I18nPluralPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { MealRepository } from '../../core/data/meal-repository';
import { DailyTargets, MEAL_TYPE_LABELS, Meal } from '../../core/models';
import { summarizeByDay, toDayKey } from '../../core/nutrition';
import { MacroProgressComponent } from '../../shared/macro-progress/macro-progress.component';

@Component({
  selector: 'app-history',
  imports: [DatePipe, DecimalPipe, I18nPluralPipe, MacroProgressComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  private readonly repository = inject(MealRepository);

  protected readonly todayKey = toDayKey(new Date());
  protected readonly mealTypeLabels = MEAL_TYPE_LABELS;
  protected readonly mealCountLabels = { '=1': '1 posiłek', few: '# posiłki', other: '# posiłków' };
  protected readonly pastDaysLabels = { '=1': 'z ostatniego dnia', other: 'z ostatnich # dni' };

  protected readonly targets = signal<DailyTargets | undefined>(undefined);
  private readonly meals = signal<Meal[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly days = computed(() => summarizeByDay(this.meals()));

  /** Średnia tylko z zakończonych dni — dzisiejszy, niepełny dzień zaniżałby wynik. */
  protected readonly trend = computed(() => {
    const pastDays = this.days().filter((day) => day.date < this.todayKey);
    if (pastDays.length === 0) {
      return null;
    }
    const totalKcal = pastDays.reduce((sum, day) => sum + day.totals.kcal, 0);
    return { days: pastDays.length, averageKcal: totalKcal / pastDays.length };
  });

  constructor() {
    forkJoin({ targets: this.repository.getTargets(), meals: this.repository.getMeals() })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ targets, meals }) => {
          this.targets.set(targets);
          this.meals.set(meals);
        },
        error: () =>
          this.errorMessage.set('Nie udało się wczytać historii. Spróbuj odświeżyć stronę.'),
      });
  }
}
