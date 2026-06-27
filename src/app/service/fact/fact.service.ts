import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DashboardStateService } from '../dashboard/dashboard-state.service';
import { environment } from '@env/environment';
import { ApiResponse, UserProfile } from '../../component/fact/fact.types';

@Injectable({
  providedIn: 'root',
})
export class FactService {
  private http = inject(HttpClient);
  private stateService = inject(DashboardStateService);
  private readonly guildUrlEndPoint = new URL('dashboard/facts', environment.backendUrl).toString();

  // Central Single Source of Truth for Fact Data
  users = signal<UserProfile[]>([]);

  constructor() {
    // Automatically fetch fresh facts whenever the global server dropdown selection changes
    effect(() => {
      const currentId = this.stateService.selectedGuildId();
      if (currentId) {
        this.fetchGuildFacts(currentId);
      } else {
        this.users.set([]);
      }
    });
  }

  private fetchGuildFacts(guildId: string): void {
    this.http.get<UserProfile[]>(`${this.guildUrlEndPoint}/${guildId}`).subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Failed to pull server facts:', err),
    });
  }

  deleteFact(factId: string): void {
    console.log('Targeting deletion for fact:', factId);
    const previousUsers = this.users();

    // Optimistic UI Update: Instantly remove it from state so the UI feels fast
    this.users.update((allUsers) =>
      allUsers
        .map((user) => ({
          ...user,
          user_facts: (user.user_facts ?? []).filter((f) => f.id !== factId),
        }))
        .filter((user) => (user.user_facts?.length ?? 0) > 0),
    );

    this.http.delete<ApiResponse>(`${this.guildUrlEndPoint}/${factId}`).subscribe({
      next: () => console.log('Fact deleted successfully from backend'),
      error: (err) => {
        console.error('Failed to delete on server, rolling back UI state:', err);
        this.users.set(previousUsers); // Rollback instantly if API fails
      },
    });
  }

  purgeGuildFacts(guildId: string): void {
    this.http.delete<void>(`${this.guildUrlEndPoint}/${guildId}/reset`).subscribe({
      next: () => this.users.set([]),
      error: (err) => console.error('Failed to purge server facts:', err),
    });
  }
}
