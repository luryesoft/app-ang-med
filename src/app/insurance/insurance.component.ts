import { Component, OnInit, Provider, ViewEncapsulation  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsuranceService } from '../services/insurance.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { PhoneNumberService } from '../services/phone-number.service';
import { Observable } from 'rxjs';

export interface Insurance {
  ic_id: number;
  ic_name?: string;
  ic_address?: string;
  ic_city?: string;
  ic_state?: string;
  ic_zip?: string;
  ic_country_cd?: string;
  ic_phone?: string;
  ic_email?: string;
  ic_license_no?: string;
  ic_status?: string;
  ic_billing_address?: string;
  ic_billing_city?: string;
  ic_billing_zip?: string;
  ic_billing_state?: string;
  updated_by?: string;
}

@Component({
  selector: 'app-insurance',
  standalone: false,
  templateUrl: './insurance.component.html',
  styleUrl: './insurance.component.scss'
})



export class InsuranceComponent implements OnInit {
  insuranceForm!: FormGroup;
  searchQuery = '';
  searQuerybeforeUpdate = '';
  searchInitiated = false;
  searchPlaceholder: string = 'Insurance name';
  insurances:   Insurance[] = [];
  selectedInsurance: Insurance | null = null;
  isEditMode: boolean = false;
  formDirty: boolean = false;
  errorMessage: string = '';
  showPopup: boolean = false;
  isActive: boolean = false;
  showSuccessPopup: boolean = false;
  successMessage: string = '';
  noSelection = false;

  constructor(
    private fb: FormBuilder, 
    private dialog: MatDialog,
     private phoneNumberService: PhoneNumberService, 
     private insuranceService: InsuranceService
    ) {
    this.initializeInsuranceForm();    
  }


  ngOnInit(): void {
    this.insuranceForm = this.fb.group({
      ic_id: [0],
      ic_name: ['', Validators.required],
      ic_address: ['', Validators.required],
      ic_city: ['', Validators.required],
      ic_state: ['', [Validators.required, Validators.maxLength(2)]],
      ic_zip: ['', Validators.required],
      ic_email: [''],
      ic_phone: [''],
      ic_country_cd: [''],
      ic_license_no: ['', Validators.maxLength(250)],
      ic_status: [''],
      ic_billing_address: [''],
      ic_billing_city: [''],
      ic_billing_zip: [''],
      ic_billing_state: [''],
      updated_by: [sessionStorage.getItem('userId')]
    });
  
  }

  initializeInsuranceForm(): void {
    this.insuranceForm = this.fb.group({
      ic_id: [0],
      ic_name: ['', Validators.required],
      ic_address: ['', Validators.required],
      ic_city: ['', Validators.required],
      ic_state: ['', Validators.required],
      ic_zip: ['', Validators.required],
      ic_country_cd: [''],
      ic_phone: ['', Validators.required],
      ic_email: ['', Validators.email],
      ic_license_no: ['', Validators.maxLength(250)],
      ic_status: [''],
      ic_billing_address: [''],
      ic_billing_city: [''],
      ic_billing_zip: [''],
      ic_billing_state: [''],
      updated_by: [sessionStorage.getItem('userId')]
    });
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit: this.formDirty:', this.formDirty);
    this.subscribeToFormChanges();
  }
  subscribeToFormChanges(): void {
    console.log('Subscribing to form changes');
    this.insuranceForm.valueChanges.subscribe(() => {
        this.onFormChange();
    });
  }

  onFormChange(): void {
    console.log('On Form Change: this.formDirty:', this.formDirty);
    this.formDirty = true;
    if (this.selectedInsurance) {
      this.selectedInsurance.ic_status = this.insuranceForm.get('ic_status')?.value;
      console.log('On Form Change: this.selectedInsurance:', this.selectedInsurance);
    }
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
    return this.insuranceForm.valid;
  }
  onSearchInputChange() {
    console.log('Search Input Cleared:', this.searchInitiated);
    if ( this.searchQuery.trim() === '') {
      this.searchInitiated = false; // Reset the flag if the search input is cleared
      
    }else{
      this.isEditMode = true;
    }
    console.log('Is Edit Mode:', this.isEditMode);
  }

