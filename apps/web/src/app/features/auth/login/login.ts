import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AuthLayout } from '../auth-layout/auth-layout';
import { Button, Input } from '../../../shared/ui';
import { ApiError, AuthService } from '../../../core/services/auth/auth.service';

interface PendingOtp {
  email: string;
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
}
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Input, AuthLayout],
  styleUrl: '../shared/auth-form.scss',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly now = signal(Date.now());
  readonly deliveryMessage = signal('Código enviado. Ya puedes revisar tu bandeja.');
  readonly phase = signal<'email' | 'code'>('email');
  readonly loading = signal(false);
  readonly pending = signal<PendingOtp | null>(null);
  readonly emailError = signal('');
  readonly codeError = signal('');
  readonly resendSeconds = computed(() =>
    Math.max(
      0,
      Math.ceil((Date.parse(this.pending()?.resendAvailableAt ?? '') - this.now()) / 1000),
    ),
  );
  readonly canResend = computed(() => this.resendSeconds() === 0);
  readonly expirySeconds = computed(() =>
    Math.max(0, Math.ceil((Date.parse(this.pending()?.expiresAt ?? '') - this.now()) / 1000)),
  );
  readonly expired = computed(() => this.expirySeconds() === 0);
  readonly expiryLabel = computed(() => {
    const seconds = this.expirySeconds();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });
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
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
    const saved = sessionStorage.getItem('moon.pending-otp');
    if (!saved) return;
    try {
      const pending = JSON.parse(saved) as Partial<PendingOtp> | null;
      if (
        pending &&
        typeof pending.email === 'string' &&
        typeof pending.challengeId === 'string' &&
        typeof pending.expiresAt === 'string' &&
        typeof pending.resendAvailableAt === 'string' &&
        Date.parse(pending.expiresAt) > Date.now() &&
        Number.isFinite(Date.parse(pending.resendAvailableAt))
      ) {
        this.pending.set(pending as PendingOtp);
        this.emailForm.controls.email.setValue(pending.email);
        this.phase.set('code');
        this.focusField('auth-code');
        return;
      }
    } catch {
      /* Ignore invalid or outdated saved challenges. */
    }
    sessionStorage.removeItem('moon.pending-otp');
  }
  private focusField(id: string): void {
    afterNextRender(
      () => this.element.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus(),
      { injector: this.injector },
    );
  }
  async sendCode(): Promise<void> {
    if (this.loading()) return;
    this.emailError.set('');
    this.emailForm.controls.email.setValue(this.emailForm.controls.email.value.trim());
    if (this.emailForm.invalid) {
      this.emailForm.controls.email.markAsTouched();
      this.emailError.set('Escribe un correo válido, por ejemplo: tu@correo.com.');
      this.focusField('auth-email');
      return;
    }
    this.loading.set(true);
    try {
      const pending = {
        email: this.emailForm.getRawValue().email.trim().toLowerCase(),
        ...(await this.auth.requestOtp(this.emailForm.getRawValue().email)),
      };
      this.now.set(Date.now());
      this.pending.set(pending);
      this.codeForm.reset();
      this.codeError.set('');
      this.deliveryMessage.set('Código enviado. Revisa tu bandeja de entrada.');
      sessionStorage.setItem('moon.pending-otp', JSON.stringify(pending));
      this.phase.set('code');
      this.focusField('auth-code');
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'No pudimos enviar el código.';
      if (this.phase() === 'code') this.codeError.set(message);
      else this.emailError.set(message);
    } finally {
      this.loading.set(false);
    }
  }
  async verifyCode(): Promise<void> {
    if (this.loading() || this.expired()) return;
    this.codeError.set('');
    if (this.codeForm.invalid || !this.pending()) {
      this.codeError.set('Escribe los 6 dígitos del código.');
      this.focusField('auth-code');
      return;
    }
    this.loading.set(true);
    try {
      const user = await this.auth.verifyOtp(
        this.pending()!.challengeId,
        this.codeForm.getRawValue().code,
      );
      sessionStorage.removeItem('moon.pending-otp');
      await this.router.navigateByUrl(
        user.profileComplete
          ? user.role === 'ORGANIZER'
            ? '/organizador/eventos'
            : '/cuenta'
          : '/completar-perfil',
      );
    } catch (e) {
      this.codeError.set(e instanceof ApiError ? e.message : 'No pudimos verificar el código.');
    } finally {
      this.loading.set(false);
    }
  }
  async resend(): Promise<void> {
    if (this.loading() || !this.canResend() || !this.pending()) return;
    this.emailForm.controls.email.setValue(this.pending()!.email);
    await this.sendCode();
  }
  changeEmail(): void {
    if (this.loading()) return;
    this.emailForm.controls.email.setValue(this.pending()?.email ?? '');
    sessionStorage.removeItem('moon.pending-otp');
    this.pending.set(null);
    this.phase.set('email');
    this.emailError.set('');
    this.codeError.set('');
    this.codeForm.reset();
    this.focusField('auth-email');
  }
}
