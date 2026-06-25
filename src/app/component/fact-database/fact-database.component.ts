import { Component, computed, effect, inject, signal } from '@angular/core';
import { UserService } from '../../service/user/user.service';
import { NgOptimizedImage } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { DiscordGuild } from '../../types/guild.model';
import { ApiResponse, UserProfile } from './fact-database.types';

@Component({
  selector: 'app-fact-database',
  imports: [NgOptimizedImage],
  templateUrl: './fact-database.component.html',
  styleUrl: './fact-database.component.css',
})
export class FactDatabaseComponent {
  protected userService = inject(UserService);
  private http = inject(HttpClient);
  private readonly guildUrlEndPoint = new URL('guild', environment.backendUrl).toString();

  // Holds the live facts data array for the currently selected server
  users = signal<UserProfile[]>([]);
  // Dynamic projection of managed guilds from the user profile signal
  guilds = computed<DiscordGuild[]>(() => {
    const profile = this.userService.currentUser();
    return profile?.managed_guilds || [];
  });
  isDropdownOpen = signal<boolean>(false);
  selectedGuildId = signal<string>('');
  activeGuild = computed(() => {
    return this.guilds().find((g) => g.id === this.selectedGuildId()) || null;
  });
  hasAnyFacts = computed(() => {
    return this.filteredUsers().length > 0;
  });
  searchQuery = signal<string>('');
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const allUsers = this.users();

    if (!query) {
      return allUsers;
    }

    const matches: UserProfile[] = [];

    for (const user of allUsers) {
      const name = user.display_name ? user.display_name.toLowerCase() : '';
      const id = user.discord_user_id ? String(user.discord_user_id).toLowerCase() : '';

      const usernameMatches = name.includes(query);
      const userIdMatches = id.includes(query);

      // 🔍 Just check if ANY fact contains the query text (true/false)
      let hasMatchingFact = false;
      const currentFacts = user.user_facts ?? [];

      for (const fact of currentFacts) {
        if (fact.fact_text.toLowerCase().includes(query)) {
          hasMatchingFact = true;
          break; // Found one match, we can stop checking this user's facts
        }
      }

      // 💡 Keep the user card completely intact if name, id, OR any fact matches
      if (usernameMatches || userIdMatches || hasMatchingFact) {
        matches.push(user); // Pass the original user object directly without modifying user_facts
      }
    }

    return matches;
  });
  showResetConfirm = signal<boolean>(false);

  constructor() {
    // Automatically sets the dropdown to select the first server when data arrives
    effect(() => {
      const activeGuilds = this.guilds();
      if (activeGuilds.length > 0 && !this.selectedGuildId()) {
        this.selectedGuildId.set(activeGuilds[0].id);
      }
    });

    // Reactive Data Fetcher: Runs automatically whenever selectedGuildId changes!
    effect(() => {
      const currentId = this.selectedGuildId();
      if (currentId) {
        this.fetchGuildFacts(currentId);
      }
    });
  }

  fetchGuildFacts(guildId: string): void {
    this.http.get<UserProfile[]>(`${this.guildUrlEndPoint}/${guildId}`).subscribe({
      next: (data) => {
        this.users.set(data);
      },
      error: (err) => {
        console.error('Failed to pull server facts:', err);
      },
    });
  }

  confirmReset(): void {
    const currentGuild = this.activeGuild();

    if (currentGuild) {
      console.log('facts have been purged');
      this.purgeGuildFacts(currentGuild.id);
    } else {
      console.warn('Cannot purge facts: No active guild is currently selected.');
    }
  }

  selectGuild(id: string): void {
    this.selectedGuildId.set(id);
    this.isDropdownOpen.set(false);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.searchQuery.set(target.value);
    }
  }

  resetSearch(): void {
    this.searchQuery.set('');
  }

  onGuildChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedGuildId.set(selectElement.value);
  }

  deleteFact(factId: string): void {
    console.log('Targeting deletion for fact:', factId);

    // Snapshot the state for safety
    const previousUsers = this.users();

    // Optimistic UI update: Remove the fact, and drop the user card if it was the last one
    this.users.update((allUsers) =>
      allUsers
        .map((user) => ({
          ...user,
          user_facts: (user.user_facts ?? []).filter((f) => f.id !== factId),
        }))
        // Keep only the users who still have at least 1 fact left
        .filter((user) => (user.user_facts?.length ?? 0) > 0),
    );

    // Call the backend
    this.http.delete<ApiResponse>(`${this.guildUrlEndPoint}/facts/${factId}`).subscribe({
      next: (response) => {
        console.log('deleted');
      },
      error: (err) => {
        console.error('Failed to delete on server, rolling back UI:', err);
        // If the backend fails, this safely restores the card AND its facts instantly!
        this.users.set(previousUsers);
      },
    });
  }

  purgeGuildFacts(guildId: string): void {
    this.http.delete<void>(`${this.guildUrlEndPoint}/${guildId}`).subscribe({
      next: () => {
        this.users.set([]);
      },
      error: (err) => {
        console.error('Failed to purge server facts:', err);
      },
    });
  }
}
