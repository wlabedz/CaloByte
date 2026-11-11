import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_URL } from '../../environments/api-url';
import { ActiveUserService } from './active-user.service';

export const USER_ID_HEADER = 'X-User-Id';

/**
 * Dokleja id zalogowanego użytkownika do zapytań do naszego API. Gdy backend go nie zna
 * (401, np. konto usunięte), wylogowuje i odsyła na stronę logowania.
 */
export const userIdInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(API_URL)) {
    return next(request);
  }
  const activeUser = inject(ActiveUserService);
  const router = inject(Router);
  const user = activeUser.user();
  const withUser = user ? request.clone({ setHeaders: { [USER_ID_HEADER]: user.id } }) : request;
  return next(withUser).pipe(
    catchError((error: unknown) => {
      if (user && error instanceof HttpErrorResponse && error.status === 401) {
        activeUser.logout();
        void router.navigate(['/profile']);
      }
      return throwError(() => error);
    }),
  );
};
