import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../models/user.model';

const LS_KEY = 'certchain_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = environment.apiUrl;

  readonly user = signal<UserProfile | null>(null);

  constructor() {
    if (this.getToken()) {
      this.loadMe().subscribe({ error: () => this.clearSession() });
    }
  }

  getToken(): string | null {
    return localStorage.getItem(LS_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private clearSession() {
    localStorage.removeItem(LS_KEY);
    this.user.set(null);
  }

  loadMe(): Observable<void> {
    if (!this.getToken()) {
      this.user.set(null);
      return of(void 0);
    }
    return this.http.get<{ user: UserProfile }>(`${this.base}/api/auth/me`).pipe(
      map((r) => r.user),
      tap((u) => this.user.set(u)),
      map(() => void 0)
    );
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<{ token: string; user: UserProfile }>(`${this.base}/api/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((r) => {
          localStorage.setItem(LS_KEY, r.token);
          this.user.set(r.user);
        }),
        map(() => void 0)
      );
  }

  register(body: {
    email: string;
    password: string;
    institutionName: string;
    description?: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/api/auth/register`,
      body
    );
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/']);
  }
}
