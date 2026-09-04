import { Component, EventEmitter, Output, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteService } from '../../services/quote.service';
import { AuthService } from '../../services/auth.service';
import { PasswordModalComponent } from '../password-modal/password-modal.component';

@Component({
  selector: 'app-add-quote',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="add-quote-container">
      <h2>Add a Quote</h2>
      <wa-card>
        <form (ngSubmit)="submit()">
          <wa-input label="Source" [value]="form.source_name" (input)="form.source_name = $any($event).target.value" placeholder="Movie, TV show, comedian, etc." required>
            <wa-icon slot="prefix" name="film"></wa-icon>
          </wa-input>

          <wa-textarea label="Quote" [value]="form.quote_text" (input)="form.quote_text = $any($event).target.value" placeholder="Enter the quote..." rows="4" required resize="auto"></wa-textarea>

          <div class="form-row">
            <wa-input label="Speaker 1" [value]="form.speaker_1" (input)="form.speaker_1 = $any($event).target.value" placeholder="Who said it?">
              <wa-icon slot="prefix" name="user"></wa-icon>
            </wa-input>
            <wa-input label="Speaker 2" [value]="form.speaker_2" (input)="form.speaker_2 = $any($event).target.value" placeholder="Second speaker"></wa-input>
            <wa-input label="Speaker 3" [value]="form.speaker_3" (input)="form.speaker_3 = $any($event).target.value" placeholder="Third speaker"></wa-input>
          </div>

          <wa-input label="Your Name" [value]="form.contributor" (input)="form.contributor = $any($event).target.value" placeholder="Who's adding this quote?">
            <wa-icon slot="prefix" name="pencil"></wa-icon>
          </wa-input>

          <wa-input label="Tags (comma-separated, max 8)" [value]="tagsInput" (input)="tagsInput = $any($event).target.value" placeholder="comedy, classic, inspirational...">
            <wa-icon slot="prefix" name="tags"></wa-icon>
          </wa-input>

          <wa-textarea label="Notes" [value]="form.notes" (input)="form.notes = $any($event).target.value" placeholder="Any additional context..." rows="2" resize="auto"></wa-textarea>

          @if (error()) { <wa-callout variant="danger">{{ error() }}</wa-callout> }
          @if (success()) { <wa-callout variant="success">Quote added successfully!</wa-callout> }

          <div class="form-actions">
            <wa-button type="button" variant="neutral" (click)="reset()">
              <wa-icon slot="prefix" name="xmark"></wa-icon>
              Clear
            </wa-button>
            <wa-button type="submit" variant="brand" [disabled]="submitting()" [loading]="submitting()">
              <wa-icon slot="prefix" name="plus"></wa-icon>
              {{ submitting() ? 'Adding...' : 'Add Quote' }}
            </wa-button>
          </div>
        </form>
      </wa-card>
      @if (showPasswordModal()) { <app-password-modal (close)="showPasswordModal.set(false)" (authenticated)="onAuthenticated($event)" /> }
    </div>
  `,
  styles: [`
    .add-quote-container { padding: 20px 0; max-width: 700px; margin:auto;}
    h2 { margin-bottom: 20px; }
    wa-card { display: block; }
    wa-input, wa-textarea { display: block; margin-bottom: 16px; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 16px; wa-input { margin-bottom: 0; } }
    wa-callout { margin-bottom: 16px; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid var(--wa-color-neutral-200); }
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
