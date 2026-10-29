import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TicketPort } from '@care/portal-domain-tickets';
import {
  aTicket,
  InMemoryTicketAdapter,
} from '@care/portal-domain-tickets/testing';
import { AuthService } from '@care/shared-data-access-auth';
import { provideUi } from '@care/shared-ui-layout';
import { provideI18nTesting } from '@care/shared-util-i18n/testing';
import { TicketListPage } from './ticket-list.page';
import { TicketListStore } from './ticket-list.store';
import { filter, firstValueFrom } from 'rxjs';

// Tinh nhat quan cua bo loc: URL <-> man hinh <-> request, ke ca Back/Forward va link chia se.
describe('TicketListPage - bo loc tren URL', () => {
  let port: InMemoryTicketAdapter;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    port = new InMemoryTicketAdapter().seed([
      aTicket({ status: 'RESOLVED', priority: 'HIGH' }),
      aTicket({ status: 'NEW' }),
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'tickets', component: TicketListPage }]),
        provideLocationMocks(),
        provideUi(),
        provideI18nTesting(),
        { provide: TicketPort, useValue: port },
        {
          provide: AuthService,
          useValue: { username: signal('agent1'), hasAnyRole: () => false },
        },
      ],
    });
    harness = await RouterTestingHarness.create();
    // Router chi lang nghe popstate (Back/Forward) sau initialNavigation; TestBed khong bootstrap app nen goi tay.
    TestBed.inject(Router).initialNavigation();
  });

  const lastCall = () => port.calls.at(-1);
  const store = () =>
    harness.routeDebugElement?.injector.get(TicketListStore) as InstanceType<
      typeof TicketListStore
    >;

  async function settle() {
    TestBed.tick();
    await harness.fixture.whenStable();
  }

  /** Back/Forward: router xu ly popstate bat dong bo -> cho dieu huong xong. */
  async function afterNavigation(action: () => void) {
    const done = firstValueFrom(
      TestBed.inject(Router).events.pipe(
        filter((e) => e instanceof NavigationEnd),
      ),
    );
    action();
    await done;
    await settle();
  }

  it('mo link chia se (hoac F5): request dung bo loc va trang tren URL', async () => {
    await harness.navigateByUrl(
      '/tickets?status=RESOLVED&priority=HIGH&page=2',
    );
    await settle();

    expect(lastCall()).toEqual({
      query: { status: 'RESOLVED', priority: 'HIGH', assignee: null },
      page: { page: 1, size: 20, sort: 'id,desc' },
    });
    const statusSelect = harness.routeNativeElement?.querySelector('nz-select');
    expect(statusSelect?.textContent).toContain('Đã xử lý');
  });

  it('URL sua tay sai: bo qua, dung mac dinh', async () => {
    await harness.navigateByUrl(
      '/tickets?status=DROP&size=5000&sort=password,asc',
    );
    await settle();

    expect(lastCall()).toEqual({
      query: { status: null, priority: null, assignee: null },
      page: { page: 0, size: 20, sort: 'id,desc' },
    });
  });

  it('doi bo loc ghi len URL; Back va Forward khoi phuc dung bo loc', async () => {
    await harness.navigateByUrl('/tickets?status=RESOLVED');
    await settle();
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    await store().setFilters({ priority: 'HIGH' });
    await settle();
    expect(router.url).toBe('/tickets?status=RESOLVED&priority=HIGH');
    expect(lastCall()?.query.priority).toBe('HIGH');

    await afterNavigation(() => location.back());
    expect(router.url).toBe('/tickets?status=RESOLVED');
    expect(lastCall()?.query).toEqual({
      status: 'RESOLVED',
      priority: null,
      assignee: null,
    });

    await afterNavigation(() => location.forward());
    expect(router.url).toBe('/tickets?status=RESOLVED&priority=HIGH');
    expect(lastCall()?.query.priority).toBe('HIGH');
  });

  it('reload: goi lai dung query hien tai du URL khong doi', async () => {
    await harness.navigateByUrl('/tickets?status=NEW');
    await settle();
    const before = port.calls.length;

    store().reload();
    await settle();

    expect(port.calls).toHaveLength(before + 1);
    expect(lastCall()?.query.status).toBe('NEW');
  });
});
