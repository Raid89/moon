import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastService } from '../../../shared/ui';
import { AuthService } from '../../services/auth/auth.service';

export const organizerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  let user;
  try {
    user = await auth.loadUser();
  } catch {
    toast.show({
      tone: 'error',
      title: 'No pudimos comprobar tu sesión',
      message: 'Revisa tu conexión y vuelve a ingresar.',
    });
    return router.parseUrl('/login');
  }
  if (!user) return router.parseUrl('/login');
  if (!user.profileComplete) return router.parseUrl('/completar-perfil');
  return user.role === 'ORGANIZER' || router.parseUrl('/cuenta');
};
