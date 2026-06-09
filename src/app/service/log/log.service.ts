import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly logUrlEndPoint = new URL('logs/stream', environment.backendUrl).toString();

  constructor(private authService: AuthService) {}

  streamLogs(): Observable<string> {
    return new Observable((observer) => {
      const controller = new AbortController();

      fetchEventSource(this.logUrlEndPoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
        signal: controller.signal,
        onopen: async (response) => {
          if (response.ok) {
            console.log('✅ SSE connection OPENED');
          } else {
            observer.error(new Error(`SSE failed to open: ${response.status}`));
          }
        },
        onmessage: (event) => {
          observer.next(event.data);
        },
        onerror: (error) => {
          console.error('❌ SSE error:', error);
          observer.error(error);
          throw error;
        },
      }).then(() => null);

      return () => {
        console.log('🔌 SSE connection closed');
        controller.abort();
      };
    });
  }
}
