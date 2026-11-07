import { Observable } from 'rxjs';

import { NewUser, User } from '../models';

/** Dostęp do profili użytkowników; implementację wybiera provider w app.config.ts. */
export abstract class UserRepository {
  abstract getUsers(): Observable<User[]>;
  abstract createUser(user: NewUser): Observable<User>;
}
