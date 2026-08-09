import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneNumber'
})
export class PhoneNumberPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return '';
    }

    const phoneNumber = value.replace(/\D/g, ''); // Remove all non-digit characters
    const match = phoneNumber.match(/^(\d{3})(\d{3})(\d{4})$/);

    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }

    return value;
  }
}