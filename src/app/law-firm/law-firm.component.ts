import { ChangeDetectionStrategy, Component, computed, effect, signal, ViewEncapsulation } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { email, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PhoneNumberService } from '../services/phone-number.service';
import { LawFirmService } from '../services/law-firm.service';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';

interface LawFirm {
  lw_id: number;
  lw_nm: string;
  lw_address_tx: string;
  lw_city: string;
  lw_zip_cd: string;
  lw_state: string;
  lw_phone: string;
  lw_email: string;
  lw_npi: string;
  lw_ein: string;
  updated_by: string;
  when_updated: string;
  active_in: string;
}

interface LawFirmFormModel {
  lw_id: number;
  lw_nm: string;
  lw_address_tx: string;
  lw_city: string;
  lw_zip_cd: string;
  lw_state: string;
  lw_phone: string;
  lw_email: string;
  lw_npi: string;
  lw_ein: string;
  updated_by: string;
  active_in: string;
  entity_id: number;
}

function blankLawFirm(): LawFirmFormModel {
  return {
    lw_id: 0,
    lw_nm: '',
    lw_address_tx: '',
    lw_city: '',
    lw_zip_cd: '',
    lw_state: '',
    lw_phone: '',
    lw_email: '',
    lw_npi: '',
    lw_ein: '',
    updated_by: sessionStorage.getItem('userId') ?? '',
    active_in: 'Y',
    entity_id: Number(sessionStorage.getItem('companyId')) || 0,
  };
}

