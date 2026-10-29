import { ageOn } from './report-row';

describe('ageOn', () => {
  const today = new Date(2026, 9, 29); // 29/10/2026

  it.each([
    ['1990-10-29', 36], // dung ngay sinh nhat
    ['1990-10-30', 35], // ngay mai moi sinh nhat
    ['1990-11-01', 35],
    ['1990-01-01', 36],
    ['2008-02-29', 18],
  ])('sinh %s -> %i tuoi', (dob, expected) => {
    expect(ageOn(dob, today)).toBe(expected);
  });
});
