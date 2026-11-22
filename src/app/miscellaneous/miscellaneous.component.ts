import { Component, OnInit, ViewChild, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { MiscellaneousService } from '../services/miscellaneous.service';
import { GlobalService } from '../services/global.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CptCodeDialogComponent } from '../cpt-code-dialog/cpt-code-dialog.component';
import { IcdCodeDialogComponent } from './icd-code-dialog/icd-code-dialog.component';
import { parseMoney } from '../pipes/numeric-only.directive';

@Component({
  selector: 'app-miscellaneous',
  standalone: false,
  templateUrl: './miscellaneous.component.html',
  styleUrls: ['./miscellaneous.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
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

  @ViewChild('cptSort') set cptSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  @ViewChild('icdSort') set icdSort(sort: MatSort) {
    if (sort) {
      this.dataSourceIcd.sort = sort;
    }
  }

  displayedColumns: string[] = [
    'cpt_code',
    'cpt_code_modifier',
    'cpt_code_charge_am',
    'active_in'
  ];
  displayedColumnsIcd: string[] = [
    'icd_code',
    'icd_code_description',
    'icd_code_text',
    'active_in'
  ];
  updateForm!: FormGroup;
  selectedCpt: any = null;
  selectedIcd: any = null;
  filterQuery = '';
  errorMessage = '';
  showPopup = false;
  successMessage = '';
  showSuccessPopup = false;
  userId = '';
  isEditMode = false;
  icdFilterQuery = '';
  icdCode = '';
  modifiedRows = new Set<string>();

  constructor(
    private miscellaneousService: MiscellaneousService,
    private globalService: GlobalService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
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
      active_in: ['A', Validators.required]
    });
    this.updateForm.get('cpt_code')?.valueChanges.subscribe(() => this.refreshDuplicateError());
    this.updateForm.get('cpt_code_modifier')?.valueChanges.subscribe(() => this.refreshDuplicateError());

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const dataStr = `${data.cpt_code ?? ''} ${data.cpt_code_short_nm ?? ''} ${data.cpt_code_description ?? ''}`.toLowerCase();
      return dataStr.includes(filter);
    };

    this.dataSourceIcd.filterPredicate = (data: any, filter: string) => {
      const dataStr = `${data.icd_code ?? ''} ${data.icd_code_text ?? ''} ${data.icd_code_description ?? ''}`.toLowerCase();
      return dataStr.includes(filter);
    };
  }

  loadBusinessEntityCptCodes(id: number, type: string, searchTerm: string): void {
    this.miscellaneousService.getBusinessEntityCptCodes(id, type, searchTerm).subscribe(data => {
      this.cptCodes = data;
      this.filteredCptCodes = data;
      this.dataSource.data = this.cptCodes;
      this.refreshDuplicateError();
    });
  }

  loadBusinessEntityIcdCodes(id: number, type: string, searchTerm: string): void {
    this.miscellaneousService.getBusinessEntityIcdCodes(id, type, searchTerm).subscribe(data => {
      this.icdCodes = data;
      this.filteredIcdCodes = data;
      this.dataSourceIcd.data = this.icdCodes;
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.filterQuery.trim().toLowerCase();
  }

  clearFilter(): void {
    this.filterQuery = '';
    this.applyFilter();
  }

  applyIcdFilter(): void {
    this.dataSourceIcd.filter = this.icdFilterQuery.trim().toLowerCase();
  }

  clearIcdFilter(): void {
    this.icdFilterQuery = '';
    this.applyIcdFilter();
  }

  selectRow(row: any): void {
    this.selectedCpt = { ...row };
    this.isEditMode = true;
    this.updateForm.patchValue({
      cpt_code: row.cpt_code,
      cpt_code_description: row.cpt_code_description,
      cpt_code_short_nm: row.cpt_code_short_nm,
      cpt_code_modifier: row.cpt_code_modifier,
      cpt_code_charge_am: row.cpt_code_charge_am,
      active_in: row.active_in
    });
    this.refreshDuplicateError();
  }

  confirmDeleteCpt(): void {
    if (!this.selectedCpt?.cpt_id) {
      return;
    }
    this.openWarningDialog('Are you sure you want to delete this CPT code?', this.selectedCpt.cpt_id);
  }

  openWarningDialog(message: string, cptId: number): void {
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message: message }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteCptCode(cptId);
      }
    });
  }

  deleteCptCode(cptId: number): void {
    this.miscellaneousService.deleteCptCode(this.entityId, cptId).subscribe(response => {
      if (response.returncd == 1) {
        this.loadBusinessEntityCptCodes(this.entityId, 'D', '');
        this.isEditMode = false;
        this.clearForm();
        this.showMessage('CPT code deleted successfully!', true);
      } else {
        this.showMessage('Error deleting CPT code', false);
      }
    });
  }

  onSubmitCptCode(): void {
    this.refreshDuplicateError();
    if (this.updateForm.get('cpt_code')?.hasError('duplicate')) {
      this.updateForm.get('cpt_code')?.markAsTouched();
      this.showMessage(this.duplicateCptMessage(), false);
      return;
    }
    if (this.isEditMode) {
      this.onSubmitUpdateCptCode();
    } else {
      this.onSubmitInsertCptCode();
    }
  }

  onSubmitUpdateCptCode(): void {
    if (!this.updateForm.valid || !this.selectedCpt) {
      return;
    }
    const formData = this.updateForm.value;
    const cptCodeData = {
      data: [
        {
          entity_id: this.entityId,
          cpt_id: this.selectedCpt.cpt_id,
          cpt_code: formData.cpt_code,
          cpt_code_short_nm: formData.cpt_code_short_nm,
          cpt_code_description: formData.cpt_code_description,
          cpt_code_modifier: formData.cpt_code_modifier,
          cpt_code_charge_am: parseMoney(formData.cpt_code_charge_am),
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
        if (response.returncd == 1) {
          this.loadBusinessEntityCptCodes(this.entityId, 'D', '');
          this.showMessage('CPT code updated successfully!::' + response.returntx, true);
        } else {
          this.showMessage('Error updating CPT code::' + response.returntx, false);
        }
      },
      error => {
        this.showMessage('Error updating CPT code::' + error, false);
      }
    );
  }

  onSubmitInsertCptCode(): void {
    if (!this.updateForm.valid) {
      return;
    }
    const formData = this.updateForm.value;
    const cptCodeData = {
      data: [
        {
          entity_id: this.entityId,
          cpt_id: null,
          cpt_code: formData.cpt_code,
          cpt_code_short_nm: formData.cpt_code_short_nm,
          cpt_code_description: formData.cpt_code_description,
          cpt_code_modifier: formData.cpt_code_modifier,
          cpt_code_charge_am: parseMoney(formData.cpt_code_charge_am),
          active_in: formData.active_in,
          when_updated: null,
          updated_by: this.userId
        }
      ],
      returncd: 0,
      returntx: ''
    };

    this.miscellaneousService.insertCptCode(cptCodeData).subscribe(
      response => {
        if (response.returncd == 1) {
          this.loadBusinessEntityCptCodes(this.entityId, 'D', '');
          this.showMessage('CPT code inserted successfully!', true);
          this.clearForm();
        } else {
          this.showMessage(response.returntx || 'Error inserting CPT code', false);
        }
      },
      error => {
        this.showMessage('Error inserting CPT code', false);
      }
    );
  }

  currencyValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const amount = parseMoney(control.value);
    return Number.isFinite(amount) && amount >= 0 ? null : { invalidCurrency: true };
  }

  clearForm(): void {
    this.selectedCpt = null;
    this.isEditMode = false;
    this.updateForm.reset({
      cpt_code: '',
      cpt_code_short_nm: '',
      cpt_code_description: '',
      cpt_code_modifier: '',
      cpt_code_charge_am: '',
      active_in: 'A'
    });
    this.refreshDuplicateError();
  }

  switchToAddMode(): void {
    this.clearForm();
  }

  openCptCodeDialog(): void {
    const dialogRef = this.dialog.open(CptCodeDialogComponent, {
      width: '55vw',
      height: '95vh',
      data: {
        title: 'CPT Codes',
        assignedKeys: this.cptCodes.map(row =>
          this.cptAssignmentKey(row.cpt_code, row.cpt_code_modifier))
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBusinessEntityCptCodes(this.entityId, 'D', '');
      }
    });
  }

  selectIcdRow(element: any): void {
    this.selectedIcd = element;
    this.icdCode = element?.icd_code ?? '';
  }

  confirmDeleteIcd(): void {
    if (!this.selectedIcd?.icd_code) {
      return;
    }
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message: 'Are you sure you want to delete ' + this.selectedIcd.icd_code + ' ICD code?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteIcdCode(this.selectedIcd.icd_code);
      }
    });
  }

  openIcdCodeDialog(): void {
    const dialogRef = this.dialog.open(IcdCodeDialogComponent, {
      width: '65vw',
      height: '95vh',
      data: {
        assignedCodes: this.icdCodes.map(row => (row.icd_code ?? '').trim().toUpperCase())
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBusinessEntityIcdCodes(this.entityId, 'D', '');
      }
    });
  }

  deleteIcdCode(icdcode: string): void {
    this.miscellaneousService.deleteIcdCode(this.entityId, icdcode).subscribe(response => {
      if (response.returncd == 1) {
        this.loadBusinessEntityIcdCodes(this.entityId, 'D', '');
        this.selectedIcd = null;
        this.icdCode = '';
        this.showMessage('ICD code deleted successfully!', true);
      } else {
        this.showMessage('Error deleting ICD code', false);
      }
    });
  }

  markRowAsModified(icdCode: string): void {
    this.modifiedRows.add(icdCode);
  }

  setIcdStatus(row: { icd_code: string; active_in: string }, active: boolean): void {
    row.active_in = active ? 'A' : 'I';
    this.markRowAsModified(row.icd_code);
  }

  updateModifiedRows(): void {
    const updatedRows = this.icdCodes
      .filter(code => this.modifiedRows.has(code.icd_code))
      .map(code => ({
        icdcode: code.icd_code,
        short_text: code.icd_code_text,
        status: code.active_in
      }));

    this.miscellaneousService.updateIcdCodes(updatedRows, this.entityId, this.userId).subscribe(
      () => {
        this.modifiedRows.clear();
        this.showMessage('ICD code updated successfully!', true);
      },
      () => {
        this.showMessage('Error updating ICD code', false);
      }
    );
  }

  duplicateCptMessage(): string {
    const code = String(this.updateForm?.get('cpt_code')?.value ?? '').trim();
    const modifier = String(this.updateForm?.get('cpt_code_modifier')?.value ?? '').trim();
    if (modifier) {
      return `${code} with modifier ${modifier} is already assigned to this company.`;
    }
    return `${code} is already assigned to this company.`;
  }

  private cptAssignmentKey(code: string | null | undefined, modifier: string | null | undefined): string {
    return `${(code ?? '').trim().toUpperCase()}|${(modifier ?? '').trim().toUpperCase()}`;
  }

  private findDuplicateCpt(code: string, modifier: string, ignoreCptId?: number): boolean {
    const codeKey = (code ?? '').trim().toUpperCase();
    if (!codeKey) {
      return false;
    }
    const key = this.cptAssignmentKey(code, modifier);
    return this.cptCodes.some(row =>
      row.cpt_id !== ignoreCptId &&
      this.cptAssignmentKey(row.cpt_code, row.cpt_code_modifier) === key);
  }

  private refreshDuplicateError(): void {
    const control = this.updateForm?.get('cpt_code');
    if (!control) {
      return;
    }
    const duplicate = this.findDuplicateCpt(
      control.value,
      this.updateForm.get('cpt_code_modifier')?.value,
      this.isEditMode ? this.selectedCpt?.cpt_id : undefined
    );
    if (duplicate) {
      control.setErrors({ ...(control.errors ?? {}), duplicate: true });
      return;
    }
    if (control.hasError('duplicate')) {
      const rest = { ...(control.errors ?? {}) };
      delete rest['duplicate'];
      control.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  private showMessage(message: string, success: boolean): void {
    if (success) {
      this.successMessage = message;
      this.showSuccessPopup = true;
      setTimeout(() => this.showSuccessPopup = false, 3000);
    } else {
      this.errorMessage = message;
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
    }
  }
}
