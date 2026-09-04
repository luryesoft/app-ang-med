import { AfterViewInit, ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PatientSearchService } from '../services/patients.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { ServiceCptDialogComponent } from './service-cpt-dialog/service-cpt-dialog.component';
import { ServiceIcdDialogComponent } from './service-icd-dialog/service-icd-dialog.component';
import { PatientSearchDialogComponent } from './patient-search-dialog/patient-search-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { GlobalService } from '../services/global.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { PdfComponent } from '../pdfgen/pdfgen.component';
import { Patient } from '../models/patient.model';
import { parseMoney } from '../pipes/numeric-only.directive';
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
export class PatientsComponent implements OnInit, AfterViewInit {
  @ViewChild('panel1') panel1!: MatExpansionPanel;
  @ViewChild('panelDx') panelDx!: MatExpansionPanel;
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
  states: { state_cd: string; state_nm: string }[] = [];
  cities: { city_nm: string; state_cd: string }[] = [];
  private cityLoadSeq = 0;
  facilities: any[] = [];
  facilityProviders: any[] = [];
  officeProviders: any[] = [];
  companyCptCodes: any[] = [];
  companyIcdCodes: any[] = [];
  insuranceSearchCtrl = new FormControl<any>('');
  citySearchCtrl = new FormControl<any>('');
  filteredInsurances$!: Observable<any[]>;
  filteredCities$!: Observable<{ city_nm: string; state_cd: string }[]>;
  services: PatientService[] = [];
  diagnoses: DiagnosisCode[] = [];
  selectedService: PatientService | null = null;
  private billingSaving = false;
  private billingSaveQueued = false;
  serviceStatuses: ServiceStatus[] = ['Open', 'Billed', 'Partial', 'Paid', 'Denied'];
  newIcdCode = '';
  newIcdDesc = '';
  newCptCode = '';
  newCptDesc = '';
  newCptModifier = '';
  newCptUnits = 1;
  newCptAmount: number | null = null;
  newPayDate: Date | string | null = null;
  newPayMethod = 'Check';
  newPayRef = '';
  newPayAmount: number | null = null;
  ssnReplaceMode = false;
  ssnLoading = false;
  savedSsnLast4 = '';
  todayDate = this.endOfToday();
  private savedDiagnosesSnapshot = '[]';
  private savedServicesSnapshot = '{}';
  private pendingSvcId: number | null = null;

  constructor(
    private patientSearchService: PatientSearchService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private globalService: GlobalService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
    ) {
    this.patientForm = this.fb.group({
      entity_id: [''],
      ptn_id: [''],
      ptn_last_nm: ['', [Validators.required, Validators.maxLength(30)]],
      ptn_first_nm: ['', [Validators.required, Validators.maxLength(30)]],
      ptn_mid_init: ['', [Validators.maxLength(3)]],
      ptn_date_of_birth: [null],
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
      ptn_date_of_accident: [null],
      ptn_policy_no: ['', [Validators.maxLength(40)]],
      ptn_claim_no: ['', [Validators.maxLength(40)]],
      ptn_policyholder: ['', [Validators.maxLength(70)]]
    });
    this.citySearchCtrl.disable({ emitEvent: false });
    this.markWorkspacePristine();
  }

  ngAfterViewInit(): void {
    this.markWorkspacePristine();
  }

