import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TicketSummary } from '@care/portal-domain-tickets';
import { DATE_FORMAT, TIME_FORMAT } from '@care/shared-util-i18n';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagComponent } from 'ng-zorro-antd/tag';
import { CATEGORY_LABEL, PRIORITY_TAG, STATUS_TAG } from '../ticket-tags';

/**
 * Mot dong phieu yeu cau trong bang. Component hien thi: chi nhan input va phat output,
 * khong inject service, khong biet ai dang dang nhap (container quyet dinh canApprove).
 * Selector dang thuoc tinh tren <tr> de DOM van la bang hop le (tbody > tr > td).
 */
@Component({
  selector: 'tr[care-ticket-row]',
  imports: [
    RouterLink,
    TranslocoPipe,
    TranslocoDatePipe,
    NzButtonComponent,
    NzTableModule,
    NzTagComponent,
  ],
  templateUrl: './ticket-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketRow {
  readonly ticket = input.required<TicketSummary>();
  /** Hien nut Duyet. Container tinh tu vai tro + trang thai phieu. */
  readonly canApprove = input(false);
  /** Dang gui yeu cau duyet dong nay: nut quay va khong bam lai duoc. */
  readonly approving = input(false);

  readonly approve = output<TicketSummary>();

  protected readonly dateFormat = DATE_FORMAT;
  protected readonly timeFormat = TIME_FORMAT;
  protected readonly statusTag = STATUS_TAG;
  protected readonly priorityTag = PRIORITY_TAG;
  protected readonly categoryLabel = CATEGORY_LABEL;
}
