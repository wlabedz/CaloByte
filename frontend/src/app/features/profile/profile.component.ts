import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
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
import { ToastService } from '../../core/toast.service';

/** Jak `EmailStr` w backendzie: domena musi zawierać kropkę (`a@b` zostałby odrzucony z 422). */
const EMAIL_WITH_DOMAIN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-profile',
  imports: [DecimalPipe, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly users = inject(UserRepository);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
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
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern(EMAIL_WITH_DOMAIN),
        Validators.maxLength(255),
      ],
    ],
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
    this.loadProfiles();
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
        this.activeUser.select(user);
        this.form.reset();
        this.saving.set(false);
        // Gdy lista wcześniej się nie wczytała, pobieramy ją od nowa — już z nowym profilem.
        if (this.loadFailed()) {
          this.loadProfiles();
        } else {
          this.profiles.update((profiles) => [...(profiles ?? []), user]);
        }
        this.toasts.show({
          message: `Zapisano profil ${user.name} ${user.surname} — jest teraz aktywny.`,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        if (error.status === 422 && rejectsField(error, 'email')) {
          this.form.controls.email.setErrors({ server: true });
          this.form.controls.email.markAsTouched();
          return;
        }
        this.saveError.set(
          error.status === 409
            ? 'Ten adres e-mail jest już zajęty.'
            : 'Nie udało się zapisać profilu. Spróbuj ponownie.',
        );
      },
    });
  }

  private loadProfiles(): void {
    this.loadFailed.set(false);
    this.users
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => this.profiles.set(users),
        error: () => this.loadFailed.set(true),
      });
  }
}

/** Czy odpowiedź 422 z FastAPI dotyczy danego pola (`detail[].loc`, np. `['body', 'email']`). */
function rejectsField(error: HttpErrorResponse, field: string): boolean {
  const detail: unknown = error.error?.detail;
  return (
    Array.isArray(detail) &&
    detail.some((issue) => Array.isArray(issue?.loc) && issue.loc.includes(field))
  );
}

function notInFuture(control: AbstractControl<string>): ValidationErrors | null {
  return control.value > toDayKey(new Date()) ? { future: true } : null;
}
