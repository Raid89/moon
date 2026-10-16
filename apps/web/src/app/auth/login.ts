import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button, Input } from '../shared/ui';
import { ApiError, AuthService } from '../core/auth.service';

interface PendingOtp {
  email: string;
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
}
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Input, RouterLink],
  styles: `
    :host {
      display: block;
    }
    .page {
      margin: auto;
      max-width: 31rem;
      padding: clamp(2rem, 8vw, 6rem) var(--moon-space-4);
    }
    .brand {
      display: inline-flex;
      text-decoration: none;
    }
    .brand img {
      height: 3rem;
      width: 3rem;
    }
    .eyebrow {
      color: var(--moon-brand-soft);
      font-weight: 800;
      margin: var(--moon-space-6) 0 var(--moon-space-2);
    }
    h1 {
      font: var(--moon-font-display);
      font-size: clamp(2.5rem, 10vw, 4.5rem);
      letter-spacing: -0.06em;
      line-height: 0.92;
      margin: 0;
    }
    .copy {
      color: var(--moon-text-muted);
      line-height: 1.55;
      margin: var(--moon-space-4) 0 var(--moon-space-6);
    }
    form {
      display: grid;
      gap: var(--moon-space-4);
    }
    moon-button {
      width: 100%;
    }
    .back {
      background: none;
      border: 0;
      color: var(--moon-brand-soft);
      cursor: pointer;
      font: inherit;
      padding: 0;
      text-align: left;
    }
    .notice {
      background: var(--moon-success-soft);
      border: 1px solid var(--moon-success);
      border-radius: var(--moon-radius-md);
      color: var(--moon-text);
      padding: var(--moon-space-3);
    }
    .resend {
      color: var(--moon-text-muted);
      font-size: 0.875rem;
      margin: 0;
    }
    .link-button {
      background: none;
      border: 0;
      color: var(--moon-brand-soft);
      cursor: pointer;
      font: inherit;
      padding: 0;
      text-decoration: underline;
    }
  `,
  template: `<main class="page">
    <a class="brand" routerLink="/login"><img src="/moon_logo.png" alt="Moon" /></a>
    @if (phase() === 'email') {
      <p class="eyebrow">Tu próxima historia empieza aquí</p>
      <h1>Entra a la noche.</h1>
      <p class="copy">Usa tu correo para recibir un código seguro. No necesitas contraseña.</p>
      <form [formGroup]="emailForm" (ngSubmit)="sendCode()">
        <moon-input
          label="Tu correo"
          type="email"
          autocomplete="email"
          placeholder="tu@correo.com"
          [formControl]="emailForm.controls.email"
          [error]="emailError()"
        /><moon-button type="submit" size="lg" [loading]="loading()">Enviar código</moon-button>
      </form>
    } @else {
      <button class="back" type="button" (click)="changeEmail()">← Cambiar correo</button>
      <p class="eyebrow">Revisa tu bandeja</p>
      <h1>Tu código llegó.</h1>
      <p class="copy">
        Lo enviamos a <strong>{{ pending()!.email }}</strong
        >. Vence en cinco minutos.
      </p>
      <form [formGroup]="codeForm" (ngSubmit)="verifyCode()">
        <moon-input
          label="Código de 6 dígitos"
          type="text"
          inputmode="numeric"
          [maxlength]="6"
          autocomplete="one-time-code"
          placeholder="000000"
          [formControl]="codeForm.controls.code"
          [error]="codeError()"
        /><moon-button type="submit" size="lg" [loading]="loading()">Continuar</moon-button>
      </form>
      <p class="resend">
        ¿No llegó?
        @if (canResend()) {
          <button class="link-button" type="button" [disabled]="loading()" (click)="resend()">
            Enviar otro código
          </button>
        } @else {
          Podrás pedir otro pronto.
        }
      </p>
    }
  </main>`,
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly phase = signal<'email' | 'code'>('email');
  readonly loading = signal(false);
  readonly pending = signal<PendingOtp | null>(null);
  readonly emailError = signal('');
  readonly codeError = signal('');
  readonly canResend = computed(
    () => !this.pending() || new Date(this.pending()!.resendAvailableAt) <= new Date(),
  );
  readonly emailForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  readonly codeForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });
  ngOnInit(): void {
    const saved = sessionStorage.getItem('moon.pending-otp');
    if (saved) {
      const pending = JSON.parse(saved) as PendingOtp;
      if (new Date(pending.expiresAt) > new Date()) {
        this.pending.set(pending);
        this.phase.set('code');
      } else sessionStorage.removeItem('moon.pending-otp');
    }
  }
  async sendCode(): Promise<void> {
    this.emailError.set('');
    if (this.emailForm.invalid) {
      this.emailForm.controls.email.markAsTouched();
      this.emailError.set('Escribe un correo válido.');
      return;
    }
    this.loading.set(true);
    try {
      const pending = {
        email: this.emailForm.getRawValue().email.trim().toLowerCase(),
        ...(await this.auth.requestOtp(this.emailForm.getRawValue().email)),
      };
      this.pending.set(pending);
      sessionStorage.setItem('moon.pending-otp', JSON.stringify(pending));
      this.phase.set('code');
    } catch (e) {
      this.emailError.set(e instanceof ApiError ? e.message : 'No pudimos enviar el código.');
    } finally {
      this.loading.set(false);
    }
  }
  async verifyCode(): Promise<void> {
    this.codeError.set('');
    if (this.codeForm.invalid || !this.pending()) {
      this.codeError.set('Escribe los 6 dígitos del código.');
      return;
    }
    this.loading.set(true);
    try {
      const user = await this.auth.verifyOtp(
        this.pending()!.challengeId,
        this.codeForm.getRawValue().code,
      );
      sessionStorage.removeItem('moon.pending-otp');
      await this.router.navigateByUrl(user.profileComplete ? '/cuenta' : '/completar-perfil');
    } catch (e) {
      this.codeError.set(e instanceof ApiError ? e.message : 'No pudimos verificar el código.');
    } finally {
      this.loading.set(false);
    }
  }
  async resend(): Promise<void> {
    this.phase.set('email');
    await this.sendCode();
  }
  changeEmail(): void {
    sessionStorage.removeItem('moon.pending-otp');
    this.pending.set(null);
    this.phase.set('email');
    this.codeForm.controls.code.setValue('');
  }
}