  ngOnInit(): void {
    this.entityId = this.globalService.getCompanyId();
    this.userId = this.globalService.getUserId();
    this.filteredInsurances$ = this.insuranceSearchCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterInsurances(value))
    );
    this.filteredCities$ = this.citySearchCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterCities(value))
    );
    this.loadLookups();
    this.openPatientFromQuery();
    if (this.selectedOption) {
      this.patchPtnFormValues(this.selectedOption);
    }
  }

  private openPatientFromQuery(): void {
    const ptnId = Number(this.route.snapshot.queryParamMap.get('ptnId'));
    const svcId = Number(this.route.snapshot.queryParamMap.get('svcId'));
    if (!Number.isFinite(ptnId) || ptnId <= 0) {
      return;
    }
    this.pendingSvcId = Number.isFinite(svcId) && svcId > 0 ? svcId : null;
    this.patientSearchService.getSearchPatients(this.entityId, 'S', String(ptnId)).subscribe({
      next: (data) => {
        if (data?.[0]) {
          this.applySelectedPatient(data[0]);
        } else {
          this.showError('Patient not found');
        }
      },
      error: (error) => {
        console.error('Error opening patient from dashboard:', error);
        this.showError('Could not open patient');
      }
    });
  }

  loadLookups(): void {
    this.patientSearchService.getLookups().subscribe({
      next: (data) => {
        this.lawFirms = data.lawyers || [];
        this.insurances = data.insurances || [];
        this.states = data.states || [];
        this.facilities = data.facilities || [];
        this.facilityProviders = data.providers || [];
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
    if (event.key === 'Escape') {
      this.clearSearchResults();
      return;
    }
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
    return this.patientForm.dirty || this.hasUnsavedBillingChanges();
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.hasPendingChanges()) {
      this.clearSearchResults();
      return true;
    }
    return this.promptDiscardChanges();
  }

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (this.filteredOptions.length) {
      this.clearSearchResults();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.filteredOptions.length) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.search-dropdown')) {
      this.clearSearchResults();
    }
  }

  private confirmDiscardChanges(onDiscard: () => void): void {
    if (!this.hasPendingChanges()) {
      this.clearSearchResults();
      onDiscard();
      return;
    }
    this.promptDiscardChanges().then((confirmed) => {
      if (confirmed) {
        onDiscard();
      }
    });
  }

  private promptDiscardChanges(): Promise<boolean> {
    this.clearSearchResults();
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: {
        message: 'You have unsaved patient changes. Discard them and continue?',
        confirmLabel: 'Discard',
        cancelLabel: 'Stay'
      }
    });
    return new Promise((resolve) => {
      dialogRef.afterClosed().subscribe((confirmed) => {
        this.clearSearchResults();
        resolve(!!confirmed);
      });
    });
  }

  private hasPendingChanges(): boolean {
    if (!this.selectedOption?.ptn_id && !this.hasUserEnteredPatientData()
      && this.services.length === 0 && this.diagnoses.length === 0) {
      return false;
    }
    return this.isPtnFormChanged();
  }

  private hasUserEnteredPatientData(): boolean {
    const value = this.patientForm.getRawValue();
    const filled = [
      value.ptn_last_nm,
      value.ptn_first_nm,
      value.ptn_mid_init,
      value.ptn_address,
      value.ptn_city,
      value.ptn_state,
      value.ptn_zip,
      value.ptn_home_phone,
      value.ptn_mobile_phone,
      value.ptn_ssn,
      value.ptn_occupation,
      value.ptn_comments,
      value.ptn_policy_no,
      value.ptn_claim_no,
      value.ptn_policyholder
    ].some((item) => String(item ?? '').trim() !== '');
    return filled
      || !!value.ptn_date_of_birth
      || !!value.ptn_date_of_accident
      || value.lw_id != null
      || value.ic_id != null;
  }

  private markWorkspacePristine(): void {
    this.patientForm.markAsPristine();
    this.captureBillingSnapshot();
  }

  patchPtnFormValues(patientData: any): void {
    this.patientForm.patchValue({
      entity_id: patientData.entity_id,
      ptn_active_flag: patientData.ptn_active_flag,
      ptn_address: patientData.ptn_address,
      ptn_city: '',
      ptn_comments: patientData.ptn_comments,
      ptn_date_of_birth: this.toDate(patientData.ptn_date_of_birth),
      ptn_first_nm: patientData.ptn_first_nm,
      ptn_home_phone: patientData.ptn_home_phone,
      ptn_id: patientData.ptn_id,
      ptn_last_nm: patientData.ptn_last_nm,
      ptn_mid_init: patientData.ptn_mid_init,
      ptn_mobile_phone: patientData.ptn_mobile_phone,
      ptn_occupation: patientData.ptn_occupation,
      ptn_sex: patientData.ptn_sex,
      ptn_ssn: '',
      ptn_state: String(patientData.ptn_state || '').trim().toUpperCase(),
      ptn_zip: patientData.ptn_zip,
      who_updated: patientData.who_updated,
      lw_id: patientData.lw_id != null ? Number(patientData.lw_id) : null,
      provider_id: patientData.provider_id != null ? Number(patientData.provider_id) : null,
      ic_id: patientData.ic_id != null ? Number(patientData.ic_id) : null,
      ptn_date_of_accident: this.toDate(patientData.ptn_date_of_accident),
      ptn_policy_no: patientData.ptn_policy_no || '',
      ptn_claim_no: patientData.ptn_claim_no || '',
      ptn_policyholder: patientData.ptn_policyholder || ''
    });
    this.savedSsnLast4 = this.toSsnLast4(patientData.ptn_ssn_last4 || patientData.ptn_ssn);
    this.ssnReplaceMode = false;
    this.ssnLoading = false;
    this.syncInsuranceDisplay();
    this.loadCities(this.patientForm.get('ptn_state')?.value, patientData.ptn_city);
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

  openAdvancedSearch(): void {
    this.clearSearchResults();
    const seed = this.searchQuery.trim();
    const dialogRef = this.dialog.open(PatientSearchDialogComponent, {
      width: '78vw',
      height: '82vh',
      autoFocus: true,
      data: {
        facilities: this.facilities,
        insurances: this.insurances,
        providers: this.facilityProviders,
        lastName: seed && !/^\d+$/.test(seed) && seed.toUpperCase() !== 'ALL' ? seed : ''
      }
    });
    dialogRef.afterClosed().subscribe((patient) => {
      if (patient?.ptn_id) {
        this.confirmDiscardChanges(() => this.applySelectedPatient(patient));
      }
    });
  }

  searchResultMeta(option: any): string {
    if (!option) {
      return '';
    }
    const dob = this.formatDateForInput(option.ptn_date_of_birth);
    const cityState = [option.ptn_city, option.ptn_state].filter(Boolean).join(', ');
    const insurer = this.insuranceNameFor(option.ic_id);
    const last4 = this.toSsnLast4(option.ptn_ssn_last4 || option.ptn_ssn);
    const claim = String(option.ptn_claim_no ?? '').trim();
    return [
      dob ? `DOB ${dob}` : '',
      cityState,
      insurer,
      last4 ? `SSN ***-**-${last4}` : '',
      claim ? `Claim ${claim}` : ''
    ].filter(Boolean).join('  ·  ');
  }

  insuranceNameFor(icId: unknown): string {
    const company = this.insurances.find((row) => Number(row.ic_id) === Number(icId));
    return company?.ic_name || '';
  }

  onOptionClick(option: any): void {
    this.clearSearchResults();
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
        ptn_date_of_birth: null,
        ptn_date_of_accident: null,
        ptn_policy_no: '',
        ptn_claim_no: '',
        ptn_policyholder: ''
      });
      this.insuranceSearchCtrl.setValue('');
      this.cities = [];
      this.citySearchCtrl.setValue('');
      this.citySearchCtrl.disable({ emitEvent: false });
      this.savedSsnLast4 = '';
      this.ssnReplaceMode = false;
      this.ssnLoading = false;
      this.selectedOption = null;
      this.clearBillingWorkspace();
      this.markWorkspacePristine();
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

  onStateChange(): void {
    this.patientForm.patchValue({ ptn_city: '' });
    this.citySearchCtrl.setValue('');
    this.patientForm.get('ptn_city')?.markAsDirty();
    this.loadCities(this.patientForm.get('ptn_state')?.value);
  }

  private loadCities(stateCode: string, selectedCity?: string): void {
    const seq = ++this.cityLoadSeq;
    const code = String(stateCode || '').trim().toUpperCase();
    if (!code) {
      this.cities = [];
      this.citySearchCtrl.setValue('');
      this.citySearchCtrl.disable({ emitEvent: false });
      return;
    }
    this.citySearchCtrl.enable({ emitEvent: false });
    this.patientSearchService.getCities(code).subscribe({
      next: (rows) => {
        if (seq !== this.cityLoadSeq) {
          return;
        }
        this.cities = (rows || []).filter(
          (row) => this.normalizeStateCode(row.state_cd) === code
        );
        this.applySelectedCity(selectedCity, code);
      },
      error: (error) => {
        if (seq !== this.cityLoadSeq) {
          return;
        }
        console.error('Error loading cities:', error);
        this.cities = [];
        this.applySelectedCity(selectedCity, code);
      }
    });
  }

  private applySelectedCity(selectedCity: string | undefined, stateCode: string): void {
    if (selectedCity) {
      const city = this.canonicalCity(selectedCity);
      this.ensureCityOption(city, stateCode);
      this.patientForm.patchValue({ ptn_city: city }, { emitEvent: false });
    }
    this.syncCityDisplay();
  }

  private normalizeStateCode(value: unknown): string {
    return String(value || '').trim().toUpperCase();
  }

  private canonicalCity(name: string): string {
    const needle = String(name || '').trim().toUpperCase();
    if (!needle) {
      return '';
    }
    const match = this.citiesForSelectedState().find(
      (row) => String(row.city_nm || '').trim().toUpperCase() === needle
    );
    return match?.city_nm || String(name || '').trim();
  }

  private ensureCityOption(cityName: string, stateCode?: string): void {
    const name = String(cityName || '').trim();
    if (!name) {
      return;
    }
    const exists = this.citiesForSelectedState().some(
      (row) => String(row.city_nm || '').trim().toUpperCase() === name.toUpperCase()
    );
    if (!exists) {
      const code = this.normalizeStateCode(stateCode || this.patientForm.get('ptn_state')?.value);
      this.cities = [{ city_nm: name, state_cd: code }, ...this.cities];
    }
  }

  private citiesForSelectedState(): { city_nm: string; state_cd: string }[] {
    const state = this.normalizeStateCode(this.patientForm.get('ptn_state')?.value);
    if (!state) {
      return [];
    }
    return this.cities.filter((row) => this.normalizeStateCode(row.state_cd) === state);
  }

  displayCity = (city: any): string => {
    if (!city) {
      return '';
    }
    if (typeof city === 'string') {
      return city;
    }
    return city.city_nm || '';
  };

  filterCities(value: any): { city_nm: string; state_cd: string }[] {
    const inState = this.citiesForSelectedState();
    const query = (typeof value === 'string' ? value : this.displayCity(value))
      .toUpperCase()
      .trim();
    if (!query) {
      return inState;
    }
    return inState.filter((row) => String(row.city_nm || '').toUpperCase().includes(query));
  }

  onCitySelected(event: MatAutocompleteSelectedEvent): void {
    const city = event.option.value;
    const name = typeof city === 'string' ? city : String(city?.city_nm || '').trim();
    this.patientForm.patchValue({ ptn_city: name });
    this.patientForm.get('ptn_city')?.markAsDirty();
  }

  onCityBlur(): void {
    setTimeout(() => this.applyCityBlur(), 180);
  }

  private applyCityBlur(): void {
    const value: any = this.citySearchCtrl.value;
    if (!value || (typeof value === 'string' && !value.trim())) {
      this.clearCity();
      return;
    }
    if (typeof value === 'object' && value.city_nm) {
      this.patientForm.patchValue({ ptn_city: String(value.city_nm).trim() });
      return;
    }
    const matches = this.filterCities(value);
    if (matches.length === 1) {
      this.citySearchCtrl.setValue(matches[0]);
      this.patientForm.patchValue({ ptn_city: matches[0].city_nm });
      this.patientForm.get('ptn_city')?.markAsDirty();
      return;
    }
    const exact = this.citiesForSelectedState().find(
      (row) => String(row.city_nm || '').trim().toUpperCase() === String(value).trim().toUpperCase()
    );
    if (exact) {
      this.citySearchCtrl.setValue(exact);
      this.patientForm.patchValue({ ptn_city: exact.city_nm });
      return;
    }
    this.syncCityDisplay();
  }

  clearCity(): void {
    this.citySearchCtrl.setValue('');
    this.patientForm.patchValue({ ptn_city: '' });
    this.patientForm.get('ptn_city')?.markAsDirty();
  }

  syncCityDisplay(): void {
    const name = String(this.patientForm.get('ptn_city')?.value || '').trim();
    const city = this.citiesForSelectedState().find(
      (row) => String(row.city_nm || '').trim().toUpperCase() === name.toUpperCase()
    );
    this.citySearchCtrl.setValue(city || name, { emitEvent: true });
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
    patientData.ptn_date_of_birth = this.parseDateString(patientData.ptn_date_of_birth);
    patientData.ptn_date_of_accident = this.parseDateString(patientData.ptn_date_of_accident);

    if (patientData.ptn_state) {
      patientData.ptn_state = String(patientData.ptn_state).trim().toUpperCase();
    } else {
      patientData.ptn_state = '';
    }
    if (patientData.ptn_city) {
      patientData.ptn_city = String(patientData.ptn_city).trim();
    } else {
      patientData.ptn_city = '';
    }

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
    const ptnId = Number(this.selectedOption?.ptn_id);
    if (!ptnId || this.ssnLoading) {
      return;
    }
    this.ssnLoading = true;
    this.patientSearchService.getPatientSsn(ptnId).subscribe({
      next: (data) => {
        this.ssnLoading = false;
        this.ssnReplaceMode = true;
        this.cdr.detectChanges();
        this.patientForm.patchValue({ ptn_ssn: data?.ptn_ssn || '' });
      },
      error: (error) => {
        this.ssnLoading = false;
        console.error('Error loading SSN:', error);
        this.showError('Could not load SSN');
      }
    });
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
            ptn_date_of_birth: null,
            ptn_date_of_accident: null,
            ptn_policy_no: '',
            ptn_claim_no: '',
            ptn_policyholder: ''
          });
          this.insuranceSearchCtrl.setValue('');
          this.cities = [];
          this.citySearchCtrl.setValue('');
          this.citySearchCtrl.disable({ emitEvent: false });
          this.savedSsnLast4 = '';
          this.ssnReplaceMode = false;
          this.clearSearchResults();
          this.selectedOption = null;
          this.isUpdateMode = false;
          this.clearBillingWorkspace();
          this.markWorkspacePristine();
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
    if (!this.validateAllServicesForSave()) {
      return;
    }

    this.patientSearchService.updatePatient(patientData).subscribe({
      next: (response) => {
        this.saveServicesThenReloadPatient(patientData, 'Patient updated successfully!');
      },
      error: (error) => {
        console.error('Error updating patient:', error);
        this.showError('Error updating patient');
      }
    });
  }

  private saveServicesThenReloadPatient(patientData: any, successMessage: string): void {
    const reload = () => {
      this.showSuccess(successMessage);
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
    };

    const ptnId = Number(patientData.ptn_id);
    if (!ptnId) {
      reload();
      return;
    }

    const saveIcdThenReload = () => {
      this.patientSearchService.savePatientIcd(ptnId, this.diagnoses).subscribe({
        next: () => reload(),
        error: (error) => {
          console.error('Error saving diagnoses:', error);
          this.showError('Could not save diagnoses');
          reload();
        }
      });
    };

    this.patientSearchService.savePatientServices(ptnId, this.services).subscribe({
      next: () => saveIcdThenReload(),
      error: (error) => {
        console.error('Error saving services:', error);
        this.showError('Could not save services');
        saveIcdThenReload();
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

  formatDateForInput(value: string | Date | null | undefined): string  {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return '';
      }
      const month = ('0' + (value.getMonth() + 1)).slice(-2);
      const day = ('0' + value.getDate()).slice(-2);
      return `${month}/${day}/${value.getFullYear()}`;
    }
    const dateString = String(value ?? '').trim();
    if (!dateString) {
      return '';
    }
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
      // Assume format is mmddyyyy
      const month = dateString.slice(0, 2);
      const day = dateString.slice(2, 4);
      const year = dateString.slice(4, 8);
  
      // Check if the sliced parts form a valid date
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(date.getTime()) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)) {
        return `${month}/${day}/${year}`;
      } else {
        return ''; // Invalid date
      }
    } else {
      const slash = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (slash) {
        const month = slash[1].padStart(2, '0');
        const day = slash[2].padStart(2, '0');
        const year = slash[3];
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        if (!isNaN(date.getTime()) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)) {
          return `${month}/${day}/${year}`;
        }
      }
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

  toDate(value: string | Date | null | undefined): Date | null {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    const formatted = this.formatDateForInput(value);
    if (!formatted) {
      return null;
    }
    const [month, day, year] = formatted.split('/');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(date.getTime()) ? null : date;
  }

  parseDateString(dateString: string | Date | null | undefined): string {
    if (dateString instanceof Date) {
      return this.formatDateForInput(dateString);
    }
    let trimmedDateString = '';
    if (!dateString) {
      return '';
    }
    if (dateString.length >= 10) {
      trimmedDateString = dateString.substring(0, 10);
    } else {
      trimmedDateString = dateString;
    }
    const slash = trimmedDateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) {
      return this.formatDateForInput(trimmedDateString);
    }
    const dateObj = new Date(trimmedDateString);
    if (!isNaN(dateObj.getTime())) {
      return this.formatDateToMMDDYYYY(trimmedDateString);
    }
    return this.formatDateForInput(trimmedDateString);
  }

  generatePDFone(): void {
    const ptnId = Number(this.selectedOption?.ptn_id);
    if (!ptnId) {
      this.showError('Select a patient before generating a PDF');
      return;
    }
    if (this.services.length || this.diagnoses.length) {
      this.buildPatientChartPdf();
      return;
    }
    this.patientSearchService.getPatientBilling(ptnId).subscribe({
      next: (data) => {
        this.diagnoses = data?.diagnoses || [];
        this.services = (data?.services || []).map((svc) => this.normalizeLoadedService(svc));
        this.selectedService = this.services[0] || null;
        this.buildPatientChartPdf();
      },
      error: (error) => {
        console.error('Error loading billing for PDF:', error);
        this.buildPatientChartPdf();
      }
    });
  }

  private buildPatientChartPdf(): void {
    const form = this.patientForm.getRawValue();
    const patient = {
      ...this.selectedOption,
      ...form,
      ptn_ssn: this.ssnLast4 || this.selectedOption?.ptn_ssn_last4 || this.selectedOption?.ptn_ssn || ''
    } as Patient;
    PdfComponent.patientInfo({
      patient,
      companyName: this.companyName,
      insuranceName: this.selectedInsuranceName === 'None' ? '' : this.selectedInsuranceName,
      lawyerName: this.selectedLawyerName === 'None' ? '' : this.selectedLawyerName,
      diagnoses: this.diagnoses,
      services: this.services.map((svc) => ({
        ...svc,
        facility_nm: svc.facility_nm || this.facilityName(svc.facility_id),
        provider_nm: svc.provider_nm || this.providerName(svc.facility_id, svc.provider_id)
      }))
    });
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
      service: {
        ...svc,
        svc_id: Number(svc.svc_id) || 0,
        facility_id: svc.facility_id != null ? Number(svc.facility_id) : null,
        provider_id: svc.provider_id != null ? Number(svc.provider_id) : null,
        diagnoses: this.diagnoses,
        lines: (svc.lines || []).map((line) => ({
          ...line,
          units: Number(line.units) || 1,
          amount: parseMoney(line.amount) || 0
        }))
      },
      ptn_date_of_accident: this.parseDateString(this.patientForm.get('ptn_date_of_accident')?.value),
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
          link.download = `NF-3-${this.formatDateForInput(svc.svc_date) || 'service'}.pdf`;
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

  printAob(svc: PatientService, form: 'delivery' | 'aob', event?: Event): void {
    event?.stopPropagation();
    if (!this.selectedOption?.ptn_id) {
      this.showError(form === 'aob' ? 'Select a patient before printing AOB' : 'Select a patient before printing the delivery list');
      return;
    }
    if (!svc) {
      return;
    }
    const label = form === 'aob' ? 'AOB' : 'delivery list';
    this.patientSearchService.generateAob({
      ptn_id: this.selectedOption.ptn_id,
      form,
      service: {
        ...svc,
        svc_id: Number(svc.svc_id) || 0,
        lines: (svc.lines || []).map((line) => ({
          ...line,
          units: Number(line.units) || 1,
          amount: parseMoney(line.amount) || 0
        }))
      },
      ptn_date_of_accident: this.parseDateString(this.patientForm.get('ptn_date_of_accident')?.value)
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const opened = window.open(url, '_blank');
        if (!opened) {
          const link = document.createElement('a');
          link.href = url;
          link.download = `${form === 'aob' ? 'AOB' : 'AOB-delivery'}-${this.formatDateForInput(svc.svc_date) || 'service'}.pdf`;
          link.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: (error) => {
        console.error(`Error generating ${label}:`, error);
        this.showError(`Could not generate ${label}`);
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

  get diagnosisSummary(): string {
    if (!this.diagnoses.length) {
      return 'No ICD codes assigned';
    }
    return this.diagnoses.map((dx) => dx.icd_code).join(', ');
  }

  get patientBilledTotal(): number {
    return this.services.reduce((sum, svc) => sum + this.serviceBilled(svc), 0);
  }

  get patientBalanceTotal(): number {
    return this.services.reduce((sum, svc) => sum + this.serviceBalance(svc), 0);
  }

  serviceBilled(svc: PatientService): number {
    return svc.lines.reduce((sum, line) => sum + (parseMoney(line.amount) || 0) * (Number(line.units) || 1), 0);
  }

  servicePaid(svc: PatientService): number {
    return svc.payments.reduce((sum, pay) => sum + (parseMoney(pay.amount) || 0), 0);
  }

  serviceBalance(svc: PatientService): number {
    return this.serviceBilled(svc) - this.servicePaid(svc);
  }

  statusClass(status: ServiceStatus): string {
    return 'status-' + status.toLowerCase();
  }

  selectService(svc: PatientService): void {
    if (!svc || svc === this.selectedService) {
      return;
    }
    const targetId = Number(svc.svc_id);
    const applySelection = () => {
      const match = targetId > 0
        ? this.services.find((item) => Number(item.svc_id) === targetId)
        : this.services.find((item) => item === svc);
      this.selectedService = match || this.services[0] || null;
      this.loadOfficeProviders(this.selectedService?.facility_id);
    };
    if (this.servicesSnapshot() === this.savedServicesSnapshot) {
      applySelection();
      return;
    }
    this.confirmDiscardChanges(() => {
      this.restoreBillingFromSnapshot();
      applySelection();
    });
  }

  addService(): void {
    const svc: PatientService = {
      svc_id: 0,
      svc_date: this.todayInput(),
      facility_id: null,
      provider_id: null,
      status: 'Open',
      notes: '',
      lines: [],
      payments: []
    };
    this.services = [svc, ...this.services];
    this.selectedService = svc;
    this.officeProviders = [];
    this.persistServices();
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
        this.persistServices();
      }
    });
  }

  openPatientIcdDialog(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (!this.selectedOption?.ptn_id) {
      this.showError('Select a patient first');
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
        assignedCodes: this.diagnoses.map((dx) => dx.icd_code)
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.codes?.length) {
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
    const existing = new Set(
      this.diagnoses.map((dx) => String(dx.icd_code).toUpperCase())
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
        description: String(code.icd_code_description || code.icd_code_text || '')
      });
    }
    if (added.length) {
      this.diagnoses = [...this.diagnoses, ...added];
    }
    return added.length;
  }

  removeDiagnosis(index: number): void {
    this.diagnoses = this.diagnoses.filter((_, i) => i !== index);
  }

  saveDiagnoses(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    this.persistDiagnoses('Diagnoses saved');
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
      width: '64vw',
      height: '85vh',
      data: {
        codes: this.companyCptCodes,
        assignedLines: this.selectedService.lines.map((line) => ({
          cpt_code: line.cpt_code,
          modifier: line.modifier
        }))
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
    const existing = new Set(
      this.selectedService.lines.map((line) => this.cptLineKey(line.cpt_code, line.modifier))
    );
    const newLines: ServiceLine[] = [];
    for (const code of codes) {
      const cpt = String(code.cpt_code ?? '').trim().toUpperCase();
      const modifier = String(code.cpt_code_modifier || '').trim().toUpperCase();
      const key = this.cptLineKey(cpt, modifier);
      if (!cpt || existing.has(key)) {
        continue;
      }
      existing.add(key);
      const amount = Number(code.cpt_code_charge_am);
      newLines.push({
        cpt_code: cpt,
        description: String(code.cpt_code_description || code.cpt_code_short_nm || ''),
        modifier,
        units: 1,
        amount: Number.isFinite(amount) ? amount : 0
      });
    }
    if (newLines.length) {
      this.selectedService.lines = [...this.selectedService.lines, ...newLines];
    }
    return newLines.length;
  }

  saveService(): void {
    if (!this.selectedService) {
      this.showError('Select a service first');
      return;
    }
    if (!this.hasUnsavedServiceChanges()) {
      this.showError('No changes to save');
      return;
    }
    this.selectedService.svc_date = this.formatDateForInput(this.selectedService.svc_date) || '';
    if (!this.prepareServiceLinesForSave(this.selectedService)) {
      return;
    }
    if (!this.preparePaymentsForSave(this.selectedService)) {
      return;
    }
    this.persistServices('Service saved');
  }

  private validateAllServicesForSave(): boolean {
    for (const svc of this.services) {
      svc.svc_date = this.formatDateForInput(svc.svc_date) || '';
      if (!this.prepareServiceLinesForSave(svc) || !this.preparePaymentsForSave(svc)) {
        this.selectedService = svc;
        this.loadOfficeProviders(svc.facility_id);
        return false;
      }
    }
    return true;
  }

  private prepareServiceLinesForSave(svc: PatientService): boolean {
    const saved: ServiceLine[] = [];
    const seen = new Set<string>();
    for (const line of svc.lines) {
      const code = String(line.cpt_code || '').trim().toUpperCase();
      if (!code) {
        this.showError('Every CPT line needs a code');
        return false;
      }
      const modifier = String(line.modifier || '').trim().toUpperCase();
      const key = this.cptLineKey(code, modifier);
      if (seen.has(key)) {
        this.showError(`Duplicate CPT ${code}${modifier ? '-' + modifier : ''} is not allowed`);
        return false;
      }
      seen.add(key);
      const units = Number(line.units);
      const amount = parseMoney(line.amount);
      if (!Number.isFinite(units) || units < 1) {
        this.showError(`Units for ${code} must be at least 1`);
        return false;
      }
      if (!Number.isFinite(amount) || amount < 0) {
        this.showError(`Amount for ${code} is invalid`);
        return false;
      }
      saved.push({
        cpt_code: code,
        description: String(line.description || '').trim(),
        modifier,
        units,
        amount
      });
    }
    svc.lines = saved;
    return true;
  }

  private preparePaymentsForSave(svc: PatientService): boolean {
    const saved: ServicePayment[] = [];
    for (const pay of svc.payments || []) {
      const payDate = this.formatDateForInput(pay.pay_date);
      if (!payDate) {
        this.showError('Every payment needs a date');
        return false;
      }
      const amount = parseMoney(pay.amount);
      if (!Number.isFinite(amount) || amount === 0) {
        this.showError('Every payment needs an amount');
        return false;
      }
      saved.push({
        pay_date: payDate,
        method: String(pay.method || 'Check').trim() || 'Check',
        reference: String(pay.reference || '').trim(),
        amount
      });
    }
    svc.payments = saved;
    this.syncServiceStatus(svc);
    return true;
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
    const modifier = this.newCptModifier.trim().toUpperCase();
    const key = this.cptLineKey(code, modifier);
    if (this.selectedService.lines.some((line) => this.cptLineKey(line.cpt_code, line.modifier) === key)) {
      this.showError(`CPT ${code}${modifier ? '-' + modifier : ''} is already on this service`);
      return;
    }
    const line: ServiceLine = {
      cpt_code: code,
      description: this.newCptDesc.trim(),
      modifier,
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

  addPaymentRow(): void {
    if (!this.selectedService) {
      return;
    }
    this.selectedService.payments = [
      ...this.selectedService.payments,
      {
        pay_date: this.todayInput(),
        method: 'Check',
        reference: '',
        amount: null as unknown as number
      }
    ];
    this.syncServiceStatus(this.selectedService);
  }

  onPaymentDateChange(pay: ServicePayment, event: MatDatepickerInputEvent<Date>): void {
    pay.pay_date = this.formatDateForInput(event.value) || '';
    this.onPaymentChange();
  }

  onPaymentChange(): void {
    if (this.selectedService) {
      this.syncServiceStatus(this.selectedService);
    }
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
    this.services = [];
    this.diagnoses = [];
    this.selectedService = null;
    this.officeProviders = [];
    this.resetDraftFields();
    const ptnId = Number(this.selectedOption?.ptn_id);
    if (!ptnId) {
      return;
    }
    this.patientSearchService.getPatientBilling(ptnId).subscribe({
      next: (data) => {
        this.diagnoses = data?.diagnoses || [];
        this.services = (data?.services || []).map((svc) => this.normalizeLoadedService(svc));
        const pendingId = this.pendingSvcId;
        this.pendingSvcId = null;
        this.selectedService =
          (pendingId ? this.services.find((svc) => Number(svc.svc_id) === pendingId) : null) ||
          this.services[0] ||
          null;
        this.captureBillingSnapshot();
        this.loadOfficeProviders(this.selectedService?.facility_id);
      },
      error: (error) => {
        console.error('Error loading patient billing:', error);
        this.showError('Could not load services and diagnoses');
      }
    });
  }

  private clearBillingWorkspace(): void {
    this.services = [];
    this.diagnoses = [];
    this.selectedService = null;
    this.officeProviders = [];
    this.resetDraftFields();
    this.captureBillingSnapshot();
  }

  onServiceDateChange(event: MatDatepickerInputEvent<Date>): void {
    if (!this.selectedService) {
      return;
    }
    this.selectedService.svc_date = this.formatDateForInput(event.value) || '';
  }

  private endOfToday(): Date {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }

  hasTreatingOffice(svc: PatientService | null = this.selectedService): boolean {
    return Number(svc?.facility_id) > 0;
  }

  onServiceFacilityChange(): void {
    if (!this.selectedService) {
      return;
    }
    const facilityId = Number(this.selectedService.facility_id);
    this.selectedService.facility_id = Number.isFinite(facilityId) && facilityId > 0 ? facilityId : null;
    this.selectedService.provider_id = null;
    this.loadOfficeProviders(this.selectedService.facility_id);
  }

  onServiceProviderChange(): void {
    if (!this.hasTreatingOffice()) {
      if (this.selectedService) {
        this.selectedService.provider_id = null;
      }
      return;
    }
  }

  private loadOfficeProviders(facilityId: number | null | undefined): void {
    const id = Number(facilityId);
    if (!Number.isFinite(id) || id <= 0) {
      this.officeProviders = [];
      return;
    }
    this.officeProviders = this.providersForFacility(id);
    this.patientSearchService.getProvidersForFacility(id).subscribe({
      next: (rows) => {
        if (Number(this.selectedService?.facility_id) !== id) {
          return;
        }
        this.officeProviders = rows || [];
        this.dropProviderIfNotInOffice();
      },
      error: (error) => {
        console.error('Error loading treating providers:', error);
        this.officeProviders = this.providersForFacility(id);
        this.dropProviderIfNotInOffice();
      }
    });
  }

  private dropProviderIfNotInOffice(): void {
    if (!this.selectedService) {
      return;
    }
    if (!this.hasTreatingOffice()) {
      this.selectedService.provider_id = null;
      return;
    }
    const providerId = Number(this.selectedService.provider_id);
    const allowed = this.officeProviders.some((row) => Number(row.provider_id) === providerId);
    if (!allowed) {
      this.selectedService.provider_id = null;
    }
  }

  providersForFacility(facilityId: number | null | undefined): any[] {
    const id = Number(facilityId);
    if (!Number.isFinite(id) || id <= 0) {
      return [];
    }
    return this.facilityProviders.filter((row) => Number(row.facility_id) === id);
  }

  serviceLocationLabel(svc: PatientService): string {
    const facility = svc.facility_nm || this.facilityName(svc.facility_id);
    const provider = svc.provider_nm || this.providerName(svc.facility_id, svc.provider_id);
    if (facility && provider) {
      return `${facility} — ${provider}`;
    }
    return provider || facility || 'No provider';
  }

  private facilityName(facilityId: number | null | undefined): string {
    const id = Number(facilityId);
    if (!Number.isFinite(id) || id <= 0) {
      return '';
    }
    const row = this.facilities.find((item) => Number(item.facility_id) === id);
    return row?.facility_nm || '';
  }

  private providerName(
    facilityId: number | null | undefined,
    providerId: number | null | undefined
  ): string {
    const facId = Number(facilityId);
    const provId = Number(providerId);
    if (!Number.isFinite(facId) || facId <= 0 || !Number.isFinite(provId) || provId <= 0) {
      return '';
    }
    const row = this.facilityProviders.find(
      (item) => Number(item.facility_id) === facId && Number(item.provider_id) === provId
    );
    return row?.provider_nm || '';
  }

  private persistDiagnoses(successMessage?: string): void {
    const ptnId = Number(this.selectedOption?.ptn_id);
    if (!ptnId) {
      this.showError('Select a patient first');
      return;
    }
    this.patientSearchService.savePatientIcd(ptnId, this.diagnoses).subscribe({
      next: (data) => {
        this.diagnoses = data?.diagnoses || this.diagnoses;
        this.captureDiagnosesSnapshot();
        if (successMessage) {
          this.showSuccess(successMessage);
        }
      },
      error: (error) => {
        console.error('Error saving diagnoses:', error);
        this.showError('Could not save diagnoses');
      }
    });
  }

  private persistServices(successMessage?: string): void {
    const ptnId = Number(this.selectedOption?.ptn_id);
    if (!ptnId) {
      return;
    }
    if (this.billingSaving) {
      this.billingSaveQueued = true;
      return;
    }
    this.billingSaving = true;
    this.patientSearchService.savePatientServices(ptnId, this.services).subscribe({
      next: (data) => {
        const queued = this.billingSaveQueued;
        this.billingSaveQueued = false;
        this.billingSaving = false;
        if (queued) {
          this.adoptSavedServiceIds(data?.services || []);
          this.persistServices(successMessage);
          return;
        }
        this.applySavedServices(data?.services || []);
        this.captureServicesSnapshot();
        setTimeout(() => this.captureServicesSnapshot());
        if (successMessage) {
          this.showSuccess(successMessage);
        }
      },
      error: (error) => {
        this.billingSaving = false;
        console.error('Error saving services:', error);
        this.showError('Could not save services');
      }
    });
  }

  private adoptSavedServiceIds(saved: PatientService[]): void {
    const normalized = saved.map((svc) => this.normalizeLoadedService(svc));
    const localById = new Map(
      this.services.filter((svc) => Number(svc.svc_id) > 0).map((svc) => [Number(svc.svc_id), svc])
    );
    const pending = this.services.filter((svc) => Number(svc.svc_id) <= 0);
    const unusedSaved = normalized.filter((svc) => !localById.has(svc.svc_id));
    for (const pendingSvc of pending) {
      const created = unusedSaved.shift();
      if (created) {
        pendingSvc.svc_id = created.svc_id;
      }
    }
  }

  private applySavedServices(saved: PatientService[]): void {
    const normalized = saved.map((svc) => this.normalizeLoadedService(svc));
    const localById = new Map(
      this.services.filter((svc) => Number(svc.svc_id) > 0).map((svc) => [Number(svc.svc_id), svc])
    );
    const pending = this.services.filter((svc) => Number(svc.svc_id) <= 0);
    const unusedSaved = normalized.filter((svc) => !localById.has(svc.svc_id));
    for (const pendingSvc of pending) {
      const created = unusedSaved.shift();
      if (created) {
        pendingSvc.svc_id = created.svc_id;
        localById.set(created.svc_id, pendingSvc);
      }
    }
    const selected = this.selectedService;
    this.services = normalized.map((svc) => localById.get(svc.svc_id) || svc);
    if (selected) {
      this.selectedService =
        this.services.find((svc) => svc === selected || svc.svc_id === selected.svc_id) ||
        this.services[0] ||
        null;
    }
  }

  private normalizeLoadedService(svc: PatientService): PatientService {
    return {
      svc_id: Number(svc.svc_id) || 0,
      svc_date: this.formatDateForInput(svc.svc_date) || svc.svc_date || '',
      facility_id: svc.facility_id != null ? Number(svc.facility_id) : null,
      provider_id: svc.provider_id != null ? Number(svc.provider_id) : null,
      facility_nm: svc.facility_nm || '',
      provider_nm: svc.provider_nm || '',
      status: svc.status || 'Open',
      notes: svc.notes || '',
      lines: (svc.lines || []).map((line) => ({
        cpt_code: line.cpt_code || '',
        description: line.description || '',
        modifier: line.modifier || '',
        units: Number(line.units) || 1,
        amount: Number(line.amount) || 0
      })),
      payments: (svc.payments || []).map((pay) => ({
        pay_date: this.formatDateForInput(pay.pay_date) || '',
        method: String(pay.method || 'Check'),
        reference: String(pay.reference || '').trim(),
        amount: parseMoney(pay.amount) || Number(pay.amount) || 0
      }))
    };
  }

  private cptLineKey(cptCode: string, modifier: string): string {
    return `${String(cptCode || '').trim().toUpperCase()}|${String(modifier || '').trim().toUpperCase()}`;
  }

  hasUnsavedServiceChanges(): boolean {
    return this.servicesSnapshot() !== this.savedServicesSnapshot;
  }

  private hasUnsavedBillingChanges(): boolean {
    return this.diagnosesSnapshot() !== this.savedDiagnosesSnapshot
      || this.hasUnsavedServiceChanges();
  }

  private captureBillingSnapshot(): void {
    this.captureDiagnosesSnapshot();
    this.captureServicesSnapshot();
  }

  private captureDiagnosesSnapshot(): void {
    this.savedDiagnosesSnapshot = this.diagnosesSnapshot();
  }

  private captureServicesSnapshot(): void {
    this.savedServicesSnapshot = this.servicesSnapshot();
  }

  private restoreBillingFromSnapshot(): void {
    try {
      this.diagnoses = JSON.parse(this.savedDiagnosesSnapshot || '[]');
      const parsed = JSON.parse(this.savedServicesSnapshot || '{}');
      this.services = (parsed.services || []).map((svc: PatientService) => this.normalizeLoadedService(svc));
      this.resetDraftFields();
      const draft = parsed.draft || {};
      this.newPayDate = draft.newPayDate || null;
      this.newPayMethod = draft.newPayMethod || 'Check';
      this.newPayRef = draft.newPayRef || '';
      this.newPayAmount = draft.newPayAmount || null;
      this.newCptCode = draft.newCptCode || '';
      this.newCptDesc = draft.newCptDesc || '';
      this.newCptModifier = draft.newCptModifier || '';
      this.newCptUnits = Number(draft.newCptUnits) > 0 ? Number(draft.newCptUnits) : 1;
      this.newCptAmount = draft.newCptAmount || null;
    } catch {
      this.loadServicesForPatient();
    }
  }

  private diagnosesSnapshot(): string {
    return JSON.stringify(
      (this.diagnoses || []).map((dx) => ({
        icd_code: String(dx.icd_code || '').trim().toUpperCase(),
        description: String(dx.description || '').trim()
      }))
    );
  }

  private servicesSnapshot(): string {
    return JSON.stringify({
      services: (this.services || []).map((svc) => ({
        svc_id: Number(svc.svc_id) || 0,
        svc_date: this.formatDateForInput(svc.svc_date) || '',
        facility_id: Number(svc.facility_id) > 0 ? Number(svc.facility_id) : null,
        provider_id: Number(svc.provider_id) > 0 ? Number(svc.provider_id) : null,
        status: String(svc.status || ''),
        notes: String(svc.notes || '').trim(),
        lines: (svc.lines || []).map((line) => ({
          cpt_code: String(line.cpt_code || '').trim().toUpperCase(),
          description: String(line.description || '').trim(),
          modifier: String(line.modifier || '').trim().toUpperCase(),
          units: Number(line.units) || 1,
          amount: parseMoney(line.amount) || 0
        })),
        payments: (svc.payments || []).map((pay) => ({
          pay_date: this.formatDateForInput(pay.pay_date) || '',
          method: String(pay.method || ''),
          reference: String(pay.reference || '').trim(),
          amount: parseMoney(pay.amount) || 0
        }))
      })),
      draft: {
        newPayDate: this.formatDateForInput(this.newPayDate) || '',
        newPayMethod: this.newPayMethod || 'Check',
        newPayRef: String(this.newPayRef || '').trim(),
        newPayAmount: parseMoney(this.newPayAmount) || 0,
        newCptCode: String(this.newCptCode || '').trim().toUpperCase(),
        newCptDesc: String(this.newCptDesc || '').trim(),
        newCptModifier: String(this.newCptModifier || '').trim().toUpperCase(),
        newCptUnits: Number(this.newCptUnits) > 0 ? Number(this.newCptUnits) : 1,
        newCptAmount: parseMoney(this.newCptAmount) || 0
      }
    });
  }

  private resetDraftFields(): void {
    this.newIcdCode = '';
    this.newIcdDesc = '';
    this.newCptCode = '';
    this.newCptDesc = '';
    this.newCptModifier = '';
    this.newCptUnits = 1;
    this.newCptAmount = null;
    this.newPayDate = null;
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
}