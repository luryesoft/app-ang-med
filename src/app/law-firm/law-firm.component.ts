import { Component, OnInit, ViewEncapsulation  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LawFirmService } from '../services/law-firm.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { PhoneNumberService } from '../services/phone-number.service';


interface LawFirm {
  lw_id: number;
  lw_nm: string;
  lw_address_tx: string;
  lw_city: string;
  lw_zip_cd: string;
  lw_state: string;
  lw_phone: string;
  lw_email: string;
  lw_npi: string;
  lw_ein: string;
  updated_by: string;
  when_updated: string;
  active_in: string;
}



@Component({
  selector: 'app-law-firm',
  standalone: false,
  templateUrl: './law-firm.component.html',
  styleUrls: ['./law-firm.component.scss'],
  encapsulation: ViewEncapsulation.None
})



export class LawFirmComponent implements OnInit  {
  lawOffices: LawFirm[] = [];
  selectedLawOffice: LawFirm | null = null;
  lawOfficeForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  showPopup: boolean = false;
  showSuccessPopup: boolean = false; 
  selectedLawOfficeType: number | null = null;
  isEditMode: boolean = true;
  isChecked: boolean = true;
  isIconChecked: boolean = false;
  isActive: boolean = false; 
  filteredLawOffices: LawFirm[] = [];
  filterQuery: string = '';
  lw_id: number = 0;

  constructor(private lawFirmService: LawFirmService, 
    private fb: FormBuilder, 
    private dialog: MatDialog,
    private phoneNumberService: PhoneNumberService ) { 
 
    this.lawOfficeForm = this.fb.group({
      lw_nm: ['', Validators.required],
      lw_address_tx: ['', Validators.required],
      lw_city: ['', Validators.required],
      lw_zip_cd: ['', Validators.required],
      lw_state: ['', Validators.maxLength(2)],
      lw_phone: [''],
      lw_email: [''],
      lw_npi: [''],
      lw_ein: [''],
      lw_id: ['', Validators.required],
      updated_by: [sessionStorage.getItem('userId')],
      active_in: ['']
    });

  }
 
  facility_id = 0;


  ngOnInit(): void {
    this.lawOfficeForm = this.fb.group({
      lw_nm: ['', Validators.required],
      lw_npi: [''],
      lw_ein: [''],
      lw_address_tx: ['', Validators.required],
      lw_city: ['', Validators.required],
      lw_state: ['', [Validators.required, Validators.maxLength(2)]],
      lw_zip_cd: ['', Validators.required],
      lw_email: [''],
      lw_phone: [''],
      lw_id: [''],
      updated_by: [sessionStorage.getItem('userId')],
      active_in: ['']
    });
  
    this.lawFirmService.getLawFirmsByOfficeId(Number(sessionStorage.getItem('officeId')) ).then(
      (data: LawFirm[]) => {
        console.log('Law Office:', data);
        this.isActive = data.some(lawOffice => lawOffice.active_in === 'Y');
         this.lawOffices = data.sort((a, b) => 
          a.lw_nm.toLowerCase().localeCompare(b.lw_nm.toLowerCase())
        );
        this.filteredLawOffices = this.lawOffices;
      },
      (error: any) => {
        console.error('Error fetching law offices:', error);
      }
    );



  }
  initializeLawOfficeForm(): void {
    this.lawOfficeForm = this.fb.group({
      lw_nm: ['', Validators.required],
      lw_ein: [''],
      lw_npi: [''],
      lw_address_tx: ['', Validators.required],
      lw_city: ['', Validators.required],
      lw_state: ['', [Validators.required, Validators.maxLength(2)]],
      lw_zip_cd: ['', Validators.required],
      lw_email:  ['', [Validators.required, Validators.email]],
      lw_phone: ['', Validators.required],
      updated_by: [sessionStorage.getItem('userId')],
      active_in: ['Y', Validators.required]
    });
    console.log('Law Office Form Initialized');
  }


  selectLawOffice(lawOffice: LawFirm): void {
    this.selectedLawOffice = lawOffice;
    this.lawOfficeForm.patchValue({
      lw_nm: lawOffice.lw_nm, 
      lw_address_tx: lawOffice.lw_address_tx, 
      lw_city: lawOffice.lw_city,
      lw_zip_cd: lawOffice.lw_zip_cd,
      lw_state: lawOffice.lw_state,
      lw_phone: lawOffice.lw_phone,
      lw_email: lawOffice.lw_email,
      lw_npi: lawOffice.lw_npi,
      lw_ein: lawOffice.lw_ein,
      lw_id: lawOffice.lw_id,
      updated_by: lawOffice.updated_by,
      active_in: lawOffice.active_in
    });
    this.isEditMode = true;
    this.lw_id = lawOffice.lw_id;
    console.log('Law Office Selected:', this.selectedLawOffice, this.isActive);
    this.isIconChecked = lawOffice.active_in === 'Y';
    this.isActive = lawOffice.active_in === 'Y';
}


  
switchToAddMode(): void {
  console.log('Switching to add mode');
  this.isEditMode = false;
  this.selectedLawOffice = null;
  this.initializeLawOfficeForm();
}

setEditMode(updatedLawOffice: LawFirm): void {
  this.isEditMode = true;
  this.selectedLawOffice = updatedLawOffice;
  this.lawOfficeForm.patchValue(updatedLawOffice);
  console.log('Switched to edit mode with updated law office:', updatedLawOffice);
}
onSubmit(): void {
  this.checkFormValidity();
  if (this.lawOfficeForm.valid) {
    console.log('Form on Submit:', this.lawOfficeForm.value);
    this.lawOfficeForm.patchValue({ when_updated: Date.now() }); // Update timestamp before submission
    if (this.isEditMode) {
      this.updateLawOffice();
    } else {
      this.addLawOffice();
    }
  } else {
    console.error('Form is invalid');
    console.warn('Form is not complited');
    this.errorMessage = 'Please complete the form';
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 5000);
    return;
  }
}

