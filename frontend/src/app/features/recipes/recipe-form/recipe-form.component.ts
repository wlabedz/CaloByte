import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  startWith,
  switchMap,
} from 'rxjs';

import { ProductRepository } from '../../../core/data/product-repository';
import { RecipeRepository } from '../../../core/data/recipe-repository';
import { Product, RecipeDetail, RecipeInput } from '../../../core/models';
import { recipePerServing } from '../../../core/nutrition';
import { ProductDialogComponent } from '../product-dialog/product-dialog.component';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const DEFAULT_WEIGHT_G = 100;
const MAX_ITEMS = 50;
const MAX_WEIGHT_G = 10000;
const MAX_MINUTES = 10000;

function notBlank(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() === ''
    ? { required: true }
    : null;
}

/** Waga musi być w przedziale (0, 10000]. */
function weightRange(control: AbstractControl): ValidationErrors | null {
  const value = control.value as number | null;
  return value !== null && value > 0 && value <= MAX_WEIGHT_G ? null : { weight: true };
}

type ItemGroup = FormGroup<{
  product: FormControl<Product>;
  weight_g: FormControl<number | null>;
}>;

@Component({
  selector: 'app-recipe-form',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, ProductDialogComponent],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeFormComponent {
  private readonly recipes = inject(RecipeRepository);
  private readonly products = inject(ProductRepository);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly search$ = new Subject<string>();

  protected readonly recipeId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly loading = signal(this.recipeId !== null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchResults = signal<Product[]>([]);
  protected readonly dialogOpen = signal(false);

  protected readonly items = new FormArray<ItemGroup>(
    [],
    [Validators.required, Validators.maxLength(MAX_ITEMS)],
  );
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200), notBlank]],
    servings: [1 as number | null, [Validators.required, Validators.min(1), Validators.max(100)]],
    category: [''],
    prep_min: [null as number | null, [Validators.min(0), Validators.max(MAX_MINUTES)]],
    cook_min: [null as number | null, [Validators.min(0), Validators.max(MAX_MINUTES)]],
    directions: ['', [Validators.maxLength(10000)]],
    items: this.items,
  });

  private readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(null)));

  protected readonly preview = computed(() => {
    this.formValue();
    const { servings } = this.form.getRawValue();
    return recipePerServing(
      this.items.controls.map((group) => ({
        product: group.controls.product.value,
        weight_g: group.controls.weight_g.value ?? 0,
      })),
      servings ?? 0,
    );
  });

  constructor() {
    this.search$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        filter((query) => query.length >= MIN_QUERY_LENGTH),
        switchMap((query) =>
          this.products.search(query).pipe(
            catchError(() => {
              this.searchResults.set([]);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((results) => this.searchResults.set(results));

    if (this.recipeId !== null) {
      this.recipes
        .get(this.recipeId)
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (recipe) => this.load(recipe),
          error: (error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status === 404) {
              void this.router.navigate(['/recipes']);
            } else {
              this.loading.set(false);
              this.errorMessage.set('Nie udało się wczytać przepisu. Spróbuj odświeżyć stronę.');
            }
          },
        });
    }
  }

  private load(recipe: RecipeDetail): void {
    if (recipe.source !== 'user') {
      void this.router.navigate(['/recipes', recipe.id]);
      return;
    }
    this.form.patchValue({
      name: recipe.name,
      servings: recipe.servings,
      category: recipe.category ?? '',
      prep_min: recipe.prep_min,
      cook_min: recipe.cook_min,
      directions: recipe.directions,
    });
    for (const item of recipe.items) {
      // RecipeDetail nie niesie wartości na 100 g, więc wyprowadzamy je z makr składnika
      // (makro × 100 / waga) wyłącznie na potrzeby podglądu; zapisujemy tylko product_id i wagę.
      const per100 = (value: number) => (item.weight_g > 0 ? (value * 100) / item.weight_g : 0);
      this.addItem(
        {
          id: item.product_id,
          name: item.product_name,
          name_en: null,
          source: 'user',
          kcal: per100(item.kcal),
          protein: per100(item.protein),
          fat: per100(item.fat),
          carbs: per100(item.carbs),
          fiber: per100(item.fiber),
        },
        item.weight_g,
      );
    }
    this.loading.set(false);
  }

  protected onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      this.searchResults.set([]);
    }
    this.search$.next(query);
  }

  protected pick(product: Product): void {
    this.addItem(product, DEFAULT_WEIGHT_G);
    this.searchResults.set([]);
  }

  protected onProductCreated(product: Product): void {
    this.dialogOpen.set(false);
    this.addItem(product, DEFAULT_WEIGHT_G);
  }

  protected removeItem(index: number): void {
    this.items.removeAt(index);
  }

  protected invalid(name: string): boolean {
    return this.submitted() && this.form.get(name)!.invalid;
  }

  protected weightInvalid(group: ItemGroup): boolean {
    return this.submitted() && group.controls.weight_g.invalid;
  }

  private addItem(product: Product, weight_g: number): void {
    this.items.push(
      this.fb.group({
        product: this.fb.control(product),
        weight_g: new FormControl<number | null>(weight_g, [Validators.required, weightRange]),
      }),
    );
  }

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    this.submitted.set(true);
    this.errorMessage.set(null);
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    const input: RecipeInput = {
      name: value.name.trim(),
      servings: value.servings!,
      category: value.category.trim() || null,
      prep_min: value.prep_min,
      cook_min: value.cook_min,
      directions: value.directions,
      items: this.items.controls.map((group) => ({
        product_id: group.controls.product.value.id,
        weight_g: group.controls.weight_g.value!,
      })),
    };
    this.saving.set(true);
    const request =
      this.recipeId === null
        ? this.recipes.create(input)
        : this.recipes.update(this.recipeId, input);
    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        void this.router.navigate(['/recipes', saved.id]);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const detail = error instanceof HttpErrorResponse ? error.error?.detail : undefined;
        this.errorMessage.set(
          typeof detail === 'string'
            ? detail
            : 'Nie udało się zapisać przepisu. Sprawdź dane i spróbuj ponownie.',
        );
      },
    });
  }
}
