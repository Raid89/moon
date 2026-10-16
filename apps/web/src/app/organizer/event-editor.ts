import { markPrivatePage } from './private-page';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { EventInput, EventsService, MoonEvent } from '../core/events.service';
import { Button, Dialog, Input, Select, SelectOption, Textarea, ToastService } from '../shared/ui';

type Step = 1 | 2 | 3 | 4;
const mapUrlPattern =
  /^https:\/\/(?:www\.)?google\.com\/maps(?:\/|$)|^https:\/\/maps\.google\.com\/|^https:\/\/maps\.app\.goo\.gl\//i;

@Component({
  selector: 'app-event-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Dialog, Input, Select, Textarea],
  styleUrl: './organizer.scss',
  template: `<main class="page event-workspace">
    <nav class="workspace-nav" aria-label="Organizador">
      <a routerLink="/organizador/eventos">← Mis eventos</a>
      <span class="workspace-status">{{
        event()?.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'
      }}</span>
      <a routerLink="/cuenta">Mi cuenta</a>
    </nav>
    <section class="editor-hero" aria-labelledby="editor-title">
      <p class="eyebrow">Equipo Moon · Configurador de eventos</p>
      <h1 id="editor-title">
        {{
          event() ? 'Dale el último toque a tu plan.' : 'Armemos un plan que se sienta inolvidable.'
        }}
      </h1>
      <p>
        Cuatro momentos simples para preparar el encuentro. Todo queda en borrador hasta que decidas
        publicarlo.
      </p>
    </section>
    @if (loading()) {
      <p class="loading-copy" role="status">Preparando tu espacio creativo…</p>
    } @else if (loadFailed()) {
      <div class="error" role="alert">
        {{ error() }} <moon-button variant="secondary" (click)="load()">Reintentar</moon-button>
      </div>
    } @else {
      @if (event()?.status === 'PUBLISHED') {
        <div class="notice" role="status">
          Este evento ya está publicado. Conservamos cada detalle para que puedas revisarlo, pero su
          edición está bloqueada.
        </div>
      }
      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }
      <div class="editor-layout">
        <aside class="stepper" aria-label="Progreso de configuración">
          <p class="stepper-label">Tu recorrido</p>
          @for (item of steps; track item.id) {
            <button
              type="button"
              class="step-button"
              [class.current]="step() === item.id"
              [class.done]="step() > item.id"
              [attr.aria-current]="step() === item.id ? 'step' : null"
              (click)="goToStep(item.id)"
            >
              <span class="step-number">{{ step() > item.id ? '✓' : item.id }}</span>
              <span
                ><strong>{{ item.title }}</strong
                ><small>{{ item.description }}</small></span
              >
            </button>
          }
        </aside>
        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <fieldset [disabled]="saving() || publishing() || event()?.status === 'PUBLISHED'">
            @switch (step()) {
              @case (1) {
                <section class="step-panel" aria-labelledby="idea-title">
                  <div class="step-heading">
                    <span>01</span>
                    <div>
                      <p>El concepto</p>
                      <h2 id="idea-title">Cuéntanos qué va a pasar.</h2>
                    </div>
                  </div>
                  <moon-input
                    label="Nombre del evento"
                    formControlName="title"
                    [maxlength]="160"
                    [error]="fieldError('title')"
                    placeholder="Una noche para conectar"
                  />
                  <moon-textarea
                    label="Descripción"
                    formControlName="description"
                    [error]="fieldError('description')"
                    hint="Haz que se sienta como una invitación, no como un aviso."
                  />
                  <div class="two-columns">
                    <moon-textarea
                      label="Dinámica y actividades"
                      formControlName="activityDescription"
                      [error]="fieldError('activityDescription')"
                    /><moon-textarea
                      label="Reglas para asistir"
                      formControlName="rules"
                      [error]="fieldError('rules')"
                    />
                  </div>
                </section>
              }
              @case (2) {
                <section class="step-panel" aria-labelledby="time-title">
                  <div class="step-heading">
                    <span>02</span>
                    <div>
                      <p>El momento</p>
                      <h2 id="time-title">Ponlo en el calendario.</h2>
                    </div>
                  </div>
                  <div class="date-scene" aria-hidden="true">
                    <span>✦</span><span>☾</span><span>✦</span>
                  </div>
                  <div class="two-columns">
                    <moon-input
                      label="Fecha y hora de inicio"
                      type="datetime-local"
                      formControlName="startsAt"
                      [error]="fieldError('startsAt')"
                      hint="Hora de Colombia (UTC-5)."
                    /><moon-input
                      label="Cupos disponibles"
                      type="number"
                      inputmode="numeric"
                      formControlName="capacity"
                      [error]="fieldError('capacity')"
                      hint="El límite que verá la comunidad."
                    />
                  </div>
                </section>
              }
              @case (3) {
                <section class="step-panel" aria-labelledby="place-title">
                  <div class="step-heading">
                    <span>03</span>
                    <div>
                      <p>El lugar</p>
                      <h2 id="place-title">Haz fácil llegar.</h2>
                    </div>
                  </div>
                  <div class="two-columns">
                    <moon-input
                      label="Nombre del lugar"
                      formControlName="venueName"
                      [maxlength]="160"
                      [error]="fieldError('venueName')"
                      placeholder="Café, parque o punto de encuentro"
                    /><moon-input
                      label="Dirección"
                      formControlName="address"
                      [maxlength]="300"
                      [error]="fieldError('address')"
                    />
                  </div>
                  <div class="two-columns">
                    <moon-select
                      label="Departamento"
                      [options]="departments()"
                      [formControl]="department"
                      (change)="loadCities()"
                    /><moon-select
                      label="Municipio"
                      [options]="cities()"
                      formControlName="cityCode"
                      [error]="fieldError('cityCode')"
                    />
                  </div>
                  @if (cityError()) {
                    <div class="error" role="alert">
                      {{ cityError() }}
                      <moon-button variant="secondary" (click)="retryLocations()"
                        >Reintentar</moon-button
                      >
                    </div>
                  }
                  <moon-input
                    label="Enlace de Google Maps"
                    type="url"
                    formControlName="mapLink"
                    [maxlength]="2048"
                    [error]="fieldError('mapLink')"
                    hint="En Google Maps: Compartir → Insertar un mapa → copia el enlace que aparece en src."
                    placeholder="https://www.google.com/maps/embed?..."
                  />
                  @if (mapPreview()) {
                    <div class="map-preview">
                      <iframe
                        [src]="mapPreview()"
                        title="Vista previa de la ubicación en Google Maps"
                        loading="lazy"
                      ></iframe
                      ><a
                        [href]="form.controls.mapLink.value"
                        target="_blank"
                        rel="noopener noreferrer"
                        >Abrir en Google Maps ↗</a
                      >
                    </div>
                  } @else {
                    <div class="map-placeholder">
                      <span aria-hidden="true">⌖</span>
                      <p>
                        Cuando pegues un enlace de Google Maps, aquí tendrás una vista previa del
                        punto de encuentro.
                      </p>
                    </div>
                  }
                </section>
              }
              @case (4) {
                <section class="step-panel" aria-labelledby="image-title">
                  <div class="step-heading">
                    <span>04</span>
                    <div>
                      <p>La primera impresión</p>
                      <h2 id="image-title">Ponle una cara al plan.</h2>
                    </div>
                  </div>
                  <div class="upload-note">
                    <span aria-hidden="true">✦</span>
                    <p>
                      <strong>Modo ejemplo.</strong> Esta previsualización vive solo en tu
                      navegador. Cuando nos compartas el bucket, conectaremos la carga real y
                      guardaremos la imagen.
                    </p>
                  </div>
                  <label
                    class="image-dropzone"
                    [class.has-image]="imagePreview()"
                    [attr.aria-describedby]="imageError() ? 'image-error' : null"
                    ><input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      (change)="selectImage($event)"
                    />
                    @if (imagePreview()) {
                      <img
                        [src]="imagePreview()"
                        alt="Vista previa de la imagen de portada elegida"
                      />
                    } @else {
                      <span class="upload-icon" aria-hidden="true">↑</span
                      ><strong>Elige una imagen de portada</strong
                      ><small>JPG, PNG o WebP · máximo 8 MB</small>
                    }
                  </label>
                  @if (imagePreview()) {
                    <div class="image-meta">
                      <span>{{ imageName() }}</span
                      ><moon-button variant="quiet" size="sm" (click)="clearImage()"
                        >Quitar imagen</moon-button
                      >
                    </div>
                  }
                  @if (imageError()) {
                    <p id="image-error" class="field-error" role="alert">{{ imageError() }}</p>
                  }
                </section>
              }
            }
          </fieldset>
          @if (event()?.status !== 'PUBLISHED') {
            <footer class="editor-actions">
              @if (step() > 1) {
                <moon-button variant="quiet" type="button" (click)="previousStep()"
                  >← Atrás</moon-button
                >
              }
              <span class="action-spacer"></span>
              @if (step() < 4) {
                <moon-button type="button" (click)="nextStep()">Continuar →</moon-button>
              } @else {
                <moon-button type="submit" [loading]="saving()" [disabled]="publishing()"
                  >Guardar borrador</moon-button
                >
              }
            </footer>
            @if (event() && step() === 4) {
              <div class="publish-row">
                <p>¿Todo listo? Al publicar, los datos quedan bloqueados.</p>
                <moon-button
                  variant="secondary"
                  [disabled]="form.dirty || saving() || publishing()"
                  (click)="publishOpen.set(true)"
                  >Publicar evento</moon-button
                >
              </div>
            }
          }
        </form>
      </div>
    }
    <moon-dialog
      title="¿Publicar este evento?"
      description="El evento será visible cuando conectemos el catálogo público y sus datos quedarán bloqueados."
      [open]="publishOpen()"
      (openChange)="publishOpen.set($event)"
      ><p>Revisa el momento, el mapa y la información del encuentro antes de continuar.</p>
      <moon-button
        moonDialogActions
        variant="secondary"
        (click)="publishOpen.set(false)"
        [disabled]="publishing()"
        >Volver a revisar</moon-button
      ><moon-button moonDialogActions (click)="publish()" [loading]="publishing()"
        >Confirmar publicación</moon-button
      ></moon-dialog
    >
  </main>`,
})
export class EventEditor implements OnInit {
  constructor() {
    markPrivatePage();
  }
  private readonly api = inject(EventsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  readonly steps: readonly { id: Step; title: string; description: string }[] = [
    { id: 1, title: 'La idea', description: 'El plan y su vibra' },
    { id: 2, title: 'El momento', description: 'Fecha y cupos' },
    { id: 3, title: 'El lugar', description: 'Mapa y dirección' },
    { id: 4, title: 'La portada', description: 'Imagen del encuentro' },
  ];
  readonly step = signal<Step>(1);
  readonly event = signal<MoonEvent | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly publishing = signal(false);
  readonly publishOpen = signal(false);
  readonly error = signal('');
  readonly loadFailed = signal(false);
  readonly cityError = signal('');
  readonly imageError = signal('');
  readonly imageName = signal('');
  readonly imagePreview = signal<string | null>(null);
  readonly departments = signal<SelectOption[]>([]);
  readonly cities = signal<SelectOption[]>([]);
  readonly department = this.fb.control('');
  private cityRequest = 0;
  private previewObjectUrl: string | null = null;
  private selectedImage: File | null = null;
  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10000)]],
    activityDescription: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(5000)],
    ],
    rules: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(5000)]],
    startsAt: ['', Validators.required],
    capacity: [
      '50',
      [Validators.required, Validators.pattern(/^\d+$/), Validators.min(1), Validators.max(100000)],
    ],
    venueName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    address: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(300)]],
    cityCode: ['', Validators.required],
    mapLink: [
      '',
      [Validators.required, Validators.pattern(mapUrlPattern), Validators.maxLength(2048)],
    ],
  });
  readonly mapPreview = computed<SafeResourceUrl | null>(() => {
    const link = this.form.controls.mapLink.value.trim();
    return mapUrlPattern.test(link) ? this.sanitizer.bypassSecurityTrustResourceUrl(link) : null;
  });
  ngOnInit() {
    this.destroyRef.onDestroy(() => this.revokePreview());
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    this.loadFailed.set(false);
    try {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        const { event } = await this.api.get(id);
        this.event.set(event);
        const local = new Date(new Date(event.startsAt).getTime() - 5 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16);
        this.form.reset({ ...event, startsAt: local, capacity: String(event.capacity) });
        if (event.imageUrls[0]) {
          this.imagePreview.set(event.imageUrls[0]);
          this.imageName.set('Portada guardada');
        }
        this.department.setValue(event.cityCode.slice(0, 2));
        if (event.status === 'PUBLISHED') {
          this.form.disable();
          this.department.disable();
        }
      }
      await this.retryLocations();
    } catch (error) {
      this.fail(error);
      this.loadFailed.set(true);
    } finally {
      this.loading.set(false);
    }
  }
  goToStep(step: Step) {
    this.step.set(step);
  }
  previousStep() {
    this.step.update((step) => (step - 1) as Step);
  }
  nextStep() {
    const controls =
      this.step() === 1
        ? ['title', 'description', 'activityDescription', 'rules']
        : this.step() === 2
          ? ['startsAt', 'capacity']
          : ['venueName', 'address', 'cityCode', 'mapLink'];
    for (const name of controls)
      this.form.controls[name as keyof typeof this.form.controls].markAsTouched();
    if (
      controls.some((name) => this.form.controls[name as keyof typeof this.form.controls].invalid)
    )
      return;
    this.step.update((step) => (step + 1) as Step);
  }
  async retryLocations() {
    this.cityError.set('');
    try {
      this.departments.set(
        (await this.auth.departments()).map((department) => ({
          label: department.name,
          value: department.code,
        })),
      );
      if (this.department.value) await this.loadCities(true);
    } catch {
      this.cityError.set('No pudimos cargar los municipios.');
    }
  }
  async loadCities(preserve = false) {
    const request = ++this.cityRequest;
    const department = this.department.value;
    this.cityError.set('');
    this.cities.set([]);
    if (!preserve) this.form.controls.cityCode.setValue('');
    if (!department) return;
    try {
      const cities = await this.auth.municipalities(department);
      if (request === this.cityRequest)
        this.cities.set(cities.map((city) => ({ label: city.name, value: city.code })));
    } catch {
      if (request === this.cityRequest) this.cityError.set('No pudimos cargar los municipios.');
    }
  }
  selectImage(event: Event) {
    this.imageError.set('');
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      this.imageError.set('Elige un JPG, PNG o WebP de máximo 8 MB.');
      return;
    }
    this.revokePreview();
    this.previewObjectUrl = URL.createObjectURL(file);
    this.selectedImage = file;
    this.imagePreview.set(this.previewObjectUrl);
    this.imageName.set(file.name);
  }
  async clearImage() {
    if (!this.selectedImage && this.event()?.imageUrls.length) {
      this.saving.set(true);
      try {
        const { event } = await this.api.removeCover(this.event()!.id);
        this.event.set(event);
      } catch (error) {
        this.fail(error);
        return;
      } finally {
        this.saving.set(false);
      }
    }
    this.revokePreview();
    this.selectedImage = null;
    this.imagePreview.set(null);
    this.imageName.set('');
    this.imageError.set('');
  }
  fieldError(name: keyof typeof this.form.controls) {
    const control = this.form.controls[name];
    if (!control.touched || !control.invalid) return '';
    if (control.hasError('required')) return 'Completa este campo.';
    if (name === 'mapLink') return 'Pega un enlace HTTPS de Google Maps.';
    if (control.hasError('minlength'))
      return `Escribe al menos ${control.errors!['minlength'].requiredLength} caracteres.`;
    if (control.hasError('maxlength')) return 'El texto supera la longitud permitida.';
    return 'Revisa el formato y el rango permitido.';
  }
  async save() {
    if (this.saving() || this.publishing() || this.event()?.status === 'PUBLISHED') return;
    this.error.set('');
    const raw = this.form.getRawValue();
    for (const key of Object.keys(raw) as (keyof typeof raw)[])
      this.form.controls[key].setValue(raw[key].trim(), { emitEvent: false });
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const date = new Date(`${raw.startsAt}:00-05:00`);
    if (!Number.isFinite(date.getTime())) {
      this.error.set('Revisa la fecha y hora de inicio.');
      return;
    }
    const data: EventInput = {
      ...raw,
      startsAt: date.toISOString(),
      capacity: Number(raw.capacity),
    };
    this.saving.set(true);
    try {
      const { event } = await this.api.save(this.event()?.id ?? null, data);
      const stored = this.selectedImage
        ? (await this.api.uploadCover(event.id, this.selectedImage)).event
        : event;
      this.event.set(stored);
      if (stored.imageUrls[0]) {
        this.revokePreview();
        this.selectedImage = null;
        this.imagePreview.set(stored.imageUrls[0]);
        this.imageName.set('Portada guardada');
      }
      this.form.markAsPristine();
      this.toast.show({
        title: 'Borrador guardado',
        message: 'Tu plan ya tiene forma. Puedes volver a pulirlo cuando quieras.',
        tone: 'success',
      });
      if (!this.route.snapshot.paramMap.get('id'))
        await this.router.navigate(['/organizador/eventos', event.id], { replaceUrl: true });
    } catch (error) {
      this.fail(error);
    } finally {
      this.saving.set(false);
    }
  }
  async publish() {
    const event = this.event();
    if (!event || this.publishing() || this.saving() || this.form.dirty) return;
    this.publishing.set(true);
    this.error.set('');
    try {
      const result = await this.api.publish(event.id);
      this.event.set(result.event);
      this.form.disable();
      this.department.disable();
      this.toast.show({
        title: 'Evento publicado',
        message: 'Tu encuentro ya quedó listo y sus detalles se conservaron.',
        tone: 'success',
      });
    } catch (error) {
      this.fail(error);
    } finally {
      this.publishOpen.set(false);
      this.publishing.set(false);
    }
  }
  private revokePreview() {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
  }
  private fail(error: unknown) {
    this.error.set(error instanceof Error ? error.message : 'No pudimos completar la acción.');
  }
}
