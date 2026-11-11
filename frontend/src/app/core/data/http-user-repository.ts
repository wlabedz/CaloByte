import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../../environments/api-url';
import { NewUser, User } from '../models';
import { UserRepository } from './user-repository';

@Injectable()
export class HttpUserRepository extends UserRepository {
  private readonly http = inject(HttpClient);

  override getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/users`);
  }

  override createUser(user: NewUser): Observable<User> {
    return this.http.post<User>(`${API_URL}/users`, user);
  }

  override me(): Observable<User> {
    return this.http.get<User>(`${API_URL}/auth/me`);
  }

  override login(email: string): Observable<User> {
    return this.http.post<User>(`${API_URL}/auth/login`, { email });
  }
}
