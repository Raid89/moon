import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, MoonUser } from '../../../core/services/auth/auth.service';
import { Button } from '../../../shared/ui';

@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, RouterLink],
  styleUrl: './account.scss',
  templateUrl: './account.html',
})
export class Account implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly user = signal<MoonUser | null>(null);
  readonly loading = signal(false);
  async ngOnInit() {
    const user = await this.auth.loadUser();
    if (!user) {
      await this.router.navigateByUrl('/login');
      return;
    }
    if (!user.profileComplete) {
      await this.router.navigateByUrl('/completar-perfil');
      return;
    }
    this.user.set(user);
  }
  async logout() {
    this.loading.set(true);
    try {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    } finally {
      this.loading.set(false);
    }
  }
}
