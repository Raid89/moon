import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

/** Keeps authenticated people out of the OTP access flow. */
export const sessionRedirectGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    return (await auth.loadUser()) ? router.parseUrl('/eventos') : true;
  } catch {
    // A transient API failure must not be treated as a logged-in session.
    return true;
  }
};
