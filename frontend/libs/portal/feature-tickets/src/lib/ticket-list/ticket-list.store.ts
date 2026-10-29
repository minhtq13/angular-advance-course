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

/** Chi con server state; bo loc va trang nam tren URL. */
interface TicketListState {
  items: TicketSummary[];
  total: number;
  status: 'loading' | 'done' | 'error';
}

/**
 * State cua man hinh danh sach phieu. Nguon su that cua bo loc, trang, sort la URL (query params):
 * F5, gui link, Back/Forward deu ra dung danh sach. Store chi doc URL va dieu huong de doi URL.
 * Cung cap o component (providers: [TicketListStore]) -> moi lan vao man hinh la mot store moi.
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
    /** URL danh sach hien tai (kem bo loc) de man hinh khac quay ve, vd sau khi tao phieu. */
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
    // switchMap: doi bo loc nhanh thi huy request cu (buoi 3). catchError ben trong: loi khong lam chet luong.
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

    /** Moi lan doi bo loc/trang la mot muc lich su moi -> Back quay ve bo loc truoc. */
    const navigate = (filters: TicketFilters, page: PageRequest) =>
      store._router.navigate([], {
        relativeTo: store._route,
        queryParams: toQueryParams(filters, page),
      });

    return {
      /** Doi bo loc -> ve trang dau, giu kich thuoc trang va sort. */
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
        // nz-table phat lai cung trang khi khoi tao: bo qua de khong dieu huong/goi API trung.
        if (samePage(page, store.page())) return Promise.resolve(false);
        return navigate(store.filters(), page);
      },
      /** Tai lai dung query va trang hien tai (nut Thu lai, sau khi duyet). URL khong doi nen phai goi tay. */
      reload(): void {
        load({ query: store.query(), page: store.page() });
      },
      _load: load,
    };
  }),
  withHooks({
    onInit(store) {
      // Truyen signal vao rxMethod: moi lan URL doi (chon bo loc, Back/Forward, mo link) la tai lai.
      store._load(
        computed(() => ({ query: store.query(), page: store.page() })),
      );
    },
  }),
);
