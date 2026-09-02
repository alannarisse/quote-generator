import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app">
      <header>
        <div class="container">
          <h1>Quote Generator</h1>
          <nav>
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Random</a>
            <a routerLink="/quotes" routerLinkActive="active">All Quotes</a>
            <a routerLink="/add" routerLinkActive="active">Add Quote</a>
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
      padding: 16px 0;
      margin-bottom: 20px;

      .container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }

      h1 {
        font-size: 1.5rem;
        margin: 0;
      }

      nav {
        display: flex;
        gap: 8px;

        a {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          color: var(--color-text-light);
          font-weight: 500;
          transition: all 0.2s;

          &:hover {
            background: var(--color-sand);
            color: var(--color-brown);
          }

          &.active {
            background: var(--color-terracotta);
            color: white;
          }
        }
      }
    }

    main {
      padding-bottom: 40px;
    }
  `]
})
export class AppComponent {}
