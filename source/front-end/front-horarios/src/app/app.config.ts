import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { catchError, switchMap, tap, throwError } from 'rxjs';

import { routes } from './app.routes';
import { SighApiService } from './services/sigh-api.service';

export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const api = inject(SighApiService);
  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.endsWith('/login') ||
    req.url.includes('/echo');

  return next(req).pipe(
    tap((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse) {
        const renewed = event.headers.get('X-Renewed-Token');
        if (renewed) {
          api.updateTokenOnly(renewed);
        }
      }
    }),
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !isAuthEndpoint &&
        (api.authToken() || api.authenticatedUser())
      ) {
        return api.refreshToken().pipe(
          switchMap((res) => {
            const retried = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.token}`
              }
            });
            return next(retried);
          }),
          catchError((refreshErr) => throwError(() => refreshErr))
        );
      }
      return throwError(() => err);
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([authRefreshInterceptor]))
  ]
};
