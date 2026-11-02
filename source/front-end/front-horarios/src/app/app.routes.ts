import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ConnectionCheckPageComponent } from './views/pages/connection-check-page/connection-check-page.component';
import { LoginPageComponent } from './views/pages/login-page/login-page.component';
import { WelcomePageComponent } from './views/pages/welcome-page/welcome-page.component';
import { SighApiService } from './services/sigh-api.service';

export const authGuard: CanActivateFn = () => {
  const api = inject(SighApiService);
  const router = inject(Router);
  // Sin token no hay sesión, aunque quede un usuario guardado en el navegador.
  if (!api.authToken()) {
    api.logout();
    return router.createUrlTree(['/login']);
  }
  return api.obtenerSesionActual().pipe(
    map(() => true),
    catchError(() =>
      api.refreshToken().pipe(
        map(() => true),
        catchError(() => {
          api.logout();
          return of(router.createUrlTree(['/login']));
        })
      )
    )
  );
};

export const routes: Routes = [
  {
    path: '',
    component: ConnectionCheckPageComponent
  },
  {
    path: 'login',
    component: LoginPageComponent
  },
  {
    path: 'bienvenida',
    component: WelcomePageComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
