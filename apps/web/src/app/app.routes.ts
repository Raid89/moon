import { organizerGuard } from './core/organizer.guard';
import { Routes } from '@angular/router';
import { Account } from './account/account';
import { Login } from './auth/login';
import { Profile } from './auth/profile';
import { UiKit } from './ui-kit/ui-kit';

export const routes: Routes = [
  { path: 'organizador', pathMatch: 'full', redirectTo: 'organizador/eventos' },
  {
    path: 'organizador/eventos',
    title: 'Mis eventos | Moon',
    canActivate: [organizerGuard],
    loadComponent: () => import('./organizer/events').then((m) => m.Events),
  },
  {
    path: 'organizador/eventos/nuevo',
    title: 'Crear evento | Moon',
    canActivate: [organizerGuard],
    loadComponent: () => import('./organizer/event-editor').then((m) => m.EventEditor),
  },
  {
    path: 'organizador/eventos/:id',
    title: 'Configurar evento | Moon',
    canActivate: [organizerGuard],
    loadComponent: () => import('./organizer/event-editor').then((m) => m.EventEditor),
  },
  { path: 'login', component: Login },
  { path: 'completar-perfil', component: Profile },
  { path: 'cuenta', component: Account },
  { path: 'ui-kit', component: UiKit },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
