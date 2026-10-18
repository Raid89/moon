import { markPrivatePage } from '../../../core/utils/mark-private-page/mark-private-page';
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
import { QuillModule, type QuillModules } from 'ngx-quill';
import { AuthService } from '../../../core/services/auth/auth.service';
import { EventInput, EventsService, MoonEvent } from '../../../core/services/events/events.service';
import { normalizeHttpsImageUrl } from '../../../core/utils/https-image-url/https-image-url';
import { Button, Dialog, Input, Select, SelectOption, ToastService } from '../../../shared/ui';

type Step = 1 | 2 | 3 | 4;
const mapUrlPattern =
  /^https:\/\/(?:www\.)?google\.com\/maps(?:\/|$)|^https:\/\/maps\.google\.com\/|^https:\/\/maps\.app\.goo\.gl\//i;

interface QuillToolbarContext {
  quill: {
    getLength(): number;
    getSelection(focus?: boolean): { index: number; length: number } | null;
    insertEmbed(index: number, type: string, value: string, source: 'user'): void;
    setSelection(index: number, length: number, source: 'silent'): void;
  };
}

function insertHttpsImage(this: QuillToolbarContext): void {
  const value = window.prompt('Pega la URL HTTPS pública de la imagen.');
  if (!value) return;

  const imageUrl = normalizeHttpsImageUrl(value);
  if (!imageUrl) {
    window.alert('Usa una URL pública HTTPS válida para insertar la imagen.');
    return;
  }

  const selection = this.quill.getSelection(true);
  const index = selection?.index ?? this.quill.getLength();
  this.quill.insertEmbed(index, 'image', imageUrl, 'user');
  this.quill.setSelection(index + 1, 0, 'silent');
}

@Component({
  selector: 'app-event-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, QuillModule, Button, Dialog, Input, Select],
  styleUrl: './event-editor.scss',
  templateUrl: './event-editor.html',
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
  readonly richTextModules: QuillModules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ header: [2, 3, false] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link', 'image'],
        ['clean'],
      ],
      handlers: { image: insertHttpsImage },
    },
  };
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
