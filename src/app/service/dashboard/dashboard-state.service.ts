import { computed, inject, Injectable, signal } from '@angular/core';
import { UserService } from '../user/user.service';
import { DiscordGuild } from '../../types/guild.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardStateService {
  private userService = inject(UserService);

  // Global State Signals - Start completely empty for the placeholder
  selectedGuildId = signal<string>('');
  isDropdownOpen = signal<boolean>(false);

  // Pull managed guilds automatically from user profile
  guilds = computed<DiscordGuild[]>(() => {
    const profile = this.userService.currentUser();
    return profile?.managed_guilds || [];
  });

  // Calculate active guild object
  activeGuild = computed<DiscordGuild | null>(() => {
    return this.guilds().find((g) => g.id === this.selectedGuildId()) || null;
  });

  selectGuild(id: string): void {
    this.selectedGuildId.set(id);
    this.isDropdownOpen.set(false);
  }
}
