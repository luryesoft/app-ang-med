import { Component, OnInit} from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { ProviderService } from '../services/providers.service';
import { MatDialog } from '@angular/material/dialog';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { FacilityDialogComponent } from '../facility-dialog/facility-dialog.component';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { CanComponentDeactivate } from '../guards/can-deactivate.guard';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs';
import { PhoneNumberService } from '../services/phone-number.service';

interface Provider {
  provider_nm: string;
  provider_id: number;
  specialty_nm?: string;
  provider_credentials?: string;
  provider_first_nm?: string;
  provider_last_nm?: string;
  provider_specialty_id?: number;
  provider_npi?: string;
  provider_license_no?: string;
  provider_tin?: string;
  updated_by?: string;
  provider_type_id?: number;
  provider_phone?: string;
  provider_email?: string;  
  entity_id?: number;
  active_in?: string;
}

export interface AddProvider {
  provider_id: number;
  specialty_nm?: string;
  provider_credentials?: string;
  provider_first_nm?: string;
  provider_last_nm?: string;
  provider_specialty_id?: number;
  provider_npi?: string;
  provider_license_no?: string;
  provider_tin?: string;
  updated_by?: string;
  provider_type_id?: number;
  provider_phone?: string;
  provider_email?: string;  
  entity_id?: number;
  active_in?: string;
}

interface ProviderType {
  provider_type_id: number;
  provider_type_nm: string;
}
interface Specialty {
  specialty_id: number;
  specialty_nm: string;

}

interface Facility {
  facility_id: number;
  facility_nm: string;
  facility_address?: string;
  facility_type_nm?: string;
  facility_address_tx?: string;
  facility_address_tx_2?: string;
  // Add other relevant fields
}



@Component({
  selector: 'app-providers',
  templateUrl: './providers.component.html',
  styleUrls: ['./providers.component.scss']
})


export class ProvidersComponent implements OnInit, CanComponentDeactivate {
  searchQuery = '';
  providers: Provider[] = [];
  selectedProvider: Provider | null = null;
  isEditMode = true;
  showPopup: boolean = false;
  showSuccessPopup: boolean = false; 
  successMessage: string = '';
  errorMessage: string = '';
  providerForm!: FormGroup;
  providerTypes: ProviderType[] = [];
  specialties: Specialty[] = [];
  facilities: Facility[] = [];
  entity_id: number = 0;
  selectedFacility: any;
  selectedFacilities: number[] = [];
  searchInitiated: boolean = false;
  isProviderFacility: boolean = true;
  isActive: boolean = false;
  formDirty: boolean = false; // Track if the form is dirty
  toggleChange: boolean = false;
  searchPlaceholder: string = 'Facility or Doctor\'s name';
  toggleSubscription: Subscription = new Subscription();
  
  constructor(private providerService: ProviderService, 
    private fb: FormBuilder, 
    private dialog: MatDialog,
    private phoneNumberService: PhoneNumberService ) {
    this.initializeProviderForm();
    
  }


    
  ngOnInit(): void {
    console.log('ProvidersComponent initialized.');
    this.loadProviderTypes();
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit: this.formDirty:', this.formDirty);
    this.subscribeToFormChanges();
  }
  subscribeToFormChanges(): void {
    console.log('Subscribing to form changes');
    this.providerForm.valueChanges.subscribe(() => {
        this.onFormChange();
    });
  }

  onFormChange(): void {
    console.log('On Form Change: this.formDirty:', this.formDirty);
    this.formDirty = true;
  }
  checkFormDirty(form: FormGroup) {
    if (form.dirty) {
        console.log('The form is dirty');
    } else {
      console.log('The form is not dirty');
    }
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    console.log('Can deactivate:', this.formDirty);
    if (this.formDirty) {
      return confirm('Do you want to save changes?');
    }
    return true;
  }

