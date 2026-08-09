import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CptCodeDto } from '../models/cpt-codes-dto'; 
import { MiscellaneousService } from '../services/miscellaneous.service';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GlobalService } from '../services/global.service';

@Component({
  selector: 'app-cpt-code-dialog',
  templateUrl: './cpt-code-dialog.component.html',
  styleUrls: ['./cpt-code-dialog.component.scss']
})
export class CptCodeDialogComponent {
  toggleState: string = 'all';
  cptCodes: CptCodeDto[] = [];
  filteredCptCodes: CptCodeDto[] = [];
  filterQuery: string = '';
  selectedCptCodes: Set<string> = new Set<string>();
  entityId!: number;
  userId!: string;
  errorMessage: string = ''; // Declare the errorMessage property
  showPopup: boolean = false; 
  successMessage: string = '';
  showSuccessPopup: boolean = false;
  constructor(
    public dialogRef: MatDialogRef<CptCodeDialogComponent>,
    private miscellaneousService: MiscellaneousService,
    private dialog: MatDialog,
    private globalService: GlobalService,
    @Inject(MAT_DIALOG_DATA) public data: { title: string,details: CptCodeDto[] }
  ) {
    if (this.data && this.data.details) {
      this.cptCodes = this.data.details;
      console.log(`Dialog CPT Codes: ${JSON.stringify(this.cptCodes, null, 2)}`);
} else {
      console.error('Facilities data is undefined or not passed correctly.');
}
}

ngOnInit(): void {
  this.applyFilter(); 
  this.filteredCptCodes = this.sortData(this.cptCodes);
  this.entityId = this.globalService.getCompanyId();
  this.userId = this.globalService.getUserId();
}

sortData(data: CptCodeDto[]): CptCodeDto[] {
  return data.sort((a, b) => a.cpt_code.localeCompare(b.cpt_code));
}
applyFilter(): void {
  const query = this.filterQuery.toLowerCase().trim();
  let filtered = this.cptCodes.filter(code =>
    code.cpt_code.toLowerCase().includes(query) ||
    code.cpt_code_description.toLowerCase().includes(query)
  );

  if (this.toggleState === 'selected') {
    filtered = filtered.filter(code => this.selectedCptCodes.has(code.cpt_code));
  }

  this.filteredCptCodes = filtered;
}

toggleSelection(cptCode: string): void {
  if (this.selectedCptCodes.has(cptCode)) {
    this.selectedCptCodes.delete(cptCode);
  } else {
    this.selectedCptCodes.add(cptCode);
  }
  this.applyFilter(); 
  console.log('Selected CPT Codes:', Array.from(this.selectedCptCodes));
}

toggleFilter(state: string): void {
  this.toggleState = state;
  console.log('Togle state:', state);
  this.applyFilter(); 
// Reapply filter when toggle state changes
}

confirmSelection(): void {
  console.log('Selected CPT Codes:', Array.from(this.selectedCptCodes));
  this.dialogRef.close(Array.from(this.selectedCptCodes));
}

onClose(): void {
  this.dialogRef.close();
}

clearFilter(): void {
  this.filterQuery = '';
  this.filteredCptCodes = [...this.cptCodes]; // Reset to show all codes
}

openWarningDialog(message: string): void {
  console.log(message);
  const dialogRef = this.dialog.open(WarningModalComponent, {
    data: { message: message }
  }); 

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('User confirmed the action');
      this.onCopyCptCodes(); 
    } else {
      console.log('User canceled the action');
      // Handle the cancellation action
    }
  });
}

onCopyCptCodes(): void {
  const selectedCptCodeIds = Array.from(this.selectedCptCodes);
  this.miscellaneousService.copyCptCodes(this.userId, this.entityId, selectedCptCodeIds).subscribe(
    (response) => {
      console.log('Response:', response);
      if (response.returncd > 0) {
        console.log('CPT code inserted:', response);
          this.successMessage = 'CPT code(s) copied successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);
          this.closeDialog(true);
        } else {
          this.errorMessage = 'Error copying CPT code(s):: '+response.returntx;
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000);
          this.closeDialog(false);
        }
    },
    (error) => {
      console.error('Error:', error);
      this.closeDialog(false);
    }
  );
}

closeDialog(success: boolean): void {
    this.dialogRef.close(success); // Pass true or false based on the operation's success
}

toggleSingleSelectionIndicator(): boolean {
  // Implement your logic here
  return true; // or false based on your logic
}
}