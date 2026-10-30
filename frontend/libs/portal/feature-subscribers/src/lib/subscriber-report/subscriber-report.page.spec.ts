import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subscriber, SubscriberApi } from '@care/shared-data-access-api';
import { provideUi } from '@care/shared-ui-layout';
import { provideI18nTesting } from '@care/shared-util-i18n/testing';
import { of } from 'rxjs';
import { SubscriberReportPage } from './subscriber-report.page';

export function fakeSubscribers(count: number): Subscriber[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    msisdn: `09${String(i + 1).padStart(8, '0')}`,
    fullName: `Khach ${i + 1}`,
    idNumber: '001099000000',
    dateOfBirth: '1990-05-20',
    province: 'Hà Nội',
    type: 'PREPAID',
    status: 'ACTIVE',
    planCode: 'D70',
    activatedAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
    version: 0,
  }));
}

describe('SubscriberReportPage', () => {
  let search: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    search = vi.fn((_: unknown, page: { size: number }) =>
      of({ content: fakeSubscribers(page.size), totalElements: page.size }),
    );
    await TestBed.configureTestingModule({
      imports: [SubscriberReportPage],
      providers: [
        provideRouter([]),
        provideUi(),
        provideI18nTesting(),
        { provide: SubscriberApi, useValue: { search } },
      ],
    }).compileComponents();
  });

  it('mac dinh tai 1.000 dong, sap xep theo id', async () => {
    const fixture = TestBed.createComponent(SubscriberReportPage);
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith(
      {},
      { page: 0, size: 1000, sort: 'id,asc' },
    );
    const el = fixture.nativeElement as HTMLElement;
    // Virtual scroll: bảng vẫn báo đủ 1.000 dòng cho trình đọc màn hình, nhưng chỉ vẽ vài dòng trong DOM.
    expect(
      el.querySelector('[role=table]')?.getAttribute('aria-rowcount'),
    ).toBe('1001');
    const rendered = el.querySelectorAll('.report-row:not(.report-head)');
    expect(rendered.length).toBeLessThan(100);
    fixture.destroy();
  });

  it('roi man hinh: go listener resize (khong giu trang va du lieu trong bo nho)', async () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const fixture = TestBed.createComponent(SubscriberReportPage);
    await fixture.whenStable();

    fixture.destroy();

    expect(remove).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
      undefined,
    );
  });
});
