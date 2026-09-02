import { Component, EventEmitter, Output, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-dialog label="Enter Password" open (wa-request-close)="close.emit()">
      <p class="modal-desc">Password required for this action</p>
      <wa-input type="password" [(ngModel)]="password" placeholder="Password" (keyup.enter)="submit()" autofocus style="width: 100%; margin-bottom: 12px;"></wa-input>
      @if (error) { <wa-callout variant="danger" size="small">{{ error }}</wa-callout> }
      <div slot="footer" class="modal-actions">
        <wa-button variant="neutral" (click)="close.emit()">Cancel</wa-button>
        <wa-button variant="brand" (click)="submit()">Submit</wa-button>
      </div>
    </wa-dialog>
  `,
  styles: [`
    .modal-desc { color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 16px; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
  `]
})
export class PasswordModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<string>();
  private authService = inject(AuthService);
  password = '';
  error = '';

  submit() {
    if (!this.password.trim()) { this.error = 'Please enter a password'; return; }
    this.authService.setPassword(this.password);
    this.authenticated.emit(this.password);
  }
}
