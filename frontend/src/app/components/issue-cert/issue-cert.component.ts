import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CertificateService } from '../../services/certificate.service';
import { IssueResponse } from '../../models/certificate.model';

@Component({
  selector: 'app-issue-cert',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Issue a Certificate</h1>
        <p>Fill in the details below. The diploma PDF will be hashed in your browser — it never leaves your device.</p>
      </div>

      <div class="form-card" *ngIf="!result">
        <div class="form-group">
          <label>Institution Name *</label>
          <input [(ngModel)]="form.institution" placeholder="e.g. University of Algiers" />
        </div>
        <div class="form-group">
          <label>Recipient Full Name *</label>
          <input [(ngModel)]="form.recipientName" placeholder="e.g. Ahmed Ben Ali" />
        </div>
        <div class="form-group">
          <label>Course / Degree Title *</label>
          <input [(ngModel)]="form.courseName" placeholder="e.g. Master of Computer Science" />
        </div>
        <div class="form-group">
          <label>Issue Date *</label>
          <input type="date" [(ngModel)]="form.issueDate" />
        </div>
        <div class="form-group">
          <label>Diploma PDF <span class="optional">(optional — hash computed locally)</span></label>
          <div class="dropzone" (click)="fileInput.click()"
               (dragover)="$event.preventDefault()"
               (drop)="onDrop($event)"
               [class.has-file]="selectedFile">
            <input #fileInput type="file" accept="application/pdf"
                   (change)="onFileSelect($event)" style="display:none" />
            <span *ngIf="!selectedFile">
              📄 Drop PDF here or <u>browse</u>
            </span>
            <span *ngIf="selectedFile" class="file-name">
              ✅ {{ selectedFile.name }}
            </span>
          </div>
          <div *ngIf="computedHash" class="hash-preview">
            <span class="hash-label">SHA-256</span>
            <code>{{ computedHash }}</code>
          </div>
        </div>

        <button class="btn-submit" (click)="issue()" [disabled]="loading || !isValid()">
          <span *ngIf="!loading">⛓ Anchor on Hedera</span>
          <span *ngIf="loading" class="loader">Submitting to HCS…</span>
        </button>

        <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      </div>

      <!-- Success Result -->
      <div class="result-card" *ngIf="result">
        <div class="result-header">
          <div class="check">✅</div>
          <h2>Certificate Anchored!</h2>
          <p>Permanently recorded on Hedera Consensus Service</p>
        </div>
        <div class="result-body">
          <div class="result-row">
            <span class="label">Certificate ID</span>
            <code>{{ result.certId }}</code>
          </div>
          <div class="result-row">
            <span class="label">HCS Sequence #</span>
            <code class="highlight">{{ result.hcs.sequenceNumber }}</code>
            <span class="hint">← share this with the certificate holder</span>
          </div>
          <div class="result-row">
            <span class="label">Topic ID</span>
            <code>{{ result.hcs.topicId }}</code>
          </div>
          <div class="result-row">
            <span class="label">Transaction ID</span>
            <code class="small">{{ result.hcs.transactionId }}</code>
          </div>
          <div class="result-row">
            <span class="label">File Hash</span>
            <code class="small">{{ result.fileHash }}</code>
          </div>
          <div class="result-row">
            <span class="label">Timestamp</span>
            <span>{{ result.hcs.timestamp | date:'medium' }}</span>
          </div>
        </div>
        <button class="btn-secondary" (click)="reset()">Issue another</button>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 680px; margin: 0 auto;
      padding: 3rem 1.5rem;
    }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 {
      font-family: var(--font-display);
      font-size: 2.2rem; font-weight: 800;
      letter-spacing: -0.04em; margin: 0 0 0.5rem;
    }
    .page-header p { color: var(--text-secondary); margin: 0; line-height: 1.6; }

    .form-card, .result-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px; padding: 2rem;
    }
    .form-group { margin-bottom: 1.25rem; }
    label {
      display: block; font-size: 0.82rem;
      font-weight: 600; color: var(--text-secondary);
      margin-bottom: 0.4rem; text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .optional { text-transform: none; font-weight: 400; opacity: 0.7; }
    input[type="text"], input[type="date"], input:not([type]) {
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
      padding: 2rem; text-align: center;
      cursor: pointer; transition: all 0.2s;
      color: var(--text-secondary); font-size: 0.9rem;
    }
    .dropzone:hover { border-color: var(--accent); background: var(--accent-dim); }
    .dropzone.has-file { border-color: #22c55e; background: rgba(34, 197, 94, 0.05); }
    .file-name { color: #22c55e; font-weight: 600; }

    .hash-preview {
      margin-top: 0.5rem; padding: 0.6rem 0.8rem;
      background: var(--input-bg); border-radius: 8px;
      display: flex; align-items: center; gap: 0.75rem;
      border: 1px solid var(--border);
    }
    .hash-label {
      font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--accent); white-space: nowrap;
    }
    .hash-preview code {
      font-size: 0.7rem; word-break: break-all;
      color: var(--text-secondary);
    }

    .btn-submit {
      width: 100%; padding: 0.9rem;
      background: var(--accent); color: #000;
      border: none; border-radius: 10px;
      font-size: 1rem; font-weight: 700;
      cursor: pointer; margin-top: 0.5rem;
      transition: all 0.2s;
    }
    .btn-submit:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .loader { animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    .alert-error {
      margin-top: 1rem; padding: 0.75rem 1rem;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
      border-radius: 8px; color: #f87171; font-size: 0.88rem;
    }

    /* Result */
    .result-header { text-align: center; margin-bottom: 1.5rem; }
    .check { font-size: 3rem; margin-bottom: 0.5rem; }
    .result-header h2 {
      font-family: var(--font-display);
      font-size: 1.6rem; font-weight: 800;
      margin: 0 0 0.25rem;
    }
    .result-header p { color: var(--text-secondary); margin: 0; }

    .result-body { border-top: 1px solid var(--border); padding-top: 1.25rem; }
    .result-row {
      display: flex; flex-wrap: wrap; align-items: baseline;
      gap: 0.5rem; margin-bottom: 0.9rem; font-size: 0.88rem;
    }
    .result-row .label {
      font-weight: 600; color: var(--text-secondary);
      font-size: 0.75rem; text-transform: uppercase;
      letter-spacing: 0.06em; min-width: 130px;
      margin-bottom: 0;
    }
    .result-row code { font-size: 0.8rem; word-break: break-all; }
    .result-row .highlight {
      color: var(--accent); font-size: 1rem; font-weight: 700;
    }
    .result-row .hint { color: var(--text-secondary); font-size: 0.75rem; font-style: italic; }
    .result-row .small { font-size: 0.72rem; }

    .btn-secondary {
      margin-top: 1.5rem; padding: 0.65rem 1.5rem;
      border: 1px solid var(--border); border-radius: 10px;
      background: transparent; color: var(--text-primary);
      cursor: pointer; font-size: 0.88rem; transition: all 0.15s;
    }
    .btn-secondary:hover { background: var(--hover); }
  `],
})
export class IssueCertComponent {
  form = { institution: '', recipientName: '', courseName: '', issueDate: '' };
  selectedFile: File | null = null;
  computedHash: string | null = null;
  loading = false;
  error: string | null = null;
  result: IssueResponse | null = null;

  constructor(private certService: CertificateService) {}

  isValid(): boolean {
    return !!(this.form.institution && this.form.recipientName &&
              this.form.courseName && this.form.issueDate);
  }

  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.computedHash = await this.certService.computeFileHash(this.selectedFile);
    }
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
      this.computedHash = await this.certService.computeFileHash(file);
    }
  }

  async issue() {
    if (!this.isValid()) return;
    this.loading = true;
    this.error = null;

    const fd = new FormData();
    fd.append('institution', this.form.institution);
    fd.append('recipientName', this.form.recipientName);
    fd.append('courseName', this.form.courseName);
    fd.append('issueDate', this.form.issueDate);
    if (this.selectedFile) {
      fd.append('file', this.selectedFile);
    } else if (this.computedHash) {
      fd.append('fileHash', this.computedHash);
    }

    this.certService.issueCertificate(fd).subscribe({
      next: (res) => { this.result = res; this.loading = false; },
      error: (err) => {
        this.error = err.error?.error || 'An error occurred. Is the backend running?';
        this.loading = false;
      },
    });
  }

  reset() {
    this.result = null;
    this.form = { institution: '', recipientName: '', courseName: '', issueDate: '' };
    this.selectedFile = null;
    this.computedHash = null;
  }
}
