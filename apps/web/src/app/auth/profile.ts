import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, Department, Municipality, ApiError } from '../core/auth.service';
import { Button, Input, Select, type SelectOption } from '../shared/ui';
@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Input, Select],
  styles: `
    :host {
      display: block;
    }
    .page {
      margin: auto;
      max-width: 34rem;
      padding: clamp(2rem, 8vw, 6rem) var(--moon-space-4);
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
    .error {
      color: var(--moon-danger);
      margin: 0;
    }
  `,
  template: `<main class="page">
    <p class="brand"><img src="/moon_logo.png" alt="Moon" /></p>
    <p class="eyebrow">Ya casi</p>
    <h1>Cuéntanos de ti.</h1>
    <p class="copy">Con tu nombre y ciudad podremos preparar experiencias que se sientan cerca.</p>
    <form [formGroup]="form" (ngSubmit)="save()">
      <moon-input
        label="¿Cómo te llamas?"
        autocomplete="name"
        placeholder="Tu nombre"
        [formControl]="form.controls.name"
        [error]="nameError()"
      /><moon-select
        label="Departamento"
        placeholder="Elige tu departamento"
        [options]="departmentOptions()"
        [formControl]="form.controls.departmentCode"
        [error]="departmentError()"
      /><moon-select
        label="Municipio de residencia"
        placeholder="Elige tu municipio"
        [options]="municipalityOptions()"
        [formControl]="form.controls.cityCode"
        [error]="cityError()"
      /><moon-button type="submit" size="lg" [loading]="loading()">Guardar y continuar</moon-button>
      <p class="error" role="alert">{{ formError() }}</p>
    </form>
  </main>`,
})
export class Profile implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly departments = signal<Department[]>([]);
  readonly municipalities = signal<Municipality[]>([]);
  readonly formError = signal('');
  readonly nameError = signal('');
  readonly departmentError = signal('');
  readonly cityError = signal('');
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    departmentCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cityCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly departmentOptions = () =>
    this.departments().map(
      ({ code, name }) => ({ value: code, label: name }) satisfies SelectOption,
    );
  readonly municipalityOptions = () =>
    this.municipalities().map(
      ({ code, name }) => ({ value: code, label: name }) satisfies SelectOption,
    );
  async ngOnInit() {
    const user = await this.auth.loadUser();
    if (!user) {
      await this.router.navigateByUrl('/login');
      return;
    }
    if (user.profileComplete) {
      await this.router.navigateByUrl('/cuenta');
      return;
    }
    try {
      this.departments.set(await this.auth.departments());
    } catch (e) {
      this.formError.set(e instanceof ApiError ? e.message : 'No pudimos cargar las ciudades.');
    }
    this.form.controls.departmentCode.valueChanges.subscribe(async (code) => {
      this.form.controls.cityCode.setValue('');
      this.municipalities.set(code ? await this.auth.municipalities(code) : []);
    });
  }
  async save() {
    this.formError.set('');
    this.nameError.set('');
    this.departmentError.set('');
    this.cityError.set('');
    if (this.form.invalid) {
      if (this.form.controls.name.invalid) this.nameError.set('Escribe tu nombre.');
      if (this.form.controls.departmentCode.invalid)
        this.departmentError.set('Selecciona tu departamento.');
      if (this.form.controls.cityCode.invalid) this.cityError.set('Selecciona tu municipio.');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.updateProfile(
        this.form.controls.name.value.trim(),
        this.form.controls.cityCode.value,
      );
      await this.router.navigateByUrl('/cuenta');
    } catch (e) {
      this.formError.set(e instanceof ApiError ? e.message : 'No pudimos guardar tu perfil.');
    } finally {
      this.loading.set(false);
    }
  }
}
