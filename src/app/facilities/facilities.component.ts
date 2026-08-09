import { Component, OnInit, ViewEncapsulation  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacilityService } from '../services/facility.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { PhoneNumberService } from '../services/phone-number.service';

interface Facility {
  facility_id: number;  
  facility_nm: string;
  facility_type_id: number;
  facility_address_tx: string;
  facility_city: string;
  facility_zip_cd: string;
  facility_state: string;
  facility_phone: string;
  facility_email: string;
  facility_npi: string;
  facility_tin: string;
  entity_id: number;
  updated_by: string;
  when_updated: string;
  active_in: string;
}

interface FacilityType {
  facility_type_id: number;
  facility_type_nm: string;
}

@Component({
  selector: 'app-facilities',
  standalone: false,
  templateUrl: './facilities.component.html',
  styleUrls: ['./facilities.component.scss'],
  encapsulation: ViewEncapsulation.None
})



export class FacilitiesComponent implements OnInit  {
  facilities: Facility[] = [];
  facilityTypes: FacilityType[] = [];
  selectedFacility: Facility | null = null;
  facilityForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  showPopup: boolean = false;
  showSuccessPopup: boolean = false; 
  selectedFacilityType: number | null = null;
  isEditMode: boolean = true;
  isChecked: boolean = true;
  isIconChecked: boolean = false;
  isActive: boolean = false; 
  filteredFacilities: Facility[] = [];
  filterQuery: string = '';
  constructor(private facilityService: FacilityService, 
    private fb: FormBuilder, 
    private dialog: MatDialog,
    private phoneNumberService: PhoneNumberService ) { 
 
    this.facilityForm = this.fb.group({
      facility_nm: ['', Validators.required],
      facility_type_id: ['', Validators.required],
      facility_address_tx: ['', Validators.required],
      facility_city: ['', Validators.required],
      facility_zip_cd: ['', Validators.required],
      facility_state: ['', Validators.maxLength(2)],
      facility_phone: [''],
      facility_email: [''],
      facility_npi: [''],
      facility_tin: [''],
      entity_id: ['', Validators.required],
      facility_id: ['', Validators.required],
      updated_by: [sessionStorage.getItem('userId')],
      active_in: ['']
    });

  }
 
  facility_id = 0;


  ngOnInit(): void {
    this.facilityForm = this.fb.group({
      facility_nm: ['', Validators.required],
      facility_tin: [''],
      facility_npi: [''],
      facility_address_tx: ['', Validators.required],
      facility_city: ['', Validators.required],
      facility_state: ['', [Validators.required, Validators.maxLength(2)]],
      facility_zip_cd: ['', Validators.required],
      facility_email: [''],
      facility_phone: [''],
      facility_type_id: [''],
      entity_id: [''],
      facility_id: [''],
      updated_by: [sessionStorage.getItem('userId')],
      active_in: ['']
    });
  
    this.facilityService.getFacilities().subscribe(
      (data: Facility[]) => {
        console.log('Facility:', data); 
         this.facilities = data.sort((a, b) => 
          a.facility_nm.toLowerCase().localeCompare(b.facility_nm.toLowerCase())
        );
        this.filteredFacilities = this.facilities;
      },
      (error) => {
        console.error('Error fetching facilities:', error);
      }
    );

    this.facilityService.getFacilityTypes().subscribe(
      (data: FacilityType[]) => {
        console.log('Facility Types:', data); 
        this.facilityTypes = data;
      },
      (error) => {
        console.error('Error fetching facility types:', error);
      }
    );

  }
  initializeFacilityForm(): void {
    this.facilityForm = this.fb.group({
      facility_nm: ['', Validators.required],
      facility_tin: [''],
      facility_npi: [''],
      facility_address_tx: ['', Validators.required],
      facility_city: ['', Validators.required],
      facility_state: ['', [Validators.required, Validators.maxLength(2)]],
      facility_zip_cd: ['', Validators.required],
      facility_email:  ['', [Validators.required, Validators.email]],
      facility_phone: ['', Validators.required],
      facility_type_id: ['', Validators.required],
      updated_by: [sessionStorage.getItem('userId')],
      active_in: ['Y', Validators.required]
    });
    console.log('Facility Form Initialized');
  }


