import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MiscellaneousService } from '../services/miscellaneous.service';
import { GlobalService } from '../services/global.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CptCodeDialogComponent } from '../cpt-code-dialog/cpt-code-dialog.component';
import { CptCodeDto } from '../models/cpt-codes-dto';
import { IcdCodeDialogComponent } from './icd-code-dialog/icd-code-dialog.component';

@Component({
  selector: 'app-miscellaneous',
  standalone: false,
  templateUrl: './miscellaneous.component.html',
  styleUrls: ['./miscellaneous.component.scss'],
  encapsulation: ViewEncapsulation.None
})


export class MiscellaneousComponent implements OnInit {
  cptCodes: any[] = [];
  icdCodes: any[] = [];
  filteredCptCodes: any[] = [];
  filteredIcdCodes: any[] = [];
  entityId!: number;
  dataSource = new MatTableDataSource<any>(this.cptCodes);
  dataSourceIcd = new MatTableDataSource<any>(this.icdCodes);
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'cpt_code', 
    'cpt_code_short_nm', 
    'cpt_code_description', 
    'cpt_code_modifier', 
    'cpt_code_charge_am', 
    'active_in'
  ];
  displayedColumnsIcd: string[] = [
    'icd_id', 
    'icd_code', 
    'icd_code_description', 
    'icd_code_text',
    'active_in'
  ];
  updateForm!: FormGroup;  
  selectedRow: any = {};
  selectedRowIndex!: number;
  selectedRowIndexIcd!: number;
  isLeftExpanded = false;
  isRightExpanded = false;
  filterQuery: string = '';
  active_in: string=''; 
  errorMessage: string = ''; // Declare the errorMessage property
  showPopup: boolean = false; 
  successMessage: string = '';
  showSuccessPopup: boolean = false;
  userId: string = '';
  isEditMode = false;
  icdFilterQuery: string = '';
  icdCode: string = '';
  modifiedRows: Set<number> = new Set<number>(); 

  constructor(private miscellaneousService: MiscellaneousService,
    private globalService: GlobalService,
    private fb: FormBuilder,
    private dialog: MatDialog


  ) { } 
  applyIcdFilter() {
    this.dataSourceIcd.filter = this.icdFilterQuery.trim().toLowerCase();
  }

  clearIcdFilter() {
    this.icdFilterQuery = '';
    this.applyIcdFilter();
  }
  ngOnInit(): void {
    // Example usage with hardcoded values
    this.entityId = this.globalService.getCompanyId();
    this.userId = this.globalService.getUserId();
    this.loadBusinessEntityCptCodes(this.entityId, 'D', '');
    this.loadBusinessEntityIcdCodes(this.entityId, 'D', '');
    this.updateForm = this.fb.group({
      cpt_code: ['', Validators.required],
      cpt_code_short_nm: ['', Validators.required], 
      cpt_code_description: ['', Validators.required],
      cpt_code_modifier: [''],
      cpt_code_charge_am: ['', [Validators.required, this.currencyValidator]],
      active_in: ['', Validators.required]
      // Add more form controls as needed
    });

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const dataStr = (data.cpt_code + data.cpt_code_description).toLowerCase();
      return dataStr.toLowerCase().includes(filter);
    };

    this.dataSourceIcd.filterPredicate = (data: any, filter: string) => {
      const dataStr = (data.icd_code + data.icd_code_description).toLowerCase();
      return dataStr.includes(filter);
    };
  }


  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  loadBusinessEntityCptCodes(id: number, type: string, searchTerm: string): void {
    this.miscellaneousService.getBusinessEntityCptCodes(id, type, searchTerm).subscribe(data => {
      this.cptCodes = data;
      this.filteredCptCodes = data;
      this.dataSource.data = this.cptCodes;
      console.log(this.cptCodes);
    });
  }

 loadBusinessEntityIcdCodes(id: number, type: string, searchTerm: string): void {
    this.miscellaneousService.getBusinessEntityIcdCodes(id, type, searchTerm).subscribe(data => {
      this.icdCodes = data;
      this.filteredIcdCodes = data;
      this.dataSourceIcd.data = this.icdCodes;
      console.log(this.dataSourceIcd.data[0].active_in);
      
    });
  }

  toggleLeftPanel() {
    this.isLeftExpanded = !this.isLeftExpanded;
    if (this.isLeftExpanded) {
        this.isRightExpanded = false; // Ensure only one panel is expanded at a time
    }
}

