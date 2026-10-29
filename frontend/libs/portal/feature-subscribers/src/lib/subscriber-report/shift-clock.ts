import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TIME_FORMAT } from '@care/shared-util-i18n';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { interval, map } from 'rxjs';

/**
 * Dong ho ca truc. Tach thanh component rieng: moi giay chi view nho nay duoc kiem tra lai,
 * khong phai ca bang bao cao. toSignal tu huy interval khi component bi huy (khong ro bo nho).
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
