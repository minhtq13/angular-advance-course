import { computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TicketPort,
  TicketQuery,
  TicketSummary,
} from '@care/portal-domain-tickets';
import { PageRequest, samePage } from '@care/shared-data-access-api';
import { AuthService } from '@care/shared-data-access-auth';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import {
  filtersFromParams,
  NO_FILTERS,
  pageFromParams,
  TicketFilters,
  toQueryParams,
} from './ticket-url';

export { NO_FILTERS, type TicketFilters } from './ticket-url';

/** Chỉ còn server state; bộ lọc và trang nằm trên URL. */
interface TicketListState {
  items: TicketSummary[];
  total: number;
  status: 'loading' | 'done' | 'error';
}

/**
 * State của màn hình danh sách phiếu. Nguồn sự thật của bộ lọc, trang, sort là URL (query params):
 * F5, gửi link, Back/Forward đều ra đúng danh sách. Store chỉ đọc URL và điều hướng để đổi URL.
 * Cung cấp ở component (providers: [TicketListStore]) -> mỗi lần vào màn hình là một store mới.
 */
export const TicketListStore = signalStore(
  withState<TicketListState>({ items: [], total: 0, status: 'loading' }),
  withProps(() => {
    const route = inject(ActivatedRoute);
    return {
      _router: inject(Router),
      _route: route,
      _params: toSignal(route.queryParamMap, { requireSync: true }),
    };
  }),
  withComputed(({ _params }, auth = inject(AuthService)) => {
    const filters = computed(() => filtersFromParams(_params()));
    const page = computed(() => pageFromParams(_params()), {
      equal: samePage,
    });
    return {
      filters,
      page,
      query: computed((): TicketQuery => ({
        status: filters().status,
        priority: filters().priority,
        assignee: filters().onlyMine ? auth.username() : null,
      })),
      hasFilters: computed(
        () =>
          filters().status !== null ||
          filters().priority !== null ||
          filters().onlyMine,
      ),
    };
  }),
  withComputed(({ _router, _route, filters, page }) => ({
    /** URL danh sách hiện tại (kèm bộ lọc) để màn hình khác quay về, vd sau khi tạo phiếu. */
    listUrl: computed(() =>
      _router.serializeUrl(
        _router.createUrlTree([], {
          relativeTo: _route,
          queryParams: toQueryParams(filters(), page()),
        }),
      ),
    ),
  })),
  withMethods((store, tickets = inject(TicketPort)) => {
    // switchMap: đổi bộ lọc nhanh thì hủy request cũ (buổi 3). catchError bên trong: lỗi không làm chết luồng.
    const load = rxMethod<{ query: TicketQuery; page: PageRequest }>(
      pipe(
        tap(() => patchState(store, { status: 'loading' })),
        switchMap(({ query, page }) =>
          tickets.search(query, page).pipe(
            tap(({ items, total }) =>
              patchState(store, { items, total, status: 'done' }),
            ),
            catchError(() => {
              patchState(store, { status: 'error' });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    /** Mỗi lần đổi bộ lọc/trang là một mục lịch sử mới -> Back quay về bộ lọc trước. */
    const navigate = (filters: TicketFilters, page: PageRequest) =>
      store._router.navigate([], {
        relativeTo: store._route,
        queryParams: toQueryParams(filters, page),
      });

    return {
      /** Đổi bộ lọc -> về trang đầu, giữ kích thước trang và sort. */
      setFilters(change: Partial<TicketFilters>): Promise<boolean> {
        return navigate(
          { ...store.filters(), ...change },
          { ...store.page(), page: 0 },
        );
      },
      clearFilters(): Promise<boolean> {
        return navigate(NO_FILTERS, { ...store.page(), page: 0 });
      },
      setPage(page: PageRequest): Promise<boolean> {
        // nz-table phát lại cùng trang khi khởi tạo: bỏ qua để không điều hướng/gọi API trùng.
        if (samePage(page, store.page())) return Promise.resolve(false);
        return navigate(store.filters(), page);
      },
      /** Tải lại đúng query và trang hiện tại (nút Thử lại, sau khi duyệt). URL không đổi nên phải gọi tay. */
      reload(): void {
        load({ query: store.query(), page: store.page() });
      },
      _load: load,
    };
  }),
  withHooks({
    onInit(store) {
      // Truyền signal vào rxMethod: mỗi lần URL đổi (chọn bộ lọc, Back/Forward, mở link) là tải lại.
      store._load(
        computed(() => ({ query: store.query(), page: store.page() })),
      );
    },
  }),
);
