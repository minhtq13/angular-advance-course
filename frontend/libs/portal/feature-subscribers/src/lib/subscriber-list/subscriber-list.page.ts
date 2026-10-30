import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DATE_FORMAT } from '@care/shared-util-i18n';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  TranslocoDatePipe,
  TranslocoDecimalPipe,
} from '@jsverse/transloco-locale';
import {
  DEFAULT_PAGE,
  PageRequest,
  samePage,
  Subscriber,
  SUBSCRIBER_STATUS,
  SUBSCRIBER_TYPE,
  SubscriberApi,
  SubscriberStatus,
  SubscriberType,
  toOptions,
  toPageRequest,
} from '@care/shared-data-access-api';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import {
  NzInputDirective,
  NzInputPrefixDirective,
  NzInputWrapperComponent,
} from 'ng-zorro-antd/input';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzTagComponent } from 'ng-zorro-antd/tag';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { RecentSubscribers } from '../recent/recent-subscribers';

@Component({
  selector: 'care-subscriber-list-page',
  imports: [
    TranslocoPipe,
    TranslocoDatePipe,
    TranslocoDecimalPipe,
    FormsModule,
    RouterLink,
    NzButtonComponent,
    NzTableModule,
    NzTagComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzInputWrapperComponent,
    NzInputDirective,
    NzInputPrefixDirective,
    NzIconDirective,
    NzAlertComponent,
  ],
  templateUrl: './subscriber-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriberListPage {
  private readonly api = inject(SubscriberApi);
  private readonly router = inject(Router);
  protected readonly recent = inject(RecentSubscribers).items;

  protected readonly dateFormat = DATE_FORMAT;
  protected readonly statusLabels = SUBSCRIBER_STATUS;
  protected readonly typeLabels = SUBSCRIBER_TYPE;
  protected readonly statusOptions = toOptions(SUBSCRIBER_STATUS);
  protected readonly typeOptions = toOptions(SUBSCRIBER_TYPE);

  // --- Bộ lọc: signal cho state, RxJS cho debounce (buổi 3: interop signals <-> observables) ---
  protected readonly keyword = signal('');
  private readonly debouncedKeyword = toSignal(
    toObservable(this.keyword).pipe(debounceTime(400), distinctUntilChanged()),
    {
      initialValue: '',
    },
  );
  protected readonly status = signal<SubscriberStatus | null>(null);
  protected readonly type = signal<SubscriberType | null>(null);

  private readonly filters = computed(() => ({
    q: this.debouncedKeyword(),
    status: this.status(),
    type: this.type(),
  }));

  // Đổi bộ lọc -> về trang đầu, giữ nguyên page size & sort.
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
    stream: ({ params }) => this.api.search(params.search, params.page),
  });

  protected readonly rows = computed(() =>
    this.result.hasValue() ? this.result.value().content : [],
  );
  protected readonly total = computed(() =>
    this.result.hasValue() ? this.result.value().totalElements : 0,
  );

  protected readonly hasFilters = computed(
    () => !!this.keyword() || this.status() !== null || this.type() !== null,
  );

  protected clearFilters(): void {
    this.keyword.set('');
    this.status.set(null);
    this.type.set(null);
  }

  protected onQueryParams(query: NzTableQueryParams): void {
    this.page.set(toPageRequest(query));
  }

  /** Click cả hàng để mở (chuột). Bàn phím dùng link ở cột số thuê bao. */
  protected open(subscriber: Subscriber, event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('a')) {
      return;
    }
    this.router.navigate(['/subscribers', subscriber.id]);
  }
}
