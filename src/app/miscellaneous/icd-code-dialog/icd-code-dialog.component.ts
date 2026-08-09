import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IcdCodeDto } from '../../models/icd-codes-dto'; 
import { MiscellaneousService } from '../../services/miscellaneous.service';
import { WarningModalComponent } from '../../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GlobalService } from '../../services/global.service';

@Component({
  selector: 'app-icd-code-dialog',
  templateUrl: './icd-code-dialog.component.html',
  styleUrls: ['./icd-code-dialog.component.scss']
})
export class IcdCodeDialogComponent {

  errorMessage: string = ''; // Declare the errorMessage property
  showPopup: boolean = false; 
  successMessage: string = '';
  showSuccessPopup: boolean = false;
  icdCodes: IcdCodeDto[] = [];
  filteredIcdCodes: IcdCodeDto[] = [];
  filterQuery: string = '';
  selectedIcdCodes: Set<string> = new Set<string>();
  entityId!: number;
  userId!: string;
  type: string = 'D';
  search: string = '';
  isLoading: boolean = false;
  //toggleSingleSelectionIndicator: boolean = false;
  toggleState: string = 'all';


  constructor(
    public dialogRef: MatDialogRef<IcdCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private miscellaneousService: MiscellaneousService,
    private globalService: GlobalService,
  ) {}

  ngOnInit(): void {

    this.entityId = this.globalService.getCompanyId();
    this.userId = this.globalService.getUserId();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  clearFilter(): void {
    this.filterQuery = '';
  }
  openWarningDialog(message: string): void {
    console.log(message);   
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message: 'Are you sure you want to copy the selected ICD codes?' }
    }); 
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('User confirmed the action');
        this.onCopyIcdCodes(); 
      } else {
        console.log('User canceled the action');
        // Handle the cancellation action
      }
    });
  }

  onCopyIcdCodes(): void {
    console.log('Copy ICD Codes:user', this.userId);
    const selectedIcdCodeIds = Array.from(this.selectedIcdCodes);
    this.miscellaneousService.copyIcdCodes(this.userId, this.entityId, selectedIcdCodeIds).subscribe(
      (response) => {
        console.log('Response:', response);
        if (response.returncd > 0) {
          console.log('ICD code inserted:', response);
            this.successMessage = 'ICD code(s) copied successfully!';
            this.showSuccessPopup = true;
            setTimeout(() => this.showSuccessPopup = false, 3000);
            this.closeDialog(true);
          } else {
            this.errorMessage = 'Error copying ICD code(s):: '+response.returntx;
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

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.applySearch();
    }
  }

  applySearch(): void {
    const query = this.filterQuery.trim();
    this.type = 'D';
    if (query.length >= 4) {
      if (/\d/.test(query.charAt(1))) {
        this.type = 'C'; // Return 'D' if the second character is numeric
      }

      this.search = query;
      console.log(this.type);
      console.log(this.search);
      this.isLoading = true;
      this.miscellaneousService.getSearchIcdCodes(this.type, this.search).subscribe(
        (data: IcdCodeDto[]) => {
          this.icdCodes = data;
          this.filteredIcdCodes = data;
            console.log('ICD Codes:',this.icdCodes);
          this.isLoading = false;
        },
        error => {
          console.error('Error fetching ICD codes:', error);
          this.errorMessage = 'Failed to fetch ICD codes.';
          this.showPopup = true;
          this.isLoading = false;
        }
      );
    }
  
  }

  clearSearch(): void {
    this.filterQuery = '';
    this.filteredIcdCodes = [...this.icdCodes]; 
  }
  


  toggleSelection(icdCode: string): void {
    if (this.selectedIcdCodes.has(icdCode)) {
      this.selectedIcdCodes.delete(icdCode);
    } else {
      this.selectedIcdCodes.add(icdCode);
    }
   // this.applyFilter(); 
    console.log('Selected ICD Codes:', Array.from(this.selectedIcdCodes));
  }
  
  toggleFilter(state: string): void {
    this.toggleState = state;
    console.log('Togle state:', state);
    this.applyFilter(); 
  // Reapply filter when toggle state changes
  }


  applyFilter(): void {
    if (this.toggleState === 'selected') {
      // Filter to show only selected ICD codes
      this.filteredIcdCodes = this.icdCodes.filter(code => this.selectedIcdCodes.has(code.icd_code));
    } else {
      // Show all ICD codes
      this.filteredIcdCodes = [...this.icdCodes];
    }
    console.log('Filtered ICD Codes:', this.filteredIcdCodes);
    console.log('All ICD Codes:', this.icdCodes);
    console.log('Selected ICD Codes:', Array.from(this.selectedIcdCodes));
  }

  toggleSingleSelectionIndicator(): boolean {
    // Implement your logic here
    return true; // or false based on your logic
  }

  closeDialog(success: boolean): void {
    this.dialogRef.close(success); // Pass true or false based on the operation's success
}
}
