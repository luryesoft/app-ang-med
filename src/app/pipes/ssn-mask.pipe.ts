import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ssnMask'
})
export class SsnMaskPipe implements PipeTransform {
  transform(ssn: string): string {
    if (!ssn || ssn.length < 4) {
      return ssn; // Return as is if SSN is invalid
    }
    const lastFourDigits = ssn.slice(-4);
    return `***-**-${lastFourDigits}`;
  }
}