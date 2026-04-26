import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <div class="card">
        <h1>{{ 'auth.registerTitle' | t }}</h1>
        <p class="sub">{{ 'auth.registerSub' | t }}</p>
        <div class="form-group">
          <label>{{ 'auth.email' | t }}</label>
          <input type="email" [(ngModel)]="email" autocomplete="email" />
        </div>
        <div class="form-group">
          <label>{{ 'auth.password' | t }}</label>
          <input type="password" [(ngModel)]="password" autocomplete="new-password" />
        </div>
        <div class="form-group">
          <label>{{ 'auth.instName' | t }}</label>
          <input type="text" [(ngModel)]="institutionName" />
        </div>
        <div class="form-group">
          <label>{{ 'auth.description' | t }}</label>
          <textarea rows="2" [(ngModel)]="description"></textarea>
        </div>
        <button class="btn-primary" type="button" (click)="submit()" [disabled]="loading">
          {{ loading ? ('auth.loading' | t) : ('auth.registerBtn' | t) }}
        </button>
        <p *ngIf="error" class="err">{{ error }}</p>
        <p *ngIf="ok" class="ok">{{ ok }}</p>
        <p class="foot">
          {{ 'auth.hasAccount' | t }}
          <a routerLink="/login">{{ 'auth.loginLink' | t }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 24rem; margin: 0 auto; padding: 2.5rem 1rem 3rem; }
    .card {
      background: #fff; border: 1px solid var(--border); border-radius: 16px;
      padding: 1.75rem; box-shadow: var(--shadow-sm);
    }
    h1 { font-size: 1.35rem; font-weight: 700; margin: 0 0 0.35rem; }
    .sub { color: var(--text-secondary); font-size: 0.9rem; margin: 0 0 1.25rem; }
    .form-group { margin-bottom: 0.9rem; }
    label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem; }
    input, textarea {
      width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--border);
      border-radius: 10px; font-size: 0.95rem; box-sizing: border-box; font-family: inherit;
    }
    .btn-primary {
      width: 100%; margin-top: 0.5rem; padding: 0.75rem;
      border: none; border-radius: 12px; font-weight: 600; cursor: pointer;
      color: #fff; background: var(--gradient-brand);
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .err { color: #b91c1c; font-size: 0.88rem; margin-top: 0.75rem; }
    .ok { color: #047857; font-size: 0.88rem; margin-top: 0.75rem; }
    .foot { margin-top: 1rem; font-size: 0.88rem; color: var(--text-secondary); }
    a { color: #5b21b6; font-weight: 600; }
  `],
})
export class RegisterComponent {
  email = '';
  password = '';
  institutionName = '';
  description = '';
  loading = false;
  error: string | null = null;
  ok: string | null = null;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  submit() {
    this.error = null;
    this.ok = null;
    this.loading = true;
    this.auth
      .register({
        email: this.email.trim(),
        password: this.password,
        institutionName: this.institutionName.trim(),
        description: this.description.trim() || undefined,
      })
      .subscribe({
        next: (r) => {
          this.loading = false;
          this.ok = r.message;
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (e) => {
          this.loading = false;
          this.error = e.error?.error || 'Registration failed';
        },
      });
  }
}