toggleRightPanel() {
    this.isRightExpanded = !this.isRightExpanded;
    if (this.isRightExpanded) {
        this.isLeftExpanded = false; // Ensure only one panel is expanded at a time
    }
}

applyFilter() {
  this.dataSource.filter = this.filterQuery.trim().toLowerCase();
}

clearFilter() {
  this.filterQuery = '';
  this.applyFilter();
}

selectRow(row: any) {
  this.selectedRow = { ...row }; 
  this.isEditMode = true;
  this.selectedRowIndex = this.dataSource.data.indexOf(row);
  this.updateForm.patchValue({
    cpt_code: row.cpt_code,
    cpt_code_description: row.cpt_code_description,
    cpt_code_short_nm: row.cpt_code_short_nm,
    cpt_code_modifier: row.cpt_code_modifier,
    cpt_code_charge_am: row.cpt_code_charge_am,
    active_in: row.active_in  
    // Patch more values as needed
    
  });
  console.log(this.selectedRow);
  this.onStatusChange(row.active_in);
  this.selectedRow.active_in = row.active_in;
  console.log('Select Row isActive:',this.isActive);
}

updateRow() {
  if (this.updateForm.valid) {
    console.log(this.updateForm.value);
    // Implement your update logic here
  }
}

openWarningDialog(message: string, cptId: number): void {
  console.log(cptId);
  const dialogRef = this.dialog.open(WarningModalComponent, {
    data: { message: message }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('User confirmed the action');
      this.deleteCptCode(cptId); 
    } else {
      console.log('User canceled the action');
      // Handle the cancellation action
    }
  });
}

deleteCptCode(cptId: number): void {
  this.miscellaneousService.deleteCptCode(this.entityId, cptId).subscribe(response => {
    if (response.returncd == 1) {
    console.log('CPT code deleted successfully:', response);
    this.loadBusinessEntityIcdCodes(this.entityId, 'D', '');
    this.isEditMode = false;
    this.selectedRow = null;
      this.clearForm();
      this.successMessage = 'CPT code deleted successfully!';
      this.showSuccessPopup = true;
      setTimeout(() => this.showSuccessPopup = false, 3000);
    } else {
      this.errorMessage = 'Error deleting CPT code';
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
    }
  });

}

deleteSelectedRow(): void {
  if (this.selectedRow) {
    const cptId = this.selectedRow.cpt_id; 
    console.log(cptId);
    const index = this.dataSource.data.indexOf(this.selectedRow);
    if (index > -1) {
      const updatedData = [...this.dataSource.data];
      updatedData.splice(index, 1); // Remove the selected row from the data array
      this.dataSource.data = updatedData; // Reassign the updated data array to the data source
      this.selectedRow = null; // Clear the selected row
    }
  }
}

onStatusChange(event: any): void {
  this.active_in = event;
  
  if (this.selectedRow) {
    this.selectedRow.active_in = event; // Update the selected row's active_in field
    this.updateForm.patchValue({ active_in: event }); // Update the form control
  }
  this.updateForm.patchValue({ active_in: event }); 
  console.log('event changed:', event);
}


get isActive(): boolean {
  this.logInvalidControls();
  return this.updateForm.valid; 
  console.log('Valid:',this.updateForm.valid); 
  console.log('Get Active:',this.isActive); 
}


logInvalidControls(): void {
  const invalidControls = [];
  const controls = this.updateForm.controls;
  for (const name in controls) {
    if (controls[name].invalid) {
      invalidControls.push(name);
    }
  }
  //console.log('Invalid controls:', invalidControls);
}

