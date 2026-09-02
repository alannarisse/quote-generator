import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storageKey = 'quote-app-password';

  password = signal<string | null>(this.getStoredPassword());

  private getStoredPassword(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(this.storageKey);
    }
    return null;
  }

  setPassword(password: string): void {
    this.password.set(password);
    sessionStorage.setItem(this.storageKey, password);
  }

  clearPassword(): void {
    this.password.set(null);
    sessionStorage.removeItem(this.storageKey);
  }

  isAuthenticated(): boolean {
    return !!this.password();
  }
}
