import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteService, Quote } from '../../services/quote.service';
import { AuthService } from '../../services/auth.service';
import { PasswordModalComponent } from '../password-modal/password-modal.component';

@Component({
  selector: 'app-random-quote',
  standalone: true,
  imports: [CommonModule, PasswordModalComponent],
  template: `
    <div class="random-quote-container">
      <div class="header">
        <h2>Random Quote</h2>
        <button class="btn-primary" (click)="getRandomQuote()" [disabled]="loading()">
          🎲 {{ quote() ? 'Another One' : 'Get Random Quote' }}
        </button>
      </div>

      @if (loading()) {
        <div class="card loading-card"><p>Finding a quote...</p></div>
      } @else if (quote()) {
        <div class="card quote-card">
          <p class="quote-text">{{ quote()!.quote_text }}</p>
          <div class="quote-source">
            <span class="source">— {{ quote()!.source_name }}</span>
            @if (quote()!.speaker_1) { <span class="speaker">({{ quote()!.speaker_1 }})</span> }
          </div>
          @if (quote()!.tags.length > 0) {
            <div class="tags">
              @for (tag of quote()!.tags; track tag) { <span class="tag">{{ tag }}</span> }
            </div>
          }
          <div class="actions">
            <button class="btn-secondary" (click)="copyToClipboard()">📋 Copy</button>
            <button class="btn-secondary" [class.active]="quote()!.next_up" (click)="toggleNextUp()">⭐ {{ quote()!.next_up ? 'Remove from Next Up' : 'Next Up' }}</button>
            <button class="btn-secondary" (click)="markAsUsed()">✓ Mark as Used</button>
          </div>
        </div>
      } @else if (error()) {
        <div class="card error-card">
          <p>{{ error() }}</p>
          <button class="btn-secondary" (click)="getRandomQuote()">Try Again</button>
        </div>
      } @else {
        <div class="card empty-card"><p>Click the button to get a random unused quote!</p></div>
      }

      @if (copied()) { <div class="toast success">Copied to clipboard!</div> }
      @if (showPasswordModal()) {
        <app-password-modal (close)="showPasswordModal.set(false)" (authenticated)="onAuthenticated($event)" />
      }
    </div>
  `,
  styles: [`
    .random-quote-container { padding: 20px 0; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .quote-card { text-align: center; padding: 40px 32px; }
    .quote-text { font-size: 1.4rem; max-width: 700px; margin: 0 auto 20px; }
    .quote-source { margin-bottom: 16px; .source { font-weight: 500; color: var(--color-brown); } .speaker { color: var(--color-text-light); margin-left: 6px; } }
    .tags { margin-bottom: 24px; }
    .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; .active { background: var(--color-gold, #d4a537); border-color: var(--color-gold, #d4a537); color: white; } }
    .loading-card, .empty-card, .error-card { text-align: center; padding: 40px; color: var(--color-text-light); }
    .error-card { color: var(--color-error); button { margin-top: 16px; } }
  `]
})
export class RandomQuoteComponent {
  private quoteService = inject(QuoteService);
  private authService = inject(AuthService);

  quote = signal<Quote | null>(null);
  loading = signal(false);
  error = signal('');
  copied = signal(false);
  showPasswordModal = signal(false);
  pendingAction = signal<'used' | 'nextup' | null>(null);

  getRandomQuote() {
    this.loading.set(true);
    this.error.set('');
    this.quoteService.getRandomQuote().subscribe({
      next: (q) => { this.quote.set(q); this.loading.set(false); },
      error: (err) => { this.error.set(err.status === 404 ? 'No unused quotes available!' : 'Failed to fetch quote'); this.loading.set(false); }
    });
  }

  copyToClipboard() {
    const q = this.quote();
    if (!q) return;
    const text = `"${q.quote_text}" — ${q.source_name}${q.speaker_1 ? ` (${q.speaker_1})` : ''}`;
    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  markAsUsed() {
    if (!this.authService.isAuthenticated()) { this.pendingAction.set('used'); this.showPasswordModal.set(true); return; }
    this.doMarkAsUsed();
  }

  toggleNextUp() {
    if (!this.authService.isAuthenticated()) { this.pendingAction.set('nextup'); this.showPasswordModal.set(true); return; }
    this.doToggleNextUp();
  }

  onAuthenticated(password: string) {
    this.showPasswordModal.set(false);
    const action = this.pendingAction();
    if (action === 'nextup') this.doToggleNextUp();
    else this.doMarkAsUsed();
    this.pendingAction.set(null);
  }

  private doMarkAsUsed() {
    const q = this.quote();
    const password = this.authService.password();
    if (!q || !password) return;
    this.quoteService.markAsUsed(q.id, password).subscribe({
      next: (updated) => this.quote.set(updated),
      error: (err) => { if (err.status === 401) { this.authService.clearPassword(); this.pendingAction.set('used'); this.showPasswordModal.set(true); } }
    });
  }

  private doToggleNextUp() {
    const q = this.quote();
    const password = this.authService.password();
    if (!q || !password) return;
    this.quoteService.toggleNextUp(q.id, password).subscribe({
      next: (updated) => this.quote.set(updated),
      error: (err) => { if (err.status === 401) { this.authService.clearPassword(); this.pendingAction.set('nextup'); this.showPasswordModal.set(true); } }
    });
  }
}
