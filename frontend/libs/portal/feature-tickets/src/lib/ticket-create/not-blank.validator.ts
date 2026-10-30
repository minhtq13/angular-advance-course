import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Chuỗi chỉ gồm khoảng trắng -> lỗi `blank`. Validators.required coi "   " là hợp lệ
 * vì chỉ kiểm tra rỗng. Chuỗi rỗng để cho required báo lỗi, tránh hiện hai lỗi cùng lúc.
 */
export function notBlank(
  control: AbstractControl<string | null>,
): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || value.length === 0) return null;
  return value.trim().length === 0 ? { blank: true } : null;
}
