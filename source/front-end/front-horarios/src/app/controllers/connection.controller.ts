import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
      error: (err) => {
        this.loading.set(false);
        const backendMsg = err?.error?.message;
        this.errorMessage.set(
          backendMsg || `No se pudo conectar con el servicio ${this.endpointUrl}`
        );
      }
    });
  }
}
