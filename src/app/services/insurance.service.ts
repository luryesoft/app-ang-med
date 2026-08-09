import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InsuranceService {

  private apiUrl = 'http://localhost:3000/api/insurance'; // Adjust the base URL as needed

  constructor(private http: HttpClient) { }

  // Example method to get insurance details
  getInsuranceDetails(insuranceId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/details/${insuranceId}`).pipe(
      catchError(error => {
        console.error('Error fetching insurance details:', error);
        return throwError(() => new Error('Failed to fetch insurance details.'));
      })
    );
  }

  // Example method to search insurances
  searchInsurances(searchQuery: string): Observable<any> {
    if (!searchQuery) {
      console.error('Search query is undefined or empty');
      return throwError(() => new Error('Search query cannot be empty.'));
    }
    console.log('Service Search query:', searchQuery);
    return this.http.get<any>(`${this.apiUrl}/search-insurance?argsearch=${searchQuery}`).pipe(
      catchError(error => {
        console.error('Error searching insurances:', error);
        return throwError(() => new Error('Failed to search insurances.'));
      })
    );
  }

  // Example method to add a new insurance
  addInsurance(insuranceData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/insert-insurance`, insuranceData).pipe(
      catchError(error => {
        console.error('Error adding insurance:', error);
        return throwError(() => new Error('Failed to add insurance.'));
      })
    );
  }

  // Example method to update an insurance
  updateInsurance(updateData: any): Observable<{ returncd: number; returntx: string }> {
    console.log('Update Data:', updateData);
    return this.http.put<{ returncd: number; returntx: string }>(`${this.apiUrl}/update-insurance`, updateData);
  }

  // Example method to delete an insurance
  deleteInsurance(insuranceId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete-insurance/${insuranceId}`).pipe(
      catchError(error => {
        console.error('Error deleting insurance:', error);
        return throwError(() => new Error('Failed to delete insurance.'));
      })
    );
  }
}