import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { UserPdfAction, UserPreference, UserTheme } from '../models/user-preference.model';
import {
  clearPdfDirectoryHandle,
  ensureDirectoryWriteAccess,
  getPdfDirectoryHandle,
  savePdfDirectoryHandle
} from './pdf-folder-store';

const PREF_PATH = '/user-preference';

@Injectable({
  providedIn: 'root'
})
export class UserPreferenceService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getPreferences(): Observable<UserPreference> {
    return this.http.get<UserPreference>(`${this.apiUrl}${PREF_PATH}`).pipe(
      tap((prefs) => this.persistAndApply(prefs))
    );
  }

  updatePreferences(dto: Partial<UserPreference>): Observable<UserPreference> {
    return this.http.put<UserPreference>(`${this.apiUrl}${PREF_PATH}`, dto).pipe(
      tap((prefs) => this.persistAndApply(prefs))
    );
  }

  getCachedPreferences(): UserPreference {
    const user = this.authService.getStoredUser();
    return this.normalize(user);
  }

  applyFromUser(user: Record<string, unknown> | null | undefined): void {
    this.applyTheme(this.normalize(user).theme);
  }

  applyStoredPreferences(): void {
    this.applyFromUser(this.authService.getStoredUser());
  }

  applyTheme(theme: UserTheme): void {
    document.body.classList.toggle('app-dark', theme === 'dark');
  }

  clearTheme(): void {
    document.body.classList.remove('app-dark');
  }

  async choosePdfFolder(): Promise<string | null> {
    const picker = (window as Window & {
      showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker;
    if (typeof picker !== 'function') {
      throw new Error('This browser cannot pick a folder. Use Chrome or Edge.');
    }
    const handle = await picker({ mode: 'readwrite' });
    await savePdfDirectoryHandle(handle);
    return handle.name || null;
  }

  async clearPdfFolder(): Promise<void> {
    await clearPdfDirectoryHandle();
  }

  async deliverPdf(blob: Blob, fileName: string): Promise<void> {
    const prefs = this.getCachedPreferences();
    if (prefs.pdf_action === 'save') {
      const saved = await this.savePdfToFolder(blob, fileName);
      if (saved) {
        return;
      }
      this.downloadPdf(blob, fileName);
      return;
    }
    this.openPdf(blob);
  }

  private async savePdfToFolder(blob: Blob, fileName: string): Promise<boolean> {
    try {
      const handle = await getPdfDirectoryHandle();
      if (!handle) {
        return false;
      }
      const allowed = await ensureDirectoryWriteAccess(handle);
      if (!allowed) {
        return false;
      }
      const fileHandle = await handle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  }

  private openPdf(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, '_blank');
    if (!opened) {
      this.downloadPdf(blob, 'document.pdf');
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  private downloadPdf(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  private persistAndApply(prefs: UserPreference): void {
    const normalized = this.normalize(prefs);
    this.authService.patchStoredUser(normalized);
    this.applyTheme(normalized.theme);
  }

  private normalize(source: Partial<UserPreference> | Record<string, unknown> | null | undefined): UserPreference {
    const theme = source && source['theme'] === 'dark' ? 'dark' : 'light';
    const pdfAction = source && source['pdf_action'] === 'save' ? 'save' : 'open';
    const folder = source && typeof source['pdf_folder_nm'] === 'string' ? source['pdf_folder_nm'] : null;
    return {
      theme,
      pdf_action: pdfAction as UserPdfAction,
      pdf_folder_nm: folder
    };
  }
}
