import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Subscriber,
  SUBSCRIBER_STATUS,
  SUBSCRIBER_TYPE,
  SubscriberApi,
  SubscriberStatus,
  SubscriberType,
} from '@care/shared-data-access-api';
import { TIME_FORMAT } from '@care/shared-util-i18n';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  TranslocoDatePipe,
  TranslocoDecimalPipe,
} from '@jsverse/transloco-locale';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { debounceTime, fromEvent, map } from 'rxjs';

export const REPORT_SIZES = [1000, 5000, 10000] as const;

/**
 * Bao cao thue bao: tai mot lan nhieu dong de doi chieu/in. Buoi 5 dung man hinh nay de do hieu nang.
 * Can backend chay voi MAX_PAGE_SIZE >= 10000.
 */
@Component({
  selector: 'care-subscriber-report-page',
  imports: [
    FormsModule,
    RouterLink,
    TranslocoPipe,
    TranslocoDatePipe,
    TranslocoDecimalPipe,
    NzAlertComponent,
    NzButtonComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzSpinComponent,
  ],
  templateUrl: './subscriber-report.page.html',
  styleUrl: './subscriber-report.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriberReportPage {
  private readonly api = inject(SubscriberApi);

  protected readonly sizes = REPORT_SIZES;
  protected readonly timeFormat = TIME_FORMAT;
  protected readonly size = signal<number>(REPORT_SIZES[0]);

  protected readonly result = rxResource({
    params: () => ({ size: this.size() }),
    stream: ({ params }) =>
      this.api
        .search({}, { page: 0, size: params.size, sort: 'id,asc' })
        .pipe(map((page) => page.content)),
  });
  protected readonly rows = computed(() =>
    this.result.hasValue() ? this.result.value() : [],
  );

  /** Dong ho ca truc tren dau trang, cap nhat moi giay. */
  protected readonly now = signal(new Date());
  /** Man hinh hep -> an bot cot. */
  protected readonly compact = signal(window.innerWidth < 1200);

  constructor() {
    setInterval(() => this.now.set(new Date()), 1000);
    fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => this.compact.set(window.innerWidth < 1200));
  }

  protected reload(): void {
    this.result.reload();
  }

  protected ageOf(dateOfBirth: string): number {
    const born = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - born.getFullYear();
    const hadBirthday =
      today.getMonth() > born.getMonth() ||
      (today.getMonth() === born.getMonth() &&
        today.getDate() >= born.getDate());
    return hadBirthday ? age : age - 1;
  }

  protected activatedOn(subscriber: Subscriber): string {
    return new Date(subscriber.activatedAt).toLocaleDateString('vi-VN');
  }

  protected typeLabel(type: SubscriberType): string {
    return SUBSCRIBER_TYPE[type];
  }

  protected statusLabel(status: SubscriberStatus): string {
    return SUBSCRIBER_STATUS[status].labelKey;
  }
}
