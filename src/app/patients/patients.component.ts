import { Component, OnInit, ViewChild } from '@angular/core';
import { PatientSearchService } from '../services/patients.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { GlobalService } from '../services/global.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { PdfComponent } from '../pdfgen/pdfgen.component';
import { Patient } from '../models/patient.model';
import { Observable, map, startWith } from 'rxjs';



@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss']
})
export class PatientsComponent implements OnInit{
  @ViewChild('panel1') panel1!: MatExpansionPanel;
  searchQuery: string = '';
  filteredOptions: any[] = [];
  entityId: number = 0;
  userId: string = '';
  searchType: string = 'L';
  selectedOption: any = null;
  patientForm: FormGroup;
  errorMessage: string = ''; // Declare the errorMessage property
  showPopup: boolean = false; 
  successMessage: string = '';
  showSuccessPopup: boolean = false;
  isUpdateMode: boolean = false;
  lawFirms: any[] = [];
  insurances: any[] = [];
  insuranceSearchCtrl = new FormControl<any>('');
  filteredInsurances$!: Observable<any[]>;

  constructor(
    private patientSearchService: PatientSearchService, 
    private fb: FormBuilder,
    private dialog: MatDialog,
    private globalService: GlobalService,
    //private pdfService: PdfService
    ) {
    this.patientForm = this.fb.group({
      entity_id: [''],
      ptn_id: [''],
      ptn_last_nm: ['', [Validators.required, Validators.maxLength(30)]],
      ptn_first_nm: ['', [Validators.required, Validators.maxLength(30)]],
      ptn_mid_init: ['', [Validators.maxLength(3)]],
      ptn_date_of_birth: [''],
      ptn_active_flag: ['Y', [Validators.required, Validators.maxLength(1)]],
      ptn_address: ['', [Validators.maxLength(50)]],
      ptn_city: ['', [Validators.maxLength(35)]],
      ptn_state: ['', [Validators.maxLength(2)]],
      ptn_zip: ['', [Validators.maxLength(9)]],
      ptn_home_phone: ['', [Validators.maxLength(15)]],
      ptn_mobile_phone: ['', [Validators.maxLength(15)]],
      ptn_sex: ['', [Validators.maxLength(1)]],
      ptn_ssn: ['', [Validators.maxLength(11)]],
      ptn_occupation: ['', [Validators.maxLength(70)]],
      ptn_comments: ['', [Validators.maxLength(200)]],
      who_updated: ['', [Validators.maxLength(8)]],
      lw_id: [null],
      provider_id: [null],
      ic_id: [null]
    });
  }