  selectFacility(facility: Facility): void {
    this.selectedFacility = facility;
    this.facilityForm.patchValue({
      facility_nm: facility.facility_nm,
      facility_type_id: facility.facility_type_id,
      facility_address_tx: facility.facility_address_tx,
      facility_city: facility.facility_city,
      facility_zip_cd: facility.facility_zip_cd,
      facility_state: facility.facility_state,
      facility_phone: facility.facility_phone,
      facility_email: facility.facility_email,
      facility_npi: facility.facility_npi,
      facility_tin: facility.facility_tin,
      facility_id: facility.facility_id,
      updated_by: facility.updated_by,
      active_in: facility.active_in
    });
    this.isEditMode = true;
    this.facility_id = facility.facility_id;
    console.log('Facility Selected:', this.selectedFacility);
    this.isIconChecked = facility.active_in === 'Y';
    this.isActive = facility.active_in === 'Y';
}

logFacilityTypeName(): void {
  const selectedType = this.facilityTypes.find(type => type.facility_type_id === this.selectedFacilityType);
  if (selectedType) {
    console.log('Selected Facility Type Name:', selectedType.facility_type_nm);
  } else {
    console.log('No facility type selected.');
  }
}
  
switchToAddMode(): void {
  console.log('Switching to add mode');
  this.isEditMode = false;
  this.selectedFacility = null;
  this.initializeFacilityForm();
}

setEditMode(updatedFacility: Facility): void {
  this.isEditMode = true;
  this.selectedFacility = updatedFacility;
  this.facilityForm.patchValue(updatedFacility);
  console.log('Switched to edit mode with updated facility:', updatedFacility);
}
onSubmit(): void {
  if (this.facilityForm.valid) {
    console.log('Form on Submit:', this.facilityForm.value);
    this.facilityForm.patchValue({ when_updated: Date.now() }); // Update timestamp before submission
    if (this.isEditMode) {
      this.updateFacility();
    } else {
      this.addFacility();
    }
  } else {
    console.error('Form is invalid');
  }
}

updateFacility(): void {
  const phone = this.facilityForm.get('facility_phone')?.value;
  if (this.validatePhoneNumber(phone)) {
    console.log('Phone number is valid');
  } else {
    console.warn('Invalid phone number');
    this.errorMessage = 'The phone number must have at least 8 digits, separated by dashes';
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 5000);
    return;
  }
  const facilityData = this.facilityForm.value;
  facilityData.entity_id = Number(sessionStorage.getItem('companyId')); 
  facilityData.facility_id = this.facility_id;
  facilityData.updated_by = sessionStorage.getItem('userId');
  //facilityData.when_updated = Date.now().toString();
  console.log('Form Submitted:', facilityData);
  // Add logic to save the facility data, e.g., call a service method
  this.facilityService.updateFacility(facilityData).subscribe(
    (response: { updatedFacility: Facility }) => { // Assuming response contains updatedFacility
      const { updatedFacility } = response; // Destructure to get updatedFacility
      console.log('Facility updated successfully:', response);
      this.successMessage = 'Facility details updated successfully!';
      this.showSuccessPopup = true;
      setTimeout(() => this.showSuccessPopup = false, 3000);
      this.refreshData();
      this.setEditMode(updatedFacility); // Pass the updated facility to setEditMode
    },
    (error: any) => {
      console.error('Error updating facility:', error);
      this.errorMessage = this.extractErrorMessage(error);
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000); 
    }
  );
}

