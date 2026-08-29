import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoginDTO } from '../models/login-dto';
import { GlobalService } from '../services/global.service';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';
const LOGIN_PATH = '/users/login';
const CLOCK_SKEW_MS = 30_000;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    private globalService: GlobalService
  ) {}

  login(dto: LoginDTO): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}${LOGIN_PATH}`, dto).pipe(
      tap((response) => {
        const token = this.readToken(response);
        const succeeded = response?.message === 'Login successful' || response?.success === true;

        if (succeeded && token && this.isUsableToken(token)) {
          this.setToken(token);
          if (response.user) {
            sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
          }
          return;
        }

        this.clearToken();
      }),
      catchError((error) => {
        this.clearToken();
        if (error.status === 401) {
          return throwError(() => new Error('Invalid email or password'));
        }
        return throwError(() => new Error('An unexpected error occurred'));
      })
    );
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!this.isUsableToken(token)) {
      if (token) {
        this.clearToken();
      }
      return null;
    }
    return token;
  }

  get isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isLoginRequest(url: string): boolean {
    return url.includes(LOGIN_PATH) || url.includes('/userlogin');
  }

  logout(): void {
    this.clearToken();
    sessionStorage.removeItem(USER_KEY);
    this.globalService.logout();
    this.router.navigate(['/userlogin']);
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  private readToken(response: any): string | null {
    const token = response?.accessToken ?? response?.token;
    return typeof token === 'string' && token.length > 0 ? token : null;
  }

  private isUsableToken(token: string | null): boolean {
    if (!token) {
      return false;
    }

    const payload = this.decodePayload(token);
    if (!payload) {
      return false;
    }

    if (typeof payload.exp === 'number') {
      return payload.exp * 1000 > Date.now() - CLOCK_SKEW_MS;
    }

    return true;
  }

  private decodePayload(token: string): { exp?: number } | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
}
