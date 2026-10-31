import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('hien thong bao roi tu an sau thoi gian quy dinh', async () => {
    const service = TestBed.inject(NotificationService);
    service.success('Đã duyệt phiếu TK-1', 20);
    expect(service.messages().map((m) => m.text)).toEqual(['Đã duyệt phiếu TK-1']);

    await new Promise((r) => setTimeout(r, 40));
    expect(service.messages()).toEqual([]);
  });

  it('nhieu thong bao hien cung luc, an rieng tung cai', async () => {
    const service = TestBed.inject(NotificationService);
    service.success('A', 20);
    service.success('B', 200);
    await new Promise((r) => setTimeout(r, 40));
    expect(service.messages().map((m) => m.text)).toEqual(['B']);
  });
});
