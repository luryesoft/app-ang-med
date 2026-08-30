import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ServiceCptDialogData {
  codes: any[];
  assignedCodes: string[];
}

@Component({
  selector: 'app-service-cpt-dialog',
  templateUrl: './service-cpt-dialog.component.html',
  styleUrls: ['./service-cpt-dialog.component.scss']
})
export class ServiceCptDialogComponent implements OnInit {
  filterQuery = '';
  toggleState = 'all';
  filteredCptCodes: any[] = [];
  selectedCptCodes = new Set<string>();
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<ServiceCptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ServiceCptDialogData
  ) {}

  ngOnInit(): void {
    this.applyFilter();
  }

  isAssigned(cptCode: string): boolean {
    return (this.data.assignedCodes || []).some(
      (code) => String(code).toUpperCase() === String(cptCode).toUpperCase()
    );
  }

  toggleSelection(cptCode: string): void {
    if (this.isAssigned(cptCode)) {
      this.errorMessage = `${cptCode} is already on this service`;
      setTimeout(() => (this.errorMessage = ''), 2500);
      return;
    }
    if (this.selectedCptCodes.has(cptCode)) {
      this.selectedCptCodes.delete(cptCode);
    } else {
      this.selectedCptCodes.add(cptCode);
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
      const cpt = String(code.cpt_code ?? '').toLowerCase();
      const desc = String(code.cpt_code_description ?? '').toLowerCase();
      const shortNm = String(code.cpt_code_short_nm ?? '').toLowerCase();
      return !query || cpt.includes(query) || desc.includes(query) || shortNm.includes(query);
    });
    if (this.toggleState === 'selected') {
      rows = rows.filter((code) => this.selectedCptCodes.has(code.cpt_code));
    }
    this.filteredCptCodes = rows.sort((a, b) =>
      String(a.cpt_code ?? '').localeCompare(String(b.cpt_code ?? ''))
    );
  }

  clearFilter(): void {
    this.filterQuery = '';
    this.applyFilter();
  }

  save(): void {
    const selected = (this.data.codes || []).filter((code) => this.selectedCptCodes.has(code.cpt_code));
    const duplicates = selected.filter((code) => this.isAssigned(code.cpt_code));
    const unique = selected.filter((code) => !this.isAssigned(code.cpt_code));

    if (selected.length === 0) {
      this.errorMessage = 'Select at least one CPT code';
      setTimeout(() => (this.errorMessage = ''), 2500);
      return;
    }
    if (unique.length === 0) {
      this.errorMessage = 'Selected CPT codes are already on this service';
      setTimeout(() => (this.errorMessage = ''), 3000);
      return;
    }

    this.dialogRef.close({
      codes: unique,
      duplicates: duplicates.map((code) => code.cpt_code)
    });
  }

  hideSingleSelectionIndicator(): boolean {
    return true;
  }
}