onSubmitCptCode(): void {
  if (this.isEditMode) {
    this.onSubmitUpdateCptCode();
  } else {
    this.onSubmitInsertCptCode();
  }
}

onSubmitUpdateCptCode(): void {
  if (this.updateForm.valid) {
    const formData = this.updateForm.value;
    const cptCodeData = {
      data: [
        {
          entity_id: this.entityId,
          cpt_id: this.selectedRow.cpt_id,
          cpt_code: formData.cpt_code,
          cpt_code_short_nm: formData.cpt_code_short_nm,
          cpt_code_description: formData.cpt_code_description,
          cpt_code_modifier: formData.cpt_code_modifier,
          cpt_code_charge_am: formData.cpt_code_charge_am,
          active_in: formData.active_in,
          when_updated: null,
          updated_by: this.userId
        }
      ],  
      returncd: 0,
      returntx: ''
    };

    this.miscellaneousService.updateCptCode(cptCodeData).subscribe(
      response => {
        console.log('CPT code updated successfully:', response);
        if (response.returncd == 1) {
          this.loadBusinessEntityCptCodes(this.entityId, 'D', '');
          this.successMessage = 'CPT code updated successfully!::'+response.returntx;
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);
          console.log('CPT code updated successfully:', response);
        } else {
          this.errorMessage = 'Error updating CPT code::'+response.returntx;
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }
      },
      error => {
        console.error('Error updating CPT code:', error);
        this.errorMessage = 'Error updating CPT code::'+error;
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
      }
    );
  } else {
    console.warn('CPT code form is invalid');
  }
}

onSubmitInsertCptCode(): void {
  if (this.updateForm.valid) {
    const formData = this.updateForm.value;
     // Create the JSON structure
    const cptCodeData = {
      data: [
        {
          entity_id: this.entityId, // Assuming entityId is set elsewhere in your component
          cpt_id: null, // Set this to the appropriate value if needed
          cpt_code: formData.cpt_code,
          cpt_code_short_nm: formData.cpt_code_short_nm,
          cpt_code_description: formData.cpt_code_description,
          cpt_code_modifier: formData.cpt_code_modifier,
          cpt_code_charge_am: formData.cpt_code_charge_am,
          active_in: formData.active_in,
          when_updated: null, // Set this to the appropriate value if needed
          updated_by: this.userId // Replace with dynamic user data if available
        }
      ],
      returncd: 0,
      returntx: ''
    };

    console.log(cptCodeData);
     this.miscellaneousService.insertCptCode(cptCodeData).subscribe(
      response => {
        console.log('CPT code inserted successfully:', response);
        if (response.returncd == 1) {
          this.loadBusinessEntityCptCodes(this.entityId, 'D', '');
          this.successMessage = 'CPT code inserted successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);
          this.clearForm();
        } else {
          this.errorMessage = 'Error inserting CPT code';
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
        }
      },
      error => {
        console.error('Error inserting CPT code:', error);
        this.errorMessage = 'Error inserting CPT code';
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
      }
    );
  } else {
    console.warn('CPT code form is invalid');
  }
  }

  currencyValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value = control.value;
    const currencyRegex = /^\d+(\.\d{1,2})?$/; // Matches numbers with up to two decimal places
    return currencyRegex.test(value) ? null : { invalidCurrency: true };
    console.log(currencyRegex.test(value));
  }

  clearForm(): void {
    this.selectedRow = null;
    this.updateForm.reset();
  }

  switchToAddMode(): void {
    console.log('Switching to add mode');
    this.isEditMode = false;
    this.selectedRow = null;
    this.clearForm();
    console.log('Switch mode Active:',this.isActive);
  }


  searchCPTCodes(type: string, search: string): void {

    this.miscellaneousService.getSearchCptCodes(type, search).subscribe(
        data => {
            console.log('Search results:', data);
            this.openCptCodeDialog(data); 
        },
        error => {
            console.error('Error fetching search results:', error);
            // Handle the error as needed
        }
    );    
  }

  openCptCodeDialog(cptCodes: CptCodeDto[]): void {
    const dialogRef = this.dialog.open(CptCodeDialogComponent, {
      width: '55vw',
      height: '95vh',
      data: { title: 'CPT Codes', details: cptCodes } 
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed:', result);
      if (result) {
        this.loadBusinessEntityCptCodes(this.entityId, 'D', '');
        }
    });
  }

