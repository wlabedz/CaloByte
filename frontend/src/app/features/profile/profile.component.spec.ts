import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { buildUser } from '../../../testing/user-fixtures';
import { ActiveUserService } from '../../core/active-user.service';
import { UserRepository } from '../../core/data/user-repository';
import { ToastService } from '../../core/toast.service';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  const anna = buildUser({ id: 'u1', name: 'Anna', surname: 'Nowak' });
  const createUser = vi.fn();
  const login = vi.fn();
  const me = vi.fn();
  let fixture: ComponentFixture<ProfileComponent>;
  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;

  function fill(id: string, value: string): void {
    const control = element.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
    if (!control) {
      throw new Error(`Brak pola #${id}`);
    }
    control.value = value;
    control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input'));
  }

  function fillValidForm(): void {
    fill('name', 'Ola');
    fill('surname', 'Wiśniewska');
    fill('email', 'ola@example.com');
    fill('birth_date', '2001-02-03');
    fill('weight_kg', '58.5');
    fill('height_cm', '165');
    fill('sex', 'female');
  }

  async function submit(form: 'login-form' | 'profile-form'): Promise<void> {
    element.querySelector<HTMLButtonElement>(`.${form} button[type="submit"]`)?.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    localStorage.clear();
    createUser.mockReset();
    login.mockReset();
    me.mockReset();
    me.mockReturnValue(of(anna));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: UserRepository, useValue: { createUser, login, me } },
      ],
    }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ProfileComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('logs in with just an e-mail and goes to the dashboard', async () => {
    login.mockReturnValue(of(anna));

    fill('login-email', ' anna@example.com ');
    await submit('login-form');

    expect(login).toHaveBeenCalledWith('anna@example.com');
    expect(TestBed.inject(ActiveUserService).user()?.id).toBe('u1');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(element.querySelector('h1')?.textContent).toContain('Anna Nowak');
  });

  it('explains when there is no account with that e-mail', async () => {
    login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    fill('login-email', 'nikt@example.com');
    await submit('login-form');

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Nie ma konta');
    expect(TestBed.inject(ActiveUserService).user()).toBeNull();
  });

  it('does not log in with an invalid e-mail', async () => {
    fill('login-email', 'a@b');
    await submit('login-form');

    expect(login).not.toHaveBeenCalled();
    expect(element.querySelector('#login-email-error')).not.toBeNull();
  });

  it('logs out', async () => {
    TestBed.inject(ActiveUserService).select(anna);
    await fixture.whenStable();

    Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Wyloguj'))
      ?.click();
    await fixture.whenStable();

    expect(TestBed.inject(ActiveUserService).user()).toBeNull();
    expect(element.querySelector('h1')?.textContent).toContain('Zaloguj się');
  });

  it('does not send an incomplete form', async () => {
    await submit('profile-form');

    expect(createUser).not.toHaveBeenCalled();
    expect(element.querySelector('#name-error')?.textContent).toContain('Podaj imię');
    expect(element.querySelector('#sex-error')?.textContent).toContain('Wybierz płeć');
  });

  it('creates an account and logs in', async () => {
    createUser.mockReturnValue(of(buildUser({ id: 'u3', name: 'Ola', surname: 'Wiśniewska' })));

    fillValidForm();
    await submit('profile-form');

    expect(createUser).toHaveBeenCalledWith({
      name: 'Ola',
      surname: 'Wiśniewska',
      email: 'ola@example.com',
      birth_date: '2001-02-03',
      weight_kg: 58.5,
      height_cm: 165,
      activity: 'moderate',
      sex: 'female',
    });
    expect(TestBed.inject(ActiveUserService).user()?.id).toBe('u3');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(TestBed.inject(ToastService).toasts()[0]?.message).toContain(
      'Założono konto Ola Wiśniewska',
    );
  });

  it('explains when the e-mail is already taken', async () => {
    createUser.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    fillValidForm();
    await submit('profile-form');

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'e-mail jest już zajęty',
    );
  });

  it('rejects an e-mail without a dot in the domain, like the backend does', async () => {
    fillValidForm();
    fill('email', 'a@b');
    await submit('profile-form');

    expect(createUser).not.toHaveBeenCalled();
    expect(element.querySelector('#email-error')?.textContent).toContain('Podaj poprawny adres');
  });

  it('shows a 422 for the e-mail next to the field', async () => {
    createUser.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { detail: [{ loc: ['body', 'email'], msg: 'value is not a valid email' }] },
          }),
      ),
    );

    fillValidForm();
    await submit('profile-form');

    expect(element.querySelector('#email-error')?.textContent).toContain(
      'Serwer nie przyjął tego adresu',
    );
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('describes the logged-in profile instead of listing other users', async () => {
    TestBed.inject(ActiveUserService).select(anna);
    await fixture.whenStable();

    const details = element.querySelector('.details')?.textContent ?? '';
    expect(me).toHaveBeenCalled();
    expect(details).toContain('62 kg');
    expect(details).toContain('168 cm');
    expect(details).toMatch(/BMI\s*22[.,]0/);
    expect(element.querySelector('.profile-form')).toBeNull();
  });

  it('says so when the profile fails to load', async () => {
    me.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    TestBed.inject(ActiveUserService).select(anna);
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Nie udało się wczytać profilu',
    );
  });
});
