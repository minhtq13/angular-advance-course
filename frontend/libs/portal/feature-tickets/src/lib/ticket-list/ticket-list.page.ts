import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  canApprove,
  TicketConflictError,
  TicketPort,
  TicketSummary,
} from '@care/portal-domain-tickets';
import { AuthService } from '@care/shared-data-access-auth';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDecimalPipe } from '@jsverse/transloco-locale';
import {
  TICKET_PRIORITY,
  TICKET_STATUS,
  toOptions,
  toPageRequest,
} from '@care/shared-data-access-api';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzCheckboxComponent } from 'ng-zorro-antd/checkbox';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { TicketRow } from '@care/portal-ui-tickets';
import { TicketListStore } from './ticket-list.store';
import { finalize } from 'rxjs';

/** Thông báo trên trang: key dịch (kèm tham số) hoặc chữ đã dịch sẵn từ backend. */
type Notice =
  { key: string; params?: Record<string, unknown> } | { text: string };

@Component({
  selector: 'care-ticket-list-page',
  imports: [
    TranslocoPipe,
    TranslocoDecimalPipe,
    FormsModule,
    RouterLink,
    NzAlertComponent,
    NzButtonComponent,
    NzIconDirective,
    NzCheckboxComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzTableModule,
    TicketRow,
  ],
  templateUrl: './ticket-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TicketListStore],
})
export class TicketListPage {
  /** Chỉ phụ thuộc hợp đồng; adapter (HTTP hay fake) do app/test cung cấp. */
  private readonly tickets = inject(TicketPort);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** Thông báo thành công: phiếu vừa tạo (từ navigation state) hoặc phiếu vừa duyệt. */
  protected readonly notice = signal<Notice | null>(
    this.createdNotice(
      inject(Router).currentNavigation()?.extras.state?.['created'],
    ),
  );
  /** Lỗi khi duyệt (409: dữ liệu đã đổi). Người dùng chọn tải lại, không tự động ghi đè màn hình. */
  protected readonly approveError = signal<Notice | null>(null);
  protected readonly approvingId = signal<number | null>(null);
  /** Chỉ ẩn/hiện nút (quy tắc ở domain). Quyền thật sự do API kiểm tra. */
  protected canApprove(ticket: TicketSummary): boolean {
    return canApprove(ticket, this.auth.roles());
  }

  protected readonly statusOptions = toOptions(TICKET_STATUS);
  protected readonly priorityOptions = toOptions(TICKET_PRIORITY);

  /** Bộ lọc, trang và kết quả nằm trong store; component chỉ giữ state UI cục bộ (thông báo, đang duyệt). */
  protected readonly store = inject(TicketListStore);

  protected approve(ticket: TicketSummary): void {
    if (this.approvingId() !== null) return;
    this.approvingId.set(ticket.id);
    this.approveError.set(null);
    this.notice.set(null);
    // Gửi version đang hiện trên màn hình: nếu người khác đã duyệt/sửa trước, backend trả 409.
    this.tickets
      .approve(ticket.id, ticket.version)
      .pipe(
        finalize(() => this.approvingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (approved) => {
          this.notice.set({
            key: 'ticket.approve.done',
            params: { code: approved.code },
          });
          this.store.reload();
        },
        error: (error: unknown) =>
          this.approveError.set(
            error instanceof TicketConflictError
              ? { text: error.message }
              : { key: 'common.genericError' },
          ),
      });
  }

  protected reloadAfterConflict(): void {
    this.approveError.set(null);
    this.store.reload();
  }

  private createdNotice(code: unknown): Notice | null {
    return typeof code === 'string'
      ? { key: 'ticket.form.created', params: { code } }
      : null;
  }

  protected onQueryParams(query: NzTableQueryParams): void {
    this.store.setPage(toPageRequest(query));
  }
}
