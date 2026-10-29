import { TestBed } from '@angular/core/testing';
import { RecentSubscribers } from './recent-subscribers';

const sub = (id: number) => ({
  id,
  msisdn: `09000000${String(id).padStart(2, '0')}`,
  fullName: `Khach ${id}`,
});

describe('RecentSubscribers', () => {
  it('moi nhat len dau, khong trung, toi da 5', () => {
    const recent = TestBed.inject(RecentSubscribers);
    [1, 2, 3, 4, 5, 6, 2].forEach((id) => recent.add(sub(id)));
    expect(recent.items().map((s) => s.id)).toEqual([2, 6, 5, 4, 3]);
  });
});
