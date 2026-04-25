import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <a class="brand" routerLink="/">
        <span class="brand-icon">⛓</span>
        <span class="brand-name">CertChain</span>
      </a>
      <div class="nav-links">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
        <a routerLink="/issue" routerLinkActive="active">Issue</a>
        <a routerLink="/verify" routerLinkActive="active">Verify</a>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 72px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(12px);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      color: var(--text-primary);
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .brand-icon { font-size: 1.6rem; }
    .nav-links {
      display: flex;
      gap: 0.25rem;
    }
    .nav-links a {
      padding: 0.45rem 1rem;
      border-radius: 8px;
      text-decoration: none;
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.15s;
    }
    .nav-links a:hover { color: var(--text-primary); background: var(--hover); }
    .nav-links a.active { color: var(--accent); background: var(--accent-dim); }
  `],
})
export class NavbarComponent {}
