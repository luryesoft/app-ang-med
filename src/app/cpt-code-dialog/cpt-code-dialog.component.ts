import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CptCodeDto } from '../models/cpt-codes-dto';
import { MiscellaneousService } from '../services/miscellaneous.service';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GlobalService } from '../services/global.service';

@Component({
    selector: 'app-cpt-code-dialog',
    templateUrl: './cpt-code-dialog.component.html',
    styleUrls: ['./cpt-code-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CptCodeDialogComponent {
  toggleState: string = 'all';
  cptCodes: CptCodeDto[] = [];
  filteredCptCodes: CptCodeDto[] = [];
  filterQuery: string = '';
  selectedCptCodes: Set<string> = new Set<string>();
  entityId!: number;
  userId!: string;
  errorMessage: string = '';
  showPopup: boolean = false;
  successMessage: string = '';
  showSuccessPopup: boolean = false;
  isLoading = false;
  searched = false;
  shortQuery = false;

  constructor(
    public dialogRef: MatDialogRef<CptCodeDialogComponent>,
    private miscellaneousService: MiscellaneousService,
    private dialog: MatDialog,
    private globalService: GlobalService,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; assignedKeys?: string[] }
  ) {}

  private assignedKeys = new Set<string>();

  ngOnInit(): void {
    this.entityId = this.globalService.getCompanyId();
    this.userId = this.globalService.getUserId();
    this.assignedKeys = new Set(this.data?.assignedKeys ?? []);
  }

  isAssigned(row: CptCodeDto): boolean {
    return this.assignedKeys.has(this.assignmentKey(row.cpt_code, row.cpt_code_modifier));
  }

  private assignmentKey(code: string | null | undefined, modifier: string | null | undefined): string {
    return `${(code ?? '').trim().toUpperCase()}|${(modifier ?? '').trim().toUpperCase()}`;
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
      this.cptCodes = [];
      this.filteredCptCodes = [];
      return;
    }

    this.shortQuery = false;
    this.searched = true;
    this.isLoading = true;

    const searchType = (type: string) =>
      this.miscellaneousService.getSearchCptCodes(type, query).pipe(
        catchError(() => of([] as CptCodeDto[]))
      );

    forkJoin({
      codes: searchType('C'),
      names: searchType('D')
    }).subscribe({
      next: ({ codes, names }) => {
        const merged = new Map<string, CptCodeDto>();
        for (const row of [...codes, ...names]) {
          if (row?.cpt_code) {
            merged.set(row.cpt_code, row);
          }
        }
        this.cptCodes = Array.from(merged.values()).sort((a, b) => a.cpt_code.localeCompare(b.cpt_code));
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to fetch CPT codes.';
        this.showPopup = true;
        this.isLoading = false;
      }
    });
  }

applyFilter(): void {
  this.filteredCptCodes = this.toggleState === 'selected'
    ? this.cptCodes.filter(code => this.selectedCptCodes.has(code.cpt_code))
    : [...this.cptCodes];
}

onCatalogRow(row: CptCodeDto): void {
  if (this.isAssigned(row)) {
    this.showAssignedMessage(row.cpt_code, row.cpt_code_modifier);
    return;
  }
  this.toggleSelection(row.cpt_code);
}

private showAssignedMessage(code: string, modifier?: string | null): void {
  const mod = (modifier ?? '').trim();
  this.errorMessage = mod
    ? `${code} with modifier ${mod} is already assigned to this company.`
    : `${code} is already assigned to this company.`;
  this.showPopup = true;
  setTimeout(() => this.showPopup = false, 4000);
}

toggleSelection(cptCode: string): void {
  const row = this.cptCodes.find(code => code.cpt_code === cptCode);
  if (row && this.isAssigned(row)) {
    this.showAssignedMessage(row.cpt_code, row.cpt_code_modifier);
    return;
  }
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
  this.shortQuery = false;
  this.filteredCptCodes = [...this.cptCodes];
}

confirmCopy(): void {
  if (!this.selectedCptCodes.size) {
    this.errorMessage = 'Select a CPT code.';
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 4000);
    return;
  }
  const alreadyAssigned = this.cptCodes
    .filter(row => this.selectedCptCodes.has(row.cpt_code) && this.isAssigned(row))
    .map(row => row.cpt_code);
  if (alreadyAssigned.length) {
    const listed = alreadyAssigned.join(', ');
    this.errorMessage = alreadyAssigned.length === 1
      ? `${listed} is already assigned to this company.`
      : `${listed} are already assigned to this company.`;
    this.showPopup = true;
    setTimeout(() => this.showPopup = false, 4000);
    return;
  }
  this.openWarningDialog('Are you sure you want to copy the selected CPT codes?');
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
          this.successMessage = response.returntx && response.returntx !== 'OK'
            ? response.returntx
            : 'CPT code(s) copied successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);
          this.closeDialog(true);
        } else {
          this.errorMessage = response.returntx || 'That CPT code is already assigned to this company.';
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

closeDialog(success: boolean): void {
    this.dialogRef.close(success); // Pass true or false based on the operation's success
}

toggleSingleSelectionIndicator(): boolean {
  // Implement your logic here
  return true; // or false based on your logic
}
}