import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

interface PendingRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  email: string;
}

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="page">
      <h1>{{ 'admin.title' | t }}</h1>
      <p class="sub">{{ 'admin.sub' | t }}</p>
      <div *ngIf="loading" class="muted">{{ 'admin.loading' | t }}</div>
      <div *ngIf="error" class="err">{{ error }}</div>
      <ul class="list" *ngIf="!loading && !error">
        <li *ngFor="let row of items" class="row">
          <div>
            <div class="name">{{ row.name }}</div>
            <div class="email">{{ row.email }}</div>
            <div *ngIf="row.description" class="desc">{{ row.description }}</div>
          </div>
          <div class="actions">
            <button type="button" class="ok" (click)="approve(row.id)">{{ 'admin.approve' | t }}</button>
            <button type="button" class="no" (click)="reject(row.id)">{{ 'admin.reject' | t }}</button>
          </div>
        </li>
        <li *ngIf="!items.length" class="empty">{{ 'admin.empty' | t }}</li>
      </ul>
    </div>
  `,
  styles: [`
    .page { max-width: 40rem; margin: 0 auto; padding: 2rem 1rem 3rem; }
    h1 { font-size: 1.4rem; font-weight: 700; margin: 0 0 0.5rem; }
    .sub { color: var(--text-secondary); margin: 0 0 1.5rem; }
    .list { list-style: none; padding: 0; margin: 0; }
    .row {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; padding: 1rem; border: 1px solid var(--border);
      border-radius: 12px; margin-bottom: 0.75rem; background: #fff;
    }
    .name { font-weight: 600; }
    .email { font-size: 0.85rem; color: var(--text-secondary); }
    .desc { font-size: 0.88rem; margin-top: 0.35rem; }
    .actions { display: flex; flex-direction: column; gap: 0.35rem; }
    .ok, .no {
      border: none; border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.85rem;
      font-weight: 600; cursor: pointer;
    }
    .ok { background: var(--gradient-brand); color: #fff; }
    .no { background: #fef2f2; color: #b91c1c; }
    .empty, .muted { color: var(--text-secondary); }
    .err { color: #b91c1c; }
  `],
})
export class AdminApprovalsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  items: PendingRow[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.http
      .get<{ institutions: PendingRow[] }>(`${this.base}/api/admin/institutions/pending`)
      .subscribe({
        next: (r) => {
          this.items = r.institutions;
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.error = e.error?.error || 'Failed to load';
        },
      });
  }

  approve(id: string) {
    this.http.post(`${this.base}/api/admin/institutions/${id}/approve`, {}).subscribe({
      next: () => this.load(),
      error: (e) => (this.error = e.error?.error || 'Failed'),
    });
  }

  reject(id: string) {
    this.http.post(`${this.base}/api/admin/institutions/${id}/reject`, {}).subscribe({
      next: () => this.load(),
      error: (e) => (this.error = e.error?.error || 'Failed'),
    });
  }
}
