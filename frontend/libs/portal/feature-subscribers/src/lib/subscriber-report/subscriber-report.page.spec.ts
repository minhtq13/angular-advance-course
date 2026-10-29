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
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'tbody tr',
    );
    expect(rows).toHaveLength(1000);
    fixture.destroy();
  });
});
