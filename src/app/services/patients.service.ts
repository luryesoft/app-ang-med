import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientSearchService {
  private apiUrl = 'http://localhost:3000/api/patients'; // Replace with your actual backend URL

  constructor(private http: HttpClient) {}

  getSearchPatients(entity: number, searchType: string, search: string): Observable<any[]> {
    const params = new HttpParams()
      .set('entity', entity.toString())
      .set('searchType', searchType)
      .set('search', search);

    return this.http.get<any[]>(`${this.apiUrl}/search_ptn`, { params });
  }

  updatePatient(patientData: any): Observable<{ returncd: number; returntx: string }> {
    const url = `${this.apiUrl}/update_ptn`;
    return this.http.put<{ returncd: number; returntx: string }>(url, patientData);
  }

  deletePatient(entity: number, ptnId: number): Observable<{ returncd: number; returntx: string }> {
    const url = `${this.apiUrl}/delete_ptn/${entity}/${ptnId}`;
    return this.http.delete<{ returncd: number; returntx: string }>(url);
  }

  insertPatient(argmessage: any): Observable<{ returncd: number; returntx: string }> {
    return this.http.post<{ returncd: number; returntx: string }>(`${this.apiUrl}/insert_ptn`, argmessage);
  }

  getLookups(): Observable<{ lawyers: any[]; insurances: any[] }> {
    return this.http.get<{ lawyers: any[]; insurances: any[] }>(`${this.apiUrl}/lookups`);
  }
}