import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { ApiError } from '../auth/auth.service';
import { apiUrl } from '../../utils/api-url/api-url';

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
  async list(page: number) {
    const result = await this.call(
      this.http.get<{ events: MoonEvent[]; total: number; pageSize: number }>(
        apiUrl('organizer/events'),
        { params: { page } },
      ),
    );
    return { ...result, events: result.events.map((event) => this.withAbsoluteImageUrls(event)) };
  }
  async get(id: string) {
    const result = await this.call(
      this.http.get<{ event: MoonEvent }>(apiUrl(`organizer/events/${id}`)),
    );
    return { event: this.withAbsoluteImageUrls(result.event) };
  }
  async save(id: string | null, data: EventInput) {
    const result = await this.call(
      id
        ? this.http.patch<{ event: MoonEvent }>(apiUrl(`organizer/events/${id}`), data)
        : this.http.post<{ event: MoonEvent }>(apiUrl('organizer/events'), data),
    );
    return { event: this.withAbsoluteImageUrls(result.event) };
  }
  async publish(id: string) {
    const result = await this.call(
      this.http.post<{ event: MoonEvent }>(apiUrl(`organizer/events/${id}/publish`), {}),
    );
    return { event: this.withAbsoluteImageUrls(result.event) };
  }
  async uploadCover(id: string, file: File) {
    const data = new FormData();
    data.append('file', file);
    const result = await this.call(
      this.http.post<{ event: MoonEvent }>(apiUrl(`organizer/events/${id}/cover`), data),
    );
    return { event: this.withAbsoluteImageUrls(result.event) };
  }
  async removeCover(id: string) {
    const result = await this.call(
      this.http.delete<{ event: MoonEvent }>(apiUrl(`organizer/events/${id}/cover`)),
    );
    return { event: this.withAbsoluteImageUrls(result.event) };
  }
  private withAbsoluteImageUrls(event: MoonEvent): MoonEvent {
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
        Array.isArray(body?.message)
          ? body.message.join(' ')
          : (body?.message ?? 'No pudimos conectar. Inténtalo de nuevo.'),
      );
    }
  }
}
