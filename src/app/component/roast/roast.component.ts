import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RoastLogResponse, RoastTargetDb } from './roast.types';
import { DashboardStateService } from '../../service/dashboard/dashboard-state.service';
import { RoastService } from '../../service/roast/roast';

@Component({
  selector: 'app-roast',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './roast.component.html',
  styleUrl: './roast.component.css',
})
export class RoastComponent {
  protected stateService = inject(DashboardStateService);
  protected roastService = inject(RoastService);

  searchQuery = signal<string>('');
  selectedQuoteCard = signal<RoastLogResponse | null>(null);
  hasAnyRoasts = computed<boolean>(() => {
    return !!this.stateService.selectedGuildId() && this.filteredRoasts().length > 0;
  });
  filteredRoasts = computed<RoastLogResponse[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const allRoasts = this.roastService.roasts() as RoastLogResponse[];

    if (!query) return allRoasts;

    return allRoasts.filter(
      (log: RoastLogResponse) =>
        log.roast_text?.toLowerCase().includes(query) ||
        log.persona_used?.toLowerCase().includes(query) ||
        (log.roast_targets &&
          log.roast_targets.some(
            (t: RoastTargetDb) =>
              t.user_profiles?.display_name?.toLowerCase().includes(query) ||
              t.discord_user_id.includes(query),
          )),
    );
  });

  getPrimaryTarget(roast: RoastLogResponse): RoastTargetDb | undefined {
    if (!roast || !roast.roast_targets) return undefined;
    return (
      roast.roast_targets.find(
        (t: RoastTargetDb) => t.discord_user_id === roast.primary_target_id,
      ) || roast.roast_targets[0]
    );
  }

  parseRoastContent(text: string, targets: any[]): string {
    if (!text) return '';
    const cleanTargets = targets || [];

    let processed = text;

    // 1. Safe Multi-Asterisk Bold (**text** or *text*) → amber emphasis
    processed = processed.replace(
      /\*{1,2}(.*?)\*{1,2}/g,
      '<strong class="text-amber-300 font-semibold not-italic">$1</strong>',
    );

    // 2. FIXED QUOTES: Only match single quotes if they wrap a full word block (prevents breaking on words like you're / don't)
    processed = processed.replace(
      /\B'(.*?)'\B/g,
      '<span class="text-slate-300 border-b border-slate-600/50 pb-px">$1</span>',
    );

    // 3. <@userId> mentions lookup mapper
    const mentionRegex = /<@(\d+)>/g;
    processed = processed.replace(mentionRegex, (match, userId) => {
      // Check both potential properties depending on structure schema
      const matchedTarget = cleanTargets.find(
        (t: any) => t.discord_user_id === userId || t.id === userId,
      );

      const displayName = matchedTarget?.user_profiles?.display_name || matchedTarget?.display_name;

      return displayName
        ? `<span class="inline-block align-baseline bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-1.5 rounded font-semibold mx-0.5 select-all">@${displayName}</span>`
        : `<span class="inline-block align-baseline bg-slate-800/60 text-slate-500 px-1.5 rounded font-mono mx-0.5">@unknown</span>`;
    });

    return processed;
  }

  copyToClipboard(roast: RoastLogResponse, event: Event): void {
    event.stopPropagation();
    let cleanText = roast.roast_text;
    const targets = roast.roast_targets || [];

    targets.forEach((t: RoastTargetDb) => {
      const fallbackName = t.user_profiles?.display_name || 'User';
      cleanText = cleanText.replace(new RegExp(`<@${t.discord_user_id}>`, 'g'), `@${fallbackName}`);
    });

    navigator.clipboard.writeText(cleanText).then(() => console.log('Copied clean roast text'));
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) this.searchQuery.set(target.value);
  }

  resetSearch(): void {
    this.searchQuery.set('');
  }
}