  switchToAddMode(): void {
    this.isEditMode = false;
   // this.resetForm();
    this.formDirty = false;
  }

  searchInsurances() {

    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.errorMessage = `Please provide the criteria for the search.`;
      console.error('Search query is undefined or empty');
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 5000);
      return; // Exit the function if searchQuery is invalid
  }
    this.searchInitiated = true; // Set the flag to true when search is initiated
    this.searQuerybeforeUpdate = this.searchQuery;
    console.log('Searching for:', this.searchQuery);
    this.isEditMode = true;
  //  this.providerForm.reset();
  
    this.insuranceService.searchInsurances(this.searchQuery).subscribe({
      next: (results: Insurance[]) => {
        console.log('Search Results:', results);

        this.insurances = results.sort((a, b) => a.ic_name!.localeCompare(b.ic_name!));

        if (this.insurances.length === 0) {
          this.searchPlaceholder = 'No results found'; 
          this.selectedInsurance = null; // Clear the selected insurance
          this.insuranceForm.reset(); 
        }else {
          this.searchPlaceholder = 'Insurance Name'; // Reset to default placeholder
        }
        this.formDirty = false;
        console.log('On Search Results: this.formDirty:', this.formDirty);
      },
      error: (error) => {
        console.error('Error searching providers:', error);
      }
    });
  }

  selectInsurance(insurance: Insurance) {
    if (this.selectedInsurance === insurance) {
      
      return;
    }
    if (this.formDirty) {
      const message = 'Please update Provider Details. If you want to discard them and select a new insurance, click "Cancel".';
      const dialogRef = this.dialog.open(WarningModalComponent, {
        data: { message: message }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result && result !== undefined) {
          console.log('User canceled the action');
          this.selectedInsurance = insurance;
          this.isEditMode = true;
          this.insuranceForm.patchValue({
            ic_id: insurance.ic_id || 0,
            ic_name: insurance.ic_name || '',
            ic_address: insurance.ic_address || '',
            ic_city: insurance.ic_city || '',
            ic_state: insurance.ic_state || '',
            ic_zip: insurance.ic_zip || '',
            ic_country_cd: insurance.ic_country_cd || '',
            ic_phone: insurance.ic_phone || '',
            ic_email: insurance.ic_email || '',
            ic_license_no: insurance.ic_license_no || '',
            ic_status: insurance.ic_status || '',
            ic_billing_address: insurance.ic_billing_address || '',
            ic_billing_city: insurance.ic_billing_city || '',
            ic_billing_zip: insurance.ic_billing_zip || '',
            ic_billing_state: insurance.ic_billing_state || '',
            updated_by: insurance.updated_by || sessionStorage.getItem('userId')
          });
          this.formDirty = false;
          console.log('Insurance Selected:', this.selectedInsurance);   
          console.log('Insurance already selected:', this.selectedInsurance.ic_status);
        }else{
          console.log('User confirmed the action');
          this.formDirty = false;
         // this.updateInsurance();
        }
      });
    }else{
      console.log('Form is not dirty');

      this.selectedInsurance = insurance;
      this.isEditMode = true;
      this.insuranceForm.patchValue({
        ic_id: insurance.ic_id,
        ic_name: insurance.ic_name || '',
        ic_address: insurance.ic_address || '',
        ic_city: insurance.ic_city || '',
        ic_state: insurance.ic_state || '',
        ic_zip: insurance.ic_zip || '',
        ic_country_cd: insurance.ic_country_cd || '',
        ic_phone: insurance.ic_phone || '',
        ic_email: insurance.ic_email || '',
        ic_license_no: insurance.ic_license_no || '',
        ic_status: insurance.ic_status || '',
        ic_billing_address: insurance.ic_billing_address || '',
        ic_billing_city: insurance.ic_billing_city || '',
        ic_billing_zip: insurance.ic_billing_zip || '',
        ic_billing_state: insurance.ic_billing_state || '',
        updated_by: insurance.updated_by || sessionStorage.getItem('userId')
      });

      console.log('Insurance Selected:', this.selectedInsurance);   
      this.formDirty = false;
    }
  }
  
  toggleCheck() {
    // this.isIconChecked = !this.isIconChecked; 
     console.log('Icon Checked:',this.isActive ); 
    // this.providerForm.get('active_in')?.setValue(this.isActive ? 'Y' : 'N'); 
   }
   
 
   onToggleChange(event: MatSlideToggleChange, insurance: any): void {
     insurance.ic_status = insurance.ic_status === 'A' ? 'I' : 'A';
     this.insuranceForm.patchValue({ ic_status: insurance.ic_status });
     console.log('Toggle change:', this.insuranceForm.get('ic_status')?.value);
     console.log('Toggle changed:', insurance.ic_status === 'A' ? 'Active' : 'Inactive');
     this.formDirty = true;
   }
 
   validatePhoneNumber(phone: string): boolean {
     return this.phoneNumberService.isValidPhoneNumber(phone);
   }


   
