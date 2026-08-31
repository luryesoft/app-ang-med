import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ServiceIcdDialogData {
  codes: any[];
  assignedCodes: string[];
}

@Component({
  selector: 'app-service-icd-dialog',
  templateUrl: './service-icd-dialog.component.html',
  styleUrls: ['./service-icd-dialog.component.scss']
})
export class ServiceIcdDialogComponent implements OnInit {
  filterQuery = '';
  toggleState = 'all';
  filteredIcdCodes: any[] = [];
  selectedIcdCodes = new Set<string>();
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<ServiceIcdDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ServiceIcdDialogData
  ) {}

  ngOnInit(): void {
    this.applyFilter();
  }

  isAssigned(icdCode: string): boolean {
    return (this.data.assignedCodes || []).some(
      (code) => String(code).toUpperCase() === String(icdCode).toUpperCase()
    );
  }

  toggleSelection(icdCode: string): void {
    if (this.isAssigned(icdCode)) {
      this.errorMessage = `${icdCode} is already assigned to this patient`;
      setTimeout(() => (this.errorMessage = ''), 2500);
      return;
    }
    if (this.selectedIcdCodes.has(icdCode)) {
      this.selectedIcdCodes.delete(icdCode);
    } else {
      this.selectedIcdCodes.add(icdCode);
    }
    this.applyFilter();
  }

  toggleFilter(state: string): void {
    this.toggleState = state;
    this.applyFilter();
  }

  applyFilter(): void {
    const query = this.filterQuery.toLowerCase().trim();
    let rows = (this.data.codes || []).filter((code) => {
      const icd = String(code.icd_code ?? '').toLowerCase();
      const desc = String(code.icd_code_description ?? '').toLowerCase();
      const text = String(code.icd_code_text ?? '').toLowerCase();
      return !query || icd.includes(query) || desc.includes(query) || text.includes(query);
    });
    if (this.toggleState === 'selected') {
      rows = rows.filter((code) => this.selectedIcdCodes.has(code.icd_code));
    }
    this.filteredIcdCodes = rows.sort((a, b) =>
      String(a.icd_code ?? '').localeCompare(String(b.icd_code ?? ''))
    );
  }

  clearFilter(): void {
    this.filterQuery = '';
    this.applyFilter();
  }

  save(): void {
    const selected = (this.data.codes || []).filter((code) => this.selectedIcdCodes.has(code.icd_code));
    const duplicates = selected.filter((code) => this.isAssigned(code.icd_code));
    const unique = selected.filter((code) => !this.isAssigned(code.icd_code));

    if (selected.length === 0) {
      this.errorMessage = 'Select at least one ICD code';
      setTimeout(() => (this.errorMessage = ''), 2500);
      return;
    }
    if (unique.length === 0) {
      this.errorMessage = 'Selected ICD codes are already assigned to this patient';
      setTimeout(() => (this.errorMessage = ''), 3000);
      return;
    }

    this.dialogRef.close({
      codes: unique,
      duplicates: duplicates.map((code) => code.icd_code)
    });
  }

  hideSingleSelectionIndicator(): boolean {
    return true;
  }
}
