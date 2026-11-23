import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

/** Keeps authenticated people out of the OTP access flow. */
export const sessionRedirectGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    const user = await auth.loadUser();
    if (!user) return true;
    const returnUrl = route.queryParamMap.get('returnUrl');
    if (user.profileComplete && returnUrl?.startsWith('/') && !returnUrl.startsWith('//'))
      return router.parseUrl(returnUrl);
    if (!user.profileComplete && returnUrl?.startsWith('/') && !returnUrl.startsWith('//'))
      return router.createUrlTree(['/completar-perfil'], { queryParams: { returnUrl } });
    return router.parseUrl(user.profileComplete ? '/eventos' : '/completar-perfil');
  } catch {
    // A transient API failure must not be treated as a logged-in session.
    return true;
  }
};
