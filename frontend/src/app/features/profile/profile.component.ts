import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { ActiveUserService } from '../../core/active-user.service';
import { UserRepository } from '../../core/data/user-repository';
import { ACTIVITY_LABELS, ActivityLevel, NewUser, SEX_LABELS, Sex, User } from '../../core/models';
import { toDayKey } from '../../core/nutrition';
import { ToastService } from '../../core/toast.service';

/** Jak `EmailStr` w backendzie: domena musi zawierać kropkę (`a@b` zostałby odrzucony z 422). */
const EMAIL_WITH_DOMAIN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-profile',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly users = inject(UserRepository);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly activeUser = inject(ActiveUserService);

  protected readonly today = toDayKey(new Date());
  protected readonly activityLabels = ACTIVITY_LABELS;
  protected readonly activityOptions = Object.keys(ACTIVITY_LABELS) as ActivityLevel[];
  protected readonly sexLabels = SEX_LABELS;
  protected readonly sexOptions = Object.keys(SEX_LABELS) as Sex[];

  /** Pełne dane zalogowanego użytkownika; `undefined` w trakcie wczytywania. */
  protected readonly profile = signal<User | undefined>(undefined);
  protected readonly profileFailed = signal(false);

  protected readonly loggingIn = signal(false);
  protected readonly loginError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  /** Logowanie bez hasła: wystarczy e-mail istniejącego konta. */
  protected readonly loginForm = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_WITH_DOMAIN)]],
  });

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
    // Po zalogowaniu (także po odświeżeniu strony) dociągamy pełny profil z backendu.
    toObservable(this.activeUser.user)
      .pipe(
        map((user) => user?.id),
        distinctUntilChanged(),
        switchMap((id) => {
          this.profile.set(undefined);
          this.profileFailed.set(false);
          return id
            ? this.users.me().pipe(
                catchError(() => {
                  this.profileFailed.set(true);
                  return EMPTY;
                }),
              )
            : of(undefined);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((user) => this.profile.set(user));
  }

  protected isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }

  protected isLoginInvalid(): boolean {
    const control = this.loginForm.controls.email;
    return control.invalid && control.touched;
  }

  protected login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loggingIn.set(true);
    this.loginError.set(null);
    this.users.login(this.loginForm.getRawValue().email.trim()).subscribe({
      next: (user) => {
        this.activeUser.select(user);
        this.loginForm.reset();
        this.loggingIn.set(false);
        this.toasts.show({ message: `Witaj, ${user.name}!` });
        void this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.loggingIn.set(false);
        this.loginError.set(
          error.status === 404
            ? 'Nie ma konta z tym adresem e-mail. Załóż je poniżej.'
            : 'Nie udało się zalogować. Spróbuj ponownie.',
        );
      },
    });
  }

  protected logout(): void {
    this.activeUser.logout();
    this.toasts.show({ message: 'Wylogowano.' });
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
        this.toasts.show({
          message: `Założono konto ${user.name} ${user.surname} — jesteś zalogowany.`,
        });
        void this.router.navigate(['/dashboard']);
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
            ? 'Ten adres e-mail jest już zajęty. Zaloguj się nim powyżej.'
            : 'Nie udało się zapisać profilu. Spróbuj ponownie.',
        );
      },
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
