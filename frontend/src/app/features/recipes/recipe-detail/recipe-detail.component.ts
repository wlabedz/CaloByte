import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { RecipeRepository } from '../../../core/data/recipe-repository';
import { RecipeDetail } from '../../../core/models';

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

  protected readonly recipe = signal<RecipeDetail | undefined>(undefined);
  protected readonly errorMessage = signal<string | null>(null);

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

  protected deleteRecipe(recipe: RecipeDetail): void {
    if (!confirm(`Usunąć przepis „${recipe.name}”?`)) {
      return;
    }
    this.errorMessage.set(null);
    this.repository.remove(recipe.id).subscribe({
      next: () => void this.router.navigate(['/recipes']),
      error: () => this.errorMessage.set('Nie udało się usunąć przepisu. Spróbuj ponownie.'),
    });
  }
}
