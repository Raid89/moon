import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { ApiError } from './auth.service';

export interface EventInput {
  title: string;
  description: string;
  activityDescription: string;
  rules: string;
  startsAt: string;
  capacity: number;
  venueName: string;
  address: string;
  cityCode: string;
  mapLink: string;
}
export interface MoonEvent extends EventInput {
  id: string;
  status: 'DRAFT' | 'PUBLISHED';
  timeZone: string;
  cityName: string;
  publishedAt: string | null;
  imageUrls: string[];
}
@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly http = inject(HttpClient);
  list(page: number) {
    return this.call(
      this.http.get<{ events: MoonEvent[]; total: number; pageSize: number }>(
        '/api/organizer/events',
        { params: { page } },
      ),
    );
  }
  get(id: string) {
    return this.call(this.http.get<{ event: MoonEvent }>(`/api/organizer/events/${id}`));
  }
  save(id: string | null, data: EventInput) {
    return this.call(
      id
        ? this.http.patch<{ event: MoonEvent }>(`/api/organizer/events/${id}`, data)
        : this.http.post<{ event: MoonEvent }>('/api/organizer/events', data),
    );
  }
  publish(id: string) {
    return this.call(
      this.http.post<{ event: MoonEvent }>(`/api/organizer/events/${id}/publish`, {}),
    );
  }
  uploadCover(id: string, file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.call(
      this.http.post<{ event: MoonEvent }>(`/api/organizer/events/${id}/cover`, data),
    );
  }
  removeCover(id: string) {
    return this.call(this.http.delete<{ event: MoonEvent }>(`/api/organizer/events/${id}/cover`));
  }
  private async call<T>(request: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(request);
    } catch (error) {
      const body = (error as HttpErrorResponse).error as
        { code?: string; message?: string } | undefined;
      throw new ApiError(
        body?.code ?? 'NETWORK_ERROR',
        Array.isArray(body?.message)
          ? body.message.join(' ')
          : (body?.message ?? 'No pudimos conectar. Inténtalo de nuevo.'),
      );
    }
  }
}
