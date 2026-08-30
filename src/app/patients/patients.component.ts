import { Component, OnInit, ViewChild } from '@angular/core';
import { PatientSearchService } from '../services/patients.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { ServiceCptDialogComponent } from './service-cpt-dialog/service-cpt-dialog.component';
import { ServiceIcdDialogComponent } from './service-icd-dialog/service-icd-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { GlobalService } from '../services/global.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { PdfComponent } from '../pdfgen/pdfgen.component';
import { Patient } from '../models/patient.model';
import {
  DiagnosisCode,
  PatientService,
  ServiceLine,
  ServicePayment,
  ServiceStatus
} from '../models/patient-service.model';
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
  companyCptCodes: any[] = [];
  companyIcdCodes: any[] = [];
  insuranceSearchCtrl = new FormControl<any>('');
  filteredInsurances$!: Observable<any[]>;
  services: PatientService[] = [];
  selectedService: PatientService | null = null;
  serviceStatuses: ServiceStatus[] = ['Open', 'Billed', 'Partial', 'Paid', 'Denied'];
  newIcdCode = '';
  newIcdDesc = '';
  newCptCode = '';
  newCptDesc = '';
  newCptModifier = '';
  newCptUnits = 1;
  newCptAmount: number | null = null;
  newPayDate = '';
  newPayMethod = 'Check';
  newPayRef = '';
  newPayAmount: number | null = null;
  ssnReplaceMode = false;
  savedSsnLast4 = '';

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
      ic_id: [null],
      ptn_date_of_accident: [''],
      ptn_policy_no: ['', [Validators.maxLength(40)]],
      ptn_claim_no: ['', [Validators.maxLength(40)]],
      ptn_policyholder: ['', [Validators.maxLength(70)]]
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
        this.companyCptCodes = data.cptCodes || [];
        this.companyIcdCodes = data.icdCodes || [];
        this.syncInsuranceDisplay();
        this.insuranceSearchCtrl.setValue(this.insuranceSearchCtrl.value);
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
      ptn_ssn: '',
      ptn_state: patientData.ptn_state,
      ptn_zip: patientData.ptn_zip,
      who_updated: patientData.who_updated,
      lw_id: patientData.lw_id != null ? Number(patientData.lw_id) : null,
      provider_id: patientData.provider_id != null ? Number(patientData.provider_id) : null,
      ic_id: patientData.ic_id != null ? Number(patientData.ic_id) : null,
      ptn_date_of_accident: this.formatDateForInput(patientData.ptn_date_of_accident),
      ptn_policy_no: patientData.ptn_policy_no || '',
      ptn_claim_no: patientData.ptn_claim_no || '',
      ptn_policyholder: patientData.ptn_policyholder || ''
    });
    this.savedSsnLast4 = this.toSsnLast4(patientData.ptn_ssn_last4 || patientData.ptn_ssn);
    this.ssnReplaceMode = false;
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
    this.loadServicesForPatient();
    setTimeout(() => this.panel1?.close());
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
      this.patientForm.reset({
        ptn_active_flag: 'Y',
        lw_id: null,
        provider_id: null,
        ic_id: null,
        ptn_date_of_accident: '',
        ptn_policy_no: '',
        ptn_claim_no: '',
        ptn_policyholder: ''
      });
      this.insuranceSearchCtrl.setValue('');
      this.savedSsnLast4 = '';
      this.ssnReplaceMode = false;
      this.selectedOption = null;
      this.clearBillingWorkspace();
      this.patientForm.markAsPristine();
      setTimeout(() => this.panel1?.open());
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

  insuranceAddress(company: any): string {
    if (!company || typeof company === 'string') {
      return '';
    }
    return [company.ic_address, company.ic_city, company.ic_state, company.ic_zip]
      .map((part) => String(part ?? '').trim())
      .filter((part) => part.length > 0)
      .join(', ');
  }

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
      const address = this.insuranceAddress(company).toLowerCase();
      return id.includes(query) || name.includes(query) || address.includes(query) || `${id} - ${name}`.includes(query);
    });
  }

  onInsuranceSelected(event: MatAutocompleteSelectedEvent): void {
    const company = event.option.value;
    this.patientForm.patchValue({ ic_id: company?.ic_id != null ? Number(company.ic_id) : null });
    this.patientForm.get('ic_id')?.markAsDirty();
  }

  onInsuranceBlur(): void {
    setTimeout(() => this.applyInsuranceBlur(), 180);
  }

  private applyInsuranceBlur(): void {
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
    patientData.ptn_date_of_accident = this.parseDateString(patientData.ptn_date_of_accident || '');

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

    if (this.isUpdateMode && !this.ssnReplaceMode) {
      patientData.ptn_ssn = '';
      return true;
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

  get ssnLast4(): string {
    return this.toSsnLast4(this.savedSsnLast4 || this.selectedOption?.ptn_ssn_last4 || this.selectedOption?.ptn_ssn);
  }

  enableSsnReplace(): void {
    this.ssnReplaceMode = true;
    this.patientForm.patchValue({ ptn_ssn: '' });
    this.patientForm.get('ptn_ssn')?.markAsDirty();
  }

  private toSsnLast4(value: unknown): string {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits.length >= 4 ? digits.slice(-4) : '';
  }

  deletePatient(entityId: number, patientId: number): void {
    this.patientSearchService.deletePatient(entityId, patientId).subscribe({
      next: (response) => {
        if (response.returncd === 1) {
          this.showSuccess('Patient deleted successfully!');
          this.patientForm.reset({
            ptn_active_flag: 'Y',
            lw_id: null,
            provider_id: null,
            ic_id: null,
            ptn_date_of_accident: '',
            ptn_policy_no: '',
            ptn_claim_no: '',
            ptn_policyholder: ''
          });
          this.insuranceSearchCtrl.setValue('');
          this.savedSsnLast4 = '';
          this.ssnReplaceMode = false;
          this.clearSearchResults();
          this.selectedOption = null;
          this.isUpdateMode = false;
          this.clearBillingWorkspace();
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

  printNf3(svc: PatientService, event?: Event): void {
    event?.stopPropagation();
    if (!this.selectedOption?.ptn_id) {
      this.showError('Select a patient before printing NF-3');
      return;
    }
    if (!svc) {
      return;
    }
    this.patientSearchService.generateNf3({
      ptn_id: this.selectedOption.ptn_id,
      service: svc,
      ptn_date_of_accident: this.patientForm.get('ptn_date_of_accident')?.value,
      ptn_policy_no: this.patientForm.get('ptn_policy_no')?.value,
      ptn_claim_no: this.patientForm.get('ptn_claim_no')?.value,
      ptn_policyholder: this.patientForm.get('ptn_policyholder')?.value
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const opened = window.open(url, '_blank');
        if (!opened) {
          const link = document.createElement('a');
          link.href = url;
          link.download = `NF-3-${svc.svc_date || 'service'}.pdf`;
          link.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: (error) => {
        console.error('Error generating NF-3:', error);
        this.showError('Could not generate NF-3');
      }
    });
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

  get selectedLawyerName(): string {
    const id = this.patientForm.get('lw_id')?.value;
    const firm = this.lawFirms.find((row) => Number(row.lw_id) === Number(id));
    return firm?.lw_nm || 'None';
  }

  get selectedInsuranceName(): string {
    const id = this.patientForm.get('ic_id')?.value;
    const company = this.insurances.find((row) => Number(row.ic_id) === Number(id));
    return company?.ic_name || 'None';
  }

  get companyName(): string {
    return this.globalService.getBusinessEntityName()
      || sessionStorage.getItem('businessEntityName')
      || '';
  }

  get patientBilledTotal(): number {
    return this.services.reduce((sum, svc) => sum + this.serviceBilled(svc), 0);
  }

  get patientBalanceTotal(): number {
    return this.services.reduce((sum, svc) => sum + this.serviceBalance(svc), 0);
  }

  serviceBilled(svc: PatientService): number {
    return svc.lines.reduce((sum, line) => sum + (Number(line.amount) || 0) * (Number(line.units) || 1), 0);
  }

  servicePaid(svc: PatientService): number {
    return svc.payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  }

  serviceBalance(svc: PatientService): number {
    return this.serviceBilled(svc) - this.servicePaid(svc);
  }

  statusClass(status: ServiceStatus): string {
    return 'status-' + status.toLowerCase();
  }

  selectService(svc: PatientService): void {
    this.selectedService = svc;
  }

  addService(): void {
    const nextId = this.services.reduce((max, svc) => Math.max(max, svc.svc_id), 0) + 1;
    const svc: PatientService = {
      svc_id: nextId,
      svc_date: this.todayInput(),
      provider_nm: '',
      status: 'Open',
      notes: '',
      diagnoses: [],
      lines: [],
      payments: []
    };
    this.services = [svc, ...this.services];
    this.selectedService = svc;
  }

  confirmDeleteService(): void {
    if (!this.selectedService) {
      return;
    }
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message: 'Delete this service, its CPT lines, and payments?' }
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && this.selectedService) {
        this.services = this.services.filter((svc) => svc !== this.selectedService);
        this.selectedService = this.services[0] || null;
      }
    });
  }

  openServiceIcdDialog(): void {
    if (!this.selectedService) {
      this.showError('Select a service first');
      return;
    }
    if (!this.companyIcdCodes.length) {
      this.showError('No ICD codes are assigned to this company');
      return;
    }
    const dialogRef = this.dialog.open(ServiceIcdDialogComponent, {
      width: '55vw',
      height: '85vh',
      data: {
        codes: this.companyIcdCodes,
        assignedCodes: this.selectedService.diagnoses.map((dx) => dx.icd_code)
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.codes?.length || !this.selectedService) {
        return;
      }
      const added = this.applySelectedIcdCodes(result.codes);
      if (result.duplicates?.length) {
        this.showError(
          `Skipped duplicates: ${result.duplicates.join(', ')}. Added ${added} ICD code(s).`,
          5000
        );
      } else if (added > 0) {
        this.showSuccess(`Added ${added} ICD code(s)`);
      }
    });
  }

  private applySelectedIcdCodes(codes: any[]): number {
    if (!this.selectedService) {
      return 0;
    }
    const existing = new Set(
      this.selectedService.diagnoses.map((dx) => String(dx.icd_code).toUpperCase())
    );
    const added: DiagnosisCode[] = [];
    for (const code of codes) {
      const icd = String(code.icd_code ?? '').toUpperCase();
      if (!icd || existing.has(icd)) {
        continue;
      }
      existing.add(icd);
      added.push({
        icd_code: icd,
        description: String(code.icd_code_text || code.icd_code_description || '')
      });
    }
    if (added.length) {
      this.selectedService.diagnoses = [...this.selectedService.diagnoses, ...added];
    }
    return added.length;
  }

  removeDiagnosis(index: number): void {
    if (!this.selectedService) {
      return;
    }
    this.selectedService.diagnoses = this.selectedService.diagnoses.filter((_, i) => i !== index);
  }

  openServiceCptDialog(): void {
    if (!this.selectedService) {
      this.showError('Select a service first');
      return;
    }
    if (!this.companyCptCodes.length) {
      this.showError('No CPT codes are assigned to this company');
      return;
    }
    const dialogRef = this.dialog.open(ServiceCptDialogComponent, {
      width: '55vw',
      height: '85vh',
      data: {
        codes: this.companyCptCodes,
        assignedCodes: this.selectedService.lines.map((line) => line.cpt_code)
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.codes?.length || !this.selectedService) {
        return;
      }
      const added = this.applySelectedCptCodes(result.codes);
      if (result.duplicates?.length) {
        this.showError(
          `Skipped duplicates: ${result.duplicates.join(', ')}. Added ${added} CPT line(s).`,
          5000
        );
      } else if (added > 0) {
        this.showSuccess(`Added ${added} CPT line(s)`);
      }
    });
  }

  private applySelectedCptCodes(codes: any[]): number {
    if (!this.selectedService) {
      return 0;
    }
    const existing = new Set(this.selectedService.lines.map((line) => String(line.cpt_code).toUpperCase()));
    const newLines: ServiceLine[] = [];
    for (const code of codes) {
      const cpt = String(code.cpt_code ?? '').toUpperCase();
      if (!cpt || existing.has(cpt)) {
        continue;
      }
      existing.add(cpt);
      newLines.push({
        cpt_code: cpt,
        description: String(code.cpt_code_description || code.cpt_code_short_nm || ''),
        modifier: String(code.cpt_code_modifier || ''),
        units: 1,
        amount: Number(code.cpt_code_charge_am) || 0
      });
    }
    if (newLines.length) {
      this.selectedService.lines = [...this.selectedService.lines, ...newLines];
    }
    return newLines.length;
  }

  saveCptLines(): void {
    if (!this.selectedService) {
      this.showError('Select a service first');
      return;
    }
    const seen = new Set<string>();
    const saved: ServiceLine[] = [];
    for (const line of this.selectedService.lines) {
      const code = String(line.cpt_code || '').trim().toUpperCase();
      if (!code) {
        this.showError('Every CPT line needs a code');
        return;
      }
      if (seen.has(code)) {
        this.showError(`Duplicate CPT ${code} is not allowed`);
        return;
      }
      seen.add(code);
      const units = Number(line.units);
      const amount = Number(line.amount);
      if (!Number.isFinite(units) || units < 1) {
        this.showError(`Units for ${code} must be at least 1`);
        return;
      }
      if (!Number.isFinite(amount) || amount < 0) {
        this.showError(`Amount for ${code} is invalid`);
        return;
      }
      saved.push({
        cpt_code: code,
        description: String(line.description || '').trim(),
        modifier: String(line.modifier || '').trim().toUpperCase(),
        units,
        amount
      });
    }
    this.selectedService.lines = saved;
    this.showSuccess('CPT lines saved');
  }

  addCptLine(): void {
    if (!this.selectedService) {
      return;
    }
    const code = this.newCptCode.trim().toUpperCase();
    const amount = Number(this.newCptAmount);
    if (!code) {
      this.showError('Enter a CPT code');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      this.showError('Enter a CPT amount');
      return;
    }
    const line: ServiceLine = {
      cpt_code: code,
      description: this.newCptDesc.trim(),
      modifier: this.newCptModifier.trim().toUpperCase(),
      units: Number(this.newCptUnits) > 0 ? Number(this.newCptUnits) : 1,
      amount
    };
    this.selectedService.lines = [...this.selectedService.lines, line];
    this.newCptCode = '';
    this.newCptDesc = '';
    this.newCptModifier = '';
    this.newCptUnits = 1;
    this.newCptAmount = null;
  }

  removeCptLine(index: number): void {
    if (!this.selectedService) {
      return;
    }
    this.selectedService.lines = this.selectedService.lines.filter((_, i) => i !== index);
  }

  addPayment(): void {
    if (!this.selectedService) {
      return;
    }
    const amount = Number(this.newPayAmount);
    if (!this.newPayDate.trim()) {
      this.showError('Enter a payment date');
      return;
    }
    if (!Number.isFinite(amount) || amount === 0) {
      this.showError('Enter a payment amount');
      return;
    }
    const payment: ServicePayment = {
      pay_date: this.newPayDate.trim(),
      method: this.newPayMethod,
      reference: this.newPayRef.trim(),
      amount
    };
    this.selectedService.payments = [...this.selectedService.payments, payment];
    this.syncServiceStatus(this.selectedService);
    this.newPayDate = '';
    this.newPayRef = '';
    this.newPayAmount = null;
  }

  removePayment(index: number): void {
    if (!this.selectedService) {
      return;
    }
    this.selectedService.payments = this.selectedService.payments.filter((_, i) => i !== index);
    this.syncServiceStatus(this.selectedService);
  }

  private syncServiceStatus(svc: PatientService): void {
    const billed = this.serviceBilled(svc);
    const paid = this.servicePaid(svc);
    if (billed > 0 && paid >= billed) {
      svc.status = 'Paid';
    } else if (paid > 0 && paid < billed) {
      svc.status = 'Partial';
    }
  }

  private loadServicesForPatient(): void {
    this.services = this.buildSampleServices();
    this.selectedService = this.services[0] || null;
    this.resetDraftFields();
  }

  private clearBillingWorkspace(): void {
    this.services = [];
    this.selectedService = null;
    this.resetDraftFields();
  }

  private resetDraftFields(): void {
    this.newIcdCode = '';
    this.newIcdDesc = '';
    this.newCptCode = '';
    this.newCptDesc = '';
    this.newCptModifier = '';
    this.newCptUnits = 1;
    this.newCptAmount = null;
    this.newPayDate = '';
    this.newPayMethod = 'Check';
    this.newPayRef = '';
    this.newPayAmount = null;
  }

  private todayInput(): string {
    const now = new Date();
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    return `${month}/${day}/${now.getFullYear()}`;
  }

  private buildSampleServices(): PatientService[] {
    return [
      {
        svc_id: 1,
        svc_date: '08/12/2026',
        provider_nm: 'Chen, PT',
        status: 'Partial',
        notes: 'Initial evaluation and therapy',
        diagnoses: [
          { icd_code: 'M54.5', description: 'Low back pain' },
          { icd_code: 'S13.4XXA', description: 'Sprain of ligaments of cervical spine' }
        ],
        lines: [
          { cpt_code: '97161', description: 'PT evaluation, low complexity', modifier: '', units: 1, amount: 150 },
          { cpt_code: '97110', description: 'Therapeutic exercises', modifier: '', units: 2, amount: 80 }
        ],
        payments: [
          { pay_date: '08/20/2026', method: 'EFT', reference: 'NF-88421', amount: 150 }
        ]
      },
      {
        svc_id: 2,
        svc_date: '08/19/2026',
        provider_nm: 'Chen, PT',
        status: 'Open',
        notes: '',
        diagnoses: [
          { icd_code: 'M54.5', description: 'Low back pain' }
        ],
        lines: [
          { cpt_code: '97110', description: 'Therapeutic exercises', modifier: '', units: 2, amount: 80 },
          { cpt_code: '97140', description: 'Manual therapy', modifier: '', units: 1, amount: 70 }
        ],
        payments: []
      }
    ];
  }
}