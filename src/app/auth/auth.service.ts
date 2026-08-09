import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth-config';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private tokenKey = 'authToken';
  constructor(private http: HttpClient) {}

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  login() {
    return localStorage.getItem(this.tokenKey);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get isLoggedIn(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    return !!token; 
    //return this.oauthService.hasValidAccessToken();
  }
}