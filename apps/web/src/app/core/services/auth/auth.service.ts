import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { apiUrl } from '../../utils/api-url/api-url';

export interface MoonUser {
  id: string;
  email: string;
  name: string | null;
  cityCode: string | null;
  cityName: string | null;
  role: 'USER' | 'ORGANIZER';
  profileComplete: boolean;
}
export interface Department {
  code: string;
  name: string;
}
export interface Municipality {
  code: string;
  name: string;
}
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly user = signal<MoonUser | null>(null);
  async requestOtp(email: string) {
    return this.call<{ challengeId: string; expiresAt: string; resendAvailableAt: string }>(
      this.http.post(apiUrl('auth/otp/request'), { email }),
    );
  }
  async verifyOtp(challengeId: string, code: string) {
    const result = await this.call<{ user: MoonUser }>(
      this.http.post(apiUrl('auth/otp/verify'), { challengeId, code }),
    );
    this.user.set(result.user);
    return result.user;
  }
  async loadUser() {
    try {
      const result = await this.call<{ user: MoonUser }>(this.http.get(apiUrl('auth/me')));
      this.user.set(result.user);
      return result.user;
    } catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
        this.user.set(null);
        return null;
      }
      throw error;
    }
  }
  async logout() {
    await this.call(this.http.post(apiUrl('auth/logout'), {}));
    this.user.set(null);
  }
  async updateProfile(name: string, cityCode: string) {
    const result = await this.call<{ user: MoonUser }>(
      this.http.patch(apiUrl('users/me'), { name, cityCode }),
    );
    this.user.set(result.user);
    return result.user;
  }
  async departments() {
    return (
      await this.call<{ departments: Department[] }>(this.http.get(apiUrl('locations/departments')))
    ).departments;
  }
  async municipalities(departmentCode: string) {
    return (
      await this.call<{ municipalities: Municipality[] }>(
        this.http.get(apiUrl('locations/municipalities'), { params: { departmentCode } }),
      )
    ).municipalities;
  }
  private async call<T>(request: ReturnType<HttpClient['get']>): Promise<T> {
    try {
      return (await firstValueFrom(request)) as T;
    } catch (error) {
      const response = error as HttpErrorResponse;
      const body = response.error as { code?: string; message?: string } | undefined;
      throw new ApiError(
        body?.code ?? 'NETWORK_ERROR',
        typeof body?.message === 'string'
          ? body.message
          : 'Revisa tu conexión e inténtalo de nuevo.',
      );
    }
  }
}
