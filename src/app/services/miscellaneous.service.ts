import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { GlobalService } from './global.service';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class MiscellaneousService {

    private readonly apiUrl = `${environment.apiUrl}/miscellaneous`;

    constructor(private http: HttpClient, private globalService: GlobalService) { }

    getBusinessEntityCptCodes(entityId: number, searchType: string, search: string): Observable<any[]> {
        const params = new HttpParams()
          .set('entityId', entityId.toString())
          .set('searchType', searchType)
          .set('search', search);
    
        return this.http.get<any[]>(this.apiUrl + '/cpt-codes', { params });
      }

    getBusinessEntityIcdCodes(entityId: number, searchType: string, search: string): Observable<any[]> {
        const params = new HttpParams()
          .set('entityId', entityId.toString())
          .set('searchType', searchType)
          .set('search', search);
        return this.http.get<any[]>(this.apiUrl + '/icd-codes', { params });
      }

    getSearchCptCodes(type: string, search: string): Observable<any[]> {
        const params = new HttpParams()
            .set('type', type)
            .set('search', search);
        return this.http.get<any[]>(`${this.apiUrl}/search-cpt-codes`, { params })
            .pipe(
                catchError(error => {
                    console.error('Error fetching CPT codes:', error);
                    return throwError(error);
                })
            );
    }


    insertCptCode(cptCode: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/insert-cpt-code', cptCode)
        .pipe(
            catchError(error => {
                console.error('Error inserting CPT code:', error);
                return throwError(error);
            })
        );
    }     

    updateCptCode(cptCode: any): Observable<any> {
        return this.http.put<any>(this.apiUrl + '/update-cpt-code', cptCode)
            .pipe(
                catchError(error => {
                    console.error('Error updating CPT code:', error);
                    return throwError(error);
                })
            );
    }

    deleteCptCode(entityId: number, cptId:number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/delete-cpt-code/${entityId}/${cptId}`)
            .pipe(
                catchError(error => {
                    console.error('Error deleting CPT code:', error);
                    return throwError(error);
                })
            );
    }

    copyCptCodes(usrid: string, entityId: number, cptCodeIds: string[]): Observable<{ returncd: number; returntx: string }> {
        return this.http.post<{ returncd: number; returntx: string }>(this.apiUrl + '/copy-cpt-codes', {
          entityId,
          cptCodeIds,
        });
      } 

     getSearchIcdCodes(type: string, search: string): Observable<any[]> {
        const params = new HttpParams()
            .set('type', type)
            .set('search', search);
        return this.http.get<any[]>(`${this.apiUrl}/search-icd-codes`, { params })
            .pipe(
                catchError(error => {
                    console.error('Error fetching ICD codes:', error);
                    return throwError(error);
                })
            );
    }       

    copyIcdCodes(userid: string, entityId: number, icdCodeIds: string[]): Observable<{ returncd: number; returntx: string }> {
        return this.http.post<{ returncd: number; returntx: string }>(this.apiUrl + '/copy-icd-codes', {
          userid,
          entityId,
          icdCodeIds,
        });
        console.log('Copy ICD Codes:', userid, entityId);
      } 

      deleteIcdCode(entityId: number, icdcode:string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/delete-icd-code/${entityId}/${icdcode}`)
            .pipe(
                catchError(error => {
                    console.error('Error deleting ICD code:', error);
                    return throwError(error);
                })
            );
    } 
    
    updateIcdCodes(updatedRows: { icdcode: string, short_text: string, status: string }[], entityId: number, userId: string): Observable<any> {
        const payload = {
            entityId: entityId,
            userId: userId,
            updatedRows: updatedRows
        };
    console.log('Payload:', payload);
        return this.http.post<any>(`${this.apiUrl}/update-icd-code`, payload)
            .pipe(
                catchError(error => {
                    console.error('Error updating ICD codes:', error);
                    return throwError(error);
                })
            );
    }

}