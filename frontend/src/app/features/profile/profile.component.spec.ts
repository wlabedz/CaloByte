import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { buildUser } from '../../../testing/user-fixtures';
import { ActiveUserService } from '../../core/active-user.service';
import { UserRepository } from '../../core/data/user-repository';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  const anna = buildUser({ id: 'u1', name: 'Anna', surname: 'Nowak' });
  const jan = buildUser({ id: 'u2', name: 'Jan', surname: 'Kowalski', email: 'jan@example.com' });
  const createUser = vi.fn();
  const getUsers = vi.fn();
  let fixture: ComponentFixture<ProfileComponent>;
  let element: HTMLElement;

  const profileButton = (name: string) =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('.profile')).find((button) =>
      button.textContent?.includes(name),
    );

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

  async function submit(): Promise<void> {
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    localStorage.clear();
    createUser.mockReset();
    getUsers.mockReset();
    getUsers.mockReturnValue(of([anna, jan]));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: UserRepository, useValue: { getUsers, createUser } }],
    }).compileComponents();

    await render();
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(ProfileComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  afterEach(() => localStorage.clear());

  it('lists profiles and makes the clicked one active', async () => {
    profileButton('Jan Kowalski')?.click();
    await fixture.whenStable();

    expect(profileButton('Jan Kowalski')?.getAttribute('aria-pressed')).toBe('true');
    expect(profileButton('Anna Nowak')?.getAttribute('aria-pressed')).toBe('false');
    expect(TestBed.inject(ActiveUserService).user()).toEqual({ id: 'u2', name: 'Jan Kowalski' });
  });

  it('does not send an incomplete form', async () => {
    await submit();

    expect(createUser).not.toHaveBeenCalled();
    expect(element.querySelector('#name-error')?.textContent).toContain('Podaj imię');
    expect(element.querySelector('#sex-error')?.textContent).toContain('Wybierz płeć');
  });

  it('creates a profile and selects it', async () => {
    createUser.mockReturnValue(of(buildUser({ id: 'u3', name: 'Ola', surname: 'Wiśniewska' })));

    fillValidForm();
    await submit();

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
    expect(profileButton('Ola Wiśniewska')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('explains when the e-mail is already taken', async () => {
    createUser.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    fillValidForm();
    await submit();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'e-mail jest już zajęty',
    );
  });

  it('rejects an e-mail without a dot in the domain, like the backend does', async () => {
    fillValidForm();
    fill('email', 'a@b');
    await submit();

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
    await submit();

    expect(element.querySelector('#email-error')?.textContent).toContain(
      'Serwer nie przyjął tego adresu',
    );
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('loads the list again after saving when it failed to load before', async () => {
    const ola = buildUser({ id: 'u3', name: 'Ola', surname: 'Wiśniewska' });
    getUsers
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })))
      .mockReturnValueOnce(of([anna, jan, ola]));
    createUser.mockReturnValue(of(ola));
    await render();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Nie udało się wczytać');

    fillValidForm();
    await submit();

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(profileButton('Ola Wiśniewska')?.getAttribute('aria-pressed')).toBe('true');
    expect(profileButton('Anna Nowak')).toBeDefined();
  });
});