onActiveInChange(elementicd: any): void {
  console.log('onActiveInChange:', elementicd);

}
saveRow(elementicd: any): void {
  console.log('Saving row:', elementicd);
  // Implement your save logic here, such as sending the updated data to the server
}

toggleSingleSelectionIndicator(): boolean {
  // Implement your logic here
  return true; // or false based on your logic
}

selectIcdRow(element: any): void {
  this.selectedRowIndexIcd = this.dataSourceIcd.data.indexOf(element);
  // Additional logic for handling the selected row can be added here
  console.log('Selected ICD Row:', element);
  this.onRowSelect(element);
}


openIcdCodeDialog(): void {
  const dialogRef = this.dialog.open(IcdCodeDialogComponent, {
    width: '65vw',
    height: '95vh'
    // No data property is passed here
  });

  dialogRef.afterClosed().subscribe(result => {
    console.log('ICD Dialog closed:', result);
    // Handle any actions after the dialog is closed
    if (result) {
      this.loadBusinessEntityIcdCodes(this.entityId, 'D', '');
    }
  });
}

openWarningIcdDialog(message: string, icdcode: string): void {
  console.log('this.icdCode:', this.icdCode);
  const dialogRef = this.dialog.open(WarningModalComponent, {
    data: { message: 'Are you sure you want to delete '+this.icdCode+' ICD code?' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('User confirmed the action');
      this.deleteIcdCode(this.icdCode); 
    } else {
      console.log('User canceled the action');
      // Handle the cancellation action
    }
  });
}
deleteIcdCode(icdcode: string): void {
  this.miscellaneousService.deleteIcdCode(this.entityId, icdcode).subscribe(response => {
    if (response.returncd == 1) {
    console.log('ICD code deleted successfully:', response);
    this.loadBusinessEntityIcdCodes(this.entityId, 'D', '');
    this.isEditMode = false;
    this.selectedRow = null;
      this.clearForm();
      this.successMessage = 'ICD code deleted successfully!';
      this.showSuccessPopup = true;
      setTimeout(() => this.showSuccessPopup = false, 3000);
    } else {
      this.errorMessage = 'Error deleting ICD code';
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
    }
  });

}

onRowSelect(row: any): void {
  this.selectedRow = row;
  console.log('Selected Row:', this.selectedRow);

  if (this.selectedRow && this.selectedRow.icd_code) {
    this.icdCode = this.selectedRow.icd_code;
    console.log('ICD Code:', this.icdCode);
  } else {
    console.error('ICD Code is undefined');
  }
}

markRowAsModified(icdCodeId: number): void {
  this.modifiedRows.add(icdCodeId);
  console.log('Modified Rows:', this.modifiedRows);
}

updateModifiedRows(): void {
  console.log('Update Modified Rows:', this.modifiedRows);
  const updatedRows = this.icdCodes
    .filter(code => this.modifiedRows.has(code.icd_code)) 
    .map(code => ({
      icdcode: code.icd_code,
      short_text: code.icd_code_text,
      status: code.active_in
    }));

  this.miscellaneousService.updateIcdCodes(updatedRows, this.entityId, this.userId ).subscribe(
    response => {
      console.log('Update successful:', response);
      this.modifiedRows.clear(); 
      this.successMessage = 'ICD code updated successfully!';
      this.showSuccessPopup = true;
      setTimeout(() => this.showSuccessPopup = false, 3000);
    },
    error => {
      console.error('Error updating ICD codes:', error);
      this.errorMessage = 'Error updating ICD code';
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
    }
  );
}
}