@Component({
  selector: 'app-law-firm',
  standalone: false,
  templateUrl: './law-firm.component.html',
  styleUrls: ['./law-firm.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class LawFirmComponent {
  readonly isEditMode = signal(true);
  readonly selectedLawOffice = signal<LawFirm | null>(null);
  readonly filterQuery = signal('');
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly showPopup = signal(false);
  readonly showSuccessPopup = signal(false);

  private readonly listOfficeId = signal(Number(sessionStorage.getItem('officeId')) || 0);
  private readonly lawFirmsResource = httpResource<LawFirm[]>(
    () => `${environment.apiUrl}/law-firms/by-office-id/${this.listOfficeId()}`,
    { defaultValue: [] }
  );

  readonly lawOffices = computed(() =>
    [...(this.lawFirmsResource.value() ?? [])].sort((a, b) =>
      (a.lw_nm ?? '').toLowerCase().localeCompare((b.lw_nm ?? '').toLowerCase())
    )
  );

  readonly filteredLawOffices = computed(() => {
    const query = this.filterQuery().trim().toLowerCase();
    const offices = this.lawOffices();
    if (!query) {
      return offices;
    }
    return offices.filter(lawOffice => (lawOffice.lw_nm ?? '').toLowerCase().includes(query));
  });

  readonly lawFirmModel = signal(blankLawFirm());
  readonly lawFirmForm = form(this.lawFirmModel, office => {
    required(office.lw_nm);
    required(office.lw_address_tx);
    required(office.lw_city);
    required(office.lw_zip_cd);
    required(office.lw_state);
    maxLength(office.lw_state, 2);
    maxLength(office.lw_ein, 250);
    maxLength(office.lw_npi, 100);
    required(office.lw_email, { when: () => !this.isEditMode() });
    email(office.lw_email);
    required(office.lw_phone, { when: () => !this.isEditMode() });
    validate(office.lw_phone, ({ value }) => {
      if (!this.isEditMode() || this.phoneNumberService.isValidPhoneNumber(value())) {
        return undefined;
      }
      return {
        kind: 'phone',
        message: 'The phone number must have at least 8 digits, separated by dashes',
      };
    });
  });

  constructor(
    private lawFirmService: LawFirmService,
    private dialog: MatDialog,
    private phoneNumberService: PhoneNumberService
  ) {
    effect(() => {
      const error = this.lawFirmsResource.error();
      if (error) {
        console.error('Error fetching law offices:', error);
      }
    });
  }

  selectLawOffice(lawOffice: LawFirm): void {
    this.isEditMode.set(true);
    this.selectedLawOffice.set(lawOffice);
    this.lawFirmForm().reset({
      lw_id: lawOffice.lw_id,
      lw_nm: lawOffice.lw_nm ?? '',
      lw_address_tx: lawOffice.lw_address_tx ?? '',
      lw_city: lawOffice.lw_city ?? '',
      lw_zip_cd: lawOffice.lw_zip_cd ?? '',
      lw_state: lawOffice.lw_state ?? '',
      lw_phone: lawOffice.lw_phone ?? '',
      lw_email: lawOffice.lw_email ?? '',
      lw_npi: lawOffice.lw_npi ?? '',
      lw_ein: lawOffice.lw_ein ?? '',
      updated_by: lawOffice.updated_by ?? sessionStorage.getItem('userId') ?? '',
      active_in: lawOffice.active_in ?? 'N',
      entity_id: Number(sessionStorage.getItem('companyId')) || 0,
    });
  }

  switchToAddMode(): void {
    this.isEditMode.set(false);
    this.selectedLawOffice.set(null);
    this.lawFirmForm().reset(blankLawFirm());
  }

  async onSubmit(): Promise<void> {
    const saved = await submit(this.lawFirmForm, async () => {
      try {
        await this.persist();
      } catch (error) {
        this.showError(this.extractErrorMessage(error));
      }
    });
    if (!saved) {
      this.showValidationMessage();
    }
  }

  onToggleChange(event: MatSlideToggleChange): void {
    this.lawFirmForm.active_in().value.set(event.checked ? 'Y' : 'N');
  }

  onFilterInput(event: Event): void {
    this.filterQuery.set((event.target as HTMLInputElement).value);
  }

  confirmAndDeleteLawOffice(lawOfficeId: number): void {
    this.openWarningDialog('Are you sure you want to delete this law office?', lawOfficeId);
  }

  private async persist(): Promise<void> {
    const lawOfficeData = {
      ...this.lawFirmModel(),
      updated_by: sessionStorage.getItem('userId'),
    };

    if (this.isEditMode()) {
      await firstValueFrom(this.lawFirmService.updateLawFirm(lawOfficeData));
      this.showSuccess('Law Office updated successfully!');
      this.isEditMode.set(true);
    } else {
      await firstValueFrom(this.lawFirmService.insertLawFirm({
        ...lawOfficeData,
        entity_id: Number(sessionStorage.getItem('companyId')),
        lw_id: 0,
      }));
      this.showSuccess('Law Office added successfully!');
      this.isEditMode.set(true);
      this.selectedLawOffice.set(null);
      this.lawFirmForm().reset(blankLawFirm());
    }
    this.refreshData();
  }

  private refreshData(): void {
    this.filterQuery.set('');
    if (this.listOfficeId() === 0) {
      this.lawFirmsResource.reload();
      return;
    }
    this.listOfficeId.set(0);
  }

  private openWarningDialog(message: string, lawOfficeId: number): void {
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteLawOffice(lawOfficeId);
      }
    });
  }

  private deleteLawOffice(lawOfficeId: number): void {
    this.lawFirmService.deleteLawFirm(lawOfficeId).subscribe({
      next: () => {
        this.showSuccess('Law Office deleted successfully!');
        this.isEditMode.set(true);
        this.selectedLawOffice.set(null);
        this.lawFirmForm().reset(blankLawFirm());
        this.refreshData();
      },
      error: (error: unknown) => {
        console.error('Error deleting law office:', error);
        this.showError(this.extractErrorMessage(error));
      }
    });
  }

  private showValidationMessage(): void {
    const otherInvalid = [
      this.lawFirmForm.lw_nm(),
      this.lawFirmForm.lw_address_tx(),
      this.lawFirmForm.lw_city(),
      this.lawFirmForm.lw_state(),
      this.lawFirmForm.lw_zip_cd(),
      this.lawFirmForm.lw_email(),
    ].some(field => field.invalid());
    const phoneMessage = this.lawFirmForm.lw_phone().errors()[0]?.message;
    this.showError(!otherInvalid && phoneMessage ? phoneMessage : 'Please complete the form');
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.showPopup.set(true);
    setTimeout(() => this.showPopup.set(false), 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.showSuccessPopup.set(true);
    setTimeout(() => this.showSuccessPopup.set(false), 3000);
  }

  private extractErrorMessage(error: any): string {
    if (error?.error?.message) {
      if (Array.isArray(error.error.message)) {
        return error.error.message.join(', ');
      }
      return error.error.message;
    }
    return 'An unexpected error occurred';
  }
}
