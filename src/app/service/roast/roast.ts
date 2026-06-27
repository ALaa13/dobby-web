import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { DashboardStateService } from '../dashboard/dashboard-state.service';
import { RoastLogResponse } from '../../component/roast/roast.types';

@Injectable({
  providedIn: 'root',
})
export class RoastService {
  private http = inject(HttpClient);
  private stateService = inject(DashboardStateService);

  // Base endpoint matches your new Kotlin configuration structural path mapping
  private readonly baseUrl = new URL('dashboard/roasts', environment.backendUrl).toString();

  // Single Source of Truth for Recent Server Roasts
  roasts = signal<RoastLogResponse[]>([]);

  constructor() {
    // Reactive Data Link: Triggers instantly when selection modifies globally
    effect(() => {
      const currentGuildId = this.stateService.selectedGuildId();
      if (currentGuildId) {
        this.fetchGuildRoasts(currentGuildId);
      } else {
        this.roasts.set([]);
      }
    });
  }

  private fetchGuildRoasts(guildId: string): void {
    this.http.get<RoastLogResponse[]>(`${this.baseUrl}/${guildId}`).subscribe({
      next: (data) => {
        // Sort roasts locally so the newest generations show up first
        const sorted = data.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        this.roasts.set(sorted);
      },
      error: (err) => {
        console.error('Failed to pull historic guild roast logs:', err);
      },
    });
  }
}
