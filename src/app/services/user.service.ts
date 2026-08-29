import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getBusinessEntityName(entityId: number): Observable<string> {
    const params = new HttpParams().set('entity_id', entityId.toString());
    return this.http.get<string>(`${this.apiUrl}/businessentity/name`, { params, responseType: 'text' as 'json' });
  }
}
