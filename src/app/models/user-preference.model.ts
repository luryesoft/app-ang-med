export type UserTheme = 'light' | 'dark';
export type UserPdfAction = 'open' | 'save';

export interface UserPreference {
  theme: UserTheme;
  pdf_action: UserPdfAction;
  pdf_folder_nm: string | null;
}
