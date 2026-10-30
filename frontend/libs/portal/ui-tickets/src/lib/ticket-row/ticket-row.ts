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
 * Một dòng phiếu yêu cầu trong bảng. Component hiển thị: chỉ nhận input và phát output,
 * không inject service, không biết ai đang đăng nhập (container quyết định canApprove).
 * Selector dạng thuộc tính trên <tr> để DOM vẫn là bảng hợp lệ (tbody > tr > td).
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
  /** Hiện nút Duyệt. Container tính từ vai trò + trạng thái phiếu. */
  readonly canApprove = input(false);
  /** Đang gửi yêu cầu duyệt dòng này: nút quay và không bấm lại được. */
  readonly approving = input(false);

  readonly approve = output<TicketSummary>();

  protected readonly dateFormat = DATE_FORMAT;
  protected readonly timeFormat = TIME_FORMAT;
  protected readonly statusTag = STATUS_TAG;
  protected readonly priorityTag = PRIORITY_TAG;
  protected readonly categoryLabel = CATEGORY_LABEL;
}
