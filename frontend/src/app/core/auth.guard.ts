import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ActiveUserService } from './active-user.service';

/** Bez zalogowania (samym e-mailem) przekierowuje na stronę profilu z formularzem logowania. */
export const authGuard: CanActivateFn = () =>
  inject(ActiveUserService).user() ? true : inject(Router).createUrlTree(['/profile']);
