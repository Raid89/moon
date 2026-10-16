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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, Department, Municipality, ApiError } from '../core/auth.service';
import { Button, Input, Select, type SelectOption } from '../shared/ui';
import { AuthLayout } from './auth-layout/auth-layout';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Input, Select, AuthLayout],
  styleUrl: './auth-form.scss',
  template: `
    <app-auth-layout
      [step]="3"
      eyebrow="HAGAMOS LAS PRESENTACIONES"
      heading="Ahora sí, ¿cómo te llamas?"
      description="Solo falta tu nombre y dónde vives. Hagamos que los próximos encuentros se sientan más cerca."
    >
      @if (initializing()) {
        <p class="status" role="status">Preparando tu perfil…</p>
      }
      @if (profileReady()) {
        <p class="status">✓ Correo verificado. Este es el último paso.</p>
      }
      <form
        [formGroup]="form"
        (ngSubmit)="save()"
        novalidate
        [attr.aria-busy]="loading() || initializing()"
      >
        <fieldset [disabled]="loading() || initializing() || !profileReady()">
          <moon-input
            label="Tu nombre"
            name="name"
            autocomplete="name"
            placeholder="Como te gusta que te llamen"
            [formControl]="form.controls.name"
            [error]="nameError()"
          />
          <div class="location-fields">
            <moon-select
              label="Departamento"
              [placeholder]="
                departmentsLoading() ? 'Cargando departamentos…' : 'Elige tu departamento'
              "
              [options]="departmentOptions()"
              [formControl]="form.controls.departmentCode"
              [error]="departmentError()"
            />
            <moon-select
              label="Ciudad o municipio"
              [placeholder]="citiesLoading() ? 'Cargando municipios…' : 'Elige tu municipio'"
              [options]="municipalityOptions()"
              [formControl]="form.controls.cityCode"
              [error]="cityError()"
              [hint]="
                !form.controls.departmentCode.value
                  ? 'Primero selecciona tu departamento.'
                  : 'Tu lugar de residencia en Colombia.'
              "
            />
          </div>
          @if (locationError()) {
            <p class="error" role="alert" animate.enter="feedback-enter">{{ locationError() }}</p>
            <button class="link-button" type="button" (click)="retryLocations()">
              Volver a cargar ubicaciones
            </button>
          }
          <moon-button
            type="submit"
            size="lg"
            [loading]="loading()"
            [disabled]="
              citiesLoading() || departmentsLoading() || !departments().length || !!locationError()
            "
          >
            {{ loading() ? 'Guardando tu perfil…' : 'Guardar y continuar' }}
            <span aria-hidden="true">↗</span>
          </moon-button>
        </fieldset>
        @if (formError()) {
          <p class="error" role="alert" animate.enter="feedback-enter">{{ formError() }}</p>
        }
      </form>
      @if (!profileReady() && !initializing()) {
        <button class="link-button" type="button" (click)="ngOnInit()">Volver a intentar</button>
      }
      <p class="support">
        Un buen comienzo no necesita más datos. Tu correo, nombre y ciudad son suficientes para tu
        perfil.
      </p>
    </app-auth-layout>
  `,
})
export class Profile implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private locationRequest = 0;
  readonly loading = signal(false);
  readonly initializing = signal(true);
  readonly profileReady = signal(false);
  readonly departmentsLoading = signal(false);
  readonly citiesLoading = signal(false);
  readonly departments = signal<Department[]>([]);
  readonly municipalities = signal<Municipality[]>([]);
  readonly locationError = signal('');
  readonly formError = signal('');
  readonly nameError = signal('');
  readonly departmentError = signal('');
  readonly cityError = signal('');
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    departmentCode: new FormControl(
      { value: '', disabled: true },
      { nonNullable: true, validators: [Validators.required] },
    ),
    cityCode: new FormControl(
      { value: '', disabled: true },
      { nonNullable: true, validators: [Validators.required] },
    ),
  });
  readonly departmentOptions = computed(() =>
    this.departments().map(
      ({ code, name }) => ({ value: code, label: name }) satisfies SelectOption,
    ),
  );
  readonly municipalityOptions = computed(() =>
    this.municipalities().map(
      ({ code, name }) => ({ value: code, label: name }) satisfies SelectOption,
    ),
  );
  constructor() {
    this.form.controls.departmentCode.valueChanges.pipe(takeUntilDestroyed()).subscribe((code) => {
      void this.loadMunicipalities(code);
    });
  }
  async ngOnInit(): Promise<void> {
    this.initializing.set(true);
    this.formError.set('');
    try {
      const user = await this.auth.loadUser();
      if (!user) {
        await this.router.navigateByUrl('/login');
        return;
      }
      if (user.profileComplete) {
        await this.router.navigateByUrl('/cuenta');
        return;
      }
      this.form.controls.name.setValue(user.name ?? '');
      this.profileReady.set(true);
      await this.loadDepartments();
    } catch (e) {
      this.formError.set(
        e instanceof ApiError ? e.message : 'No pudimos cargar tu perfil. Inténtalo de nuevo.',
      );
    } finally {
      this.initializing.set(false);
    }
  }
  private async loadDepartments(): Promise<void> {
    this.departmentsLoading.set(true);
    this.locationError.set('');
    try {
      const departments = await this.auth.departments();
      this.departments.set(departments);
      if (departments.length) this.form.controls.departmentCode.enable({ emitEvent: false });
      else this.locationError.set('No hay departamentos disponibles. Intenta cargarlos de nuevo.');
    } catch (e) {
      this.locationError.set(
        e instanceof ApiError ? e.message : 'No pudimos cargar los departamentos.',
      );
    } finally {
      this.departmentsLoading.set(false);
    }
  }
  private async loadMunicipalities(code: string): Promise<void> {
    const request = ++this.locationRequest;
    this.form.controls.cityCode.reset('');
    this.form.controls.cityCode.disable();
    this.municipalities.set([]);
    this.cityError.set('');
    this.departmentError.set('');
    this.locationError.set('');
    this.citiesLoading.set(!!code);
    if (!code) return;
    try {
      const municipalities = await this.auth.municipalities(code);
      if (request !== this.locationRequest || this.destroyRef.destroyed) return;
      this.municipalities.set(municipalities);
      if (municipalities.length) this.form.controls.cityCode.enable();
      else this.locationError.set('No hay municipios disponibles. Intenta cargarlos de nuevo.');
    } catch (e) {
      if (request !== this.locationRequest || this.destroyRef.destroyed) return;
      this.locationError.set(
        e instanceof ApiError ? e.message : 'No pudimos cargar los municipios.',
      );
    } finally {
      if (request === this.locationRequest && !this.destroyRef.destroyed)
        this.citiesLoading.set(false);
    }
  }
  async retryLocations(): Promise<void> {
    if (this.departmentsLoading() || this.citiesLoading() || this.loading()) return;
    if (!this.departments().length) await this.loadDepartments();
    else await this.loadMunicipalities(this.form.controls.departmentCode.value);
  }
  async save(): Promise<void> {
    if (
      this.loading() ||
      !this.profileReady() ||
      this.initializing() ||
      this.citiesLoading() ||
      this.departmentsLoading() ||
      this.locationError()
    )
      return;
    this.formError.set('');
    this.nameError.set('');
    this.departmentError.set('');
    this.cityError.set('');
    this.form.controls.name.setValue(this.form.controls.name.value.trim());
    if (
      this.form.invalid ||
      !this.form.controls.departmentCode.value ||
      !this.form.controls.cityCode.value
    ) {
      this.form.markAllAsTouched();
      afterNextRender(
        () =>
          this.element.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
      if (this.form.controls.name.invalid)
        this.nameError.set('Escribe tu nombre con al menos 2 caracteres.');
      if (!this.form.controls.departmentCode.value)
        this.departmentError.set('Selecciona tu departamento.');
      if (!this.form.controls.cityCode.value) this.cityError.set('Selecciona tu municipio.');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.updateProfile(
        this.form.controls.name.value,
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
