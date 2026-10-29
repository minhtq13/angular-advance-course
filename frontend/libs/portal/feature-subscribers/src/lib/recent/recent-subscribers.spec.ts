import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@care/shared-data-access-auth';
import { RecentSubscribers } from './recent-subscribers';

const sub = (id: number) => ({
  id,
  msisdn: `09000000${String(id).padStart(2, '0')}`,
  fullName: `Khach ${id}`,
});

describe('RecentSubscribers', () => {
  const username = signal('agent1');

  beforeEach(() => {
    username.set('agent1');
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { username } }],
    });
  });

  it('moi nhat len dau, khong trung, toi da 5', () => {
    const recent = TestBed.inject(RecentSubscribers);
    [1, 2, 3, 4, 5, 6, 2].forEach((id) => recent.add(sub(id)));
    expect(recent.items().map((s) => s.id)).toEqual([2, 6, 5, 4, 3]);
  });

  it('doi phien (dang xuat, nguoi khac dang nhap): xoa danh sach', () => {
    const recent = TestBed.inject(RecentSubscribers);
    TestBed.tick();
    recent.add(sub(1));

    username.set('');
    TestBed.tick();
    expect(recent.items()).toEqual([]);

    username.set('supervisor1');
    TestBed.tick();
    expect(recent.items()).toEqual([]);
  });
});
