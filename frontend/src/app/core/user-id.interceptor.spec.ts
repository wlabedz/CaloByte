import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_URL } from '../../environments/api-url';
import { buildUser } from '../../testing/user-fixtures';
import { ActiveUserService } from './active-user.service';
import { userIdInterceptor } from './user-id.interceptor';

describe('userIdInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([userIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('sends the logged-in user id to our API only', () => {
    TestBed.inject(ActiveUserService).select(buildUser({ id: 'u1' }));

    http.get(`${API_URL}/recipes`).subscribe();
    http.get('https://example.com/x').subscribe();

    expect(backend.expectOne(`${API_URL}/recipes`).request.headers.get('X-User-Id')).toBe('u1');
    expect(backend.expectOne('https://example.com/x').request.headers.has('X-User-Id')).toBe(false);
  });

  it('sends no header when nobody is logged in', () => {
    http.get(`${API_URL}/recipes`).subscribe();

    expect(backend.expectOne(`${API_URL}/recipes`).request.headers.has('X-User-Id')).toBe(false);
  });

  it('logs out and goes to the login page when the API does not know the user', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.inject(ActiveUserService).select(buildUser({ id: 'gone' }));

    http.get(`${API_URL}/recipes`).subscribe({ error: () => undefined });
    backend.expectOne(`${API_URL}/recipes`).flush(null, { status: 401, statusText: '' });

    expect(TestBed.inject(ActiveUserService).user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/profile']);
  });
});
