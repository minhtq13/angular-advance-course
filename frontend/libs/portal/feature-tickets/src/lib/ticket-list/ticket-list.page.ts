import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  TicketConflictError,
  TicketPort,
  TicketPriority,
  TicketStatus,
  TicketSummary,
} from '@care/portal-domain-tickets';
import { AuthService } from '@care/shared-data-access-auth';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDecimalPipe } from '@jsverse/transloco-locale';
import {
  DEFAULT_PAGE,
  PageRequest,
  samePage,
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

  protected readonly status = signal<TicketStatus | null>(null);
  protected readonly priority = signal<TicketPriority | null>(null);
  protected readonly onlyMine = signal(false);

  private readonly filters = computed(() => ({
    status: this.status(),
    priority: this.priority(),
    assignee: this.onlyMine() ? this.auth.username() : null,
  }));

  protected readonly page = linkedSignal<
    ReturnType<typeof this.filters>,
    PageRequest
  >({
    source: this.filters,
    computation: (_, previous) => ({
      ...(previous?.value ?? DEFAULT_PAGE),
      page: 0,
    }),
    equal: samePage,
  });

  protected readonly result = rxResource({
    params: () => ({ search: this.filters(), page: this.page() }),
    stream: ({ params }) => this.tickets.search(params.search, params.page),
  });

  protected readonly rows = computed(() =>
    this.result.hasValue() ? this.result.value().items : [],
  );
  protected readonly total = computed(() =>
    this.result.hasValue() ? this.result.value().total : 0,
  );

  protected readonly hasFilters = computed(
    () => this.status() !== null || this.priority() !== null || this.onlyMine(),
  );

  protected clearFilters(): void {
    this.status.set(null);
    this.priority.set(null);
    this.onlyMine.set(false);
  }

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
          this.result.reload();
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
    this.result.reload();
  }

  private createdNotice(code: unknown): Notice | null {
    return typeof code === 'string'
      ? { key: 'ticket.form.created', params: { code } }
      : null;
  }

  protected onQueryParams(query: NzTableQueryParams): void {
    this.page.set(toPageRequest(query));
  }
}
