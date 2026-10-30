import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import {
  PageResponse,
  Subscriber,
  SubscriberApi,
} from '@care/shared-data-access-api';
import { provideUi } from '@care/shared-ui-layout';
import { provideI18nTesting } from '@care/shared-util-i18n/testing';
import { of, Subject } from 'rxjs';
import { SubscriberPicker } from './subscriber-picker';

@Component({
  imports: [SubscriberPicker, ReactiveFormsModule],
  template: `<care-subscriber-picker [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl<number | null>(null);
}

/** Truy cập method protected của picker trong test (thay cho gõ phím vào nz-select). */
type PickerInternals = {
  onSearch(term: string): void;
  onSelect(id: number | null): void;
};

describe('SubscriberPicker', () => {
  /** Mỗi lần search trả về một Subject: test tự quyết định khi nào "server" trả lời. */
  let pending: Subject<PageResponse<Subscriber>>[];

  beforeEach(() => {
    pending = [];
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideUi(),
        provideI18nTesting(),
        {
          provide: SubscriberApi,
          useValue: {
            search: () => {
              const response = new Subject<PageResponse<Subscriber>>();
              pending.push(response);
              return response;
            },
            get: () => of(null),
          },
        },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const picker = fixture.debugElement.query(By.directive(SubscriberPicker))
      .componentInstance as PickerInternals;
    // Bật fake timers sau khi render xong: debounceTime của RxJS dùng setInterval.
    vi.useFakeTimers();
    return { fixture, picker };
  }

  it('chon thue bao trong ket qua -> form control nhan id', async () => {
    const { fixture, picker } = await render();
    picker.onSearch('0901');
    vi.advanceTimersByTime(300);
    pending[0].next({
      content: [
        { id: 5, msisdn: '0901000005', fullName: 'Le Van C' } as Subscriber,
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });
    pending[0].complete();

    picker.onSelect(5);

    expect(fixture.componentInstance.control.value).toBe(5);
  });

  it('roi man hinh khi dang tim: request dang chay bi huy, khong con ai lang nghe', async () => {
    const { fixture, picker } = await render();
    picker.onSearch('0901');
    vi.advanceTimersByTime(300);
    expect(pending[0].observed).toBe(true);

    fixture.destroy();

    // HttpClient thật: unsubscribe = hủy XHR (tab Network hiện "canceled").
    expect(pending[0].observed).toBe(false);
  });
});
