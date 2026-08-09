import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, switchMap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { LoginDTO } from '../models/login-dto';
import { GlobalService } from './global.service';

interface LoginResponse {
  success: boolean;
  user?: {
    id: number;
    user_name: string;
    user_last_name: string;
    company_id: number;
    user_id:string;
  };
}
export interface LoginDto {
  userId: string;
  passWord: string;
}

@Injectable({
  providedIn: 'root'
})


export class UserService {
  private apiUrl = 'http://localhost:3000/api'; 
  private loggedIn = new BehaviorSubject<boolean>(false);
  private userData = new BehaviorSubject<any>(null);
  private tokenKey = 'authToken';
  constructor(private http: HttpClient, private router: Router,private globalService: GlobalService,) {}

  login(dto: LoginDto): Observable<any> {
    //console.log('Sending DTO to API:', dto);
    return this.http.post<{ token: string }>(`${this.apiUrl}/users/login`, dto )
      .pipe(
        tap((response: any) => {
          //console.log('Received response:', response.message);
          if (response.message === 'Login successful') {
            this.loggedIn.next(true);
            this.userData.next(response.user);
            // Store user info in sessionStorage if needed
            sessionStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem(this.tokenKey, response.token);
          }else{
            this.loggedIn.next(false);
            this.userData.next(null);
            sessionStorage.removeItem('user');
            localStorage.removeItem(this.tokenKey);
            //console.log('not logged in :',response.message);
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

  getBusinessEntityName(entityId: number): Observable<string> {
    const params = new HttpParams().set('entity_id', entityId.toString());
    return this.http.get<string>(`${this.apiUrl}/businessentity/name`,  { params, responseType: 'text' as 'json'});
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }
  getUserData(): Observable<any> {
    return this.userData.asObservable(); // Expose userData as an Observable
  }
  logout() {
    this.loggedIn.next(false);
    sessionStorage.removeItem('user');
    sessionStorage.clear();
    this.globalService.logout();
    this.userData.next(null); 
    this.router.navigate(['/userlogin']);
  }
}

