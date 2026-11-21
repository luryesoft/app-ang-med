import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UserPdfAction, UserPreference, UserTheme } from '../models/user-preference.model';
import { UserPreferenceService } from '../services/user-preference.service';

@Component({
  selector: 'app-preferences',
  standalone: false,
  templateUrl: './preferences.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './preferences.component.scss'
})
export class PreferencesComponent implements OnInit {
  prefs: UserPreference = {
    theme: 'light',
    pdf_action: 'open',
    pdf_folder_nm: null
  };
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private userPreferenceService: UserPreferenceService) {}

  ngOnInit(): void {
    this.prefs = this.userPreferenceService.getCachedPreferences();
    this.userPreferenceService.applyTheme(this.prefs.theme);
    this.userPreferenceService.getPreferences().subscribe({
      next: (prefs) => {
        this.prefs = prefs;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showError('Could not load preferences');
      }
    });
  }

  setTheme(theme: UserTheme): void {
    if (this.prefs.theme === theme) {
      return;
    }
    this.prefs = { ...this.prefs, theme };
    this.userPreferenceService.applyTheme(theme);
    this.save({ theme });
  }

  async setPdfAction(pdf_action: UserPdfAction): Promise<void> {
    if (pdf_action === 'save') {
      if (this.prefs.pdf_action !== 'save' || !this.prefs.pdf_folder_nm) {
        await this.chooseFolder();
      }
      return;
    }
    if (this.prefs.pdf_action === pdf_action) {
      return;
    }
    this.prefs = { ...this.prefs, pdf_action };
    this.save({ pdf_action });
  }

  async chooseFolder(): Promise<void> {
    try {
      const name = await this.userPreferenceService.choosePdfFolder();
      this.prefs = { ...this.prefs, pdf_action: 'save', pdf_folder_nm: name };
      this.save({ pdf_action: 'save', pdf_folder_nm: name });
    } catch (error) {
      if (this.isAbort(error)) {
        return;
      }
      this.showError(error instanceof Error ? error.message : 'Could not select a folder');
    }
  }

  async clearFolder(): Promise<void> {
    await this.userPreferenceService.clearPdfFolder();
    this.prefs = { ...this.prefs, pdf_folder_nm: null };
    this.save({ pdf_folder_nm: null });
  }

  private save(dto: Partial<UserPreference>): void {
    this.saving = true;
    this.errorMessage = '';
    this.userPreferenceService.updatePreferences(dto).subscribe({
      next: (prefs) => {
        this.prefs = prefs;
        this.saving = false;
        this.showSuccess('Preferences saved');
      },
      error: () => {
        this.saving = false;
        this.showError('Could not save preferences');
      }
    });
  }

  private isAbort(error: unknown): boolean {
    return !!error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError';
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = '';
      }
    }, 3000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      if (this.successMessage === message) {
        this.successMessage = '';
      }
    }, 2000);
  }
}
