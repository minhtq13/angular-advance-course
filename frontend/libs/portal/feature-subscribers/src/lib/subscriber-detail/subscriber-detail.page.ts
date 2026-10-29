import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  input,
  numberAttribute,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '@care/shared-data-access-auth';
import { DATE_FORMAT, TIME_FORMAT } from '@care/shared-util-i18n';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import {
  problemMessage,
  SUBSCRIBER_STATUS,
  SUBSCRIBER_TYPE,
  SubscriberApi,
  SubscriberStatus,
  TICKET_PRIORITY,
  TICKET_STATUS,
  TicketApi,
} from '@care/shared-data-access-api';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import {
  NzBreadCrumbComponent,
  NzBreadCrumbItemComponent,
} from 'ng-zorro-antd/breadcrumb';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmDirective } from 'ng-zorro-antd/popconfirm';
import { NzSkeletonComponent } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagComponent } from 'ng-zorro-antd/tag';
import { tap } from 'rxjs';
import { RecentSubscribers } from '../recent/recent-subscribers';

@Component({
  selector: 'care-subscriber-detail-page',
  imports: [
    TranslocoPipe,
    TranslocoDatePipe,
    RouterLink,
    NzAlertComponent,
    NzBreadCrumbComponent,
    NzBreadCrumbItemComponent,
    NzButtonComponent,
    NzDescriptionsModule,
    NzIconDirective,
    NzPopconfirmDirective,
    NzSkeletonComponent,
    NzTableModule,
    NzTagComponent,
  ],
  templateUrl: './subscriber-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriberDetailPage {
  private readonly subscriberApi = inject(SubscriberApi);
  private readonly ticketApi = inject(TicketApi);
  private readonly auth = inject(AuthService);
  private readonly message = inject(NzMessageService);
  private readonly transloco = inject(TranslocoService);
  private readonly recent = inject(RecentSubscribers);

  /** Bind tu route param :id nho withComponentInputBinding(). */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly dateFormat = DATE_FORMAT;
  protected readonly timeFormat = TIME_FORMAT;
  protected readonly statusLabels = SUBSCRIBER_STATUS;
  protected readonly typeLabels = SUBSCRIBER_TYPE;
  protected readonly ticketStatusLabels = TICKET_STATUS;
  protected readonly priorityLabels = TICKET_PRIORITY;

  protected readonly subscriber = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) =>
      this.subscriberApi
        .get(id)
        .pipe(
          tap(({ id, msisdn, fullName }) =>
            this.recent.add({ id, msisdn, fullName }),
          ),
        ),
  });

  protected readonly tickets = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) =>
      this.ticketApi.search(
        { subscriberId: id },
        { page: 0, size: 10, sort: 'createdAt,desc' },
      ),
  });

  // value() throw khi resource o trang thai loi -> luon kiem tra hasValue() truoc.
  protected readonly recentTickets = computed(() =>
    this.tickets.hasValue() ? this.tickets.value().content : [],
  );

  protected readonly canChangeStatus = computed(
    () =>
      this.auth.hasAnyRole('SUPERVISOR', 'ADMIN') &&
      this.subscriber.hasValue() &&
      this.subscriber.value().status !== 'TERMINATED',
  );

  /** Trang thai dang gui len server -> hien loading tren dung nut va chan bam lap. */
  protected readonly pendingStatus = signal<SubscriberStatus | null>(null);

  protected changeStatus(status: SubscriberStatus): void {
    if (!this.subscriber.hasValue()) {
      return;
    }
    const current = this.subscriber.value();
    this.pendingStatus.set(status);
    this.subscriberApi
      .changeStatus(current.id, status, current.version)
      .subscribe({
        next: (updated) => {
          this.subscriber.set(updated);
          this.pendingStatus.set(null);
          this.message.success(
            this.transloco.translate('subscriber.detail.statusChanged', {
              status: this.transloco.translate(
                this.statusLabels[status].labelKey,
              ),
            }),
          );
        },
        error: (error) => {
          this.pendingStatus.set(null);
          this.message.error(
            problemMessage(
              error,
              this.transloco.translate('common.genericError'),
            ),
          );
        },
      });
  }
}
