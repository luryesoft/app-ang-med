import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoginDTO } from '../models/login-dto';
import { GlobalService } from '../services/global.service';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'authToken';
const SESSION_KEY = 'authSession';
const USER_KEY = 'user';
const LOGIN_PATH = '/users/login';
const LOGOUT_PATH = '/users/logout';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private globalService: GlobalService
  ) {}

  login(dto: LoginDTO): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}${LOGIN_PATH}`, dto).pipe(
      tap((response) => {
        const succeeded = response?.message === 'Login successful' || response?.success === true;
        this.clearStoredToken();

        if (succeeded && response?.user) {
          sessionStorage.setItem(SESSION_KEY, '1');
          sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
          return;
        }

        this.clearSessionFlag();
      }),
      catchError((error) => {
        this.clearSessionFlag();
        this.clearStoredToken();
        if (error.status === 401) {
          return throwError(() => new Error('Invalid email or password'));
        }
        return throwError(() => new Error('An unexpected error occurred'));
      })
    );
  }

  get isLoggedIn(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  isLoginRequest(url: string): boolean {
    return url.includes(LOGIN_PATH) || url.includes(LOGOUT_PATH) || url.includes('/userlogin');
  }

  /** Drop leftover JavaScript tokens. The real session is the HttpOnly cookie. */
  enforceBrowserSession(): void {
    this.clearStoredToken();
    if (!this.isLoggedIn) {
      sessionStorage.removeItem(USER_KEY);
      this.globalService.logout();
    }
  }

  getStoredUser(): Record<string, unknown> | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }

  patchStoredUser(partial: object): Record<string, unknown> {
    const next = { ...(this.getStoredUser() || {}), ...partial };
    sessionStorage.setItem(USER_KEY, JSON.stringify(next));
    return next;
  }

  private loggingOut = false;

  logout(): void {
    if (this.loggingOut) {
      return;
    }
    this.loggingOut = true;
    this.http.post(`${this.apiUrl}${LOGOUT_PATH}`, {}).subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout()
    });
  }

  private finishLogout(): void {
    this.clearSessionFlag();
    this.clearStoredToken();
    sessionStorage.removeItem(USER_KEY);
    this.globalService.logout();
    document.body.classList.remove('app-dark');
    this.loggingOut = false;
    this.router.navigate(['/userlogin']);
  }

  private clearSessionFlag(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }

  private clearStoredToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}
