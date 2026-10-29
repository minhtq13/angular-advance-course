import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Chuoi chi gom khoang trang -> loi `blank`. Validators.required coi "   " la hop le
 * vi chi kiem tra rong. Chuoi rong de cho required bao loi, tranh hien hai loi cung luc.
 */
export function notBlank(
  control: AbstractControl<string | null>,
): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || value.length === 0) return null;
  return value.trim().length === 0 ? { blank: true } : null;
}
