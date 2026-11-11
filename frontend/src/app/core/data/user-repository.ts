import { Observable } from 'rxjs';

import { NewUser, User } from '../models';

/** Dostęp do profili użytkowników; implementację wybiera provider w app.config.ts. */
export abstract class UserRepository {
  abstract getUsers(): Observable<User[]>;
  abstract createUser(user: NewUser): Observable<User>;
  /** Logowanie bez hasła: konto o podanym e-mailu albo błąd 404. */
  abstract login(email: string): Observable<User>;
  /** Pełny profil zalogowanego użytkownika (`GET /auth/me`). */
  abstract me(): Observable<User>;
}
