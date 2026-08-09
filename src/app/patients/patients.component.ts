import { Component, OnInit, ViewChild } from '@angular/core';
import { PatientSearchService } from '../services/patients.service';
import { FormGroup, Validators } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { phoneValidator } from '../pipes/phone-validator';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GlobalService } from '../services/global.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { PdfComponent } from '../pdfgen/pdfgen.component';
import { Patient } from '../models/patient.model';



@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss']
})
export class PatientsComponent implements OnInit{
  @ViewChild(MatExpansionPanel) panel!: MatExpansionPanel; 
  searchQuery: string = '';
  filteredOptions: any[] = [];
  entityId: number = 0; // Example entity ID, replace with actual logic
  userId: string = '';
  searchType: string = 'L'; // Example search type, replace with actual logic
  selectedOption: any = null;
  patientForm: FormGroup;
  errorMessage: string = ''; // Declare the errorMessage property
  showPopup: boolean = false; 
  successMessage: string = '';
  showSuccessPopup: boolean = false;
  isUpdateMode: boolean = false;

  constructor(
    private patientSearchService: PatientSearchService, 
    private fb: FormBuilder,
    private dialog: MatDialog,
    private globalService: GlobalService,
    //private pdfService: PdfService
    ) {
    this.patientForm = this.fb.group({
      entity_id: [''],
      ptn_active_flag: ['', [Validators.required]],
      ptn_address: ['', [Validators.required]],
      ptn_city: ['', [Validators.required]],
      ptn_comments: [''],
      ptn_date_of_birth: ['',Date, [Validators.required]],
      ptn_first_nm: ['', [Validators.required]],
      ptn_home_phone: [''], //[Validators.required, phoneValidator()]],
      ptn_id: [''],
      ptn_last_nm: ['', [Validators.required]],
      ptn_mid_init: [''],
      ptn_mobile_phone: [''],//[Validators.required, phoneValidator()]],
      ptn_occupation: [''],
      ptn_sex: [''],
      ptn_ssn: [''],
      ptn_state: [''],
      ptn_zip: [''],
      who_updated: ['']
    });
  }

