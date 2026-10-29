import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SubscriberApi } from '@care/shared-data-access-api';
import { DATE_FORMAT } from '@care/shared-util-i18n';
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
import { ReportRow, toReportRow } from './report-row';
import { ShiftClock } from './shift-clock';

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
    ScrollingModule,
    ShiftClock,
  ],
  templateUrl: './subscriber-report.page.html',
  styleUrl: './subscriber-report.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriberReportPage {
  private readonly api = inject(SubscriberApi);

  protected readonly sizes = REPORT_SIZES;
  protected readonly dateFormat = DATE_FORMAT;
  /** Phai khop $row-height trong scss: CDK tinh vi tri tung dong bang chieu cao co dinh. */
  protected readonly rowHeight = 33;
  protected readonly size = signal<number>(REPORT_SIZES[0]);

  protected readonly result = rxResource({
    params: () => ({ size: this.size() }),
    stream: ({ params }) =>
      this.api
        .search({}, { page: 0, size: params.size, sort: 'id,asc' })
        .pipe(map((page) => page.content)),
  });
  /** Tinh san mot lan moi khi du lieu doi, khong tinh lai moi lan kiem tra view. */
  protected readonly rows = computed(() => {
    const today = new Date();
    return this.result.hasValue()
      ? this.result.value().map((s) => toReportRow(s, today))
      : [];
  });

  /**
   * Man hinh hep -> an bot cot. toSignal go listener khi component bi huy. Ban dau dung
   * fromEvent(...).subscribe() khong huy: window giu closure -> giu trang nay va ca nghin dong du lieu
   * sau moi lan dieu huong (heap tang ~11 MB sau 20 lan).
   */
  protected readonly compact = toSignal(
    fromEvent(window, 'resize').pipe(
      debounceTime(200),
      map(() => window.innerWidth < 1200),
    ),
    { initialValue: window.innerWidth < 1200 },
  );

  protected reload(): void {
    this.result.reload();
  }

  /** Dong giu nguyen DOM khi tai lai cung du lieu: so theo id, khong theo object moi tu server. */
  protected readonly trackById = (_: number, row: ReportRow) => row.id;
}
