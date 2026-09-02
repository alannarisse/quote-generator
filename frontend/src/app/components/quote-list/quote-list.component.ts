import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteService, Quote, QuoteFilters } from '../../services/quote.service';
import { AuthService } from '../../services/auth.service';
import { PasswordModalComponent } from '../password-modal/password-modal.component';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordModalComponent],
  template: `
    <div class="quote-list-container">
      <div class="filters">
        <div class="filter-row">
          <input type="text" placeholder="Search by source..." [(ngModel)]="filters.source" (ngModelChange)="loadQuotes()" />
          <input type="text" placeholder="Search by speaker..." [(ngModel)]="filters.speaker" (ngModelChange)="loadQuotes()" />
          <select [(ngModel)]="filters.tag" (ngModelChange)="loadQuotes()">
            <option value="">All tags</option>
            @for (tag of tags(); track tag) { <option [value]="tag">{{ tag }}</option> }
          </select>
        </div>
        <div class="filter-row">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="filters.unused" (ngModelChange)="loadQuotes()" /> Show unused only
          </label>
          <div class="sort-controls">
            <span>Sort by:</span>
            <select [(ngModel)]="filters.sort" (ngModelChange)="loadQuotes()">
              <option value="created_at">Date Added</option>
              <option value="source_name">Source</option>
              <option value="speaker_1">Speaker</option>
              <option value="tags">Tags</option>
              <option value="next_up">Next Up</option>
            </select>
            <button class="btn-icon" (click)="toggleOrder()">{{ filters.order === 'asc' ? '↑' : '↓' }}</button>
          </div>
        </div>
      </div>

      <div class="quote-count">{{ quotes().length }} quote{{ quotes().length !== 1 ? 's' : '' }}</div>

      @if (loading()) {
        <div class="loading">Loading quotes...</div>
      } @else {
        <div class="quotes-grid">
          @for (quote of quotes(); track quote.id) {
            <div class="card quote-item" [class.used]="quote.used_at" [class.next-up]="quote.next_up">
              <p class="quote-text">{{ quote.quote_text }}</p>
              <div class="quote-source">
                <span class="source">{{ quote.source_name }}</span>
                @if (quote.speaker_1) { <span class="speaker">— {{ quote.speaker_1 }}</span> }
              </div>
              @if (quote.tags.length > 0) {
                <div class="tags">@for (tag of quote.tags; track tag) { <span class="tag">{{ tag }}</span> }</div>
              }
              <div class="quote-meta">
                @if (quote.next_up) { <span class="badge-nextup">Next Up</span> }
                @if (quote.used_at) { <span class="badge-used">Used</span> }
                @if (quote.contributor) { <span class="contributor">by {{ quote.contributor }}</span> }
              </div>
              <div class="quote-actions">
                <button class="btn-icon" title="Copy" (click)="copyQuote(quote)">📋</button>
                <button class="btn-icon" [class.active]="quote.next_up" [title]="quote.next_up ? 'Remove from Next Up' : 'Add to Next Up'" (click)="toggleNextUp(quote)">⭐</button>
                @if (quote.used_at) {
                  <button class="btn-icon" title="Mark as unused" (click)="toggleUsed(quote)">↩️</button>
                } @else {
                  <button class="btn-icon" title="Mark as used" (click)="toggleUsed(quote)">✓</button>
                }
                <button class="btn-icon delete" title="Delete" (click)="deleteQuote(quote)">🗑️</button>
              </div>
            </div>
          }
        </div>
      }

      @if (copied()) { <div class="toast success">Copied to clipboard!</div> }
      @if (showPasswordModal()) {
        <app-password-modal (close)="showPasswordModal.set(false)" (authenticated)="onAuthenticated($event)" />
      }
    </div>
  `,
  styles: [`
    .quote-list-container { padding: 20px 0; }
    .filters { background: white; padding: 16px; border-radius: var(--radius-md); margin-bottom: 16px; box-shadow: var(--shadow-sm); }
    .filter-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; &:not(:last-child) { margin-bottom: 12px; } input[type="text"], select { flex: 1; min-width: 150px; } }
    .checkbox-label { display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--color-text-light); input { width: auto; } }
    .sort-controls { display: flex; align-items: center; gap: 8px; margin-left: auto; span { color: var(--color-text-light); font-size: 0.9rem; } select { min-width: 120px; } }
    .quote-count { color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 16px; }
    .loading { text-align: center; padding: 40px; color: var(--color-text-light); }
    .quotes-grid { display: grid; gap: 16px; }
    .quote-item { position: relative; &.used { opacity: 0.7; border-left: 3px solid var(--color-success); } &.next-up { border-left: 3px solid var(--color-gold, #d4a537); background: linear-gradient(to right, rgba(212, 165, 55, 0.05), transparent); } }
    .quote-text { font-size: 1.1rem; margin-bottom: 12px; }
    .quote-source { margin-bottom: 8px; .source { font-weight: 500; color: var(--color-brown); } .speaker { color: var(--color-text-light); } }
    .tags { margin-bottom: 12px; }
    .quote-meta { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; .contributor { font-size: 0.85rem; color: var(--color-text-light); } }
    .quote-actions { display: flex; gap: 8px; border-top: 1px solid var(--color-sand); padding-top: 12px; margin-top: 8px; .delete:hover { color: var(--color-error); } .active { color: var(--color-gold, #d4a537); } }
    .badge-nextup { background: var(--color-gold, #d4a537); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
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
