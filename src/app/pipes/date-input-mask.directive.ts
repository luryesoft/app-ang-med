import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'input[dateMask]'
})
export class DateInputMaskDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const allowed = [
      'Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight',
      'Delete', 'Enter', 'Escape'
    ];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (event.key === '/') {
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const previous = input.value || '';
    const caret = input.selectionStart ?? previous.length;
    const digitsBeforeCaret = previous.slice(0, caret).replace(/\D/g, '').length;
    const digits = previous.replace(/\D/g, '').slice(0, 8);
    const masked = this.toMask(digits);
    if (previous === masked) {
      return;
    }
    input.value = masked;
    const nextCaret = this.caretAfterDigits(masked, digitsBeforeCaret);
    input.setSelectionRange(nextCaret, nextCaret);
  }

  private toMask(digits: string): string {
    if (digits.length <= 2) {
      return digits;
    }
    if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  private caretAfterDigits(masked: string, digitCount: number): number {
    if (digitCount <= 0) {
      return 0;
    }
    let seen = 0;
    for (let i = 0; i < masked.length; i++) {
      if (/\d/.test(masked.charAt(i))) {
        seen += 1;
        if (seen === digitCount) {
          return i + 1;
        }
      }
    }
    return masked.length;
  }
}
