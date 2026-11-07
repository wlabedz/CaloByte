import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { ProductRepository } from '../../../core/data/product-repository';
import { Product } from '../../../core/models';

const MAX_MACRO_SUM_G = 100;

function macroSum(group: AbstractControl): ValidationErrors | null {
  const { protein, fat, carbs } = group.value as Record<string, number | null>;
  return (protein ?? 0) + (fat ?? 0) + (carbs ?? 0) > MAX_MACRO_SUM_G ? { macroSum: true } : null;
}

@Component({
  selector: 'app-product-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './product-dialog.component.html',
  styleUrl: './product-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDialogComponent {
  private readonly repository = inject(ProductRepository);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly created = output<Product>();
  readonly closed = output<void>();

  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.maxLength(200), notBlank]],
      kcal: [null as number | null, [Validators.required, Validators.min(0), Validators.max(900)]],
      protein: [null as number | null, [Validators.required, Validators.min(0)]],
      fat: [null as number | null, [Validators.required, Validators.min(0)]],
      carbs: [null as number | null, [Validators.required, Validators.min(0)]],
      fiber: [0 as number | null, [Validators.required, Validators.min(0)]],
    },
    { validators: macroSum },
  );

  protected invalid(name: string): boolean {
    const control = this.form.get(name)!;
    return this.submitted() && control.invalid;
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
    this.saving.set(true);
    this.repository
      .create({
        name: value.name.trim(),
        kcal: value.kcal!,
        protein: value.protein!,
        fat: value.fat!,
        carbs: value.carbs!,
        fiber: value.fiber!,
      })
      .subscribe({
        next: (product) => {
          this.saving.set(false);
          this.created.emit(product);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          const detail = error instanceof HttpErrorResponse ? error.error?.detail : undefined;
          this.errorMessage.set(
            typeof detail === 'string'
              ? detail
              : 'Nie udało się zapisać produktu. Spróbuj ponownie.',
          );
        },
      });
  }
}

function notBlank(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() === ''
    ? { required: true }
    : null;
}
