import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EchoService } from '../services/echo.service';
import { SighApiService } from '../services/sigh-api.service';
import { EchoResponse } from '../models/echo-response.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ConnectionController {
  private readonly echoService = inject(EchoService);
  private readonly sighApi = inject(SighApiService);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly echoData = this.echoService.lastEchoResponse;
  readonly endpointUrl = API_CONFIG.echoEndpoint;

  verifyAndRedirect(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.echoService.checkEcho().subscribe({
      next: (response: EchoResponse) => {
        this.loading.set(false);
        if (response?.databaseConnected === true) {
          const targetRoute = this.sighApi.isAuthenticated() ? '/bienvenida' : '/login';
          this.router.navigate([targetRoute]);
        } else {
          this.errorMessage.set(response?.message || 'La base de datos no está disponible.');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.describeError(err));
      }
    });
  }

  private describeError(err: HttpErrorResponse): string {
    const backendMsg: string | undefined = err.error?.message;

    if (err.status === 0) {
      return 'No se pudo contactar el servidor. Verifique que la API esté en ejecución.';
    }
    if (err.status === 503) {
      return backendMsg || 'La API respondió, pero el servicio de base de datos no está disponible.';
    }
    if (err.status >= 200 && err.status < 300) {
      return 'El servidor respondió con un contenido que no corresponde a la API.';
    }
    return backendMsg || `El servidor respondió con el código ${err.status}.`;
  }
}
