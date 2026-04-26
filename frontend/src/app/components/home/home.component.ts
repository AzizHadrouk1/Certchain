import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="hero">
      <div class="hero-bg" aria-hidden="true">
        <div class="soft-wash"></div>
        <div class="grid-lines"></div>
      </div>

      <div class="hero-content">
        <img
          class="hero-logo"
          src="assets/logo-certchain.png"
          width="160"
          height="160"
          [attr.alt]="'home.altLogo' | t" />
        <p class="tagline">{{ 'home.tagline' | t }}</p>
        <div class="badge">{{ 'home.badge' | t }}</div>
        <h1>
          {{ 'home.h1a' | t }}<br />
          <span class="accent">{{ 'home.h1b' | t }}</span> — <span class="no-middleman">{{ 'home.h1c' | t }}</span>
        </h1>
        <p class="subtitle">
          {{ 'home.subtitle' | t }}
        </p>
        <div class="cta-group">
          <a routerLink="/issue" class="btn btn-primary">{{ 'home.ctaIssue' | t }}</a>
          <a routerLink="/verify" class="btn btn-secondary">{{ 'home.ctaVerify' | t }}</a>
        </div>
        <p class="inst-note">{{ 'home.instNote' | t }}</p>
      </div>

      <div class="features">
        <div class="feature-card">
          <div class="feature-icon">🔐</div>
          <h3>{{ 'home.f1t' | t }}</h3>
          <p>{{ 'home.f1d' | t }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>{{ 'home.f2t' | t }}</h3>
          <p>{{ 'home.f2d' | t }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🌐</div>
          <h3>{{ 'home.f3t' | t }}</h3>
          <p>{{ 'home.f3d' | t }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💰</div>
          <h3>{{ 'home.f4t' | t }}</h3>
          <p>{{ 'home.f4d' | t }}</p>
        </div>
      </div>

      <div class="how-it-works">
        <h2>{{ 'home.howTitle' | t }}</h2>
        <div class="steps">
          <div class="step">
            <div class="step-num">01</div>
            <div class="step-body">
              <h4>{{ 'home.s1t' | t }}</h4>
              <p>{{ 'home.s1d' | t }}</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-num">02</div>
            <div class="step-body">
              <h4>{{ 'home.s2t' | t }}</h4>
              <p>{{ 'home.s2d' | t }}</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-num">03</div>
            <div class="step-body">
              <h4>{{ 'home.s3t' | t }}</h4>
              <p>{{ 'home.s3d' | t }}</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-num">04</div>
            <div class="step-body">
              <h4>{{ 'home.s4t' | t }}</h4>
              <p>{{ 'home.s4d' | t }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero { position: relative; overflow-x: hidden; background: var(--bg); }

    .hero-bg {
      position: absolute; inset: 0; pointer-events: none; z-index: 0;
    }
    .soft-wash {
      position: absolute;
      inset: -20% 20% 40% -20%;
      background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37, 99, 235, 0.08) 0%, transparent 60%);
    }
    .grid-lines {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
      opacity: 0.5;
    }

    .hero-content {
      position: relative; z-index: 1;
      max-width: 44rem; margin: 0 auto;
      padding: 2.5rem 1.5rem 3.5rem;
      text-align: center;
    }
    .hero-logo {
      display: block;
      margin: 0 auto 1rem;
      width: min(10rem, 40vw);
      height: auto;
      object-fit: contain;
    }
    .tagline {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text-secondary);
      margin: 0 0 1.25rem;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      padding: 0.4rem 1rem;
      border-radius: 999px;
      background: var(--gradient-subtle);
      color: #5b21b6;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 1.25rem;
      border: 1px solid rgba(124, 58, 237, 0.2);
    }
    h1 {
      font-family: var(--font-display);
      font-size: clamp(1.875rem, 4.5vw, 2.75rem);
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.03em;
      margin: 0 0 1.25rem;
      color: var(--text-primary);
    }
    .accent {
      background: var(--gradient-brand);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: var(--color-gradient-end);
    }
    .no-middleman { font-style: italic; font-weight: 500; color: var(--text-secondary); }
    .subtitle {
      font-size: 1.0625rem;
      color: var(--text-secondary);
      max-width: 32rem;
      margin: 0 auto 2rem;
      line-height: 1.65;
    }
    .cta-group {
      display: flex; gap: 0.75rem;
      justify-content: center; flex-wrap: wrap;
      margin-bottom: 4rem;
    }
    .btn {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      font-weight: 600; font-size: 0.9375rem;
      text-decoration: none; transition: box-shadow 0.2s, transform 0.2s, background 0.2s;
      display: inline-block;
    }
    .btn-primary {
      background: var(--gradient-brand);
      color: var(--on-gradient);
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35); }
    .btn-secondary {
      border: 1px solid var(--border);
      color: var(--text-primary);
      background: var(--surface);
    }
    .btn-secondary:hover { background: #f9fafb; box-shadow: var(--shadow-sm); transform: translateY(-1px); }

    .inst-note {
      font-size: 0.9rem;
      color: var(--text-secondary);
      max-width: 32rem;
      margin: 0 auto 2.5rem;
      line-height: 1.5;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      max-width: 1000px; margin: 0 auto;
      padding: 0 1.5rem 4rem;
      position: relative; z-index: 1;
    }
    .feature-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    }
    .feature-card:hover {
      border-color: rgba(37, 99, 235, 0.35);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .feature-icon { font-size: 1.75rem; margin-bottom: 0.75rem; }
    .feature-card h3 {
      font-family: var(--font-display);
      font-size: 1.0625rem; font-weight: 600;
      margin: 0 0 0.5rem; color: var(--text-primary);
    }
    .feature-card p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }

    .how-it-works {
      max-width: 1100px; margin: 0 auto;
      padding: 0 1.5rem 5rem;
      position: relative; z-index: 1;
    }
    .how-it-works h2 {
      font-family: var(--font-display);
      font-size: 1.5rem; font-weight: 700;
      letter-spacing: -0.02em;
      text-align: center; margin-bottom: 2rem;
    }
    .steps {
      display: flex; align-items: flex-start;
      gap: 1rem; flex-wrap: wrap; justify-content: center;
    }
    .step {
      flex: 1; min-width: 180px; max-width: 220px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px; padding: 1.25rem;
      box-shadow: var(--shadow-sm);
    }
    .step-num {
      font-family: var(--font-display);
      font-size: 2rem; font-weight: 700;
      background: var(--gradient-brand);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1; margin-bottom: 0.75rem; opacity: 0.9;
    }
    .step-body h4 { font-size: 0.9rem; font-weight: 600; margin: 0 0 0.4rem; }
    .step-body p { font-size: 0.875rem; color: var(--text-secondary); margin: 0; line-height: 1.55; }
    .step-arrow {
      font-size: 1.25rem; color: #d1d5db;
      align-self: center; padding-top: 0.5rem;
    }
  `],
})
export class HomeComponent {}
