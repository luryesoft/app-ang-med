import { AbstractControl, ValidatorFn } from '@angular/forms';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value || ''; // Default to an empty string if null or undefined
    const phoneNumber = value.replace(/\D/g, ''); // Remove non-digit characters

    // Check if the phone number has exactly 10 digits
    if (phoneNumber.length < 10) {
      return { invalidPhone: { value: control.value, message: 'Phone number must be 10 digits long' } };
    }

    return phoneNumber; // Valid phone number
  };
}