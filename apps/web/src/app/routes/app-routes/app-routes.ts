import { organizerGuard } from '../../core/guards/organizer/organizer.guard';
import { sessionRedirectGuard } from '../../core/guards/session-redirect/session-redirect.guard';
import { Routes } from '@angular/router';
import { Account } from '../../features/account/account/account';
import { Login } from '../../features/auth/login/login';
import { Profile } from '../../features/auth/profile/profile';
import { UiKit } from '../../features/ui-kit/ui-kit/ui-kit';
import { SiteShell } from '../../features/layout/site-shell/site-shell';

export const routes: Routes = [
  {
    path: '',
    component: SiteShell,
    children: [
      {
        path: '',
        component: Login,
        canActivate: [sessionRedirectGuard],
        data: { shell: 'access' },
      },
      {
        path: 'eventos',
        title: 'Próximos planes | Moon',
        loadComponent: () =>
          import('../../features/events/events-home/events-home').then((m) => m.EventsHome),
      },
      {
        path: 'eventos/:id',
        title: 'Detalle del evento | Moon',
        loadComponent: () =>
          import('../../features/events/event-detail/event-detail').then((m) => m.EventDetail),
      },
      { path: 'organizador', pathMatch: 'full', redirectTo: 'organizador/eventos' },
      {
        path: 'organizador/eventos',
        title: 'Mis eventos | Moon',
        canActivate: [organizerGuard],
        loadComponent: () => import('../../features/organizer/events/events').then((m) => m.Events),
      },
      {
        path: 'organizador/eventos/nuevo',
        title: 'Crear evento | Moon',
        canActivate: [organizerGuard],
        loadComponent: () =>
          import('../../features/organizer/event-editor/event-editor').then((m) => m.EventEditor),
      },
      {
        path: 'organizador/eventos/:id/inscritos',
        title: 'Inscritos al evento | Moon',
        canActivate: [organizerGuard],
        loadComponent: () =>
          import('../../features/organizer/event-registrations/event-registrations').then(
            (m) => m.EventRegistrations,
          ),
      },
      {
        path: 'organizador/eventos/:id',
        title: 'Configurar evento | Moon',
        canActivate: [organizerGuard],
        loadComponent: () =>
          import('../../features/organizer/event-editor/event-editor').then((m) => m.EventEditor),
      },
      { path: 'completar-perfil', component: Profile, data: { shell: 'access' } },
      { path: 'cuenta', component: Account },
      { path: 'ui-kit', component: UiKit },
      { path: '', pathMatch: 'full', redirectTo: 'eventos' },
      { path: '**', redirectTo: 'eventos' },
    ],
  },
];
