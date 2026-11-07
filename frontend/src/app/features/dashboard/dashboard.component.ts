import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { MealRepository } from '../../core/data/meal-repository';
import { DailyTargets, MEAL_TYPE_LABELS, Meal } from '../../core/models';
import { sortByEatenAt, sumMacros, toDayKey } from '../../core/nutrition';
import { ToastService } from '../../core/toast.service';
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
  private readonly toasts = inject(ToastService);

  protected readonly today = new Date();
  protected readonly mealTypeLabels = MEAL_TYPE_LABELS;

  protected readonly targets = signal<DailyTargets | undefined>(undefined);
  private readonly meals = signal<Meal[]>([]);
  /** Posiłki ukryte po kliknięciu „Usuń”, ale jeszcze nieusunięte — do czasu, aż minie „Cofnij”. */
  private readonly pendingDeletion = signal<ReadonlySet<string>>(new Set());
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly todayMeals = computed(() => {
    const todayKey = toDayKey(this.today);
    const pending = this.pendingDeletion();
    return sortByEatenAt(
      this.meals().filter((meal) => !pending.has(meal.id) && toDayKey(meal.eaten_at) === todayKey),
    );
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

  /** Posiłek znika od razu; żądanie DELETE idzie dopiero, gdy minie szansa na „Cofnij”. */
  protected deleteMeal(meal: Meal): void {
    this.errorMessage.set(null);
    this.setPendingDeletion(meal.id, true);
    this.toasts.show({
      message: `Usunięto posiłek „${meal.name}”.`,
      action: { label: 'Cofnij', run: () => this.setPendingDeletion(meal.id, false) },
      onClose: (reason) => {
        if (reason !== 'action') {
          this.commitDeletion(meal);
        }
      },
    });
  }

  private commitDeletion(meal: Meal): void {
    this.repository.deleteMeal(meal.id).subscribe({
      next: () => {
        this.meals.update((meals) => meals.filter(({ id }) => id !== meal.id));
        this.setPendingDeletion(meal.id, false);
      },
      error: () => {
        this.setPendingDeletion(meal.id, false);
        this.errorMessage.set(`Nie udało się usunąć posiłku „${meal.name}”. Spróbuj ponownie.`);
      },
    });
  }

  private setPendingDeletion(id: string, pending: boolean): void {
    this.pendingDeletion.update((ids) => {
      const next = new Set(ids);
      if (pending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