openWarningDialog(message: string, insuranceId: number): void {
  const dialogRef = this.dialog.open(WarningModalComponent, {
    data: { message: message }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('User confirmed the action');
      this.deleteInsurance(insuranceId); 
    } else {
      console.log('User canceled the action');
      // Handle the cancellation action
    }
  });
}


   confirmAndDeleteInsurance(insurance: Insurance): void {
    //const insurance = this.selectedInsurance;
    if (!insurance) {
      console.error('Selected provider is undefined');
      return;
    }
    this.openWarningDialog('Are you sure you want to delete this insurance?', insurance.ic_id); 
  }

  deleteInsurance(id: number): void {
    this.insuranceService.deleteInsurance(id).subscribe(
      response => {
        console.log('Delete successful', response);
        this.successMessage = 'Insurance updated successfully!';
        this.showSuccessPopup = true;
        setTimeout(() => this.showSuccessPopup = false, 5000);
        this.formDirty = false;
        this.searchQuery = this.searQuerybeforeUpdate;
        this.searchInsurances();

      },
      error => {
        console.error('Delete failed', error);
        this.errorMessage = 'Failed to delete insurance. Please try again.';
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 5000);
      }
    );
  }
  onSubmit(): void {
    console.log('On Submit>>>>>');
    if (this.insuranceForm.valid) {

        console.log('Form is valid');
     //   this.insuranceForm.patchValue({ ic_status: 'A' });
     //   this.isActive = true;
        if (this.isEditMode) {
          this.updateInsurance();
        } else {
          console.log('Adding Insurance');
          this.addInsurance();
        }
    }else{
      console.error('Form is invalid');
      this.errorMessage = 'Please fill in all required fields.';
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 5000);
    }
  }

  updateInsurance(): void {
    if (this.selectedInsurance) {
      const updatedInsurance = this.insuranceForm.value;
      this.insuranceService.updateInsurance(updatedInsurance).subscribe({
        next: (response) => {
          console.log('Insurance updated successfully:', response);
          this.successMessage = 'Insurance updated successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 5000);
          this.formDirty = false;
          this.searchQuery = this.searQuerybeforeUpdate;
          this.searchInsurances();
        },
        error: (error) => {
          console.error('Error updating insurance:', error);
          this.errorMessage = 'Failed to update insurance. Please try again.';
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 5000);
        }
      });
    } else {
      console.warn('No insurance selected for update');
    }
  }

  addInsurance(): void {
    console.log('Adding Insurance:', this.insuranceForm.value);
    this.insuranceService.addInsurance(this.insuranceForm.value).subscribe({
      next: (response) => console.log('Insurance added successfully:', response),
      error: (error) => console.error('Error adding insurance:', error)
    });
  }
}