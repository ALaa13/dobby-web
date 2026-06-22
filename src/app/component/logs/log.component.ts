import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { LogService } from '../../service/log/log.service';
import { FormsModule } from '@angular/forms';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ParsedLog } from '../../service/log/log.types';

@Component({
  selector: 'app-logs',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css'],
  imports: [FormsModule, ScrollingModule],
})
export class LogComponent implements OnInit, OnDestroy {
  @ViewChild('viewport') private viewport!: CdkVirtualScrollViewport;

  private streamSubscription?: Subscription;
  allLogsCache: ParsedLog[] = [];
  filteredLogs: ParsedLog[] = [];
  // UI States
  autoScroll = true;
  paused = false;
  searchText = '';
  highlightSearch = true;
  expandedIndex: number | null = null;
  logLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
  activeLevels = new Set<string>(['ERROR', 'WARN', 'INFO', 'DEBUG']);

  constructor(
    private logService: LogService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.streamSubscription = this.logService.currentLogs$.subscribe((latestLogs) => {
      this.allLogsCache = latestLogs;

      if (!this.paused) {
        this.applyFilters();
        if (this.autoScroll) {
          setTimeout(() => this.scrollToBottom(), 0);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.streamSubscription?.unsubscribe();
  }

  applyFilters(): void {
    const searchTarget = this.searchText.toLowerCase();
    this.filteredLogs = this.allLogsCache.filter((log) => {
      if (!this.activeLevels.has(log.level)) return false;
      return !(this.searchText && !log.raw.toLowerCase().includes(searchTarget));
    });
    this.cdr.detectChanges();
  }

  clearLogs(): void {
    this.logService.clearAllLogs();
    this.expandedIndex = null;
  }

  toggleFilter(level: string): void {
    if (this.activeLevels.has(level)) {
      this.activeLevels.delete(level);
    } else {
      this.activeLevels.add(level);
    }
    this.applyFilters();
  }

  isLevelActive(level: string): boolean {
    return this.activeLevels.has(level);
  }

  onSearch(): void {
    this.applyFilters();
  }

  trackByFn(idx: number, item: ParsedLog): string | number {
    return item.timestamp ? `${item.timestamp}-${idx}` : idx;
  }

  getLogCardBorderClass(level: string): string {
    const borders: Record<string, string> = {
      ERROR: 'border-l-4 border-l-red-500',
      WARN: 'border-l-4 border-l-yellow-500',
      INFO: 'border-l-4 border-l-blue-500',
      DEBUG: 'border-l-4 border-l-gray-500',
    };
    return borders[level] || 'border-l-4 border-l-gray-500';
  }

  getLevelBadgeClass(level: string): string {
    const badges: Record<string, string> = {
      ERROR: 'bg-red-600 text-white',
      WARN: 'bg-yellow-600 text-black',
      INFO: 'bg-blue-600 text-white',
      DEBUG: 'bg-gray-600 text-white',
    };
    return badges[level] || 'bg-gray-600 text-white';
  }

  highlightMessage(message: string): SafeHtml | string {
    if (!this.highlightSearch || !this.searchText) return message;
    const safeText = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const regex = new RegExp(`(${this.escapeRegExp(this.searchText)})`, 'gi');
    return this.sanitizer.bypassSecurityTrustHtml(
      safeText.replace(regex, '<mark class="bg-yellow-500 text-black px-0.5 rounded">$1</mark>'),
    );
  }

  toggleDetails(idx: number): void {
    this.expandedIndex = this.expandedIndex === idx ? null : idx;
    setTimeout(() => this.viewport?.checkViewportSize(), 0);
  }

  copyLogs(): void {
    const textToCopy = this.filteredLogs.map((l) => l.raw).join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => alert('Logs copied!'));
  }

  downloadLogs(): void {
    const logData = this.filteredLogs.map((l) => l.raw).join('\n');
    const blob = new Blob([logData], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `logs-${new Date().toISOString()}.txt`;
    a.click();
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  private scrollToBottom(): void {
    this.viewport?.scrollTo({ bottom: 0, behavior: 'auto' });
  }
}
