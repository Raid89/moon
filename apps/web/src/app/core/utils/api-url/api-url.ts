import { environment } from '../../../../environments/environment';

/** Resolves an API path against the environment-specific API base URL. */
export function apiUrl(path: string): string {
  return new URL(path.replace(/^\/?api\/?/, ''), `${environment.apiUrl}/`).toString();
}
