import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { apiCredentialsInterceptor } from '../../interceptors/api-credentials/api-credentials.interceptor';
import { routes } from '../../../routes/app-routes/app-routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([apiCredentialsInterceptor])),
    provideRouter(routes),
  ],
};
