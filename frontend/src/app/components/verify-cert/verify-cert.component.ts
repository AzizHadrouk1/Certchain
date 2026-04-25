import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CertificateService } from '../../services/certificate.service';
import { VerifyResponse } from '../../models/certificate.model';

@Component({
  selector: 'app-verify-cert',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Verify a Certificate</h1>
        <p>Enter the HCS sequence number provided by the institution. Optionally re-upload the PDF to verify file integrity.</p>
      </div>

      <div class="verify-card">
        <div class="form-group">
          <label>HCS Sequence Number *</label>
          <input [(ngModel)]="sequenceNumber" placeholder="e.g. 42" type="number" />
        </div>

        <div class="form-group">
          <label>Diploma PDF <span class="optional">(optional — for hash verification)</span></label>
          <div class="dropzone" (click)="fileInput.click()"
               (dragover)="$event.preventDefault()"
               (drop)="onDrop($event)"
               [class.has-file]="selectedFile">
            <input #fileInput type="file" accept="application/pdf"
                   (change)="onFileSelect($event)" style="display:none" />
            <span *ngIf="!selectedFile">📄 Drop PDF here or <u>browse</u></span>
            <span *ngIf="selectedFile" class="file-name">✅ {{ selectedFile.name }}</span>
          </div>
        </div>

        <button class="btn-verify" (click)="verify()" [disabled]="loading || !sequenceNumber">
          <span *ngIf="!loading">🔍 Verify Certificate</span>
          <span *ngIf="loading" class="loader">Querying Hedera Mirror Node…</span>
        </button>

        <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      </div>

      <!-- Result -->
      <div *ngIf="result" class="result-card" [class.verified]="result.verified" [class.failed]="!result.verified">
        <div class="result-banner">
          <span class="banner-icon">{{ result.verified ? '✅' : '❌' }}</span>
          <div>
            <h2>{{ result.verified ? 'Certificate Verified' : 'Not Found' }}</h2>
            <p>{{ result.message }}</p>
          </div>
        </div>

        <div *ngIf="result.hashMatch !== undefined" class="hash-status"
             [class.match]="result.hashMatch" [class.mismatch]="!result.hashMatch">
          <span>{{ result.hashMatch ? '🔐 File hash matches — document is authentic' : '⚠️ Hash mismatch — document may have been tampered with' }}</span>
        </div>

        <div class="cert-details" *ngIf="result.certificate">
          <h3>Certificate Details</h3>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">Recipient</span>
              <span class="detail-value name">{{ result.certificate.recipientName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Course / Degree</span>
              <span class="detail-value">{{ result.certificate.courseName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Institution</span>
              <span class="detail-value">{{ result.certificate.institution }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Issue Date</span>
              <span class="detail-value">{{ result.certificate.issueDate }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Consensus Time</span>
              <span class="detail-value mono">{{ formatTimestamp(result.certificate.consensusTimestamp) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Sequence #</span>
              <span class="detail-value mono accent">{{ result.certificate.sequenceNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Topic ID</span>
              <span class="detail-value mono">{{ result.certificate.topicId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">File Hash</span>
              <span class="detail-value mono small">{{ result.certificate.fileHash }}</span>
            </div>
          </div>
        </div>

        <button class="btn-reset" (click)="reset()">Verify another</button>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 680px; margin: 0 auto; padding: 3rem 1.5rem; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 {
      font-family: var(--font-display);
      font-size: 2.2rem; font-weight: 800;
      letter-spacing: -0.04em; margin: 0 0 0.5rem;
    }
    .page-header p { color: var(--text-secondary); margin: 0; line-height: 1.6; }

    .verify-card {
      background: var(--card-bg); border: 1px solid var(--border);
      border-radius: 16px; padding: 2rem; margin-bottom: 2rem;
    }
    .form-group { margin-bottom: 1.25rem; }
    label {
      display: block; font-size: 0.82rem; font-weight: 600;
      color: var(--text-secondary); margin-bottom: 0.4rem;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .optional { text-transform: none; font-weight: 400; opacity: 0.7; }
    input {
      width: 100%; padding: 0.7rem 1rem;
      background: var(--input-bg); border: 1px solid var(--border);
      border-radius: 10px; color: var(--text-primary);
      font-family: var(--font-body); font-size: 0.95rem;
      outline: none; transition: border-color 0.15s;
      box-sizing: border-box;
    }
    input:focus { border-color: var(--accent); }

    .dropzone {
      border: 2px dashed var(--border); border-radius: 12px;
      padding: 1.5rem; text-align: center;
      cursor: pointer; transition: all 0.2s;
      color: var(--text-secondary); font-size: 0.9rem;
    }
    .dropzone:hover { border-color: var(--accent); background: var(--accent-dim); }
    .dropzone.has-file { border-color: #22c55e; background: rgba(34,197,94,0.05); }
    .file-name { color: #22c55e; font-weight: 600; }

    .btn-verify {
      width: 100%; padding: 0.9rem;
      background: var(--accent); color: #000;
      border: none; border-radius: 10px;
      font-size: 1rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-verify:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-verify:disabled { opacity: 0.4; cursor: not-allowed; }
    .loader { animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    .alert-error {
      margin-top: 1rem; padding: 0.75rem 1rem;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
      border-radius: 8px; color: #f87171; font-size: 0.88rem;
    }

    /* Result */
    .result-card {
      background: var(--card-bg); border-radius: 16px;
      padding: 2rem; border: 1px solid var(--border);
    }
    .result-card.verified { border-color: rgba(34,197,94,0.4); }
    .result-card.failed { border-color: rgba(239,68,68,0.4); }

    .result-banner {
      display: flex; align-items: center; gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .banner-icon { font-size: 2.5rem; flex-shrink: 0; }
    .result-banner h2 {
      font-family: var(--font-display);
      font-size: 1.4rem; font-weight: 800; margin: 0 0 0.2rem;
    }
    .result-banner p { color: var(--text-secondary); margin: 0; font-size: 0.88rem; }

    .hash-status {
      padding: 0.75rem 1rem; border-radius: 10px;
      font-size: 0.88rem; font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .hash-status.match { background: rgba(34,197,94,0.1); color: #4ade80; }
    .hash-status.mismatch { background: rgba(239,68,68,0.1); color: #f87171; }

    .cert-details h3 {
      font-size: 0.8rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--text-secondary); margin: 0 0 1rem;
      border-top: 1px solid var(--border); padding-top: 1.25rem;
    }
    .detail-grid { display: flex; flex-direction: column; gap: 0.7rem; }
    .detail-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline; }
    .detail-label {
      font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--text-secondary); min-width: 130px;
    }
    .detail-value { font-size: 0.9rem; color: var(--text-primary); }
    .detail-value.name { font-weight: 700; font-size: 1rem; }
    .detail-value.mono { font-family: monospace; font-size: 0.82rem; word-break: break-all; }
    .detail-value.accent { color: var(--accent); font-weight: 700; }
    .detail-value.small { font-size: 0.72rem; }

    .btn-reset {
      margin-top: 1.5rem; padding: 0.65rem 1.5rem;
      border: 1px solid var(--border); border-radius: 10px;
      background: transparent; color: var(--text-primary);
      cursor: pointer; font-size: 0.88rem; transition: all 0.15s;
    }
    .btn-reset:hover { background: var(--hover); }
  `],
})
export class VerifyCertComponent {
  sequenceNumber = '';
  selectedFile: File | null = null;
  loading = false;
  error: string | null = null;
  result: VerifyResponse | null = null;

  constructor(private certService: CertificateService) {}

  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile = input.files[0];
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type === 'application/pdf') this.selectedFile = file;
  }

  async verify() {
    if (!this.sequenceNumber) return;
    this.loading = true;
    this.error = null;
    this.result = null;

    try {
      if (this.selectedFile) {
        const fileHash = await this.certService.computeFileHash(this.selectedFile);
        this.certService.verifyWithHash(this.sequenceNumber, fileHash).subscribe({
          next: (res) => { this.result = res; this.loading = false; },
          error: (err) => {
            this.error = err.error?.error || 'Verification failed.';
            this.loading = false;
          },
        });
      } else {
        this.certService.verifyCertificate(this.sequenceNumber).subscribe({
          next: (res) => { this.result = res; this.loading = false; },
          error: (err) => {
            this.error = err.error?.error || 'Verification failed.';
            this.loading = false;
          },
        });
      }
    } catch (err: any) {
      this.error = err.message;
      this.loading = false;
    }
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    const [secs] = ts.split('.');
    return new Date(parseInt(secs, 10) * 1000).toLocaleString();
  }

  reset() {
    this.result = null;
    this.sequenceNumber = '';
    this.selectedFile = null;
    this.error = null;
  }
}
