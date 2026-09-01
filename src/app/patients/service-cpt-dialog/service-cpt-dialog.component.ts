import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ServiceCptAssignedLine {
  cpt_code: string;
  modifier?: string;
  cpt_code_modifier?: string;
}

export interface ServiceCptDialogData {
  codes: any[];
  assignedLines: ServiceCptAssignedLine[];
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
  selectedByLine = new Map<string, any>();
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<ServiceCptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ServiceCptDialogData
  ) {}

  ngOnInit(): void {
    this.applyFilter();
  }

  lineKey(code: any): string {
    const cpt = String(code?.cpt_code ?? '').trim().toUpperCase();
    const modifier = String(code?.cpt_code_modifier ?? code?.modifier ?? '').trim().toUpperCase();
    return `${cpt}|${modifier}`;
  }

  isAssigned(code: any): boolean {
    return (this.data.assignedLines || []).some(
      (line) => this.lineKey(line) === this.lineKey(code)
    );
  }

  isSelected(code: any): boolean {
    return this.selectedByLine.has(this.lineKey(code));
  }

  modifierLabel(code: any): string {
    const modifier = String(code?.cpt_code_modifier ?? '').trim();
    return modifier || '—';
  }

  toggleSelection(code: any, event?: Event): void {
    event?.stopPropagation();
    const cpt = String(code?.cpt_code ?? '').trim().toUpperCase();
    if (!cpt) {
      return;
    }
    if (this.isAssigned(code)) {
      this.errorMessage = `${cpt} with that modifier is already on this service`;
      setTimeout(() => (this.errorMessage = ''), 2500);
      return;
    }
    const key = this.lineKey(code);
    if (this.selectedByLine.has(key)) {
      this.selectedByLine.delete(key);
    } else {
      this.selectedByLine.set(key, code);
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
      const modifier = String(code.cpt_code_modifier ?? '').toLowerCase();
      return !query
        || cpt.includes(query)
        || desc.includes(query)
        || shortNm.includes(query)
        || modifier.includes(query);
    });
    if (this.toggleState === 'selected') {
      rows = rows.filter((code) => this.isSelected(code));
    }
    this.filteredCptCodes = rows.sort((a, b) => {
      const byCode = String(a.cpt_code ?? '').localeCompare(String(b.cpt_code ?? ''));
      if (byCode !== 0) {
        return byCode;
      }
      return this.modifierLabel(a).localeCompare(this.modifierLabel(b));
    });
  }

  clearFilter(): void {
    this.filterQuery = '';
    this.applyFilter();
  }

  save(): void {
    const unique = Array.from(this.selectedByLine.values()).filter((code) => !this.isAssigned(code));
    const duplicates = Array.from(this.selectedByLine.values()).filter((code) => this.isAssigned(code));

    if (this.selectedByLine.size === 0) {
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
      duplicates: duplicates.map((code) => String(code.cpt_code ?? '').trim().toUpperCase())
    });
  }

  hideSingleSelectionIndicator(): boolean {
    return true;
  }
}
