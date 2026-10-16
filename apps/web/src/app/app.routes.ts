import { Routes } from '@angular/router';
import { Account } from './account/account';
import { Login } from './auth/login';
import { Profile } from './auth/profile';
import { UiKit } from './ui-kit/ui-kit';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'completar-perfil', component: Profile },
  { path: 'cuenta', component: Account },
  { path: 'ui-kit', component: UiKit },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
