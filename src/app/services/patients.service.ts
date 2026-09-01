import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiagnosisCode, PatientService } from '../models/patient-service.model';
import { parseMoney } from '../pipes/numeric-only.directive';

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

  searchPatientsAdvanced(filters: {
    last_nm?: string;
    first_nm?: string;
    ptn_id?: number | null;
    ssn_last4?: string;
    facility_id?: number | null;
    ic_id?: number | null;
    provider_id?: number | null;
    active_flag?: string;
    claim_no?: string;
    policy_no?: string;
  }): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/search_advanced`, filters);
  }

  getPatientSsn(ptnId: number): Observable<{ ptn_ssn: string }> {
    return this.http.get<{ ptn_ssn: string }>(`${this.apiUrl}/ssn/${ptnId}`);
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

  getLookups(): Observable<{
    lawyers: any[];
    insurances: any[];
    cptCodes: any[];
    icdCodes: any[];
    facilities: any[];
    providers: any[];
  }> {
    return this.http.get<{
      lawyers: any[];
      insurances: any[];
      cptCodes: any[];
      icdCodes: any[];
      facilities: any[];
      providers: any[];
    }>(`${this.apiUrl}/lookups`);
  }

  getProvidersForFacility(facilityId: number): Observable<any[]> {
    const params = new HttpParams().set('facilityId', String(facilityId));
    return this.http.get<any[]>(`${this.apiUrl}/providers`, { params });
  }

  generateNf3(payload: {
    ptn_id: number;
    service: any;
    ptn_date_of_accident?: string;
    ptn_policy_no?: string;
    ptn_claim_no?: string;
    ptn_policyholder?: string;
  }): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/nf3`, payload, { responseType: 'blob' });
  }

  getPatientBilling(ptnId: number): Observable<{ diagnoses: DiagnosisCode[]; services: PatientService[] }> {
    return this.http.get<{ diagnoses: DiagnosisCode[]; services: PatientService[] }>(
      `${this.apiUrl}/billing/${ptnId}`
    );
  }

  savePatientIcd(
    ptnId: number,
    diagnoses: DiagnosisCode[]
  ): Observable<{ diagnoses: DiagnosisCode[] }> {
    return this.http.put<{ diagnoses: DiagnosisCode[] }>(`${this.apiUrl}/icd`, {
      ptn_id: ptnId,
      diagnoses
    });
  }

  savePatientServices(
    ptnId: number,
    services: PatientService[]
  ): Observable<{ services: PatientService[] }> {
    return this.http.put<{ services: PatientService[] }>(`${this.apiUrl}/services`, {
      ptn_id: ptnId,
      services: services.map((svc) => ({
        svc_id: svc.svc_id,
        svc_date: svc.svc_date,
        facility_id: svc.facility_id,
        provider_id: svc.provider_id,
        status: svc.status,
        notes: svc.notes,
        lines: (svc.lines || []).map((line) => ({
          ...line,
          amount: parseMoney(line.amount) || 0,
          units: Number(line.units) || 1
        }))
      }))
    });
  }
}