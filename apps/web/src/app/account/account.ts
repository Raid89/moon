import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, MoonUser } from '../core/auth.service';
import { Button } from '../shared/ui';

@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, RouterLink],
  styles: `
    :host {
      display: block;
    }
    .page {
      margin: auto;
      max-width: 42rem;
      padding: clamp(2rem, 8vw, 6rem) var(--moon-space-4);
    }
    .eyebrow {
      color: var(--moon-brand-soft);
      font-weight: 800;
    }
    .brand {
      margin: 0;
    }
    .brand img {
      display: block;
      height: 3rem;
      width: 3rem;
    }
    .eyebrow {
      margin: var(--moon-space-6) 0 var(--moon-space-2);
    }
    h1 {
      font: var(--moon-font-display);
      font-size: clamp(2.5rem, 10vw, 4.5rem);
      letter-spacing: -0.06em;
      line-height: 0.92;
      margin: 0;
    }
    .card {
      background: var(--moon-surface);
      border: 1px solid var(--moon-border);
      border-radius: var(--moon-radius-lg);
      display: grid;
      gap: var(--moon-space-3);
      margin-top: var(--moon-space-6);
      padding: var(--moon-space-5);
    }
    .label {
      color: var(--moon-text-faint);
      font-size: 0.8rem;
      margin: 0;
    }
    .value {
      font-size: 1.1rem;
      margin: 0;
    }
    moon-button {
      margin-top: var(--moon-space-5);
    }
  `,
  template: `<main class="page">
    <p class="brand"><img src="/moon_logo.png" alt="Moon" /></p>
    <p class="eyebrow">Tu cuenta</p>
    <h1>Qué gusto verte.</h1>
    @if (user()) {
      <section class="card" aria-label="Datos de tu perfil">
        <div>
          <p class="label">Nombre</p>
          <p class="value">{{ user()!.name }}</p>
        </div>
        <div>
          <p class="label">Correo</p>
          <p class="value">{{ user()!.email }}</p>
        </div>
        <div>
          <p class="label">Ciudad</p>
          <p class="value">{{ user()!.cityName }}</p>
        </div>
      </section>
      @if (user()!.role === 'ORGANIZER') {
        <p>
          <a routerLink="/organizador/eventos" style="color: var(--moon-brand-soft)"
            >Gestionar mis eventos →</a
          >
        </p>
      }
      <moon-button variant="secondary" (click)="logout()" [loading]="loading()"
        >Cerrar sesión</moon-button
      >
    }
  </main>`,
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
