import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { GlobalService } from './global.service';
import { catchError, throwError } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class LawFirmService {

    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient, private globalService: GlobalService) { }


    async getLawFirmsByOfficeId(office_id: number): Promise<any[]> {

        return this.http.get<any>(`${this.apiUrl}/law-firms/by-office-id/${office_id}`).toPromise();
      }

      async getLawOffices(): Promise<any[]> {
        const office_id = 0;
        return this.http.get<any>(`${this.apiUrl}/law-firms/by-office-id/${office_id}`).toPromise();
      }

      updateLawFirm(updateData: any): Observable<{ returncd: number; returntx: string }> {
        return this.http.put<{ returncd: number; returntx: string }>(`${this.apiUrl}/law-firms/update-law-firm`, updateData);
      }

      insertLawFirm(lawFirmData: any): Observable<{ returncd: number; returntx: string }> {
        return this.http.post<{ returncd: number; returntx: string }>(`${this.apiUrl}/law-firms/insert-law-firm`, lawFirmData);
      }

      deleteLawFirm(lw_id: number): Observable<{ returncd: number; returntx: string }> {
        return this.http.delete<{ returncd: number; returntx: string }>(`${this.apiUrl}/law-firms/delete-law-firm/${lw_id}`);
      }     

}