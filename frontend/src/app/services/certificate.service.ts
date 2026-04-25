import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IssueResponse, VerifyResponse } from '../models/certificate.model';

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

  /**
   * Compute SHA-256 of a File using the Web Crypto API (browser-native, no library needed).
   */
  async computeFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
