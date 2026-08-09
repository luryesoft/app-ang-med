import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private loggedIn = new BehaviorSubject<boolean>(false);
  private userData = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/userlogin`, { email, password })
      .pipe(
        tap((response: any) => {
          if (response.success) {
            this.loggedIn.next(true);
            this.userData.next(response.user);
            // Store user info in localStorage if needed
            localStorage.setItem('user', JSON.stringify(response.user));
          }
        }),
        catchError(error => {
          if (error.status === 401) {
            return throwError(() => new Error('Invalid email or password'));
          }
          return throwError(() => new Error('An unexpected error occurred'));
        })        
      );
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }
  getUserData(): Observable<any> {
    return this.userData.asObservable(); // Expose userData as an Observable
  }
  logout() {
    this.loggedIn.next(false);
    localStorage.removeItem('user');
    this.userData.next(null); 
    this.router.navigate(['/userlogin']);
  }
}