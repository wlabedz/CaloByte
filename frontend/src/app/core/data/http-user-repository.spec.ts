import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../../../environments/api-url';
import { NEW_USER, buildUser } from '../../../testing/user-fixtures';
import { User } from '../models';
import { HttpUserRepository } from './http-user-repository';

describe('HttpUserRepository', () => {
  let repository: HttpUserRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpUserRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(HttpUserRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads users from GET /users', () => {
    const users = [buildUser({ id: 'u1' })];
    let result: User[] | undefined;

    repository.getUsers().subscribe((loaded) => (result = loaded));
    http.expectOne({ method: 'GET', url: `${API_URL}/users` }).flush(users);

    expect(result).toEqual(users);
  });

  it('creates a user with POST /users', () => {
    repository.createUser(NEW_USER).subscribe();

    const request = http.expectOne({ method: 'POST', url: `${API_URL}/users` });
    expect(request.request.body).toEqual(NEW_USER);
    request.flush(buildUser({ id: 'u1' }));
  });

  it('logs in with POST /auth/login', () => {
    repository.login('anna@example.com').subscribe();

    const request = http.expectOne({ method: 'POST', url: `${API_URL}/auth/login` });
    expect(request.request.body).toEqual({ email: 'anna@example.com' });
    request.flush(buildUser({ id: 'u1' }));
  });

  it('loads the logged-in profile from GET /auth/me', () => {
    repository.me().subscribe();

    http.expectOne({ method: 'GET', url: `${API_URL}/auth/me` }).flush(buildUser({ id: 'u1' }));
  });
});
