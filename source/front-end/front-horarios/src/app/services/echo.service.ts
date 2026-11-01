import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
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
    return this.http.get<EchoResponse>(this.apiUrl, { params: { t: Date.now() } }).pipe(
      tap((response: EchoResponse) => this.lastEchoResponse.set(response)),
      catchError((err: HttpErrorResponse) => {
        if (this.isEchoResponse(err.error)) {
          this.lastEchoResponse.set(err.error);
        }
        return throwError(() => err);
      })
    );
  }

  private isEchoResponse(body: unknown): body is EchoResponse {
    return typeof body === 'object' && body !== null && 'databaseConnected' in body;
  }
}
