import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IssueResponse, VerifyResponse } from '../models/certificate.model';
import jsQR from 'jsqr';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for Angular/Vite builds
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private readonly api = `${environment.apiUrl}/api/certificate`;

  constructor(private http: HttpClient) {}

  issueCertificate(formData: FormData): Observable<IssueResponse> {
    return this.http.post<IssueResponse>(`${this.api}/issue`, formData);
  }

  verifyCertificate(sequenceNumber: string): Observable<VerifyResponse> {
    return this.http.get<VerifyResponse>(`${this.api}/verify/${sequenceNumber}`);
  }

  verifyWithHash(
    sequenceNumber: string,
    fileHash: string
  ): Observable<VerifyResponse> {
    return this.http.post<VerifyResponse>(`${this.api}/verify-hash`, {
      sequenceNumber,
      fileHash,
    });
  }

  verifyByQrToken(token: string): Observable<VerifyResponse> {
    return this.http.get<VerifyResponse>(`${this.api}/verify-qr/${encodeURIComponent(token)}`);
  }

  verifyWithHashByQr(
    qrToken: string,
    fileHash: string
  ): Observable<VerifyResponse> {
    return this.http.post<VerifyResponse>(`${this.api}/verify-hash-qr`, {
      qrToken,
      fileHash,
    });
  }

  /**
   * Compute SHA-256 of a File using the Web Crypto API (browser-native, no library needed).
   */
  async computeFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Extracts a QR code payload from a PDF by rendering pages to a canvas and decoding.
   * Returns the raw QR text (often a URL like /verify?qr=TOKEN) or null if not found.
   */
  async extractQrFromPdf(file: File): Promise<string | null> {
    const data = await file.arrayBuffer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadingTask = (pdfjsLib as any).getDocument({ data });
    const pdf = await loadingTask.promise;

    const maxPages = Math.min(pdf.numPages || 1, 3);
    for (let i = 1; i <= maxPages; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height);
      if (code?.data) return code.data;
    }
    return null;
  }

  /** Extract token from QR string. Accepts full URL or plain token. */
  parseQrToken(qrText: string): string {
    const t = (qrText || '').trim();
    if (!t) return '';
    try {
      const u = new URL(t, window.location.origin);
      const q = u.searchParams.get('qr');
      if (q) return q;
    } catch {
      // not a URL
    }
    // if text looks like token
    return t;
  }
}
