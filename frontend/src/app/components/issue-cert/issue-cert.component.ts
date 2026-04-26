import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CertificateService } from '../../services/certificate.service';
import { InstitutionService } from '../../services/institution.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { IssueResponse } from '../../models/certificate.model';

@Component({
  selector: 'app-issue-cert',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TranslatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>{{ 'issue.title' | t }}</h1>
        <p>{{ 'issue.intro' | t }}</p>
      </div>

      <div *ngIf="auth.isLoggedIn() && !auth.user()" class="banner warn">{{ 'auth.loading' | t }}</div>

      <div *ngIf="auth.user()?.institution?.status === 'pending'" class="banner warn">
        {{ 'issue.pending' | t }}
      </div>
      <div *ngIf="auth.user()?.institution?.status === 'rejected'" class="banner bad">
        {{ 'issue.rejected' | t }}
      </div>

      <div class="form-card" *ngIf="!result && auth.user()?.institution?.status === 'approved'">
        <div class="form-group readonly">
          <label>{{ 'issue.readonlyInst' | t }}</label>
          <div class="inst-name">{{ auth.user()?.institution?.name }}</div>
        </div>

        <div class="branding" *ngIf="showBranding">
          <h3>{{ 'issue.branding' | t }}</h3>
          <div class="form-group">
            <label>{{ 'issue.logo' | t }}</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onLogo($event)" />
          </div>
          <div class="form-group">
            <label>{{ 'issue.signature' | t }}</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onSig($event)" />
          </div>
        </div>
        <button type="button" class="linkish" (click)="showBranding = !showBranding">
          {{ showBranding ? '▲' : '▼' }} {{ 'issue.branding' | t }}
        </button>

        <div class="form-group">
          <label>{{ 'issue.recipient' | t }}</label>
          <input [(ngModel)]="form.recipientName" [attr.placeholder]="'issue.recipientPh' | t" />
        </div>
        <div class="form-group">
          <label>{{ 'issue.course' | t }}</label>
          <input [(ngModel)]="form.courseName" [attr.placeholder]="'issue.coursePh' | t" />
        </div>
        <div class="form-group">
          <label>{{ 'issue.courseDesc' | t }}</label>
          <textarea rows="2" [(ngModel)]="form.courseDescription"></textarea>
        </div>
        <div class="form-group">
          <label>{{ 'issue.date' | t }}</label>
          <input type="date" [(ngModel)]="form.issueDate" />
        </div>
        <div class="form-group">
          <label>{{ 'issue.pdf' | t }} <span class="optional">{{ 'issue.pdfOptional' | t }}</span></label>
          <div
            class="dropzone"
            (click)="fileInput.click()"
            (dragover)="$event.preventDefault()"
            (drop)="onDrop($event)"
            [class.has-file]="selectedFile">
            <input
              #fileInput
              type="file"
              accept="application/pdf"
              (change)="onFileSelect($event)"
              style="display:none" />
            <span *ngIf="!selectedFile">📄 {{ 'issue.drop' | t }} <u>{{ 'issue.browse' | t }}</u></span>
            <span *ngIf="selectedFile" class="file-name">✅ {{ selectedFile.name }}</span>
          </div>
          <div *ngIf="computedHash" class="hash-preview">
            <span class="hash-label">{{ 'issue.hashLabel' | t }}</span>
            <code>{{ computedHash }}</code>
          </div>
        </div>

        <button class="btn-submit" (click)="issue()" [disabled]="loading || !isValid()">
          <span *ngIf="!loading">{{ 'issue.submit' | t }}</span>
          <span *ngIf="loading" class="loader">{{ 'issue.loading' | t }}</span>
        </button>

        <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      </div>

      <div class="result-card" *ngIf="result">
        <div class="result-header">
          <div class="check">✅</div>
          <h2>{{ 'issue.successTitle' | t }}</h2>
          <p>{{ 'issue.successSub' | t }}</p>
        </div>
        <div class="result-actions" *ngIf="result.pdfUrl">
          <button type="button" class="btn-submit" (click)="downloadPdf()">
            {{ 'issue.downloadPdf' | t }}
          </button>
          <p class="qr-hint" *ngIf="result.verifyUrl">
            {{ 'issue.qrHint' | t }}<br />
            <code class="small-url">{{ result.verifyUrl }}</code>
          </p>
        </div>
        <div class="result-body">
          <div class="result-row">
            <span class="label">{{ 'issue.labelCertId' | t }}</span>
            <code>{{ result.certId }}</code>
          </div>
          <div class="result-row">
            <span class="label">{{ 'issue.labelSeq' | t }}</span>
            <code class="highlight">{{ result.hcs.sequenceNumber }}</code>
            <span class="hint">{{ 'issue.hintSeq' | t }}</span>
          </div>
          <div class="result-row">
            <span class="label">{{ 'issue.labelTopic' | t }}</span>
            <code>{{ result.hcs.topicId }}</code>
          </div>
          <div class="result-row">
            <span class="label">{{ 'issue.labelTx' | t }}</span>
            <code class="small">{{ result.hcs.transactionId }}</code>
          </div>
          <div class="result-row">
            <span class="label">{{ 'issue.labelHash' | t }}</span>
            <code class="small">{{ result.fileHash }}</code>
          </div>
          <div class="result-row">
            <span class="label">{{ 'issue.labelTime' | t }}</span>
            <span>{{ result.hcs.timestamp | date: 'medium' : undefined : i18n.dateLocale() }}</span>
          </div>
        </div>
        <button class="btn-secondary" (click)="reset()">{{ 'issue.again' | t }}</button>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 40rem; margin: 0 auto;
      padding: 2rem 1.25rem 3rem;
      background: var(--bg);
    }
    .banner {
      padding: 0.85rem 1rem; border-radius: 12px; margin-bottom: 1rem; font-size: 0.92rem;
    }
    .banner.warn { background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; }
    .banner.bad { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .page-header { margin-bottom: 1.75rem; }
    .page-header h1 {
      font-family: var(--font-display);
      font-size: 1.75rem; font-weight: 700;
      letter-spacing: -0.03em; margin: 0 0 0.5rem;
    }
    .page-header p { color: var(--text-secondary); margin: 0; line-height: 1.6; font-size: 0.95rem; }

    .form-card, .result-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px; padding: 1.75rem;
      box-shadow: var(--shadow-sm);
    }
    .readonly .inst-name { font-weight: 600; padding: 0.5rem 0; }
    .branding { margin: 1rem 0; padding-top: 0.5rem; border-top: 1px solid var(--border); }
    .branding h3 { font-size: 0.95rem; margin: 0 0 0.5rem; }
    .linkish {
      background: none; border: none; color: #5b21b6; font-size: 0.88rem;
      cursor: pointer; margin-bottom: 1rem; padding: 0;
    }
    .form-group { margin-bottom: 1.25rem; }
    label {
      display: block; font-size: 0.875rem;
      font-weight: 600; color: var(--text-primary);
      margin-bottom: 0.4rem;
    }
    .optional { font-weight: 400; color: var(--text-secondary); }
    input[type="text"], input[type="date"], textarea {
      width: 100%; padding: 0.65rem 0.9rem;
      background: var(--input-bg); border: 1px solid var(--border);
      border-radius: 10px; color: var(--text-primary);
      font-family: var(--font-body); font-size: 1rem;
      outline: none; transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    textarea { min-height: 3rem; resize: vertical; }
    input:focus, textarea:focus {
      border-color: rgba(37, 99, 235, 0.5);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    .dropzone {
      border: 2px dashed #cbd5e1; border-radius: 12px;
      padding: 1.75rem; text-align: center;
      cursor: pointer; transition: all 0.2s;
      color: var(--text-secondary); font-size: 0.9375rem;
      background: #fafafa;
    }
    .dropzone:hover { border-color: var(--color-gradient-start); background: var(--gradient-subtle); }
    .dropzone.has-file { border-color: #10b981; background: #ecfdf5; }
    .file-name { color: #047857; font-weight: 600; }

    .hash-preview {
      margin-top: 0.5rem; padding: 0.6rem 0.8rem;
      background: #f3f4f6; border-radius: 8px;
      display: flex; align-items: center; gap: 0.75rem;
      border: 1px solid var(--border);
    }
    .hash-label {
      font-size: 0.6875rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: #5b21b6; white-space: nowrap;
    }
    .hash-preview code { font-size: 0.7rem; word-break: break-all; color: var(--text-secondary); }

    .btn-submit {
      width: 100%; padding: 0.85rem 1rem;
      background: var(--gradient-brand);
      color: var(--on-gradient);
      border: none; border-radius: 12px;
      font-size: 1rem; font-weight: 600;
      cursor: pointer; margin-top: 0.5rem;
      transition: box-shadow 0.2s, transform 0.2s;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(124, 58, 237, 0.35); }
    .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
    .loader { animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    .alert-error {
      margin-top: 1rem; padding: 0.75rem 1rem;
      background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 10px; color: #b91c1c; font-size: 0.9rem;
    }

    .result-actions { margin-bottom: 1rem; }
    .qr-hint { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.75rem; }
    .small-url { font-size: 0.72rem; word-break: break-all; display: block; margin-top: 0.35rem; }

    .result-header { text-align: center; margin-bottom: 1rem; }
    .check { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .result-header h2 {
      font-family: var(--font-display);
      font-size: 1.4rem; font-weight: 700;
      margin: 0 0 0.25rem;
    }
    .result-header p { color: var(--text-secondary); margin: 0; font-size: 0.9rem; }

    .result-body { border-top: 1px solid var(--border); padding-top: 1.25rem; }
    .result-row {
      display: flex; flex-wrap: wrap; align-items: baseline;
      gap: 0.5rem; margin-bottom: 0.9rem; font-size: 0.9rem;
    }
    .result-row .label {
      font-weight: 600; color: var(--text-secondary);
      font-size: 0.75rem; text-transform: uppercase;
      letter-spacing: 0.04em; min-width: 8rem;
      margin-bottom: 0;
    }
    .result-row code { font-size: 0.8rem; word-break: break-all; }
    .result-row .highlight { color: #5b21b6; font-size: 1rem; font-weight: 700; }
    .result-row .hint { color: var(--text-secondary); font-size: 0.75rem; font-style: italic; }
    .result-row .small { font-size: 0.72rem; }

    .btn-secondary {
      margin-top: 1.5rem; padding: 0.65rem 1.5rem;
      border: 1px solid var(--border); border-radius: 12px;
      background: var(--surface); color: var(--text-primary);
      cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: background 0.15s;
    }
    .btn-secondary:hover { background: #f3f4f6; }
  `],
})
export class IssueCertComponent {
  form = {
    recipientName: '',
    courseName: '',
    courseDescription: '',
    issueDate: '',
  };
  selectedFile: File | null = null;
  computedHash: string | null = null;
  loading = false;
  error: string | null = null;
  result: IssueResponse | null = null;
  showBranding = false;

  protected readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  private readonly certService = inject(CertificateService);
  private readonly instService = inject(InstitutionService);

  isValid(): boolean {
    return !!(
      this.form.recipientName &&
      this.form.courseName &&
      this.form.issueDate
    );
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

  onLogo(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (f) {
      this.instService.uploadLogo(f).subscribe({ error: () => {} });
    }
  }

  onSig(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (f) {
      this.instService.uploadSignature(f).subscribe({ error: () => {} });
    }
  }

  async issue() {
    if (!this.isValid()) return;
    this.loading = true;
    this.error = null;

    const fd = new FormData();
    fd.append('recipientName', this.form.recipientName);
    fd.append('courseName', this.form.courseName);
    fd.append('issueDate', this.form.issueDate);
    if (this.form.courseDescription?.trim()) {
      fd.append('courseDescription', this.form.courseDescription.trim());
    }
    if (this.selectedFile) {
      fd.append('file', this.selectedFile);
    } else if (this.computedHash) {
      fd.append('fileHash', this.computedHash);
    }

    this.certService.issueCertificate(fd).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || this.i18n.t('issue.error');
        this.loading = false;
      },
    });
  }

  async downloadPdf() {
    if (!this.result?.pdfUrl) return;
    const t = localStorage.getItem('certchain_token');
    const res = await fetch(this.result.pdfUrl, {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `certchain-${this.result.certId}.pdf`;
    a.click();
    URL.revokeObjectURL(u);
  }

  reset() {
    this.result = null;
    this.form = {
      recipientName: '',
      courseName: '',
      courseDescription: '',
      issueDate: '',
    };
    this.selectedFile = null;
    this.computedHash = null;
  }
}
