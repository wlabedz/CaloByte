import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { RecipeRepository } from '../../../core/data/recipe-repository';
import { RecipeDetail, RecipeInput } from '../../../core/models';
import { servingsLabel } from '../../../core/polish-plural';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-recipe-detail',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetailComponent {
  private readonly repository = inject(RecipeRepository);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly servingsLabel = servingsLabel;
  protected readonly recipe = signal<RecipeDetail | undefined>(undefined);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly deleting = signal(false);

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    this.repository
      .get(id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (recipe) => this.recipe.set(recipe),
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            void this.router.navigate(['/recipes']);
          } else {
            this.errorMessage.set('Nie udało się wczytać przepisu. Spróbuj odświeżyć stronę.');
          }
        },
      });
  }

  /**
   * Jak na Pulpicie: bez okna potwierdzenia, za to z „Cofnij” w powiadomieniu. Przepis
   * usuwamy od razu (lista po powrocie ma być aktualna), a „Cofnij” zapisuje go ponownie
   * z tych samych danych, więc dostaje nowe ID.
   */
  protected deleteRecipe(recipe: RecipeDetail): void {
    if (this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.errorMessage.set(null);
    this.repository.remove(recipe.id).subscribe({
      next: () => {
        void this.router.navigate(['/recipes']);
        this.toasts.show({
          message: `Usunięto przepis „${recipe.name}”.`,
          action: { label: 'Cofnij', run: () => this.restore(recipe) },
        });
      },
      error: () => {
        this.deleting.set(false);
        this.errorMessage.set(`Nie udało się usunąć przepisu „${recipe.name}”. Spróbuj ponownie.`);
      },
    });
  }

  private restore(recipe: RecipeDetail): void {
    this.repository.create(toRecipeInput(recipe)).subscribe({
      next: (restored) => void this.router.navigate(['/recipes', restored.id]),
      error: () =>
        this.toasts.show({ message: `Nie udało się przywrócić przepisu „${recipe.name}”.` }),
    });
  }
}

function toRecipeInput(recipe: RecipeDetail): RecipeInput {
  return {
    name: recipe.name,
    servings: recipe.servings,
    category: recipe.category,
    prep_min: recipe.prep_min,
    cook_min: recipe.cook_min,
    directions: recipe.directions,
    items: recipe.items.map(({ product_id, weight_g }) => ({ product_id, weight_g })),
  };
}