  ngOnInit(): void {
    this.entityId = this.globalService.getCompanyId();
    this.userId = this.globalService.getUserId();
    // Initialize form with selected patient data if available
    if (this.selectedOption) {
      this.patchPtnFormValues(this.selectedOption);
    }
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.searchQuery.length > 0) { 
      //check for alphanumeric only
      const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(this.searchQuery.trim());
      if (!isAlphanumeric) {
        this.errorMessage = 'Search must contain only alphanumeric characters';
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
        return;
      }

      const isNumeric = !isNaN(Number(this.searchQuery.trim()));
      if (isNumeric) {
        console.log('Search query is numeric:', this.searchQuery);
        this.searchType='S';
      } else {
        console.log('Search query is not numeric:', this.searchQuery);
        this.searchType='L';
      }
      // Trigger search on Enter key
      this.patientSearchService.getSearchPatients(this.entityId, this.searchType, this.searchQuery.trim())
        .subscribe(
          data => {
            console.log(data);
            this.filteredOptions = data;
            if (this.filteredOptions.length === 0) {
              //this.isUpdateMode = false;
              this.clearSelection();
              console.error('no data found');
              this.errorMessage = 'No data found';
              this.showPopup = true;
              setTimeout(() => this.showPopup = false, 3000);                 
            }
            else {
              this.isUpdateMode = true;
            }
          },
          error => {
            console.error('Error fetching search results:', error);
          }
        );
    }
  }

  isPtnFormChanged(): boolean {
    return this.patientForm.dirty;
  }

  onPtnFormFocusOut(): void {
    console.log('Focus exited the form');
    // Perform any additional actions needed when focus exits the form
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
    });
  }

  clearSelection(): void {
    this.filteredOptions = [];
    this.searchQuery = '';
    console.log('Options cleared');
  }

  onOptionClick(option: any): void {
    this.selectedOption = option;
    console.log('Selected option:', this.selectedOption);
    this.clearSelection();
    this.patchPtnFormValues(this.selectedOption);
  }

  openWarningDialog(message: string, ptnId: number): void {
    console.log(ptnId);
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message: message }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('User confirmed the action');
        console.log(message, ptnId);
        if (message.toLowerCase().includes('patient')) {
          console.log('delete patient');
          this.deletePatient(this.entityId, ptnId);
        }
      } else {
        console.log('User canceled the action');
        // Handle the cancellation action
      }
    });
  }

  toggleMode(): void {
    console.log('toggleMode1:', this.isUpdateMode);
    this.isUpdateMode = false;
    this.patientForm.reset(); 
    this.selectedOption = null;
    console.log('toggleMode2:', this.isUpdateMode);
  }


  onSubmit(patientData: any): void {
    
 //    if (this.patientForm.valid) {
        if (this.isUpdateMode) {
          console.log('Form submitted:', patientData);
          this.updatePatient(patientData);    
        }   else {
          this.insertPatient(patientData);
        }
  //    } else {

  //    }

    }
  
 


  validatePatientData(patientData: any): boolean {
        patientData.ptn_date_of_birth = this.parseDateString(patientData.ptn_date_of_birth);

    if (patientData.ptn_home_phone) {
      patientData.ptn_home_phone = patientData.ptn_home_phone.replace(/\D/g, '');
    } else {
      patientData.ptn_home_phone = ''; // or handle it as needed
    }
    
    if (patientData.ptn_home_phone.length === 10  || patientData.ptn_home_phone === '') {
      console.log('phone value is valid');
    }
    else   {
        this.errorMessage = 'Home phone must be 10 digits long';
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
        return false;
    }
    
    if (patientData.ptn_mobile_phone) {
      patientData.ptn_mobile_phone = patientData.ptn_mobile_phone.replace(/\D/g, '');
    } else {
      patientData.ptn_mobile_phone = ''; // or handle it as needed
    }
    if (patientData.ptn_mobile_phone.length === 10  || patientData.ptn_mobile_phone === '') {
      console.log('phone value is valid');
    }
    else   {
        this.errorMessage = 'Mobile phone must be 10 digits long';
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
        return false;
    }

    if (patientData.ptn_ssn) {
      patientData.ptn_ssn = patientData.ptn_ssn.replace(/\D/g, '');
    } else {
      patientData.ptn_ssn = ''; // or handle it as needed
    }

    console.log('SSN::',patientData.ptn_ssn);
    if (patientData.ptn_ssn.length === 9  || patientData.ptn_ssn === '') {
      console.log('SSN value is valid');
    }
    else   {
        this.errorMessage = 'SSN must be 9 digits long';
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
        return false;
    }
    return true;
  }

  deletePatient(entityId: number, patientId: number): void {
    // Implement the logic to delete a patient
    console.log(`Deleting patient with ID: ${patientId} for entity: ${entityId}`);
    this.patientSearchService.deletePatient(entityId, patientId).subscribe(
      response => {
        if (response.returncd === 1) {
          console.log('Patient deleted successfully:', response);
          this.successMessage = 'Patient updated successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);
          this.patientForm.reset();
          this.clearSelection();
          this.selectedOption = null;
          this.isUpdateMode = false;
        }
        else {
          console.error('Error deleting patient:', response);
          this.errorMessage = 'Patient is not deleted. ' + response.returntx;
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 5000);
        }
      },
      error => {
        console.error('Error deleting patient:', error);
        console.error('Error fetching search results:', error);
        this.errorMessage = 'Error fetching search results';
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);   
      }
    );
  }

  updatePatient(patientData: any): void {
    patientData.who_updated = this.userId;
    patientData.entity_id = this.entityId;

    if (!this.validatePatientData(patientData)) {
      return;
    }
  
    this.patientSearchService.updatePatient(patientData)
      .subscribe(
        response => {
          console.log('Patient updated successfully:', response);
          this.successMessage = 'Patient updated successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);
          this.patientForm.reset();
          
          
          this.patientSearchService.getSearchPatients(patientData.entity_id, 'S', patientData.ptn_id)
          .subscribe(
            data => {
              console.log(data);
              this.filteredOptions = data;
              this.onOptionClick(this.filteredOptions[0]);

            },
            error => {
              console.error('Error fetching search results:', error);
              this.errorMessage = 'Error fetching search results';
              this.showPopup = true;
              setTimeout(() => this.showPopup = false, 3000);              
            }
          );
          
        },
        error => {
          console.error('Error updating patient:', error);
          this.errorMessage = 'Error updating patient';
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }
      );
  }

  insertPatient(patientData: any): void {
    patientData.entity_id = this.entityId;
    patientData.ptn_id = 0;
    //patientData.ptn_active_flag = 'Y';
    patientData.who_updated = this.userId;

    console.log(patientData);
    if (!this.validatePatientData(patientData)) {
      return;
    }
    this.patientSearchService.insertPatient(patientData)
      .subscribe(
        response => {
          console.log('Patient inserted successfully:', response);
          this.successMessage = 'Patient inserted successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);
          this.patientForm.reset();

          this.patientSearchService.getSearchPatients(patientData.entity_id, 'S', response.returncd.toString())
          .subscribe(
            data => {
              console.log(data);
              this.filteredOptions = data;
              this.onOptionClick(this.filteredOptions[0]);
              this.isUpdateMode = true;
            },
            error => {
              console.error('Error fetching search results:', error);
              this.errorMessage = 'Error fetching search results';
              this.showPopup = true;
              setTimeout(() => this.showPopup = false, 3000);              
            }
          );
        },
        error => {
          console.error('Error inserting patient:', error);
          this.errorMessage = 'Error inserting patient:' + error;
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }
      );
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
    let trimmedDateString: string;
    trimmedDateString = '';
    if (dateString.length >= 10) {
      // Extract the first 8 characters
      trimmedDateString = dateString.substring(0, 10);
      console.log('parse:',trimmedDateString);
    } else {
      trimmedDateString = dateString;
    }
    const dateObj = new Date(trimmedDateString); 
    if (!isNaN(dateObj.getTime())) {
      const formattedDate = this.formatDateToMMDDYYYY(trimmedDateString);
      console.log('parse 1:',formattedDate);
      return formattedDate;
    } else {
      const formattedDate = this.formatDateForInput(trimmedDateString);
      console.log('parse 2:',formattedDate);
      return formattedDate;
    }
    
   
}

generatePDFone() {
  PdfComponent.patientInfo(this.selectedOption as Patient );
}

formatDateToMMDDYYYY(dateString: string): string  {
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return ''; // Return null or handle invalid date as needed
  }

  const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
  const day = ('0' + date.getDate()).slice(-2);
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}
}