addFacility(): void {
  
    const newFacility = this.facilityForm.value;
    newFacility.entity_id = Number(sessionStorage.getItem('companyId')); 
    newFacility.facility_id = 0; 
    newFacility.updated_by = sessionStorage.getItem('userId');
    console.log('New Facility:', newFacility);
    this.facilityService.addFacility(newFacility).subscribe(
      (facility) => {
        this.facilities.push(facility);
        this.successMessage = 'Facility added successfully!';
        this.showSuccessPopup = true;
        setTimeout(() => this.showSuccessPopup = false, 3000);
        this.refreshData();
        console.log('Refresh Edit Mode Facility:', facility);
        this.setEditMode(null as any);
        //this.selectFacility(facility);
        this.filteredFacilities = this.facilities;
      },
      (error) => {
        this.errorMessage = this.extractErrorMessage(error);
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
      }
    );
   
  }

  

 private extractErrorMessage(error: any): string {
  if (error.error && error.error.message) {
    if (Array.isArray(error.error.message)) {
      return error.error.message.join(', ');
    } else {
      return error.error.message;
    }
  }
  return 'An unexpected error occurred';
}

refreshData() {
  this.facilityService.getFacilities().subscribe(
    (data: Facility[]) => {
      console.log('Facility:', data); 
       this.facilities = data.sort((a, b) => 
        a.facility_nm.toLowerCase().localeCompare(b.facility_nm.toLowerCase())
      );
      this.filteredFacilities = this.facilities;
      this.initializeFacilityForm();
      this.filterQuery = ''
    },
    (error) => {
      console.error('Error fetching facilities:', error);
    }
  );
}



deleteFacility(facilityId: number): void {
  this.facilityService.deleteFacility(facilityId).subscribe(
    () => {
      console.log('Facility deleted successfully');
      this.successMessage = 'Facility deleted successfully!';
      this.refreshData(); // Refresh the list of facilities
      this.setEditMode(null as any);
    },
    (error) => {
      console.error('Error deleting facility:', error);
      this.errorMessage = this.extractErrorMessage(error);
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
    }
  );
}

openWarningDialog(message: string, facilityId: number): void {
  const dialogRef = this.dialog.open(WarningModalComponent, {
    data: { message: message }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('User confirmed the action');
      this.deleteFacility(facilityId); 
    } else {
      console.log('User canceled the action');
      // Handle the cancellation action
    }
  });
}


confirmAndDeleteFacility(facilityId: number): void {
  this.facilityService.hasProviders(facilityId).subscribe({
    next: (response: any[]) => {
      console.log('Response:', response); 
       // Log the response object
      const responseMessage = response[0].f_get_facility_providers;
      console.log('Response Message:', responseMessage); 
      if (responseMessage === 'OK') {
        this.openWarningDialog('Are you sure you want to delete this facility?', facilityId);
      } else {
        this.errorMessage = 'Delete failed. This Facility Has Providers'; // Display the error message
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
      }
    },
    error: (error) => {
      console.error('Error checking providers:', error);
      this.errorMessage = 'Failed to check if facility has providers.';
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
    }
  });
}

toggleCheck() {
  this.isIconChecked = !this.isIconChecked; 
  console.log('Icon Checked:', this.isIconChecked); 
  this.facilityForm.get('active_in')?.setValue(this.isIconChecked ? 'Y' : 'N'); 
}

onToggleChange(event: MatSlideToggleChange) {
  this.isActive = event.checked;
  console.log('Toggle changed:', this.isActive ? 'Active' : 'Inactive');
  this.facilityForm.get('active_in')?.setValue(this.isActive ? 'Y' : 'N');
}


filterFacilities() {
  if (!this.filterQuery) {
    this.filteredFacilities = this.facilities;
    return;
  }
  console.log('Filter Query:', this.filterQuery);
  const query = this.filterQuery.toLowerCase();
  this.filteredFacilities = this.facilities.filter(facility =>
    facility.facility_nm.toLowerCase().includes(query)
  );
}

validatePhoneNumber(phone: string): boolean {
  return this.phoneNumberService.isValidPhoneNumber(phone);
}
}
