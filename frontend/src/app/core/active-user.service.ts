import { Injectable, signal } from '@angular/core';

import { User } from './models';

const STORAGE_KEY = 'calobyte.activeUser';

export interface ActiveUser {
  id: string;
  name: string;
  email?: string;
}

/**
 * Zalogowany użytkownik. Logowanie jest bez hasła (wystarczy e-mail), a jego id trafia do
 * backendu w nagłówku `X-User-Id` (zob. `userIdInterceptor`). Zapamiętujemy go w przeglądarce,
 * żeby przetrwał odświeżenie strony.
 */
@Injectable({ providedIn: 'root' })
export class ActiveUserService {
  private readonly current = signal<ActiveUser | null>(readStoredUser());
  readonly user = this.current.asReadonly();

  select(user: User): void {
    const active: ActiveUser = {
      id: user.id,
      name: `${user.name} ${user.surname}`,
      email: user.email,
    };
    this.current.set(active);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    } catch {
      // Zablokowany storage (np. tryb prywatny): logowanie działa do odświeżenia strony.
    }
  }

  logout(): void {
    this.current.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Jak wyżej: nie ma czego czyścić.
    }
  }
}

function readStoredUser(): ActiveUser | null {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return isActiveUser(stored) ? stored : null;
  } catch {
    return null;
  }
}

function isActiveUser(value: unknown): value is ActiveUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ActiveUser).id === 'string' &&
    typeof (value as ActiveUser).name === 'string'
  );
}
