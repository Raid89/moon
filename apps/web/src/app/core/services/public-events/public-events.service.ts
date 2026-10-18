import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { ApiError } from '../auth/auth.service';
import { apiUrl } from '../../utils/api-url/api-url';

export interface PublicEvent {
  id: string;
  title: string;
  startsAt: string;
  timeZone: string;
  capacity: number;
  confirmedCount: number;
  venueName: string;
  address: string;
  cityCode: string;
  cityName: string;
  imageUrls: string[];
}

export interface PublicEventPage {
  events: PublicEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EventCity {
  code: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class PublicEventsService {
  private readonly http = inject(HttpClient);

  async list(page: number, q: string, cityCode: string): Promise<PublicEventPage> {
    const result = await this.call(
      this.http.get<PublicEventPage>(apiUrl('events'), {
        params: { page, ...(q.trim() ? { q: q.trim() } : {}), ...(cityCode ? { cityCode } : {}) },
      }),
    );
    return { ...result, events: result.events.map((event) => this.withAbsoluteImageUrls(event)) };
  }

  async cities(): Promise<EventCity[]> {
    return (await this.call(this.http.get<{ cities: EventCity[] }>(apiUrl('events/cities'))))
      .cities;
  }

  private withAbsoluteImageUrls(event: PublicEvent): PublicEvent {
    return { ...event, imageUrls: event.imageUrls.map((url) => apiUrl(url)) };
  }

  private async call<T>(request: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(request);
    } catch (error) {
      const body = (error as HttpErrorResponse).error as
        { code?: string; message?: string } | undefined;
      throw new ApiError(
        body?.code ?? 'NETWORK_ERROR',
        typeof body?.message === 'string'
          ? body.message
          : 'No pudimos conectar. Inténtalo de nuevo.',
      );
    }
  }
}
