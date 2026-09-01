import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ssnMask'
})
export class SsnMaskPipe implements PipeTransform {
  transform(ssn: string): string {
    const digits = String(ssn || '').replace(/\D/g, '');
    if (digits.length < 4) {
      return '';
    }
    return `***-**-${digits.slice(-4)}`;
  }
}