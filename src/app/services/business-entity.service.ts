import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessEntityService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBusinessEntity(id: number): Observable<any> {
    const url = `${this.apiUrl}/businessentity/id/?entity_id=${id}`;
    return this.http.get<any>(url, { observe: 'body' })
      .pipe(
        tap((response: any) => {
          console.log('Business entity data:', response);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error retrieving business entity:', error);
          console.error('Error details:', {
            url: `${this.apiUrl}/businessentity/${id}`,
            status: error.status,
            message: error.message
          });
          return throwError(() => new Error('Error retrieving business entity'));
        })
      );
  }

  updateBusinessEntity(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/businessentity/${id}`, data);
  }

  getUsersByEntity(entityId: number): Observable<any[]> {
    const url = `${this.apiUrl}/users/by-entity/${entityId}`;
    return this.http.get<any[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error fetching users:', error);
    return throwError(() => new Error('Error fetching users'));
  }

  getSecurityProfiles(): Observable<any[]> {
    const url = `${this.apiUrl}/users/sec-profiles`;
    return this.http.get<any[]>(url).pipe(
      catchError(this.handleError)
    );
  } 

  updateUser(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/update-user`, data).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating user:', error);
        return throwError(() => new Error('Error updating user'));
      })
    );
  }

  insertUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/insert-user`, data).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error inserting user:', error);
        return throwError(() => new Error('Error inserting user'));
      })
    );
  }

  deleteUser(username: string): Observable<any> {
    const url = `${this.apiUrl}/users/delete-user/${username}`;
    return this.http.delete<any>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting user:', error);
        return throwError(() => new Error('Error deleting user'));
      })
    );
  }
}