import { Component, OnInit, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteService, Quote, QuoteFilters } from '../../services/quote.service';
import { AuthService } from '../../services/auth.service';
import { PasswordModalComponent } from '../password-modal/password-modal.component';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="quote-list-container">
      <wa-card class="filters">
        <div class="filter-row">
          <wa-input placeholder="Search by source..." [value]="filters.source || ''" (wa-input)="filters.source = $any($event).target.value; loadQuotes()">
            <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
          </wa-input>
          <wa-input placeholder="Search by speaker..." [value]="filters.speaker || ''" (wa-input)="filters.speaker = $any($event).target.value; loadQuotes()">
            <wa-icon slot="prefix" name="user"></wa-icon>
          </wa-input>
          <wa-select placeholder="All tags" [value]="filters.tag || ''" (wa-change)="filters.tag = $any($event).target.value; loadQuotes()">
            <wa-option value="">All tags</wa-option>
            @for (tag of tags(); track tag) { <wa-option [value]="tag">{{ tag }}</wa-option> }
          </wa-select>
        </div>
        <div class="filter-row">
          <wa-checkbox [checked]="filters.unused || false" (wa-change)="filters.unused = $any($event).target.checked; loadQuotes()">Show unused only</wa-checkbox>
          <div class="sort-controls">
            <span>Sort by:</span>
            <wa-select [value]="filters.sort || 'created_at'" (wa-change)="filters.sort = $any($event).target.value; loadQuotes()">
              <wa-option value="created_at">Date Added</wa-option>
              <wa-option value="source_name">Source</wa-option>
              <wa-option value="speaker_1">Speaker</wa-option>
              <wa-option value="tags">Tags</wa-option>
              <wa-option value="next_up">Next Up</wa-option>
            </wa-select>
            <wa-button variant="text" size="small" (click)="toggleOrder()">
              <wa-icon [name]="filters.order === 'asc' ? 'arrow-up' : 'arrow-down'"></wa-icon>
            </wa-button>
          </div>
        </div>
      </wa-card>

      <div class="quote-count">
        <wa-badge variant="neutral">{{ quotes().length }}</wa-badge>
        quote{{ quotes().length !== 1 ? 's' : '' }}
      </div>

      @if (loading()) {
        <div class="loading">
          <wa-spinner></wa-spinner>
          <span>Loading quotes...</span>
        </div>
      } @else {
        <div class="quotes-grid">
          @for (quote of quotes(); track quote.id) {
            <wa-card class="quote-item" [class.used]="quote.used_at" [class.next-up]="quote.next_up">
              <p class="quote-text">{{ quote.quote_text }}</p>
              <div class="quote-source">
                <span class="source">{{ quote.source_name }}</span>
                @if (quote.speaker_1) { <span class="speaker">— {{ quote.speaker_1 }}</span> }
              </div>
              @if (quote.tags.length > 0) {
                <div class="tags">@for (tag of quote.tags; track tag) { <wa-tag size="small">{{ tag }}</wa-tag> }</div>
              }
              <div class="quote-meta">
                @if (quote.next_up) { <wa-badge variant="warning">Next Up</wa-badge> }
                @if (quote.used_at) { <wa-badge variant="success">Used</wa-badge> }
                @if (quote.contributor) { <span class="contributor">by {{ quote.contributor }}</span> }
              </div>
              <div class="quote-actions">
                <wa-tooltip content="Copy">
                  <wa-button variant="text" size="small" (click)="copyQuote(quote)">
                    <wa-icon name="clipboard"></wa-icon>
                  </wa-button>
                </wa-tooltip>
                <wa-tooltip [content]="quote.next_up ? 'Remove from Next Up' : 'Add to Next Up'">
                  <wa-button [variant]="quote.next_up ? 'brand' : 'text'" size="small" (click)="toggleNextUp(quote)">
                    <wa-icon name="star"></wa-icon>
                  </wa-button>
                </wa-tooltip>
                <wa-tooltip [content]="quote.used_at ? 'Mark as unused' : 'Mark as used'">
                  <wa-button variant="text" size="small" (click)="toggleUsed(quote)">
                    <wa-icon [name]="quote.used_at ? 'rotate-left' : 'check'"></wa-icon>
                  </wa-button>
                </wa-tooltip>
                <wa-tooltip content="Delete">
                  <wa-button variant="text" size="small" class="delete-btn" (click)="deleteQuote(quote)">
                    <wa-icon name="trash"></wa-icon>
                  </wa-button>
                </wa-tooltip>
              </div>
            </wa-card>
          }
        </div>
      }

      @if (copied()) { <wa-callout variant="success" class="toast-notification">Copied to clipboard!</wa-callout> }
      @if (showPasswordModal()) {
        <app-password-modal (close)="showPasswordModal.set(false)" (authenticated)="onAuthenticated($event)" />
      }
    </div>
  `,
  styles: [`
    .quote-list-container { padding: 20px 0; }
    .filters { margin-bottom: 16px; }
    .filter-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; &:not(:last-child) { margin-bottom: 12px; } wa-input, wa-select { flex: 1; min-width: 150px; } }
    .sort-controls { display: flex; align-items: center; gap: 8px; margin-left: auto; span { color: var(--color-text-light); font-size: 0.9rem; } wa-select { min-width: 140px; } }
    .quote-count { color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .loading { text-align: center; padding: 40px; color: var(--color-text-light); display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .quotes-grid { display: grid; gap: 16px; }
    .quote-item { position: relative; &.used { opacity: 0.7; border-left: 3px solid var(--wa-color-success-600); } &.next-up { border-left: 3px solid var(--wa-color-warning-600); } }
    .quote-text { font-size: 1.1rem; margin-bottom: 12px; font-style: italic; &::before { content: '"'; } &::after { content: '"'; } }
    .quote-source { margin-bottom: 8px; .source { font-weight: 500; color: var(--color-brown); } .speaker { color: var(--color-text-light); } }
    .tags { margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 6px; }
    .quote-meta { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; .contributor { font-size: 0.85rem; color: var(--color-text-light); } }
    .quote-actions { display: flex; gap: 4px; border-top: 1px solid var(--wa-color-neutral-200); padding-top: 12px; margin-top: 8px; }
    .delete-btn:hover { --wa-color-neutral-600: var(--wa-color-danger-600); }
    .toast-notification { position: fixed; bottom: 20px; right: 20px; z-index: 1000; animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    wa-card { display: block; }
  `]
})
export class QuoteListComponent implements OnInit {
  private quoteService = inject(QuoteService);
  private authService = inject(AuthService);

  quotes = signal<Quote[]>([]);
  tags = signal<string[]>([]);
  loading = signal(true);
  copied = signal(false);
  showPasswordModal = signal(false);
  filters: QuoteFilters = { sort: 'created_at', order: 'desc' };
  pendingAction = signal<{ type: string; quote: Quote } | null>(null);

  ngOnInit() { this.loadQuotes(); this.loadTags(); }

  loadQuotes() {
    this.loading.set(true);
    this.quoteService.getQuotes(this.filters).subscribe({
      next: (quotes) => { this.quotes.set(quotes); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadTags() { this.quoteService.getTags().subscribe({ next: (tags) => this.tags.set(tags) }); }
  toggleOrder() { this.filters.order = this.filters.order === 'asc' ? 'desc' : 'asc'; this.loadQuotes(); }

  copyQuote(quote: Quote) {
    const text = `"${quote.quote_text}" — ${quote.source_name}${quote.speaker_1 ? ` (${quote.speaker_1})` : ''}`;
    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  toggleUsed(quote: Quote) {
    if (!this.authService.isAuthenticated()) { this.pendingAction.set({ type: quote.used_at ? 'unuse' : 'use', quote }); this.showPasswordModal.set(true); return; }
    this.doToggleUsed(quote);
  }

  deleteQuote(quote: Quote) {
    if (!confirm('Delete this quote?')) return;
    if (!this.authService.isAuthenticated()) { this.pendingAction.set({ type: 'delete', quote }); this.showPasswordModal.set(true); return; }
    this.doDelete(quote);
  }

  toggleNextUp(quote: Quote) {
    if (!this.authService.isAuthenticated()) { this.pendingAction.set({ type: 'nextup', quote }); this.showPasswordModal.set(true); return; }
    this.doToggleNextUp(quote);
  }

  onAuthenticated(password: string) {
    this.showPasswordModal.set(false);
    const action = this.pendingAction();
    if (action) {
      if (action.type === 'delete') this.doDelete(action.quote);
      else if (action.type === 'nextup') this.doToggleNextUp(action.quote);
      else this.doToggleUsed(action.quote);
    }
    this.pendingAction.set(null);
  }

  private doToggleUsed(quote: Quote) {
    const password = this.authService.password();
    if (!password) return;
    const action$ = quote.used_at ? this.quoteService.markAsUnused(quote.id, password) : this.quoteService.markAsUsed(quote.id, password);
    action$.subscribe({
      next: () => this.loadQuotes(),
      error: (err) => { if (err.status === 401) { this.authService.clearPassword(); this.pendingAction.set({ type: quote.used_at ? 'unuse' : 'use', quote }); this.showPasswordModal.set(true); } }
    });
  }

  private doDelete(quote: Quote) {
    const password = this.authService.password();
    if (!password) return;
    this.quoteService.deleteQuote(quote.id, password).subscribe({
      next: () => this.loadQuotes(),
      error: (err) => { if (err.status === 401) { this.authService.clearPassword(); this.pendingAction.set({ type: 'delete', quote }); this.showPasswordModal.set(true); } }
    });
  }

  private doToggleNextUp(quote: Quote) {
    const password = this.authService.password();
    if (!password) return;
    this.quoteService.toggleNextUp(quote.id, password).subscribe({
      next: () => this.loadQuotes(),
      error: (err) => { if (err.status === 401) { this.authService.clearPassword(); this.pendingAction.set({ type: 'nextup', quote }); this.showPasswordModal.set(true); } }
    });
  }
}
