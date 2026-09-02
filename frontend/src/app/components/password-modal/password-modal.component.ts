import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Enter Password</h3>
        <p class="modal-desc">Password required for this action</p>
        <input type="password" [(ngModel)]="password" placeholder="Password" (keyup.enter)="submit()" autofocus />
        @if (error) { <p class="error">{{ error }}</p> }
        <div class="modal-actions">
          <button class="btn-secondary" (click)="close.emit()">Cancel</button>
          <button class="btn-primary" (click)="submit()">Submit</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    h3 { margin-bottom: 4px; }
    .modal-desc { color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 16px; }
    input { width: 100%; margin-bottom: 12px; }
    .error { color: var(--color-error); font-size: 0.85rem; margin-bottom: 12px; }
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
