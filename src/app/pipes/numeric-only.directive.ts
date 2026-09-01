import { Directive, HostListener } from '@angular/core';

export function parseMoney(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  const n = Number(String(value ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

@Directive({
  selector: '[numericOnly]'
})
export class NumericOnlyDirective {

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight'];
    if (allowedKeys.indexOf(event.key) !== -1) {
      return; // Allow navigation and control keys
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault(); // Prevent non-numeric input
    }
  }
}