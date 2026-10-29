import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
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

/** Thong bao tren trang: key dich (kem tham so) hoac chu da dich san tu backend. */
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
  /** Chi phu thuoc hop dong; adapter (HTTP hay fake) do app/test cung cap. */
  private readonly tickets = inject(TicketPort);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** Thong bao thanh cong: phieu vua tao (tu navigation state) hoac phieu vua duyet. */
  protected readonly notice = signal<Notice | null>(
    this.createdNotice(
      inject(Router).currentNavigation()?.extras.state?.['created'],
    ),
  );
  /** Loi khi duyet (409: du lieu da doi). Nguoi dung chon tai lai, khong tu dong ghi de man hinh. */
  protected readonly approveError = signal<Notice | null>(null);
  protected readonly approvingId = signal<number | null>(null);
  /** Chi an/hien nut. Quyen that su do API kiem tra (agent goi thang API van nhan 403). */
  protected readonly isManager = computed(() =>
    this.auth.hasAnyRole('SUPERVISOR'),
  );

  protected readonly statusOptions = toOptions(TICKET_STATUS);
  protected readonly priorityOptions = toOptions(TICKET_PRIORITY);

  /** Bo loc, trang va ket qua nam trong store; component chi giu state UI cuc bo (thong bao, dang duyet). */
  protected readonly store = inject(TicketListStore);

  protected approve(ticket: TicketSummary): void {
    if (this.approvingId() !== null) return;
    this.approvingId.set(ticket.id);
    this.approveError.set(null);
    this.notice.set(null);
    // Gui version dang hien tren man hinh: neu nguoi khac da duyet/sua truoc, backend tra 409.
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
