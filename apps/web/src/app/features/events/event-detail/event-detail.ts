import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import {
  PublicEventDetail,
  PublicEventsService,
} from '../../../core/services/public-events/public-events.service';
import { Button, ToastService } from '../../../shared/ui';

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, Button],
  styleUrl: './event-detail.scss',
  templateUrl: './event-detail.html',
})
export class EventDetail implements OnInit {
  private readonly api = inject(PublicEventsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly event = signal<PublicEventDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly reserving = signal(false);
  readonly registered = signal(false);

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No encontramos este evento.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    try {
      this.event.set(await this.api.get(id));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar este evento.');
    } finally {
      this.loading.set(false);
    }
  }

  capacityPercent(event: PublicEventDetail): number {
    return Math.min(100, Math.round((event.confirmedCount / event.capacity) * 100));
  }

  availabilityLabel(event: PublicEventDetail): string {
    if (this.registered()) return 'Inscrito';
    return event.confirmedCount >= event.capacity ? 'Cupos completos' : 'Cupos disponibles';
  }

  async reserve(): Promise<void> {
    const event = this.event();
    if (!event || this.reserving() || this.registered()) return;

    const returnUrl = this.router.url;
    try {
      const user = this.auth.user() ?? (await this.auth.loadUser());
      if (!user) {
        await this.router.navigate(['/login'], { queryParams: { returnUrl } });
        return;
      }
      if (!user.profileComplete) {
        await this.router.navigate(['/completar-perfil'], { queryParams: { returnUrl } });
        return;
      }

      this.reserving.set(true);
      const result = await this.api.register(event.id);
      this.event.update((current) =>
        current ? { ...current, confirmedCount: result.confirmedCount } : current,
      );
      this.registered.set(true);
      this.toast.show({
        title: result.alreadyRegistered ? 'Ya tienes tu lugar' : '¡Tu lugar está confirmado!',
        message: result.alreadyRegistered
          ? 'Esta reserva ya estaba registrada para este evento.'
          : 'Nos vemos en el encuentro. Guarda la fecha y llega con ganas de conocer gente.',
        tone: 'success',
      });
    } catch (error) {
      this.toast.show({
        title: 'No pudimos completar la reserva',
        message: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
        tone: 'error',
      });
    } finally {
      this.reserving.set(false);
    }
  }
}