  ngOnInit(): void {
    this.entityId = this.globalService.getCompanyId();
    this.userId = this.globalService.getUserId();
    this.filteredInsurances$ = this.insuranceSearchCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterInsurances(value))
    );
    this.loadLookups();
    if (this.selectedOption) {
      this.patchPtnFormValues(this.selectedOption);
    }
  }

  loadLookups(): void {
    this.patientSearchService.getLookups().subscribe({
      next: (data) => {
        this.lawFirms = data.lawyers || [];
        this.insurances = data.insurances || [];
        this.syncInsuranceDisplay();
      },
      error: (error) => {
        console.error('Error loading patient lookups:', error);
      }
    });
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || !this.searchQuery.trim()) {
      return;
    }

    const query = this.searchQuery.trim();
    // Allow letters, digits, spaces, hyphens, and apostrophes (e.g. O'Brien, Smith-Jones)
    if (!/^[a-zA-Z0-9\s\-']+$/.test(query)) {
      this.showError('Search may include letters, numbers, spaces, hyphens, and apostrophes only');
      return;
    }

    if (query.toUpperCase() === 'ALL') {
      this.searchType = 'A';
    } else if (/^\d+$/.test(query)) {
      // Backend type S: patient ID or last 4 of SSN
      this.searchType = 'S';
    } else {
      this.searchType = 'L';
    }

    this.patientSearchService.getSearchPatients(this.entityId, this.searchType, query)
      .subscribe({
        next: (data) => {
          this.filteredOptions = data;
          if (this.filteredOptions.length === 0) {
            this.clearSearchResults();
            this.showError('No data found');
          } else {
            this.isUpdateMode = true;
          }
        },
        error: (error) => {
          console.error('Error fetching search results:', error);
          this.showError('Error fetching search results');
        }
      });
  }

  isPtnFormChanged(): boolean {
    return this.patientForm.dirty;
  }

  private confirmDiscardChanges(onDiscard: () => void): void {
    if (!this.isPtnFormChanged()) {
      onDiscard();
      return;
    }
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: {
        message: 'You have unsaved patient changes. Discard them and continue?'
      }
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        onDiscard();
      }
    });
  }

  patchPtnFormValues(patientData: any): void {
    this.patientForm.patchValue({
      entity_id: patientData.entity_id,
      ptn_active_flag: patientData.ptn_active_flag,
      ptn_address: patientData.ptn_address,
      ptn_city: patientData.ptn_city,
      ptn_comments: patientData.ptn_comments,
      ptn_date_of_birth: this.formatDateForInput(patientData.ptn_date_of_birth),
      ptn_first_nm: patientData.ptn_first_nm,
      ptn_home_phone: patientData.ptn_home_phone,
      ptn_id: patientData.ptn_id,
      ptn_last_nm: patientData.ptn_last_nm,
      ptn_mid_init: patientData.ptn_mid_init,
      ptn_mobile_phone: patientData.ptn_mobile_phone,
      ptn_occupation: patientData.ptn_occupation,
      ptn_sex: patientData.ptn_sex,
      ptn_ssn: patientData.ptn_ssn,
      ptn_state: patientData.ptn_state,
      ptn_zip: patientData.ptn_zip,
      who_updated: patientData.who_updated,
      lw_id: patientData.lw_id != null ? Number(patientData.lw_id) : null,
      provider_id: patientData.provider_id != null ? Number(patientData.provider_id) : null,
      ic_id: patientData.ic_id != null ? Number(patientData.ic_id) : null
    });
    this.syncInsuranceDisplay();
    this.patientForm.markAsPristine();
  }

  clearSearchResults(): void {
    this.filteredOptions = [];
    this.searchQuery = '';
  }

  /** @deprecated use clearSearchResults */
  clearSelection(): void {
    this.clearSearchResults();
  }

  onOptionClick(option: any): void {
    this.confirmDiscardChanges(() => {
      this.applySelectedPatient(option);
    });
  }

  private applySelectedPatient(option: any): void {
    this.selectedOption = option;
    this.isUpdateMode = true;
    this.clearSearchResults();
    this.patchPtnFormValues(this.selectedOption);
  }

  confirmDeletePatient(): void {
    if (!this.selectedOption?.ptn_id) {
      this.showError('Select a patient before deleting');
      return;
    }
    this.openWarningDialog(
      'Are you sure you want to delete this Patient?',
      this.selectedOption.ptn_id
    );
  }

  openWarningDialog(message: string, ptnId: number): void {
    if (!ptnId) {
      this.showError('Select a patient before deleting');
      return;
    }
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deletePatient(this.entityId, ptnId);
      }
    });
  }

  toggleMode(): void {
    this.confirmDiscardChanges(() => {
      this.isUpdateMode = false;
      this.patientForm.reset({ ptn_active_flag: 'Y', lw_id: null, provider_id: null, ic_id: null });
      this.insuranceSearchCtrl.setValue('');
      this.selectedOption = null;
      this.patientForm.markAsPristine();
    });
  }

  private showError(message: string, durationMs = 3000): void {
    this.errorMessage = message;
    this.showPopup = true;
    setTimeout(() => (this.showPopup = false), durationMs);
  }

  private showSuccess(message: string, durationMs = 3000): void {
    this.successMessage = message;
    this.showSuccessPopup = true;
    setTimeout(() => (this.showSuccessPopup = false), durationMs);
  }


  displayInsurance = (company: any): string => {
    if (!company) {
      return '';
    }
    if (typeof company === 'string') {
      return company;
    }
    return company.ic_name || '';
  };

  filterInsurances(value: any): any[] {
    const query = (typeof value === 'string' ? value : this.displayInsurance(value))
      .toLowerCase()
      .trim();
    if (!query) {
      return this.insurances;
    }
    return this.insurances.filter((company) => {
      const id = String(company.ic_id ?? '');
      const name = String(company.ic_name ?? '').toLowerCase();
      return id.includes(query) || name.includes(query) || `${id} - ${name}`.includes(query);
    });
  }

  onInsuranceSelected(event: MatAutocompleteSelectedEvent): void {
    const company = event.option.value;
    this.patientForm.patchValue({ ic_id: company?.ic_id != null ? Number(company.ic_id) : null });
    this.patientForm.get('ic_id')?.markAsDirty();
  }

  onInsuranceBlur(): void {
    const value: any = this.insuranceSearchCtrl.value;
    if (!value || (typeof value === 'string' && !value.trim())) {
      this.clearInsurance();
      return;
    }
    if (typeof value === 'object' && value.ic_id != null) {
      this.patientForm.patchValue({ ic_id: Number(value.ic_id) });
      return;
    }
    const matches = this.filterInsurances(value);
    if (matches.length === 1) {
      this.insuranceSearchCtrl.setValue(matches[0]);
      this.patientForm.patchValue({ ic_id: Number(matches[0].ic_id) });
      this.patientForm.get('ic_id')?.markAsDirty();
      return;
    }
    this.syncInsuranceDisplay();
  }

  clearInsurance(): void {
    this.insuranceSearchCtrl.setValue('');
    this.patientForm.patchValue({ ic_id: null });
    this.patientForm.get('ic_id')?.markAsDirty();
  }

  syncInsuranceDisplay(): void {
    const id = this.patientForm.get('ic_id')?.value;
    const company = this.insurances.find((row) => Number(row.ic_id) === Number(id));
    this.insuranceSearchCtrl.setValue(company || (id != null && id !== '' ? String(id) : ''), { emitEvent: false });
  }

  compareIds(a: any, b: any): boolean {
    if (a == null && b == null) {
      return true;
    }
    return Number(a) === Number(b);
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }
    const patientData = this.patientForm.getRawValue();
    if (this.isUpdateMode) {
      this.updatePatient(patientData);
    } else {
      this.insertPatient(patientData);
    }
  }
  
 


  validatePatientData(patientData: any): boolean {
    patientData.ptn_date_of_birth = this.parseDateString(patientData.ptn_date_of_birth || '');

    if (patientData.ptn_home_phone) {
      patientData.ptn_home_phone = patientData.ptn_home_phone.replace(/\D/g, '');
    } else {
      patientData.ptn_home_phone = '';
    }

    if (!(patientData.ptn_home_phone.length === 10 || patientData.ptn_home_phone === '')) {
      this.showError('Home phone must be 10 digits long');
      return false;
    }

    if (patientData.ptn_mobile_phone) {
      patientData.ptn_mobile_phone = patientData.ptn_mobile_phone.replace(/\D/g, '');
    } else {
      patientData.ptn_mobile_phone = '';
    }

    if (!(patientData.ptn_mobile_phone.length === 10 || patientData.ptn_mobile_phone === '')) {
      this.showError('Mobile phone must be 10 digits long');
      return false;
    }

    if (patientData.ptn_ssn) {
      patientData.ptn_ssn = patientData.ptn_ssn.replace(/\D/g, '');
    } else {
      patientData.ptn_ssn = '';
    }

    if (!(patientData.ptn_ssn.length === 9 || patientData.ptn_ssn === '')) {
      this.showError('SSN must be 9 digits long');
      return false;
    }
    return true;
  }

  deletePatient(entityId: number, patientId: number): void {
    this.patientSearchService.deletePatient(entityId, patientId).subscribe({
      next: (response) => {
        if (response.returncd === 1) {
          this.showSuccess('Patient deleted successfully!');
          this.patientForm.reset({ ptn_active_flag: 'Y', lw_id: null, provider_id: null, ic_id: null });
          this.insuranceSearchCtrl.setValue('');
          this.clearSearchResults();
          this.selectedOption = null;
          this.isUpdateMode = false;
          this.patientForm.markAsPristine();
        } else {
          this.showError('Patient is not deleted. ' + response.returntx, 5000);
        }
      },
      error: (error) => {
        console.error('Error deleting patient:', error);
        this.showError('Error deleting patient');
      }
    });
  }

  updatePatient(patientData: any): void {
    patientData.who_updated = this.userId;
    patientData.entity_id = this.entityId;

    if (!this.validatePatientData(patientData)) {
      return;
    }

    this.patientSearchService.updatePatient(patientData).subscribe({
      next: (response) => {
        this.showSuccess('Patient updated successfully!');
        this.patientForm.reset();

        this.patientSearchService.getSearchPatients(patientData.entity_id, 'S', patientData.ptn_id)
          .subscribe({
            next: (data) => {
              this.filteredOptions = data;
              if (this.filteredOptions[0]) {
                this.applySelectedPatient(this.filteredOptions[0]);
              }
            },
            error: (error) => {
              console.error('Error fetching search results:', error);
              this.showError('Error fetching search results');
            }
          });
      },
      error: (error) => {
        console.error('Error updating patient:', error);
        this.showError('Error updating patient');
      }
    });
  }

  insertPatient(patientData: any): void {
    patientData.entity_id = this.entityId;
    patientData.ptn_id = 0;
    patientData.who_updated = this.userId;

    if (!this.validatePatientData(patientData)) {
      return;
    }
    this.patientSearchService.insertPatient(patientData).subscribe({
      next: (response) => {
        this.showSuccess('Patient inserted successfully!');
        this.patientForm.reset();

        this.patientSearchService.getSearchPatients(patientData.entity_id, 'S', response.returncd.toString())
          .subscribe({
            next: (data) => {
              this.filteredOptions = data;
              if (this.filteredOptions[0]) {
                this.applySelectedPatient(this.filteredOptions[0]);
              }
            },
            error: (error) => {
              console.error('Error fetching search results:', error);
              this.showError('Error fetching search results');
            }
          });
      },
      error: (error) => {
        console.error('Error inserting patient:', error);
        this.showError('Error inserting patient');
      }
    });
  }

  formatDateForInput(dateString: string | null | undefined): string  {
    if (!dateString) {
      return '';
    }
    if (dateString && dateString.length === 8) {
      // Assume format is mmddyyyy
      const month = dateString.slice(0, 2);
      const day = dateString.slice(2, 4);
      const year = dateString.slice(4, 8);
  
      // Check if the sliced parts form a valid date
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return `${month}/${day}/${year}`;
      } else {
        return ''; // Invalid date
      }
    } else {
      // Try to parse as a standard date string
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      } else {
        return ''; // Invalid date
      }
    }
  }

  parseDateString(dateString: string): string {
    let trimmedDateString = '';
    if (!dateString) {
      return '';
    }
    if (dateString.length >= 10) {
      trimmedDateString = dateString.substring(0, 10);
    } else {
      trimmedDateString = dateString;
    }
    const dateObj = new Date(trimmedDateString);
    if (!isNaN(dateObj.getTime())) {
      return this.formatDateToMMDDYYYY(trimmedDateString);
    }
    return this.formatDateForInput(trimmedDateString);
  }

  generatePDFone(): void {
    if (!this.selectedOption?.ptn_id) {
      this.showError('Select a patient before generating a PDF');
      return;
    }
    PdfComponent.patientInfo(this.selectedOption as Patient);
  }

  formatDateToMMDDYYYY(dateString: string): string {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return '';
    }

    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  }
}