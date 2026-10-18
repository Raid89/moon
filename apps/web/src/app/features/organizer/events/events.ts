import { markPrivatePage } from '../../../core/utils/mark-private-page/mark-private-page';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsService, MoonEvent } from '../../../core/services/events/events.service';
import { Badge, Button, EmptyState } from '../../../shared/ui';

@Component({
  selector: 'app-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, Badge, Button, EmptyState],
  styleUrl: './events.scss',
  templateUrl: './events.html',
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
