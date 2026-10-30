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
 * Báo cáo thuê bao: tải một lần nhiều dòng để đối chiếu/in. Buổi 5 dùng màn hình này để đo hiệu năng.
 * Cần backend chạy với MAX_PAGE_SIZE >= 10000.
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
  /** Phải khớp $row-height trong scss: CDK tính vị trí từng dòng bằng chiều cao cố định. */
  protected readonly rowHeight = 33;
  protected readonly size = signal<number>(REPORT_SIZES[0]);

  protected readonly result = rxResource({
    params: () => ({ size: this.size() }),
    stream: ({ params }) =>
      this.api
        .search({}, { page: 0, size: params.size, sort: 'id,asc' })
        .pipe(map((page) => page.content)),
  });
  /** Tính sẵn một lần mỗi khi dữ liệu đổi, không tính lại mỗi lần kiểm tra view. */
  protected readonly rows = computed(() => {
    const today = new Date();
    return this.result.hasValue()
      ? this.result.value().map((s) => toReportRow(s, today))
      : [];
  });

  /**
   * Màn hình hẹp -> ẩn bớt cột. toSignal gỡ listener khi component bị hủy. Ban đầu dùng
   * fromEvent(...).subscribe() không hủy: window giữ closure -> giữ trang này và cả nghìn dòng dữ liệu
   * sau mỗi lần điều hướng (heap tăng ~11 MB sau 20 lần).
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

  /** Dòng giữ nguyên DOM khi tải lại cùng dữ liệu: so theo id, không theo object mới từ server. */
  protected readonly trackById = (_: number, row: ReportRow) => row.id;
}
