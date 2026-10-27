import en from '../assets/i18n/en.json';
import vi from '../assets/i18n/vi.json';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? keys(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

function params(text: string): string[] {
  return [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();
}

function lookup(obj: object, key: string): string {
  return key
    .split('.')
    .reduce<unknown>(
      (o, k) => (o as Record<string, unknown>)[k],
      obj,
    ) as string;
}

describe('file dich', () => {
  it('vi va en co cung bo key (khong thieu ban dich)', () => {
    expect(keys(en).sort()).toEqual(keys(vi).sort());
  });

  it('tham so {{...}} giong nhau giua hai ngon ngu', () => {
    for (const key of keys(vi)) {
      expect(params(lookup(en, key)), key).toEqual(params(lookup(vi, key)));
    }
  });

  it('khong co ban dich rong', () => {
    for (const [name, file] of [
      ['vi', vi],
      ['en', en],
    ] as const) {
      for (const key of keys(file)) {
        expect(lookup(file, key).trim(), `${name}: ${key}`).not.toBe('');
      }
    }
  });
});
