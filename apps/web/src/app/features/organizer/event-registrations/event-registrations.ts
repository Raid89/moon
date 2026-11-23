import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  EventsService,
  OrganizerRegistrations,
} from '../../../core/services/events/events.service';
import { markPrivatePage } from '../../../core/utils/mark-private-page/mark-private-page';
import { Button, EmptyState } from '../../../shared/ui';

@Component({
  selector: 'app-event-registrations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, Button, EmptyState],
  styleUrl: './event-registrations.scss',
  templateUrl: './event-registrations.html',
})
export class EventRegistrations implements OnInit {
  constructor() {
    markPrivatePage();
  }

  private readonly api = inject(EventsService);
  private readonly route = inject(ActivatedRoute);

  readonly data = signal<OrganizerRegistrations | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

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
      this.data.set(await this.api.registrations(id));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar los inscritos.');
    } finally {
      this.loading.set(false);
    }
  }
}
