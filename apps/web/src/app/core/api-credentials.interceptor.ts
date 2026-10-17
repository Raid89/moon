import { HttpInterceptorFn } from '@angular/common/http';

/** Sends the session cookie when the API is hosted on a different origin. */
export const apiCredentialsInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ withCredentials: true }));