updateLawOffice(): void {
  const phone = this.lawOfficeForm.get('lw_phone')?.value;
  if (this.validatePhoneNumber(phone)) {
    console.log('Phone number is valid');
  } else {
    console.warn('Invalid phone number');
    this.errorMessage = 'The phone number must have at least 8 digits, separated by dashes';
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 5000);
    return;
  }
  const lawOfficeData = this.lawOfficeForm.value;
  lawOfficeData.lw_id = this.lw_id;
  lawOfficeData.updated_by = sessionStorage.getItem('userId');

  console.log('Form Submitted:', lawOfficeData);
  // Add logic to save the facility data, e.g., call a service method
  this.lawFirmService.updateLawFirm(lawOfficeData).subscribe(
    (response: { returncd: number; returntx: string }) => {
      console.log('Law Office updated successfully:', response.returntx);
      // Handle the response as needed
      this.successMessage = 'Law Office updated successfully!';
      this.showSuccessPopup = true;
      setTimeout(() => this.showSuccessPopup = false, 3000);
      this.refreshData();

      this.lawOfficeForm.reset();
      this.selectedLawOffice = null;
      //this.isEditMode = false;
    },
    (error: any) => {
      console.error('Error updating:', error);
      this.errorMessage = this.extractErrorMessage(error);
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
    }
  );
}

addLawOffice(): void {
  
    const newLawOffice = this.lawOfficeForm.value;
    newLawOffice.entity_id = Number(sessionStorage.getItem('companyId')); 
    newLawOffice.lw_id = 0; 
    newLawOffice.updated_by = sessionStorage.getItem('userId');
    console.log('New Law Office:', newLawOffice);
    this.lawFirmService.insertLawFirm(newLawOffice).subscribe(
      (response: { returncd: number; returntx: string }) => {
       // this.lawOffices.push(response.returntx);
        this.successMessage = 'Law Office added successfully!';
        this.showSuccessPopup = true; 
        setTimeout(() => this.showSuccessPopup = false, 3000);
        this.refreshData();
        console.log('Refresh Edit Mode Law Office:', response.returntx);
        this.setEditMode(null as any);
        //this.selectLawOffice(lawOffice);
        this.filteredLawOffices = this.lawOffices;
      },
      (error: any) => {
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
  this.lawFirmService.getLawOffices().then(
    (data: LawFirm[]) => {
      console.log('Law Office:', data); 
       this.lawOffices = data.sort((a, b) => 
        a.lw_nm.toLowerCase().localeCompare(b.lw_nm.toLowerCase())
      );
      this.filteredLawOffices = this.lawOffices;
      this.initializeLawOfficeForm();
      this.filterQuery = ''
    },
    (error: any) => {
      console.error('Error fetching law offices:', error);
    }
  );
}



deleteLawOffice(lawOfficeId: number): void {
  this.lawFirmService.deleteLawFirm(lawOfficeId).subscribe(
    () => {
      console.log('Law Office deleted successfully');
      this.successMessage = 'Law Office deleted successfully!';
      this.refreshData(); // Refresh the list of law offices
      this.setEditMode(null as any);
      this.successMessage = 'Law Office deleted successfully!';
      this.showSuccessPopup = true; 
      setTimeout(() => this.showSuccessPopup = false, 3000);
    },
    (error: any) => {
      console.error('Error deleting law office:', error);
      this.errorMessage = this.extractErrorMessage(error);
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
    }
  );
}



openWarningDialog(message: string, lawOfficeId: number): void {
  const dialogRef = this.dialog.open(WarningModalComponent, {
    data: { message: message }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('User confirmed the action');
      this.deleteLawOffice(lawOfficeId); 
    } else {
      console.log('User canceled the action');
      // Handle the cancellation action
    }
  });
}


confirmAndDeleteLawOffice(lawOfficeId: number): void {

        this.openWarningDialog('Are you sure you want to delete this law office?', lawOfficeId);

}

toggleCheck() {
  this.isIconChecked = !this.isIconChecked; 
  console.log('Icon Checked:', this.isIconChecked); 
  this.lawOfficeForm.get('active_in')?.setValue(this.isIconChecked ? 'Y' : 'N'); 
}

onToggleChange(event: MatSlideToggleChange) {
  this.isActive = event.checked;
  console.log('Toggle changed:', this.isActive ? 'Active' : 'Inactive');
  this.lawOfficeForm.get('active_in')?.setValue(this.isActive ? 'Y' : 'N');
}


filterLawOffices() {
  if (!this.filterQuery) {
    this.filteredLawOffices = this.lawOffices;
    return;
  }
  console.log('Filter Query:', this.filterQuery);
  const query = this.filterQuery.toLowerCase();
  this.filteredLawOffices = this.lawOffices.filter(lawOffice =>
    lawOffice.lw_nm.toLowerCase().includes(query)
  );
}

validatePhoneNumber(phone: string): boolean {
  return this.phoneNumberService.isValidPhoneNumber(phone);
}

checkFormValidity(): void {
  Object.keys(this.lawOfficeForm.controls).forEach(key => {
    const control = this.lawOfficeForm.get(key);
    if (control && control.invalid) {
      console.log(`Control ${key} is invalid. Errors:`, control.errors);
    }
  });
}
}
