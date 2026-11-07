import { Injectable, signal } from '@angular/core';

import { User } from './models';

const STORAGE_KEY = 'calobyte.activeUser';

export interface ActiveUser {
  id: string;
  name: string;
}

/**
 * Wybrany profil. Do czasu logowania to on określa, czyje dane pokazuje aplikacja;
 * zapamiętujemy go w przeglądarce, żeby przetrwał odświeżenie strony.
 */
@Injectable({ providedIn: 'root' })
export class ActiveUserService {
  private readonly current = signal<ActiveUser | null>(readStoredUser());
  readonly user = this.current.asReadonly();

  select(user: User): void {
    const active: ActiveUser = { id: user.id, name: `${user.name} ${user.surname}` };
    this.current.set(active);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    } catch {
      // Zablokowany storage (np. tryb prywatny): wybór działa do odświeżenia strony.
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
