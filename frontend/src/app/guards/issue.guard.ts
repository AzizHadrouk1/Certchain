import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Only signed-in institutions may open the issue page (UI handles pending/approved). */
export const issueGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: '/issue' },
    });
  }
  if (auth.user()?.role === 'admin') {
    return router.createUrlTree(['/']);
  }
  if (auth.user()?.role !== 'institution') {
    return router.createUrlTree(['/login']);
  }
  return true;
};
