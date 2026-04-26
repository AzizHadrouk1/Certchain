import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <header class="nav-wrap">
      <nav class="navbar">
        <a
          class="brand"
          routerLink="/"
          [attr.aria-label]="'nav.brandAlt' | t">
          <img
            class="brand-logo"
            src="assets/logo-certchain.png"
            width="40"
            height="40"
            alt="" />
          <span class="brand-text">
            <span class="cert">Cert</span><span class="chain">Chain</span>
          </span>
        </a>
        <div class="nav-center">
          <div class="nav-links">
            <a
              routerLink="/"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              >{{ 'nav.home' | t }}</a
            >
            <a
              *ngIf="auth.isLoggedIn() && auth.user()?.role === 'institution'"
              routerLink="/issue"
              routerLinkActive="active"
              >{{ 'nav.issue' | t }}</a
            >
            <a routerLink="/verify" routerLinkActive="active">{{ 'nav.verify' | t }}</a>
          </div>
        </div>
        <div class="nav-lang">
          <div class="nav-actions">
            <div
              class="lang"
              role="group"
              [attr.aria-label]="'nav.language' | t">
              <button
                type="button"
                class="lang-btn"
                [class.active]="i18n.lang() === 'en'"
                (click)="i18n.setLang('en')">
                EN
              </button>
              <button
                type="button"
                class="lang-btn"
                [class.active]="i18n.lang() === 'fr'"
                (click)="i18n.setLang('fr')">
                FR
              </button>
            </div>
            <div class="auth-row">
              <a *ngIf="!auth.isLoggedIn()" routerLink="/login" class="auth-link primary">{{
                'nav.login' | t
              }}</a>
              <a *ngIf="!auth.isLoggedIn()" routerLink="/register" class="auth-link secondary">{{
                'nav.register' | t
              }}</a>
              <a
                *ngIf="auth.user()?.role === 'admin'"
                routerLink="/admin"
                routerLinkActive="active"
                class="auth-link secondary"
                >{{ 'nav.admin' | t }}</a
              >
              <button
                *ngIf="auth.isLoggedIn()"
                type="button"
                class="auth-out"
                (click)="auth.logout()">
                {{ 'nav.logout' | t }}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .nav-wrap {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      background: var(--bg);
      box-shadow: var(--shadow-sm);
    }
    .nav-wrap::after {
      content: '';
      display: block;
      height: 3px;
      background: var(--gradient-brand);
      opacity: 0.9;
    }
    .navbar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: 0.75rem 1rem;
      padding: 0 1.25rem;
      min-height: 4rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .nav-center {
      justify-self: center;
      min-width: 0;
    }
    .nav-lang {
      justify-self: end;
      min-width: 0;
      display: flex;
      align-items: center;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.6rem;
      flex-wrap: nowrap;
      white-space: nowrap;
    }
    .auth-row {
      display: flex;
      flex-wrap: nowrap;
      gap: 0.4rem;
      align-items: center;
      justify-content: flex-end;
    }
    .auth-link {
      font-size: 0.82rem;
      font-weight: 650;
      letter-spacing: -0.01em;
      text-decoration: none;
      padding: 0.4rem 0.7rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: #ffffff;
      color: var(--text-primary);
      box-shadow: 0 1px 8px rgba(15, 23, 42, 0.06);
      transition: transform 0.15s, box-shadow 0.15s, background 0.15s, border-color 0.15s;
    }
    .auth-link:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
      border-color: rgba(37, 99, 235, 0.35);
    }
    .auth-link.primary {
      border: none;
      background: var(--gradient-brand);
      color: #ffffff;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.28);
    }
    .auth-link.primary:hover {
      box-shadow: 0 10px 24px rgba(124, 58, 237, 0.28);
    }
    .auth-link.secondary {
      background: #ffffff;
      color: #5b21b6;
    }
    .auth-link.secondary:hover {
      background: var(--gradient-subtle);
    }
    .auth-out {
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid var(--border);
      background: #f9fafb;
      border-radius: 8px;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
    }
    .lang {
      display: inline-flex;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 2px;
      background: #f9fafb;
    }
    .lang-btn {
      border: none;
      background: transparent;
      padding: 0.35rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 600;
      font-family: var(--font-body);
      color: var(--text-secondary);
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .lang-btn:hover { color: var(--text-primary); background: var(--hover); }
    .lang-btn.active {
      color: #fff;
      background: var(--gradient-brand);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: var(--text-primary);
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .brand-logo {
      display: block;
      width: 40px; height: 40px;
      object-fit: contain;
      border-radius: 8px;
    }
    .brand-text { display: inline-flex; }
    .cert { color: var(--color-navy); }
    .chain {
      background: var(--gradient-brand);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: var(--color-gradient-end);
    }
    .nav-links {
      display: flex;
      gap: 0.35rem;
      padding: 0.25rem;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: #ffffff;
      box-shadow: 0 1px 10px rgba(15, 23, 42, 0.06);
    }
    .nav-links a {
      padding: 0.5rem 1.05rem;
      border-radius: 999px;
      text-decoration: none;
      color: var(--color-navy-muted);
      font-size: 0.9375rem;
      font-weight: 500;
      transition: color 0.15s, background 0.15s;
    }
    .nav-links a:hover {
      color: var(--color-navy);
      background: var(--hover);
    }
    .nav-links a.active {
      color: #ffffff;
      background: var(--gradient-brand);
    }
    @media (max-width: 640px) {
      .navbar {
        grid-template-columns: 1fr auto;
        grid-template-areas:
          "brand lang"
          "nav nav";
        row-gap: 0.5rem;
        padding: 0.65rem 1rem 0.85rem;
      }
      .brand { grid-area: brand; }
      .nav-center {
        grid-area: nav;
        width: 100%;
        display: flex;
        justify-content: center;
      }
      .nav-lang { grid-area: lang; }
      .nav-actions {
        gap: 0.45rem;
      }
      .nav-links {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  `],
})
export class NavbarComponent {
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
}
