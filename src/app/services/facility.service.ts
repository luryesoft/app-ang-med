import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { GlobalService } from './global.service';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class FacilityService {

 private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private globalService: GlobalService) { }

  getFacilities(): Observable<any> {
    const companyId = this.globalService.getCompanyId();
    if (!companyId || isNaN(Number(companyId))) {
      console.error('Invalid company ID:', companyId);
      throw new Error('Company ID is not valid or not available in session storage');
    }
    return this.http.get<any>(`${this.apiUrl}/healthcare-facilities/entityfacility?entity_id=${companyId}`);
  }

  getFacilityTypes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/healthcare-facilities/facility-types`).pipe(
      catchError(error => {
        console.error('Error fetching facility types:', error);
        // Optionally, you can return a default value or rethrow the error
        return throwError(() => new Error('Failed to fetch facility types.'));
      })
    );
  }

  updateFacility(facilityData: any): Observable<any> {
    console.log('Facility Data:', facilityData);
    return this.http.put<any>(`${this.apiUrl}/healthcare-facilities/${facilityData.facility_id}`, facilityData);
  }

  addFacility(facilityData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/healthcare-facilities`, facilityData);
  }

  deleteFacility(facilityId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/healthcare-facilities/${facilityId}`);
  }

  hasProviders(facilityId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/healthcare-facilities/facility-providers?facilityId=${facilityId}`).pipe(
      map((response: string) => {
        console.log('Response:', response);
        return  response; // If response is 'OK', there are no providers
      }),
      catchError(error => {
        console.error('Error checking if facility has providers:', error);
        return throwError(() => new Error('Failed to check if facility has providers.'));
      })
    );
  }

}