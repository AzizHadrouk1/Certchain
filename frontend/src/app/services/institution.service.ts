import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/institution`;

  uploadLogo(file: File): Observable<{ ok: boolean; filename: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ ok: boolean; filename: string }>(
      `${this.base}/assets/logo`,
      fd
    );
  }

  uploadSignature(file: File): Observable<{ ok: boolean; filename: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ ok: boolean; filename: string }>(
      `${this.base}/assets/signature`,
      fd
    );
  }
}
