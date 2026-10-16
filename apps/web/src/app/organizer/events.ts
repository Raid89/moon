import { markPrivatePage } from './private-page';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsService, MoonEvent } from '../core/events.service';
import { Badge, Button, EmptyState } from '../shared/ui';

@Component({
  selector: 'app-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, Badge, Button, EmptyState],
  styleUrl: './events.scss',
  template: `<main class="page">
    <nav aria-label="Organizador">
      <a routerLink="/cuenta"><img src="/moon_logo.png" alt="Moon" width="40" height="40" /></a
      ><a routerLink="/cuenta">Mi cuenta</a>
    </nav>
    <header>
      <p class="eyebrow">Equipo Moon · Organizador</p>
      <h1>Los buenos planes<br />empiezan contigo.</h1>
      <p class="intro">
        Prepara tu próximo encuentro. Dale forma, revisa los detalles y compártelo.
      </p>
    </header>
    <section aria-labelledby="events-title">
      <div class="section-heading">
        <h2 id="events-title">
          Mis eventos <span class="muted">({{ total() }})</span>
        </h2>
        <a class="action-link" routerLink="/organizador/eventos/nuevo"
          >Crear evento <span aria-hidden="true">＋</span></a
        >
      </div>
      @if (error()) {
        <div role="alert" class="error">
          {{ error() }} <moon-button variant="secondary" (click)="load()">Reintentar</moon-button>
        </div>
      }
      @if (loading()) {
        <p role="status">Cargando tus eventos…</p>
      } @else if (!error() && !events().length) {
        <moon-empty-state
          title="Tu próximo encuentro empieza aquí"
          description="Crea tu primer evento y guárdalo como borrador hasta tenerlo listo."
          icon="✦"
        />
      } @else {
        <div class="event-grid">
          @for (event of events(); track event.id) {
            <article class="event-card">
              @if (event.imageUrls[0]) {
                <img
                  class="cover"
                  [src]="event.imageUrls[0]"
                  alt=""
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
              }
              <div class="event-body">
                <moon-badge [tone]="event.status === 'PUBLISHED' ? 'success' : 'neutral'">{{
                  event.status === 'PUBLISHED' ? 'Publicado · edición bloqueada' : 'Borrador'
                }}</moon-badge>
                <h3>
                  <a [routerLink]="['/organizador/eventos', event.id]">{{ event.title }}</a>
                </h3>
                <p>
                  {{ event.startsAt | date: 'dd/MM/yyyy · HH:mm' : '-0500' }}
                  <span class="muted">(Colombia)</span>
                </p>
                <p class="muted">{{ event.cityName }} · {{ event.capacity }} cupos</p>
                <a [routerLink]="['/organizador/eventos', event.id]">{{
                  event.status === 'DRAFT' ? 'Configurar evento →' : 'Ver detalles →'
                }}</a>
              </div>
            </article>
          }
        </div>
      }
      @if (total() > 20) {
        <nav aria-label="Paginación">
          <moon-button
            variant="secondary"
            [disabled]="page() === 1 || loading()"
            (click)="changePage(-1)"
            >Anterior</moon-button
          ><span>Página {{ page() }}</span
          ><moon-button
            variant="secondary"
            [disabled]="page() * 20 >= total() || loading()"
            (click)="changePage(1)"
            >Siguiente</moon-button
          >
        </nav>
      }
    </section>
  </main>`,
})
export class Events implements OnInit {
  constructor() {
    markPrivatePage();
  }
  private readonly api = inject(EventsService);
  readonly events = signal<MoonEvent[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly error = signal('');
  ngOnInit() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.api.list(this.page());
      this.events.set(result.events);
      this.total.set(result.total);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar los eventos.');
    } finally {
      this.loading.set(false);
    }
  }
  changePage(delta: number) {
    this.page.update((page) => page + delta);
    void this.load();
  }
}
