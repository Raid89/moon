import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth.service';

type ShellMode = 'access' | 'app';

@Component({
  selector: 'app-site-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styleUrl: './site-shell.scss',
  templateUrl: './site-shell.html',
})
export class SiteShell implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navigation = new Subscription();

  readonly shellMode = signal<ShellMode>('app');
  readonly sessionLoading = signal(true);
  readonly currentYear = new Date().getFullYear();
  readonly user = this.auth.user;
  readonly isAccess = computed(() => this.shellMode() === 'access');
  readonly isSignedIn = computed(() => !this.isAccess() && !!this.user());

  ngOnInit(): void {
    this.updateShellMode();
    this.navigation.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => this.updateShellMode()),
    );
    void this.restoreSession();
  }

  ngOnDestroy(): void {
    this.navigation.unsubscribe();
  }

  async logout(): Promise<void> {
    if (this.sessionLoading()) return;
    this.sessionLoading.set(true);
    try {
      await this.auth.logout();
      await this.router.navigateByUrl('/eventos');
    } finally {
      this.sessionLoading.set(false);
    }
  }

  private async restoreSession(): Promise<void> {
    try {
      await this.auth.loadUser();
    } catch {
      /* Public navigation remains available when the session cannot be restored. */
    } finally {
      this.sessionLoading.set(false);
    }
  }

  private updateShellMode(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    this.shellMode.set(route.data['shell'] === 'access' ? 'access' : 'app');
  }
}
