import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PatientSearchService } from '../../services/patients.service';

export interface PatientSearchDialogData {
  facilities: any[];
  insurances: any[];
  providers: any[];
  lastName?: string;
}

@Component({
  selector: 'app-patient-search-dialog',
  templateUrl: './patient-search-dialog.component.html',
  styleUrls: ['./patient-search-dialog.component.scss']
})
export class PatientSearchDialogComponent implements OnInit {
  lastNm = '';
  firstNm = '';
  ptnId: number | null = null;
  ssnLast4 = '';
  facilityId: number | null = null;
  icId: number | null = null;
  providerId: number | null = null;
  activeFlag = 'Y';
  claimNo = '';
  policyNo = '';
  results: any[] = [];
  searched = false;
  searching = false;
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<PatientSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PatientSearchDialogData,
    private patientSearchService: PatientSearchService
  ) {}

  ngOnInit(): void {
    const seed = String(this.data?.lastName ?? '').trim();
    if (seed && !/^\d+$/.test(seed) && seed.toUpperCase() !== 'ALL') {
      this.lastNm = seed.toUpperCase();
    }
  }

  get officeProviders(): any[] {
    if (!this.facilityId) {
      return this.data.providers || [];
    }
    return (this.data.providers || []).filter(
      (row) => Number(row.facility_id) === Number(this.facilityId)
    );
  }

  compareIds(a: any, b: any): boolean {
    if (a == null && b == null) {
      return true;
    }
    return Number(a) === Number(b);
  }

  onOfficeChange(): void {
    if (
      this.providerId &&
      !this.officeProviders.some((row) => Number(row.provider_id) === Number(this.providerId))
    ) {
      this.providerId = null;
    }
  }

  hasAnyFilter(): boolean {
    return !!(
      this.lastNm.trim() ||
      this.firstNm.trim() ||
      this.ptnId ||
      this.ssnLast4.replace(/\D/g, '').length === 4 ||
      this.facilityId ||
      this.icId ||
      this.providerId ||
      this.activeFlag === 'Y' ||
      this.activeFlag === 'N' ||
      this.claimNo.trim() ||
      this.policyNo.trim()
    );
  }

  search(): void {
    if (!this.hasAnyFilter()) {
      this.showError('Choose at least one search option');
      return;
    }
    this.searching = true;
    this.errorMessage = '';
    this.patientSearchService
      .searchPatientsAdvanced({
        last_nm: this.lastNm.trim(),
        first_nm: this.firstNm.trim(),
        ptn_id: this.ptnId,
        ssn_last4: this.ssnLast4,
        facility_id: this.facilityId,
        ic_id: this.icId,
        provider_id: this.providerId,
        active_flag: this.activeFlag,
        claim_no: this.claimNo.trim(),
        policy_no: this.policyNo.trim()
      })
      .subscribe({
        next: (rows) => {
          this.results = rows || [];
          this.searched = true;
          this.searching = false;
          if (!this.results.length) {
            this.showError('No patients match these options');
          }
        },
        error: (error) => {
          console.error('Advanced patient search failed:', error);
          this.searching = false;
          this.searched = true;
          this.results = [];
          this.showError('Could not search patients');
        }
      });
  }

  clearFilters(): void {
    this.lastNm = '';
    this.firstNm = '';
    this.ptnId = null;
    this.ssnLast4 = '';
    this.facilityId = null;
    this.icId = null;
    this.providerId = null;
    this.activeFlag = 'Y';
    this.claimNo = '';
    this.policyNo = '';
    this.results = [];
    this.searched = false;
    this.errorMessage = '';
  }

  selectPatient(row: any): void {
    if (!row?.ptn_id) {
      return;
    }
    this.dialogRef.close(row);
  }

  formatDob(value: unknown): string {
    const raw = String(value ?? '').trim();
    if (!raw) {
      return '';
    }
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      return `${iso[2]}/${iso[3]}/${iso[1]}`;
    }
    return raw.length >= 10 ? raw.slice(0, 10) : raw;
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = '';
      }
    }, 3000);
  }
}
