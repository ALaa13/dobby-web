import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

export interface ParsedLog {
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  raw: string;
}

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly logUrlEndPoint = new URL('logs/stream', environment.backendUrl).toString();
  private controller?: AbortController;

  // single source of truth for log arrays
  private masterLogs: ParsedLog[] = [];
  private logs$ = new BehaviorSubject<ParsedLog[]>([]);
  public currentLogs$ = this.logs$.asObservable();

  constructor(
    private authService: AuthService,
    private zone: NgZone,
  ) {
    this.authService.authState$.subscribe(async (isLoggedIn) => {
      if (isLoggedIn) {
        await this.startStreaming();
      } else {
        console.log('Cleaning up logs stream due to global logout...');
        this.stopStreaming();
      }
    });
  }

  private async startStreaming() {
    this.controller = new AbortController();
    await fetchEventSource(this.logUrlEndPoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
        Accept: 'text/event-stream',
      },
      signal: this.controller.signal,
      openWhenHidden: true, // Keep collecting logs safely even if on different Tab!

      onopen: async (response) => {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
          console.log('✅ Global SSE stream initialized');
        }
      },

      onmessage: (event) => {
        this.zone.run(() => {
          if (event.data) {
            const parsed = this.parseLogLine(event.data);
            this.masterLogs.push(parsed);
            // Cap log cache at 1000 lines so the browser tab doesn't eat memory over days
            if (this.masterLogs.length > 1000) this.masterLogs.shift();
            this.logs$.next([...this.masterLogs]);
          }
        });
      },

      onerror: (error) => {
        console.error('❌ Global SSE stream error:', error);
      },
    });
  }

  private stopStreaming() {
    if (this.controller) {
      this.controller.abort(); // instantly kill the active HTTP socket stream connection
      this.controller = undefined; // Clear it out

      // Clear the arrays so the next user doesn't see old data logs
      this.masterLogs = [];
      this.logs$.next([]);
      console.log('🔌 Global SSE log stream successfully disconnected.');
    }
  }

  // optimized multi-precision line parser
  private parseLogLine(log: string): ParsedLog {
    const SPRING_BOOT_REGEX =
      /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+\S*)\s+([A-Z]+)\s+\d+\s+---\s+\[.*?]\s+(\S+)\s+:\s+(.*)$/;
    const match = log.match(SPRING_BOOT_REGEX);

    if (match) {
      const cleanTime = new Date(match[1]).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return {
        timestamp: cleanTime,
        level: match[2].trim(),
        logger: this.getShortLogger(match[3]),
        message: match[4],
        raw: log,
      };
    }
    return {
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      logger: 'System',
      message: log,
      raw: log,
    };
  }

  private getShortLogger(loggerName: string): string {
    const parts = loggerName.split('.');
    return parts[parts.length - 1] || 'unknown';
  }

  // Public control operations for the toolbar buttons to interact with
  public clearAllLogs() {
    this.masterLogs = [];
    this.logs$.next([]);
  }
}
