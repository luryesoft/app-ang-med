import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IcdCodeDto } from '../../models/icd-codes-dto';
import { MiscellaneousService } from '../../services/miscellaneous.service';
import { WarningModalComponent } from '../../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GlobalService } from '../../services/global.service';

@Component({
    selector: 'app-icd-code-dialog',
    templateUrl: './icd-code-dialog.component.html',
    styleUrls: ['./icd-code-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
  searched = false;
  shortQuery = false;
  //toggleSingleSelectionIndicator: boolean = false;
  toggleState: string = 'all';


  constructor(
    public dialogRef: MatDialogRef<IcdCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private miscellaneousService: MiscellaneousService,
    private globalService: GlobalService,
  ) {}

  private assignedCodes = new Set<string>();

  ngOnInit(): void {
    this.entityId = this.globalService.getCompanyId();
    this.userId = this.globalService.getUserId();
    this.assignedCodes = new Set(
      (this.data?.assignedCodes ?? []).map((code: string) => String(code ?? '').trim().toUpperCase())
    );
  }

  isAssigned(icdCode: string): boolean {
    return this.assignedCodes.has(String(icdCode ?? '').trim().toUpperCase());
  }

  onCatalogRow(row: IcdCodeDto): void {
    if (this.isAssigned(row.icd_code)) {
      this.showAssignedMessage(row.icd_code);
      return;
    }
    this.toggleSelection(row.icd_code);
  }

  confirmCopy(): void {
    if (!this.selectedIcdCodes.size) {
      this.errorMessage = 'Select an ICD code.';
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 4000);
      return;
    }
    const alreadyAssigned = Array.from(this.selectedIcdCodes).filter(code => this.isAssigned(code));
    if (alreadyAssigned.length) {
      const listed = alreadyAssigned.join(', ');
      this.errorMessage = alreadyAssigned.length === 1
        ? `${listed} is already assigned to this company.`
        : `${listed} are already assigned to this company.`;
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 4000);
      return;
    }
    this.openWarningDialog('Are you sure you want to copy the selected ICD codes?');
  }

  private showAssignedMessage(icdCode: string): void {
    if (!icdCode) {
      return;
    }
    this.errorMessage = `${icdCode} is already assigned to this company.`;
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 4000);
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
            this.errorMessage = response.returntx || 'That ICD code is already assigned to this company.';
            this.showPopup = true;
            setTimeout(() => this.showPopup = false, 4000);
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
    if (query.length < 4) {
      this.shortQuery = true;
      this.searched = false;
      this.icdCodes = [];
      this.filteredIcdCodes = [];
      return;
    }

    // Catalog codes are stored without a decimal, so E78.01 is searched as E7801.
    const codeQuery = query.replace(/[.\s-]/g, '');
    this.search = query;
    this.shortQuery = false;
    this.isLoading = true;
    this.searched = true;

    const searchType = (type: string, term: string) =>
      this.miscellaneousService.getSearchIcdCodes(type, term).pipe(
        catchError(() => of([] as IcdCodeDto[]))
      );

    forkJoin({
      codes: searchType('C', codeQuery),
      descriptions: searchType('D', query)
    }).subscribe({
      next: ({ codes, descriptions }) => {
        const merged = new Map<string, IcdCodeDto>();
        for (const row of [...codes, ...descriptions]) {
          if (row?.icd_code) {
            merged.set(row.icd_code, row);
          }
        }
        this.icdCodes = Array.from(merged.values());
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to fetch ICD codes.';
        this.showPopup = true;
        this.isLoading = false;
      }
    });
  }

  clearSearch(): void {
    this.filterQuery = '';
    this.filteredIcdCodes = [...this.icdCodes]; 
  }
  


  toggleSelection(icdCode: string): void {
    if (this.isAssigned(icdCode)) {
      this.showAssignedMessage(icdCode);
      return;
    }
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
