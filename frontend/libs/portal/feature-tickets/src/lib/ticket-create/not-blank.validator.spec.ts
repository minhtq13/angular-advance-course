import { FormControl, Validators } from '@angular/forms';
import { notBlank } from './not-blank.validator';

describe('notBlank', () => {
  it.each([
    ['   ', { blank: true }],
    ['\t\n', { blank: true }],
    ['  a ', null],
    ['', null],
    [null, null],
  ])('%j -> %j', (value, expected) => {
    expect(notBlank(new FormControl(value))).toEqual(expected);
  });

  it('di cung required: chuoi rong chi bao required, khoang trang chi bao blank', () => {
    const control = new FormControl('', [Validators.required, notBlank]);
    expect(Object.keys(control.errors ?? {})).toEqual(['required']);
    control.setValue('   ');
    expect(Object.keys(control.errors ?? {})).toEqual(['blank']);
  });
});
