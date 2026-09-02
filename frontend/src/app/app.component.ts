import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="app">
      <header>
        <div class="container">
          <h1>
            <wa-icon name="quote-left" style="margin-right: 8px;"></wa-icon>
            Quote Keeper
          </h1>
          <nav>
            <wa-button-group>
              <wa-button [variant]="isActive('/') ? 'brand' : 'neutral'" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <wa-icon slot="prefix" name="shuffle"></wa-icon>
                Random
              </wa-button>
              <wa-button [variant]="isActive('/quotes') ? 'brand' : 'neutral'" routerLink="/quotes" routerLinkActive="active">
                <wa-icon slot="prefix" name="list"></wa-icon>
                All Quotes
              </wa-button>
              <wa-button [variant]="isActive('/add') ? 'brand' : 'neutral'" routerLink="/add" routerLinkActive="active">
                <wa-icon slot="prefix" name="plus"></wa-icon>
                Add Quote
              </wa-button>
            </wa-button-group>
          </nav>
        </div>
      </header>
      <main class="container">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app { min-height: 100vh; }
    header {
      background: white;
      box-shadow: var(--shadow-sm);
      padding: 1rem;
      margin-bottom: 20px;

      .container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }

      h1 {
        font-size: 1.5rem;
        margin: 0;
        display: flex;
        align-items: center;
      }
    }

    main {
      padding-bottom: 40px;
      max-width:85%;
      margin:auto;
    }
  `]
})
export class AppComponent {
  private router = inject(Router);

  isActive(path: string): boolean {
    if (path === '/') {
      return this.router.url === '/';
    }
    return this.router.url.startsWith(path);
  }
}