  isFormComplete(): boolean {
    // Check if the form is valid and all required fields are filled
    return this.providerForm.valid;
  }
  initializeProviderForm(): void {
    this.providerForm = this.fb.group({
      provider_first_nm: ['', [Validators.required]],
      provider_last_nm: ['', [Validators.required]],
      provider_specialty_id: ['', Validators.required],
      provider_npi: [''],
      provider_license_no: [''],
      provider_tin: [''],
      updated_by: [sessionStorage.getItem('userId')],
      provider_type_id: ['', Validators.required],
      provider_credentials: ['', [Validators.minLength(2), Validators.required]],
      provider_phone: ['', [Validators.required]],
      provider_email: ['', [Validators.required, Validators.email]],
      entity_id: [0],
      active_in: ['N']
    });
    console.log('Provider Form Initialized');
  }
  
  loadProviderTypes(): void {
    this.providerService.getProviderTypes().subscribe(
      (data: ProviderType[]) => {
        console.log('Provider Types:', data);
        this.providerTypes = data;
      },
      (error) => {
        console.error('Error fetching provider types:', error);
      }
    );
    this.loadSpecialties();
  }

  loadSpecialties(): void {
    this.providerService.getSpecialties().subscribe(
      (data: Specialty[]) => {
        console.log('Specialties:', data);
        this.specialties = data;
        this.specialties = data.sort((a, b) => a.specialty_nm.localeCompare(b.specialty_nm));
      },
      (error) => {
        console.error('Error fetching specialties:', error);
      }
    );
    
  }

  loadFacilities(providerId: number): void {
    this.providerService.getFacilitiesByProvider(providerId).subscribe(
        (data: Facility[]) => {
            this.facilities = data;
            this.facilities.sort((a, b) => a.facility_nm.localeCompare(b.facility_nm));
            console.log('Facilities:', data);
            console.log('Length of Facilities:', this.facilities.length);
            if (this.facilities.length === 0) {
              this.isProviderFacility = false;
            }else{
              this.isProviderFacility = true;
            }
            console.log('Selected Provider Is Provider Facility:', this.isProviderFacility);
        },
        (error) => {
            if (error.status === 404) {
                console.warn('Facilities not found for provider ID:', providerId);
                // Optionally, clear the facilities array if needed
                this.facilities = [];
                this.isProviderFacility = false;
            } else {
                console.error('Error fetching facilities:', error);
            }
        }
    );
}

onSubmit() {
  const phone = this.providerForm.get('provider_phone')?.value;
  if (this.validatePhoneNumber(phone)) {
    console.log('Phone number is valid');
  } else {
    console.warn('Invalid phone number');
    this.errorMessage = 'The phone number must have at least 8 digits, separated by dashes';
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 5000);
    return;
  }
  console.log('Form submitted:', this.providerForm.value);
  console.log('Is Edit Mode:', this.isEditMode);
  console.log('Selected Facility:', this.facilities);
  this.selectedFacility = this.facilities[0];
  if (this.providerForm.valid ) {
    if (this.isEditMode) {
      console.log('Updating provider:', this.providerForm.value);
      this.updateProvider();
    } else {
      console.log('Adding provider:', this.providerForm.value);
      this.addProvider();
    }
  } else {
    console.warn('Form is incomplete');
    this.errorMessage = `Form is incomplete`;
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 5000);
  }
}

  selectFacility(facility: any) {
    this.selectedFacility = facility;
  }

  hasNoFacilities(): boolean {
    return this.facilities.length === 0;
  }


  searchProviders() {

    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.errorMessage = `Please provide the criteria for the search.`;
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 5000);
      return; // Exit the function if searchQuery is invalid
  }
    this.searchInitiated = true; // Set the flag to true when search is initiated

    console.log('Searching for:', this.searchQuery);
    this.isEditMode = true;
  //  this.providerForm.reset();
    this.entity_id = Number(sessionStorage.getItem('companyId'));
    this.providerService.searchProviders(this.searchQuery).subscribe({
      next: (results: Provider[]) => {
        console.log('Search Results:', results);

        this.providers = results.sort((a, b) => a.provider_first_nm!.localeCompare(b.provider_first_nm!));

        if (this.providers.length === 0) {
          this.facilities = [];
          this.isProviderFacility = false;
          console.log('Facilities cleared');
          this.searchPlaceholder = 'No results found'; 
        }else {
          this.searchPlaceholder = 'Facility or Doctor\'s name'; // Reset to default placeholder
        }
        this.formDirty = false;
        console.log('On Search Results: this.formDirty:', this.formDirty);
      },
      error: (error) => {
        console.error('Error searching providers:', error);
      }
    });
  }

