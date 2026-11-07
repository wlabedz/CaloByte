import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { ActiveUserService } from '../../core/active-user.service';
import { UserRepository } from '../../core/data/user-repository';
import { ACTIVITY_LABELS, ActivityLevel, NewUser, SEX_LABELS, Sex, User } from '../../core/models';
import { toDayKey } from '../../core/nutrition';

@Component({
  selector: 'app-profile',
  imports: [DecimalPipe, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly users = inject(UserRepository);
  protected readonly activeUser = inject(ActiveUserService);

  protected readonly today = toDayKey(new Date());
  protected readonly activityLabels = ACTIVITY_LABELS;
  protected readonly activityOptions = Object.keys(ACTIVITY_LABELS) as ActivityLevel[];
  protected readonly sexLabels = SEX_LABELS;
  protected readonly sexOptions = Object.keys(SEX_LABELS) as Sex[];

  protected readonly profiles = signal<User[] | undefined>(undefined);
  protected readonly loadFailed = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  // Ograniczenia jak w UserCreate (backend/schemas.py), żeby błędy wyłapać przed wysłaniem.
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    surname: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    birth_date: ['', [Validators.required, notInFuture]],
    weight_kg: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(499)],
    ],
    height_cm: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(299)],
    ],
    activity: ['moderate' as ActivityLevel, Validators.required],
    sex: ['' as Sex | '', Validators.required],
  });

  constructor() {
    this.users
      .getUsers()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (users) => this.profiles.set(users),
        error: () => this.loadFailed.set(true),
      });
  }

  protected isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    // Po walidacji żadne pole nie jest puste, więc wartość ma już kształt NewUser.
    this.users.createUser(this.form.getRawValue() as NewUser).subscribe({
      next: (user) => {
        this.profiles.update((profiles) => [...(profiles ?? []), user]);
        this.activeUser.select(user);
        this.form.reset();
        this.saving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.saveError.set(
          error.status === 409
            ? 'Ten adres e-mail jest już zajęty.'
            : 'Nie udało się zapisać profilu. Spróbuj ponownie.',
        );
        this.saving.set(false);
      },
    });
  }
}

function notInFuture(control: AbstractControl<string>): ValidationErrors | null {
  return control.value > toDayKey(new Date()) ? { future: true } : null;
}
