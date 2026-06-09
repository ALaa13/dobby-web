import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly logUrlEndPoint = new URL('logs/stream', environment.backendUrl).toString();

  streamLogs(): Observable<string> {
    return new Observable((observer) => {
      const eventSource = new EventSource(this.logUrlEndPoint);

      eventSource.onopen = () => {
        console.log('✅ SSE connection OPENED');
      };

      eventSource.onmessage = (event) => {
        console.log('📝 Message received:', event.data);
        observer.next(event.data);
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE error:', error);
        observer.error(error);
        eventSource.close();
      };

      return () => {
        console.log('🔌 SSE connection closed');
        eventSource.close();
      };
    });
  }
}
