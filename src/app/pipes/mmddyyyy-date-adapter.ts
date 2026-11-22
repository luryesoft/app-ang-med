import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class MmddyyyyDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    const text = String(value ?? '').trim();
    if (!text) {
      return null;
    }
    const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) {
      const month = Number(slash[1]);
      const day = Number(slash[2]);
      const year = Number(slash[3]);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
        ? date
        : null;
    }
    const parsed = new Date(text);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  override deserialize(value: any): Date | null {
    if (value == null || value === '') {
      return null;
    }
    if (typeof value === 'string') {
      return this.parse(value);
    }
    return super.deserialize(value);
  }

  override format(date: Date, displayFormat: any): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    // Keep MM/DD/YYYY in the input; use the native formatter for calendar month/year labels.
    if (displayFormat && typeof displayFormat === 'object' && displayFormat.day == null) {
      return super.format(date, displayFormat);
    }
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${month}/${day}/${date.getFullYear()}`;
  }
}
