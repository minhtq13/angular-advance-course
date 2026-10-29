import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  TicketPort,
  TicketPriority,
  TicketStatus,
} from '@care/portal-domain-tickets';
import { AuthService } from '@care/shared-data-access-auth';
import { DATE_FORMAT, TIME_FORMAT } from '@care/shared-util-i18n';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  TranslocoDatePipe,
  TranslocoDecimalPipe,
} from '@jsverse/transloco-locale';
import {
  DEFAULT_PAGE,
  PageRequest,
  samePage,
  TICKET_CATEGORY,
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
import { NzTagComponent } from 'ng-zorro-antd/tag';

@Component({
  selector: 'care-ticket-list-page',
  imports: [
    TranslocoPipe,
    TranslocoDatePipe,
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
    NzTagComponent,
  ],
  templateUrl: './ticket-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketListPage {
  /** Chi phu thuoc hop dong; adapter (HTTP hay fake) do app/test cung cap. */
  private readonly tickets = inject(TicketPort);
  private readonly auth = inject(AuthService);

  protected readonly dateFormat = DATE_FORMAT;
  protected readonly timeFormat = TIME_FORMAT;
  protected readonly statusLabels = TICKET_STATUS;
  protected readonly priorityLabels = TICKET_PRIORITY;
  protected readonly categoryLabels = TICKET_CATEGORY;
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

  protected onQueryParams(query: NzTableQueryParams): void {
    this.page.set(toPageRequest(query));
  }
}
