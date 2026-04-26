import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CertificateService } from '../../services/certificate.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { VerifyResponse } from '../../models/certificate.model';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';

@Component({
  selector: 'app-verify-cert',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>{{ 'verify.title' | t }}</h1>
        <p>{{ 'verify.intro' | t }}</p>
      </div>

      <div class="verify-card">
        <div class="form-group">
          <label>{{ 'verify.qrLabel' | t }}</label>
          <input [(ngModel)]="qrToken" [attr.placeholder]="'verify.qrPh' | t" name="qrt" />
          <div class="qr-actions">
            <button type="button" class="btn-mini" (click)="toggleScan()">
              {{ scanning ? 'Stop' : 'Scan' }}
            </button>
            <span class="hint">{{ scanning ? 'Point your camera at the QR' : '' }}</span>
          </div>
          <video #video class="video" *ngIf="scanning"></video>
        </div>
        <div class="form-group">
          <label>{{ 'verify.seq' | t }}</label>
          <input [(ngModel)]="sequenceNumber" [attr.placeholder]="'verify.seqPh' | t" type="number" />
        </div>

        <div class="form-group">
          <label
            >{{ 'verify.pdf' | t }} <span class="optional">{{ 'verify.pdfOptional' | t }}</span></label
          >
          <div class="dropzone" (click)="fileInput.click()"
               (dragover)="$event.preventDefault()"
               (drop)="onDrop($event)"
               [class.has-file]="selectedFile">
            <input #fileInput type="file" accept="application/pdf"
                   (change)="onFileSelect($event)" style="display:none" />
            <span *ngIf="!selectedFile"
              >📄 {{ 'verify.drop' | t }} <u>{{ 'verify.browse' | t }}</u></span
            >
            <span *ngIf="selectedFile" class="file-name">✅ {{ selectedFile.name }}</span>
          </div>
          <div *ngIf="pdfStatus" class="pdf-status">{{ pdfStatus }}</div>
        </div>

        <button
          class="btn-verify"
          (click)="verify()"
          [disabled]="loading || (!sequenceNumber && !(qrToken || '').trim())">
          <span *ngIf="!loading">{{ 'verify.btn' | t }}</span>
          <span *ngIf="loading" class="loader">{{ 'verify.loading' | t }}</span>
        </button>

        <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      </div>

      <!-- Result -->
      <div *ngIf="result" class="result-card" [class.verified]="result.verified" [class.failed]="!result.verified">
        <div class="result-banner">
          <span class="banner-icon">{{ result.verified ? '✅' : '❌' }}</span>
          <div>
            <h2>{{ result.verified ? ('verify.ok' | t) : ('verify.notFound' | t) }}</h2>
            <p>{{ result.message }}</p>
          </div>
        </div>

        <div *ngIf="result.hashMatch !== undefined" class="hash-status"
             [class.match]="result.hashMatch" [class.mismatch]="!result.hashMatch">
          <span>{{
            result.hashMatch ? ('verify.hashOk' | t) : ('verify.hashBad' | t)
          }}</span>
        </div>

        <div class="cert-details" *ngIf="result.certificate">
          <h3>{{ 'verify.details' | t }}</h3>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">{{ 'verify.recipient' | t }}</span>
              <span class="detail-value name">{{ result.certificate.recipientName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ 'verify.course' | t }}</span>
              <span class="detail-value">{{ result.certificate.courseName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ 'verify.institution' | t }}</span>
              <span class="detail-value">{{ result.certificate.institution }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ 'verify.issueDate' | t }}</span>
              <span class="detail-value">{{ result.certificate.issueDate }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ 'verify.consensus' | t }}</span>
              <span class="detail-value mono">{{ formatTimestamp(result.certificate.consensusTimestamp) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ 'verify.seqLabel' | t }}</span>
              <span class="detail-value mono accent">{{ result.certificate.sequenceNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ 'verify.topic' | t }}</span>
              <span class="detail-value mono">{{ result.certificate.topicId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ 'verify.fileHash' | t }}</span>
              <span class="detail-value mono small">{{ result.certificate.fileHash }}</span>
            </div>
          </div>
        </div>

        <button class="btn-reset" (click)="reset()">{{ 'verify.again' | t }}</button>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 40rem; margin: 0 auto; padding: 2rem 1.25rem 3rem; background: var(--bg); }
    .page-header { margin-bottom: 1.75rem; }
    .page-header h1 {
      font-family: var(--font-display);
      font-size: 1.75rem; font-weight: 700;
      letter-spacing: -0.03em; margin: 0 0 0.5rem;
    }
    .page-header p { color: var(--text-secondary); margin: 0; line-height: 1.6; font-size: 0.95rem; }

    .verify-card {
      background: var(--card-bg); border: 1px solid var(--border);
      border-radius: 16px; padding: 1.75rem; margin-bottom: 2rem;
      box-shadow: var(--shadow-sm);
    }
    .form-group { margin-bottom: 1.25rem; }
    label {
      display: block; font-size: 0.875rem; font-weight: 600;
      color: var(--text-primary); margin-bottom: 0.4rem;
    }
    .optional { font-weight: 400; color: var(--text-secondary); }
    input {
      width: 100%; padding: 0.65rem 0.9rem;
      background: var(--input-bg); border: 1px solid var(--border);
      border-radius: 10px; color: var(--text-primary);
      font-family: var(--font-body); font-size: 1rem;
      outline: none; transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    input:focus {
      border-color: rgba(37, 99, 235, 0.5);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    .dropzone {
      border: 2px dashed #cbd5e1; border-radius: 12px;
      padding: 1.5rem; text-align: center;
      cursor: pointer; transition: all 0.2s;
      color: var(--text-secondary); font-size: 0.9375rem;
      background: #fafafa;
    }
    .dropzone:hover { border-color: var(--color-gradient-start); background: var(--gradient-subtle); }
    .dropzone.has-file { border-color: #10b981; background: #ecfdf5; }
    .file-name { color: #047857; font-weight: 600; }
    .pdf-status { margin-top: 0.75rem; color: var(--text-secondary); font-size: 0.9rem; }
    .qr-actions { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
    .btn-mini {
      border: 1px solid var(--border);
      background: #fff;
      border-radius: 12px;
      padding: 0.45rem 0.75rem;
      font-weight: 650;
      cursor: pointer;
    }
    .video { width: 100%; border-radius: 12px; border: 1px solid var(--border); margin-top: 0.75rem; }
    .hint { color: var(--text-secondary); font-size: 0.85rem; }

    .btn-verify {
      width: 100%; padding: 0.85rem 1rem;
      background: var(--gradient-brand);
      color: var(--on-gradient);
      border: none; border-radius: 12px;
      font-size: 1rem; font-weight: 600;
      cursor: pointer; transition: box-shadow 0.2s, transform 0.2s;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    }
    .btn-verify:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(124, 58, 237, 0.35); }
    .btn-verify:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
    .loader { animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    .alert-error {
      margin-top: 1rem; padding: 0.75rem 1rem;
      background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 10px; color: #b91c1c; font-size: 0.9rem;
    }

    .result-card {
      background: var(--card-bg); border-radius: 16px;
      padding: 1.75rem; border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }
    .result-card.verified { border-color: rgba(16, 185, 129, 0.45); }
    .result-card.failed { border-color: #fecaca; }

    .result-banner {
      display: flex; align-items: center; gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .banner-icon { font-size: 2.25rem; flex-shrink: 0; }
    .result-banner h2 {
      font-family: var(--font-display);
      font-size: 1.3rem; font-weight: 700; margin: 0 0 0.2rem;
    }
    .result-banner p { color: var(--text-secondary); margin: 0; font-size: 0.9rem; }

    .hash-status {
      padding: 0.75rem 1rem; border-radius: 10px;
      font-size: 0.9rem; font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .hash-status.match { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .hash-status.mismatch { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    .cert-details h3 {
      font-size: 0.8rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-secondary); margin: 0 0 1rem;
      border-top: 1px solid var(--border); padding-top: 1.25rem;
    }
    .detail-grid { display: flex; flex-direction: column; gap: 0.7rem; }
    .detail-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline; }
    .detail-label {
      font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.04em; color: var(--text-secondary); min-width: 8rem;
    }
    .detail-value { font-size: 0.9rem; color: var(--text-primary); }
    .detail-value.name { font-weight: 700; font-size: 1rem; }
    .detail-value.mono { font-family: ui-monospace, monospace; font-size: 0.82rem; word-break: break-all; }
    .detail-value.accent { color: #5b21b6; font-weight: 700; }
    .detail-value.small { font-size: 0.72rem; }

    .btn-reset {
      margin-top: 1.5rem; padding: 0.65rem 1.5rem;
      border: 1px solid var(--border); border-radius: 12px;
      background: var(--surface); color: var(--text-primary);
      cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: background 0.15s;
    }
    .btn-reset:hover { background: #f3f4f6; }
  `],
})
export class VerifyCertComponent implements OnInit {
  sequenceNumber = '';
  qrToken = '';
  selectedFile: File | null = null;
  loading = false;
  error: string | null = null;
  result: VerifyResponse | null = null;
  pdfStatus: string | null = null;
  scanning = false;
  private reader: BrowserMultiFormatReader | null = null;

  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);

  constructor(private certService: CertificateService) {}

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap.get('qr');
    if (q) this.qrToken = q;
  }

  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile = input.files[0];
    await this.onPdfSelected();
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type === 'application/pdf') this.selectedFile = file;
    await this.onPdfSelected();
  }

  private async onPdfSelected() {
    this.pdfStatus = null;
    this.error = null;
    this.result = null;
    if (!this.selectedFile) return;
    this.pdfStatus = 'Detecting QR in PDF…';
    try {
      const qrText = await this.certService.extractQrFromPdf(this.selectedFile);
      if (!qrText) {
        this.pdfStatus = 'QR code not found in PDF.';
        return;
      }
      this.qrToken = this.certService.parseQrToken(qrText);
      this.pdfStatus = 'QR detected. Verifying…';
      await this.verify();
      this.pdfStatus = null;
    } catch (e: any) {
      this.pdfStatus = null;
      this.error = e?.message || this.i18n.t('verify.error');
    }
  }

  async toggleScan() {
    if (this.scanning) {
      this.stopScan();
      return;
    }
    this.scanning = true;
    this.error = null;
    this.result = null;
    if (!this.reader) this.reader = new BrowserMultiFormatReader();
    // Let Angular render the <video> element
    setTimeout(() => {
      const video = document.querySelector('video') as HTMLVideoElement | null;
      if (!video) return;
      this.reader!.decodeFromVideoDevice(null, video, (res: any, err: any) => {
        if (res?.getText()) {
          this.qrToken = this.certService.parseQrToken(res.getText());
          this.stopScan();
          this.verify();
        }
        if (err && !(err instanceof NotFoundException)) {
          // ignore intermittent decode errors
        }
      });
    }, 0);
  }

  stopScan() {
    this.scanning = false;
    try {
      this.reader?.reset();
    } catch {}
  }

  async verify() {
    this.loading = true;
    this.error = null;
    this.result = null;

    const qt = this.qrToken?.trim();
    if (qt) {
      try {
        if (this.selectedFile) {
          const fileHash = await this.certService.computeFileHash(this.selectedFile);
          this.certService.verifyWithHashByQr(qt, fileHash).subscribe({
            next: (res) => {
              this.result = res;
              this.loading = false;
            },
            error: (err) => {
              this.error = err.error?.error || this.i18n.t('verify.error');
              this.loading = false;
            },
          });
        } else {
          this.certService.verifyByQrToken(qt).subscribe({
            next: (res) => {
              this.result = res;
              this.loading = false;
            },
            error: (err) => {
              this.error = err.error?.error || this.i18n.t('verify.error');
              this.loading = false;
            },
          });
        }
      } catch (err: any) {
        this.error = err.message;
        this.loading = false;
      }
      return;
    }

    if (!this.sequenceNumber) {
      this.loading = false;
      return;
    }

    try {
      if (this.selectedFile) {
        const fileHash = await this.certService.computeFileHash(this.selectedFile);
        this.certService.verifyWithHash(this.sequenceNumber, fileHash).subscribe({
          next: (res) => {
            this.result = res;
            this.loading = false;
          },
          error: (err) => {
            this.error = err.error?.error || this.i18n.t('verify.error');
            this.loading = false;
          },
        });
      } else {
        this.certService.verifyCertificate(this.sequenceNumber).subscribe({
          next: (res) => {
            this.result = res;
            this.loading = false;
          },
          error: (err) => {
            this.error = err.error?.error || this.i18n.t('verify.error');
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
    return new Date(parseInt(secs, 10) * 1000).toLocaleString(this.i18n.dateLocale());
  }

  reset() {
    this.result = null;
    this.sequenceNumber = '';
    this.qrToken = '';
    this.selectedFile = null;
    this.error = null;
    this.pdfStatus = null;
  }
}
