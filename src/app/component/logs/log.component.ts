import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { LogService } from '../../service/log/log.service';
import { FormsModule } from '@angular/forms';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface ParsedLog {
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  raw: string;
}

@Component({
  selector: 'app-logs',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css'],
  imports: [FormsModule, ScrollingModule],
})
export class LogsComponent implements OnInit, OnDestroy {
  constructor(
    private logService: LogService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
  ) {}

  // Query Virtual Scroll Viewport instance directly
  @ViewChild('viewport') private viewport!: CdkVirtualScrollViewport;
  logs: ParsedLog[] = [];
  filteredLogs: ParsedLog[] = [];
  private subscription?: Subscription;
  // UI State
  autoScroll = true;
  paused = false;
  searchText = '';
  highlightSearch = true;
  expandedIndex: number | null = null;
  // Filters
  logLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
  activeLevels = new Set<string>(['ERROR', 'WARN', 'INFO', 'DEBUG']);

  ngOnInit() {
    this.subscription = this.logService.streamLogs().subscribe({
      next: (rawLogLine) => {
        if (!this.paused) {
          // Parse data instantly upon receipt so filters run blazingly fast
          const parsed = this.parseLogLine(rawLogLine);
          this.logs.push(parsed);
          this.applyFilters();
          if (this.autoScroll) {
            // Drop timeout optimization, handle via view scheduler task queue loop safely
            setTimeout(() => this.scrollToBottom(), 0);
          }
        }
      },
      error: (err) => console.error('Log stream error:', err),
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  // Pure single-pass High Performance Regex engine parsing
  parseLogLine(log: string): ParsedLog {
    const SPRING_BOOT_REGEX =
      /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2})\s+([A-Z]+)\s+\d+\s+---\s+\[.*?]\s+\[.*?]\s+(\S+)\s+:\s+(.*)$/;
    const match = log.match(SPRING_BOOT_REGEX);
    if (match) {
      return {
        timestamp: match[1],
        level: match[2],
        logger: match[3],
        message: match[4],
        raw: log,
      };
    }
    // Fallback block safely preserving unstructured multiline runtime exceptions
    return {
      timestamp: '',
      level: 'LOG',
      logger: 'unknown',
      message: log,
      raw: log,
    };
  }

  // Cross-Site Scripting (XSS) Protected highlighter
  highlightMessage(message: string): SafeHtml | string {
    if (!this.highlightSearch || !this.searchText) return message;
    // Defuse potentially hazardous active script injections
    let safeText = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Safely apply custom mark styling safely rules rules
    const regex = new RegExp(`(${this.escapeRegExp(this.searchText)})`, 'gi');
    const highlighted = safeText.replace(
      regex,
      '<mark class="bg-yellow-500 text-black px-0.5 rounded">$1</mark>',
    );
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  // Styling layout computation shortcuts
  getLogLineClass(level: string): string {
    const base = 'flex items-center gap-2 p-1 hover:bg-white/5 transition';
    if (level === 'ERROR') return `${base} border-l-4 border-red-500 bg-red-950/10`;
    if (level === 'WARN') return `${base} border-l-4 border-yellow-500 bg-yellow-950/10`;
    if (level === 'INFO') return `${base} border-l-4 border-blue-500`;
    return base;
  }

  getLevelBadgeClass(level: string): string {
    switch (level) {
      case 'ERROR':
        return 'bg-red-600 text-white';
      case 'WARN':
        return 'bg-yellow-600 text-black';
      case 'INFO':
        return 'bg-blue-600 text-white';
      case 'DEBUG':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  getLogCardBorderClass(level: string): string {
    if (level === 'ERROR') return 'border-l-4 border-l-red-500';
    if (level === 'WARN') return 'border-l-4 border-l-yellow-500';
    if (level === 'INFO') return 'border-l-4 border-l-blue-500';
    if (level === 'DEBUG') return 'border-l-4 border-l-gray-500';
    return 'border-l-4 border-l-purple-500';
  }

  // Stream Filtering Logic Engine
  toggleFilter(level: string) {
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

  onSearch() {
    this.applyFilters();
  }

  applyFilters() {
    const searchTarget = this.searchText.toLowerCase();
    this.filteredLogs = this.logs.filter((log) => {
      // 1. Level evaluation optimization pass
      if (!this.activeLevels.has(log.level)) return false;
      // 2. High speed pattern verification check
      return !(this.searchText && !log.raw.toLowerCase().includes(searchTarget));
    });
    this.cdr.detectChanges();
  }

  // Dashboard Control Operations
  clearLogs() {
    this.logs = [];
    this.filteredLogs = [];
    this.expandedIndex = null;
    this.cdr.detectChanges();
  }

  copyLogs() {
    const text = this.filteredLogs.map((l) => l.raw).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert('Logs copied to clipboard!');
    });
  }

  downloadLogs() {
    const text = this.filteredLogs.map((l) => l.raw).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  toggleDetails(index: number) {
    // 1. Toggle the index state
    this.expandedIndex = this.expandedIndex === index ? null : index;

    // 2. Force the Virtual Scroller to check element bounds and shift the layout
    if (this.viewport) {
      // We use a microtask timeout to make sure Angular updates the DOM *before* the scroller remeasures it
      setTimeout(() => {
        this.viewport.checkViewportSize();
      }, 0);
    }
  }

  // Virtual view tracker anchor handler
  private scrollToBottom() {
    if (this.viewport) {
      this.viewport.scrollTo({
        bottom: 0,
        behavior: 'auto',
      });
    }
  }

  trackByFn(index: number, item: ParsedLog): string | number {
    return item.timestamp ? `${item.timestamp}-${index}` : index;
  }

  protected readonly navigator = navigator;
}
