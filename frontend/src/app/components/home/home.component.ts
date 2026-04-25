import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="hero">
      <div class="hero-bg">
        <div class="grid-lines"></div>
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
      </div>

      <div class="hero-content">
        <div class="badge">Powered by Hedera HCS</div>
        <h1>Your degree,<br><span class="accent">verifiable in seconds.</span></h1>
        <p class="subtitle">
          CertChain anchors academic credentials directly to the Hedera Consensus Service.
          No central database, no middleman — just cryptographic proof on a public ledger.
        </p>
        <div class="cta-group">
          <a routerLink="/issue" class="btn btn-primary">Issue Certificate</a>
          <a routerLink="/verify" class="btn btn-secondary">Verify a Certificate</a>
        </div>
      </div>

      <div class="features">
        <div class="feature-card">
          <div class="feature-icon">🔐</div>
          <h3>Tamper-Proof</h3>
          <p>Every certificate is hashed and written to Hedera HCS. Any modification invalidates the proof instantly.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Instant Verification</h3>
          <p>Employers paste a certificate ID and get cryptographic confirmation in under 3 seconds.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🌐</div>
          <h3>Decentralised</h3>
          <p>No single point of failure. Hedera's distributed ledger ensures global availability and immutability.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💰</div>
          <h3>Low Cost</h3>
          <p>Each certificate issuance costs fractions of a cent on Hedera — making it accessible to every institution.</p>
        </div>
      </div>

      <div class="how-it-works">
        <h2>How it works</h2>
        <div class="steps">
          <div class="step">
            <div class="step-num">01</div>
            <div class="step-body">
              <h4>Institution uploads PDF</h4>
              <p>The diploma PDF is hashed client-side using SHA-256. The file never leaves your browser.</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-num">02</div>
            <div class="step-body">
              <h4>Hash anchored on HCS</h4>
              <p>The hash + metadata is submitted as a message to a Hedera Consensus Service topic.</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-num">03</div>
            <div class="step-body">
              <h4>Sequence number issued</h4>
              <p>Hedera returns a consensus timestamp and sequence number — your certificate's permanent ID.</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-num">04</div>
            <div class="step-body">
              <h4>Anyone can verify</h4>
              <p>Paste the ID + optionally re-upload the PDF. The hash is compared against the on-chain record.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero { position: relative; overflow-x: hidden; }

    .hero-bg {
      position: absolute; inset: 0; pointer-events: none; z-index: 0;
    }
    .grid-lines {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(var(--border) 1px, transparent 1px),
        linear-gradient(90deg, var(--border) 1px, transparent 1px);
      background-size: 48px 48px;
      opacity: 0.35;
    }
    .glow {
      position: absolute; border-radius: 50%;
      filter: blur(120px); opacity: 0.12;
    }
    .glow-1 {
      width: 600px; height: 600px;
      top: -100px; left: -100px;
      background: var(--accent);
    }
    .glow-2 {
      width: 400px; height: 400px;
      top: 200px; right: -80px;
      background: #22d3ee;
    }

    .hero-content {
      position: relative; z-index: 1;
      max-width: 900px; margin: 0 auto;
      padding: 7rem 2rem 4rem;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 0.35rem 1rem;
      border-radius: 999px;
      background: var(--accent-dim);
      color: var(--accent);
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 1.5rem;
    }
    h1 {
      font-family: var(--font-display);
      font-size: clamp(2.8rem, 6vw, 5rem);
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.04em;
      margin: 0 0 1.5rem;
      color: var(--text-primary);
    }
    .accent { color: var(--accent); }
    .subtitle {
      font-size: 1.15rem;
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto 2.5rem;
      line-height: 1.7;
    }
    .cta-group {
      display: flex; gap: 1rem;
      justify-content: center; flex-wrap: wrap;
      margin-bottom: 5rem;
    }
    .btn {
      padding: 0.8rem 2rem; border-radius: 10px;
      font-weight: 600; font-size: 0.95rem;
      text-decoration: none; transition: all 0.2s;
      display: inline-block;
    }
    .btn-primary {
      background: var(--accent); color: #000;
    }
    .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-secondary {
      border: 1px solid var(--border); color: var(--text-primary);
      background: var(--surface);
    }
    .btn-secondary:hover { background: var(--hover); transform: translateY(-1px); }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      max-width: 1000px; margin: 0 auto;
      padding: 0 2rem 5rem;
      position: relative; z-index: 1;
    }
    .feature-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.5rem;
      transition: border-color 0.2s, transform 0.2s;
    }
    .feature-card:hover {
      border-color: var(--accent);
      transform: translateY(-3px);
    }
    .feature-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .feature-card h3 {
      font-family: var(--font-display);
      font-size: 1rem; font-weight: 700;
      margin: 0 0 0.5rem; color: var(--text-primary);
    }
    .feature-card p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }

    .how-it-works {
      max-width: 1100px; margin: 0 auto;
      padding: 0 2rem 6rem;
      position: relative; z-index: 1;
    }
    .how-it-works h2 {
      font-family: var(--font-display);
      font-size: 2rem; font-weight: 700;
      letter-spacing: -0.03em;
      text-align: center; margin-bottom: 2.5rem;
    }
    .steps {
      display: flex; align-items: flex-start;
      gap: 1rem; flex-wrap: wrap; justify-content: center;
    }
    .step {
      flex: 1; min-width: 180px; max-width: 220px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px; padding: 1.25rem;
    }
    .step-num {
      font-family: var(--font-display);
      font-size: 2.5rem; font-weight: 800;
      color: var(--accent); opacity: 0.5;
      line-height: 1; margin-bottom: 0.75rem;
    }
    .step-body h4 { font-size: 0.9rem; font-weight: 600; margin: 0 0 0.4rem; }
    .step-body p { font-size: 0.82rem; color: var(--text-secondary); margin: 0; line-height: 1.55; }
    .step-arrow {
      font-size: 1.5rem; color: var(--border);
      align-self: center; padding-top: 0.5rem;
    }
  `],
})
export class HomeComponent {}
