import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TIME_FORMAT } from '@care/shared-util-i18n';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { interval, map } from 'rxjs';

/**
 * Đồng hồ ca trực. Tách thành component riêng: mỗi giây chỉ view nhỏ này được kiểm tra lại,
 * không phải cả bảng báo cáo. toSignal tự hủy interval khi component bị hủy (không rò bộ nhớ).
 */
@Component({
  selector: 'care-shift-clock',
  imports: [TranslocoPipe, TranslocoDatePipe],
  template: `{{ 'report.shift' | transloco }}:
    {{ now() | translocoDate: timeFormat }}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShiftClock {
  protected readonly timeFormat = TIME_FORMAT;
  protected readonly now = toSignal(
    interval(1000).pipe(map(() => new Date())),
    {
      initialValue: new Date(),
    },
  );
}
