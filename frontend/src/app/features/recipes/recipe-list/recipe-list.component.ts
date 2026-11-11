import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
} from 'rxjs';

import { RecipeRepository } from '../../../core/data/recipe-repository';
import {
  CategoryCount,
  Page,
  RecipeQuery,
  RecipeSource,
  RecipeSummary,
} from '../../../core/models';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

interface Filters {
  q: string;
  category: string;
  source: RecipeSource | '';
  page: number;
}

@Component({
  selector: 'app-recipe-list',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './recipe-list.component.html',
  styleUrl: './recipe-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeListComponent {
  private readonly repository = inject(RecipeRepository);
  private readonly search$ = new Subject<string>();

  protected readonly filters = signal<Filters>({ q: '', category: '', source: '', page: 1 });
  protected readonly result = signal<Page<RecipeSummary> | undefined>(undefined);
  protected readonly categories = signal<CategoryCount[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil((this.result()?.total ?? 0) / PAGE_SIZE)),
  );

  private readonly query = computed<RecipeQuery>(() => {
    const { q, category, source, page } = this.filters();
    return {
      ...(q && { q }),
      ...(category && { category }),
      // „Moje” to przepisy zalogowanego użytkownika, a nie wszystkie przepisy użytkowników.
      ...(source === 'user' && { mine: true }),
      page,
      limit: PAGE_SIZE,
    };
  });

  constructor() {
    this.repository
      .categories()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (categories) => this.categories.set(categories), error: () => undefined });

    this.search$
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.updateFilters({ q }));

    toObservable(this.query)
      .pipe(
        tap(() => this.errorMessage.set(null)),
        switchMap((query) =>
          this.repository.list(query).pipe(
            catchError(() => {
              this.errorMessage.set('Nie udało się wczytać przepisów. Spróbuj odświeżyć stronę.');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.result.set(result));
  }

  protected onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value.trim());
  }

  protected onCategory(event: Event): void {
    this.updateFilters({ category: (event.target as HTMLSelectElement).value });
  }

  protected setSource(source: RecipeSource | ''): void {
    this.updateFilters({ source });
  }

  protected goToPage(page: number): void {
    this.filters.update((filters) => ({ ...filters, page }));
  }

  private updateFilters(change: Partial<Filters>): void {
    this.filters.update((filters) => ({ ...filters, ...change, page: 1 }));
  }
}
