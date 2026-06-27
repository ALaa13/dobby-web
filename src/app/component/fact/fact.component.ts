import { Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { DashboardStateService } from '../../service/dashboard/dashboard-state.service';
import { FactService } from '../../service/fact/fact.service';
import { UserProfile } from './fact.types';

@Component({
  selector: 'app-fact-database',
  imports: [NgOptimizedImage],
  templateUrl: './fact.component.html',
  styleUrl: './fact.component.css',
})
export class FactComponent {
  protected stateService = inject(DashboardStateService);
  protected factService = inject(FactService);

  searchQuery = signal<string>('');
  showResetConfirm = signal<boolean>(false);

  // Clean computed state pulling cleanly from the logic service
  hasAnyFacts = computed(() => {
    return this.stateService.selectedGuildId() && this.filteredUsers().length > 0;
  });

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const allUsers = this.factService.users(); // 👈 Reading users from service layer

    if (!query) return allUsers;

    const matches: UserProfile[] = [];
    for (const user of allUsers) {
      const name = user.display_name ? user.display_name.toLowerCase() : '';
      const id = user.discord_user_id ? String(user.discord_user_id).toLowerCase() : '';

      const usernameMatches = name.includes(query);
      const userIdMatches = id.includes(query);

      let hasMatchingFact = false;
      const currentFacts = user.user_facts ?? [];

      for (const fact of currentFacts) {
        if (fact.fact_text.toLowerCase().includes(query)) {
          hasMatchingFact = true;
          break;
        }
      }

      if (usernameMatches || userIdMatches || hasMatchingFact) {
        matches.push(user);
      }
    }
    return matches;
  });

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.searchQuery.set(target.value);
    }
  }

  resetSearch(): void {
    this.searchQuery.set('');
  }

  onDeleteFact(factId: string): void {
    this.factService.deleteFact(factId);
  }

  confirmReset(): void {
    const currentGuild = this.stateService.activeGuild();
    if (currentGuild) {
      this.factService.purgeGuildFacts(currentGuild.id);
    } else {
      console.warn('Cannot purge facts: No active guild is currently selected.');
    }
  }
}
