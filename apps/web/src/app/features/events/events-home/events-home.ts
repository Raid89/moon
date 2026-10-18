import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import {
  EventCity,
  PublicEvent,
  PublicEventsService,
} from '../../../core/services/public-events/public-events.service';

type CataloguePreview = 'ready' | 'loading' | 'no-results' | 'empty' | 'error';

@Component({
  selector: 'app-events-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  styleUrl: './events-home.scss',
  templateUrl: './events-home.html',
})
export class EventsHome implements OnInit, OnDestroy {
  private readonly api = inject(PublicEventsService);
  private readonly subscriptions = new Subscription();

  readonly search = new FormControl('', { nonNullable: true });
  readonly cityCode = new FormControl('', { nonNullable: true });
  readonly events = signal<PublicEvent[]>([]);
  readonly cities = signal<EventCity[]>([]);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly pageSize = signal(12);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal('');
  readonly loaded = signal(false);
  readonly preview = signal<CataloguePreview>('ready');
  readonly displayState = computed<CataloguePreview>(() => {
    const preview = this.preview();
    if (preview !== 'ready') return preview;
    if (this.loading()) return 'loading';
    if (this.error()) return 'error';
    if (!this.events().length) return this.hasFilters() ? 'no-results' : 'empty';
    return 'ready';
  });

  ngOnInit() {
    this.subscriptions.add(
      this.search.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => this.reset()),
    );
    this.subscriptions.add(this.cityCode.valueChanges.subscribe(() => this.reset()));
    void this.loadCities();
    void this.load();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  get hasMore() {
    return this.events().length < this.total();
  }

  hasFilters() {
    return Boolean(this.search.value.trim() || this.cityCode.value);
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.api.list(1, this.search.value, this.cityCode.value);
      this.events.set(result.events);
      this.page.set(result.page);
      this.pageSize.set(result.pageSize);
      this.total.set(result.total);
      this.loaded.set(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar los planes.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore() {
    if (!this.hasMore || this.loadingMore()) return;
    this.loadingMore.set(true);
    try {
      const result = await this.api.list(this.page() + 1, this.search.value, this.cityCode.value);
      this.events.update((events) => [...events, ...result.events]);
      this.page.set(result.page);
      this.total.set(result.total);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar más planes.');
    } finally {
      this.loadingMore.set(false);
    }
  }

  resetFilters() {
    this.preview.set('ready');
    this.search.setValue('', { emitEvent: false });
    this.cityCode.setValue('', { emitEvent: false });
    void this.load();
  }

  clearSearch() {
    this.search.setValue('');
  }

  setPreview(preview: CataloguePreview) {
    this.preview.set(preview);
  }

  retry() {
    this.preview.set('ready');
    void this.load();
  }

  private reset() {
    this.preview.set('ready');
    void this.load();
  }

  private async loadCities() {
    try {
      this.cities.set(await this.api.cities());
    } catch {
      // The catalogue remains usable when the optional city list is unavailable.
    }
  }
}