subscribeToUserInteractions(): void {
    this.providerForm.valueChanges.subscribe(() => {
        this.onUserInteraction();
    });
}
onUserInteraction(): void {
  console.log('User interacted with the form');
    this.formDirty = true;
  }
  onSearchInputChange() {
    console.log('Search Input Cleared:', this.searchInitiated);
    if ( this.searchQuery.trim() === '') {
      this.searchInitiated = false; // Reset the flag if the search input is cleared
      
    }else{
      this.isProviderFacility = true;
    }
    console.log('Is Provider Facility:', this.isProviderFacility);
  }

  switchToAddMode(): void {
    this.isEditMode = false;
    this.resetForm();
    this.formDirty = false;
  }

  resetForm() {
    this.providerForm.reset({
        provider_first_nm: '',
        provider_last_nm: '',
        provider_specialty_id: '',
        provider_npi: '',
        provider_license_no: '',
        provider_tin: '',
        updated_by: sessionStorage.getItem('userId'),
        provider_type_id: '',
        provider_credentials: '',
        provider_phone: '',
        provider_email: '',
        entity_id: 0,
        active_in: 'N'
    });
    this.facilities = [];
    this.selectedProvider = null;
    this.selectedFacility = null;
    this.providerForm.markAsPristine();
    this.providerForm.markAsUntouched();
}

  selectProvider(provider: Provider) {
    if (this.selectedProvider === provider) {
      return;
    }
    if (this.formDirty) {
      const message = 'Please update Provider Details. If you want to discard them and select a new provider, click "Cancel".';
      const dialogRef = this.dialog.open(WarningModalComponent, {
        data: { message: message }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result && result !== undefined) {
          console.log('User canceled the action');
          this.selectedProvider = provider;
          this.isEditMode = true;
          this.providerForm.patchValue({
            provider_first_nm: provider.provider_first_nm || '',
            provider_last_nm: provider.provider_last_nm || '',
            provider_specialty_id: provider.provider_specialty_id || '',
            provider_npi: provider.provider_npi || '',
            provider_license_no: provider.provider_license_no || '',
            provider_tin: provider.provider_tin || '',
            updated_by: provider.updated_by || sessionStorage.getItem('userId'),
            provider_type_id: provider.provider_type_id || '',
            provider_credentials: provider.provider_credentials || '',
            provider_phone: provider.provider_phone || '',  
            provider_email: provider.provider_email || '',
            entity_id: provider.entity_id || 0,
            active_in: provider.active_in || 'N'
          });
          this.formDirty = false;
          console.log('Provider Selected:', this.selectedProvider);   
          this.loadFacilities(provider.provider_id);
          console.log('Selected Facilities :', this.facilities);
          
        }else{
          console.log('User confirmed the action');
          this.formDirty = false;
          this.updateProvider();
        }
      });
    }else{
      console.log('Form is not dirty');

      this.selectedProvider = provider;
      this.isEditMode = true;
      this.providerForm.patchValue({
        provider_first_nm: provider.provider_first_nm || '',
        provider_last_nm: provider.provider_last_nm || '',
        provider_specialty_id: provider.provider_specialty_id || '',
        provider_npi: provider.provider_npi || '',
        provider_license_no: provider.provider_license_no || '',
        provider_tin: provider.provider_tin || '',
        updated_by: provider.updated_by || sessionStorage.getItem('userId'),
        provider_type_id: provider.provider_type_id || '',
        provider_credentials: provider.provider_credentials || '',
        provider_phone: provider.provider_phone || '',  
        provider_email: provider.provider_email || '',
        entity_id: provider.entity_id || 0,
        active_in: provider.active_in || 'N'
      });

      console.log('Provider Selected:', this.selectedProvider);   
      this.loadFacilities(provider.provider_id);
      console.log('Selected Facilities :', this.facilities);
      this.formDirty = false;
    }
  }
  
  confirmAndDeleteFacility(facilityId: number): void {   
    this.openWarningDialog('Are you sure you want to delete this facility?', facilityId);
  }

 addProvider(): void {
    if (this.providerForm.valid) {
      const newProvider: Provider = this.providerForm.value;
      newProvider.entity_id = Number(sessionStorage.getItem('companyId'));
      console.log('New Provider:', newProvider);
      this.providerService.addProvider(newProvider).subscribe({
        next: (response: any) => {
          console.log('Provider added successfully:', response);
          this.successMessage = 'Provider added successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);
          //this.loadProviders(); // Optionally reload the list of providers
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error Object:', error.error);
          this.errorMessage = `${error.error.message}`;
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 5000);
        }
      });
    } else {
      console.warn('Provider form is invalid');
    }
  }

  updateProvider(): void {
    if (this.selectedProvider !== null) {
      
      console.log('Updating provider:', this.selectedProvider.provider_id);
      this.providerForm.value.entity_id = Number(sessionStorage.getItem('companyId'));
      this.selectedProvider.entity_id = Number(sessionStorage.getItem('companyId'));
      this.providerService.updateProvider(this.selectedProvider.provider_id, this.providerForm.value)
        .subscribe({
          next: (response: any) => {
            console.log('Provider updated successfully', response);
            this.successMessage = 'Provider updated successfully!';
            this.showSuccessPopup = true;
            setTimeout(() => this.showSuccessPopup = false, 3000);
            this.selectedProvider = response;
            console.log('Selected Provider after update:', this.selectedProvider);
            this.formDirty = false;
            this.isEditMode = true
         //   this.providerForm.reset();
           this.searchProviders();
         //   this.selectProvider(response);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error Object:', error.error);
            this.errorMessage = `${error.error.message}`;
            this.showPopup = true;
            setTimeout(() => this.showPopup = false, 5000);
          }
        });
    }
  }

  getProviderById(providerId: number): void {
    this.providerService.getProviderById(providerId).subscribe({
      next: (provider: any) => {
        this.selectedProvider = provider;
        console.log('Provider refreshed:', this.selectedProvider);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error refreshing provider:', error.error);
      }
    });
  }

  openConfirmationDialog(message: string, providerId: number): void {
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message: message }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {

      }
    });

  }  


  openWarningDialog(message: string, facilityId: number): void {
        const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message: message }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const providerId = this.selectedProvider?.provider_id;
        if (providerId !== undefined) {
          this.deleteFacility(providerId, facilityId);
        } else {
          console.log('User canceled the action');
          this.errorMessage = 'User canceled the action';
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }
      }
    });

  }  
  
  openWarningDialogProvider(message: string, providerId: number): void {

    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message: message }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const providerId = this.selectedProvider?.provider_id;
        if (providerId !== undefined) {
          this.deleteProvider(providerId);
        } else {
          console.log('User canceled the action');
          this.errorMessage = 'User canceled the action';
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }
      }
    });
  }

  deleteFacility(provider_id: number, facility_id: number): void {
    console.log('Deleting facility:', provider_id, facility_id);
    this.providerService.deleteFacility(provider_id, facility_id).subscribe({
      next: (response) => 
        {

        console.log('Response:', response.returncd); 
        const responseMessage = response[0]; 
        if (response.returncd === 1) {
          console.log(`Facility with ID ${facility_id} deleted successfully.`);
          this.successMessage = 'Facility deleted successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);
          console.log('Loading facilities', this.selectedProvider?.provider_id);
          this.loadFacilities(this.selectedProvider?.provider_id || 0);

        } else if (response.returncd === 0)  {
          console.error(`Error deleting facility:`, response.returncd);
          this.errorMessage = 'Facility not found';
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }else{
          this.errorMessage = 'An unexpected error occurred. Please try again later.';
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }
      },
      error: (error) => {
        console.error('Error during API call:', error);
        alert('An unexpected error occurred. Please try again later.');
      }
    });
  }

  confirmAndDeleteProvider(provider: Provider): void {
    //const provider = this.selectedProvider;
    if (!provider) {
      console.error('Selected provider is undefined');
      return;
    }
    const message = `Are you sure you want to delete ${provider.provider_first_nm} ${provider.provider_last_nm}?`;
    this.openWarningDialogProvider(message, provider.provider_id);   
  }

  deleteProvider(providerId: number): void {
    
    console.log(`Provider with ID ${providerId} deleted.`);
      this.providerService.deleteProvider(providerId).subscribe({
        next: (response) => {
          console.log('Response:', response); 
          this.successMessage = 'Provider deleted successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);
          this.searchProviders(); 
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error deleting provider:', error);
          this.errorMessage = 'An error occurred while deleting the provider.';
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }
      });    
  }




  phoneValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const validPhonePattern = /^[0-9]{10}$/; 
      const isValid = validPhonePattern.test(control.value);
      return isValid ? null : { invalidPhone: true };
    };
  } 

  openFacilityDialog() {
    const entityId = Number(sessionStorage.getItem('companyId'));
    console.log(`Entity ID: ${entityId}`);
    const providerId = this.selectedProvider?.provider_id ?? 0;
    console.log(`Provider ID: ${providerId}`);
    
    this.providerService.getAvailableFacilities(entityId, providerId).subscribe(
      (facilities: any) => {
        // Prepare the data object with the correct structure
        const dialogData = {
          title: 'Select Facilities',
          details: facilities // Ensure this matches the expected structure
        };
        console.log('Dialog Data:', dialogData);
        // Open the dialog with the prepared data
        const dialogRef = this.dialog.open(FacilityDialogComponent, {
          width: '600px',
          data: dialogData
        });

        console.log(`Facility Dialog opened, data: ${JSON.stringify(facilities, null, 2)}`);
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            console.log('Selected Facility IDs:', result);
            this.selectedFacilities = result;
            this.addFacilitiesToProvider(providerId, this.selectedFacilities);
          }
        });
      },
      (error) => {
        console.error('Error fetching available facilities:', error);
      }
    );
  }

  addFacilitiesToProvider(providerId: number, facilities: number[]) {
    console.log('Adding facilities to provider:', 'provider:', providerId, 'facilities:', facilities);
    this.providerService.insertProvidersFacility(providerId, facilities).subscribe({
      next: (response) => {
        console.log('Response:', response);
        this.successMessage = 'Facilities added successfully!';
        this.showSuccessPopup = true;
        setTimeout(() => this.showSuccessPopup = false, 3000);
        this.loadFacilities(providerId);
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = error.error.message;
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
      }
    });
  }

  toggleCheck() {
   // this.isIconChecked = !this.isIconChecked; 
    console.log('Icon Checked:',this.isActive ); 
   // this.providerForm.get('active_in')?.setValue(this.isActive ? 'Y' : 'N'); 
  }
  

  onToggleChange(event: MatSlideToggleChange, provider: any): void {
    provider.active_in = provider.active_in === 'Y' ? 'N' : 'Y';
    console.log('Toggle changed:', provider.active_in === 'Y' ? 'Active' : 'Inactive');
    this.providerForm.patchValue({ active_in: provider.active_in }); 
    this.formDirty = true;
  }

  validatePhoneNumber(phone: string): boolean {
    return this.phoneNumberService.isValidPhoneNumber(phone);
  }

  getSelectedSpecialtyName(): string {
    const selectedId = this.providerForm.get('provider_specialty_id')?.value;
    const selectedSpecialty = this.specialties.find(specialty => specialty.specialty_id === selectedId);
    return selectedSpecialty ? selectedSpecialty.specialty_nm : '';
  }
  getSelectedProviderTypeName(): string {
    console.log('Selected Provider:', this.providers);
    const selectedId = this.providerForm.get('provider_type_id')?.value;
    const selectedProviderType = this.providerTypes.find(providerType => providerType.provider_type_id === selectedId);
    return selectedProviderType ? selectedProviderType.provider_type_nm : '';
  }
}




