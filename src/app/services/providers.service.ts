import { Injectable, Provider } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { AddProvider } from '../providers/providers.component'; 

@Injectable({
  providedIn: 'root'
})
export class ProviderService {

  private apiUrl = 'http://localhost:3000/api'; // Adjust the base URL as needed

  constructor(private http: HttpClient) { }

  // Example method to get providers for a specific facility
  getProvidersByFacility(facilityId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/healthcare-providers/byfacility/?facility_id=${facilityId}`).pipe(
      catchError(error => {
        console.error('Error fetching providers:', error);
        return throwError(() => new Error('Failed to fetch providers.'));
      })
    );
  }
  searchProviders(searchString: string): Observable<any> {
    const entity_id =  Number(sessionStorage.getItem('companyId')); 
    return this.http.get<any>(`${this.apiUrl}/healthcare-providers/search-providers?entity_id=${entity_id}&search_string=${searchString}`).pipe(
      catchError(error => {
        console.error('Error searching providers:', error);
        return throwError(() => new Error('Failed to search providers.'));
      })
    );
  }
  addProvider(provider: AddProvider): Observable<any> {
    return this.http.post(`${this.apiUrl}/healthcare-providers/add-provider`, provider);
  }
  
  getProviderTypes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/healthcare-providers/provider-types`).pipe(
      catchError(error => {
        console.error('Error fetching provider types:', error);
        return throwError(() => new Error('Failed to fetch provider types.'));
      })
    );
  }
  getSpecialties(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/healthcare-providers/provider-specialty`).pipe(
      catchError(error => {
        console.error('Error fetching specialties:', error);
        return throwError(() => new Error('Failed to fetch specialties.'));
      })
    );
  }
  getFacilitiesByProvider(providerId: number): Observable<any> {
    console.log('Provider ID:', providerId);
    return this.http.get<any>(`${this.apiUrl}/healthcare-providers/facility-by-provider?provider_id=${providerId}`).pipe(
      tap(response => {
        console.log('Service Response:', response); // Log the response from the API
      }),
      catchError(error => {
        if (error.status === 404) {
          console.warn(`Facilities not found for provider ID: ${providerId}`);
          return of([]); // Return an empty array if 404 error occurs
      } else {
        console.error('Error fetching facilities:', error);
        throw error; // Re-throw the error for other status codes
      }
      })
    );
  }

  deleteFacility(provider_id: number, facility_id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/healthcare-providers/delete-provider-facility?provider_id=${provider_id}&facility_id=${facility_id}`).pipe(
      catchError(error => {
        console.error('Error deleting facility:', error);
        return throwError(() => new Error('Failed to delete facility.'));
      })
    );
  }

  deleteProvider(provider_id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/healthcare-providers/delete-provider?provider_id=${provider_id}`).pipe(
      catchError(error => {
        console.error('Error deleting Provider:', error);
        return throwError(() => new Error('Failed to delete Provider.'));
      })
    );
  }


  updateProvider(providerId: number, providerData: Provider): Observable<any> {
    console.log('Updating provider:', providerData);
    return this.http.put(`${this.apiUrl}/healthcare-providers/update-provider/${providerId}`, providerData);
  }

  getProviderById(providerId: number): Observable<any> {
    console.log('Fetching provider by ID:', providerId);
    return this.http.get<any>(`${this.apiUrl}/healthcare-providers/provider-detail?provider_id=${providerId}}`).pipe(
      catchError(error => {
        console.error('Error fetching provider:', error);
        return throwError(() => new Error('Failed to fetch provider.'));
      })
    );
  }
  getAvailableFacilities(entityId: number, providerId: number): Observable<{ id: number, name: string }[]> {
    const url = `${this.apiUrl}/healthcare-providers/available-facility?entity_id=${entityId}&provider_id=${providerId}`;
    return this.http.get<{ id: number, name: string }[]>(url);
  }

  insertProvidersFacility(providerId: number, facility: number[]): Observable<{ returncd: number; returntx: string }> {
    return this.http.post<{ returncd: number; returntx: string }>(
      `${this.apiUrl}/healthcare-providers/insert-providers-facility/`,
      { providerId, facility }
    );
  }
}

