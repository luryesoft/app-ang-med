import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PhoneNumberService {
  constructor() {}

  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex =  /^(?=.*-)[- +()0-9]{8,15}$/;
    return phoneRegex.test(phone);
  }
}
