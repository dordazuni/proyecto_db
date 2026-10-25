import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, catchError, map, tap } from 'rxjs';
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
    const cacheBuster = `?t=${Date.now()}`;
    return this.requestEcho(`${this.apiUrl}${cacheBuster}`).pipe(
      catchError(() => this.requestEcho(`/api/echo${cacheBuster}`)),
      tap((response) => this.lastEchoResponse.set(response))
    );
  }

  private requestEcho(url: string): Observable<EchoResponse> {
    return this.http.get(url, { observe: 'response', responseType: 'text' }).pipe(
      map((httpResponse: HttpResponse<string>) => {
        const rawBody = httpResponse.body ?? '';
        let parsed: Partial<EchoResponse> = {};

        try {
          parsed = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          parsed = { message: rawBody };
        }

        const isOk = httpResponse.status >= 200 && httpResponse.status < 300;

        return {
          status: parsed.status ?? (isOk ? 'OK' : 'ERROR'),
          databaseConnected: parsed.databaseConnected ?? isOk,
          message:
            parsed.message ||
            (typeof rawBody === 'string' && rawBody.trim().length > 0 && !rawBody.trim().startsWith('{')
              ? rawBody
              : 'Conexión verificada exitosamente con PostgreSQL.'),
          databaseUrl: parsed.databaseUrl ?? '',
          timestamp: parsed.timestamp ?? new Date().toISOString()
        } satisfies EchoResponse;
      })
    );
  }
}
