import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { EchoResponse } from '../models/echo-response.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class EchoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_CONFIG.echoEndpoint;

  readonly lastEchoResponse = signal<EchoResponse | null>(null);

  checkEcho(): Observable<EchoResponse> {
    return this.http.get<EchoResponse>(this.apiUrl).pipe(
      tap({
        next: (response: EchoResponse) => this.lastEchoResponse.set(response),
        error: () => this.lastEchoResponse.set(null)
      })
    );
  }
}
