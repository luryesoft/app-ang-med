import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

   @Injectable({
     providedIn: 'root'
   })
   export class SharedDataService {
    private readonly apiUrl = environment.apiUrl; 
     private businessEntityNameSource = new BehaviorSubject<string | null>(null);
     businessEntityName$ = this.businessEntityNameSource.asObservable();

     constructor(private http: HttpClient) {}
     setBusinessEntityName(name: string | null) {
       this.businessEntityNameSource.next(name);
     }

     getSecMenuProfile(arguser: string): Observable<any> {
      const url = `${this.apiUrl}/shared-data/sec-menu-profile/?arguser=${arguser}`;
      return this.http.get<any>(url).pipe(
        catchError(error => {
          console.error('Error fetching sec menu profile:', error);
          return throwError(error);
        })
      );
    } 
   }