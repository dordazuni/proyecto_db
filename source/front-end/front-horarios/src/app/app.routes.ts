import { Routes } from '@angular/router';
import { ConnectionCheckPageComponent } from './views/pages/connection-check-page/connection-check-page.component';
import { WelcomePageComponent } from './views/pages/welcome-page/welcome-page.component';

export const routes: Routes = [
  {
    path: '',
    component: ConnectionCheckPageComponent
  },
  {
    path: 'bienvenida',
    component: WelcomePageComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
