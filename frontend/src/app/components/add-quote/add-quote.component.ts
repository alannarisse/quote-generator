import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteService } from '../../services/quote.service';
import { AuthService } from '../../services/auth.service';
import { PasswordModalComponent } from '../password-modal/password-modal.component';

@Component({
  selector: 'app-add-quote',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordModalComponent],
  template: `
    <div class="add-quote-container">
      <h2>Add a Quote</h2>
      <form (ngSubmit)="submit()" class="card">
        <div class="form-group">
          <label for="source">Source *</label>
          <input id="source" type="text" [(ngModel)]="form.source_name" name="source_name" placeholder="Movie, TV show, comedian, etc." required />
        </div>
        <div class="form-group">
          <label for="quote">Quote *</label>
          <textarea id="quote" [(ngModel)]="form.quote_text" name="quote_text" placeholder="Enter the quote..." required></textarea>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="speaker1">Speaker 1</label><input id="speaker1" type="text" [(ngModel)]="form.speaker_1" name="speaker_1" placeholder="Who said it?" /></div>
          <div class="form-group"><label for="speaker2">Speaker 2</label><input id="speaker2" type="text" [(ngModel)]="form.speaker_2" name="speaker_2" placeholder="Second speaker" /></div>
          <div class="form-group"><label for="speaker3">Speaker 3</label><input id="speaker3" type="text" [(ngModel)]="form.speaker_3" name="speaker_3" placeholder="Third speaker" /></div>
        </div>
        <div class="form-group"><label for="contributor">Your Name</label><input id="contributor" type="text" [(ngModel)]="form.contributor" name="contributor" placeholder="Who's adding this quote?" /></div>
        <div class="form-group"><label for="tags">Tags (comma-separated, max 8)</label><input id="tags" type="text" [(ngModel)]="tagsInput" name="tags" placeholder="comedy, classic, inspirational..." /></div>
        <div class="form-group"><label for="notes">Notes</label><textarea id="notes" [(ngModel)]="form.notes" name="notes" placeholder="Any additional context..." rows="2"></textarea></div>
        @if (error()) { <p class="error">{{ error() }}</p> }
        @if (success()) { <p class="success">Quote added successfully!</p> }
        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="reset()">Clear</button>
          <button type="submit" class="btn-primary" [disabled]="submitting()">{{ submitting() ? 'Adding...' : 'Add Quote' }}</button>
        </div>
      </form>
      @if (showPasswordModal()) { <app-password-modal (close)="showPasswordModal.set(false)" (authenticated)="onAuthenticated($event)" /> }
    </div>
  `,
  styles: [`
    .add-quote-container { padding: 20px 0; max-width: 700px; }
    h2 { margin-bottom: 20px; }
    .form-group { margin-bottom: 16px; label { display: block; margin-bottom: 6px; font-weight: 500; color: var(--color-brown); font-size: 0.9rem; } input, textarea { width: 100%; } }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
    .error { color: var(--color-error); margin-bottom: 16px; }
    .success { color: var(--color-success); margin-bottom: 16px; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; }
  `]
})
export class AddQuoteComponent {
  @Output() quoteAdded = new EventEmitter<void>();
  private quoteService = inject(QuoteService);
  private authService = inject(AuthService);

  form = { source_name: '', quote_text: '', speaker_1: '', speaker_2: '', speaker_3: '', contributor: '', notes: '' };
  tagsInput = '';
  submitting = signal(false);
  error = signal('');
  success = signal(false);
  showPasswordModal = signal(false);

  submit() {
    if (!this.form.source_name.trim() || !this.form.quote_text.trim()) { this.error.set('Source and quote are required'); return; }
    if (!this.authService.isAuthenticated()) { this.showPasswordModal.set(true); return; }
    this.doSubmit();
  }

  onAuthenticated(password: string) { this.showPasswordModal.set(false); this.doSubmit(); }

  private doSubmit() {
    const password = this.authService.password();
    if (!password) return;
    this.submitting.set(true); this.error.set(''); this.success.set(false);
    const tags = this.tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t).slice(0, 8);
    this.quoteService.addQuote({ ...this.form, tags }, password).subscribe({
      next: () => { this.success.set(true); this.reset(); this.submitting.set(false); this.quoteAdded.emit(); setTimeout(() => this.success.set(false), 3000); },
      error: (err) => { this.submitting.set(false); if (err.status === 401) { this.authService.clearPassword(); this.error.set('Invalid password.'); this.showPasswordModal.set(true); } else { this.error.set('Failed to add quote.'); } }
    });
  }

  reset() { this.form = { source_name: '', quote_text: '', speaker_1: '', speaker_2: '', speaker_3: '', contributor: '', notes: '' }; this.tagsInput = ''; this.error.set(''); }
}
