import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TicketPort } from '@care/portal-domain-tickets';
import {
  aTicket,
  InMemoryTicketAdapter,
} from '@care/portal-domain-tickets/testing';
import { AuthService } from '@care/shared-data-access-auth';
import { throwError } from 'rxjs';
import { TicketListStore } from './ticket-list.store';

describe('TicketListStore', () => {
  let port: InMemoryTicketAdapter;

  function setup() {
    port = new InMemoryTicketAdapter().seed([
      aTicket({ status: 'NEW', assignee: 'agent1' }),
      aTicket({ status: 'RESOLVED', assignee: 'agent2' }),
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        TicketListStore,
        { provide: TicketPort, useValue: port },
        { provide: AuthService, useValue: { username: signal('agent1') } },
      ],
    });
    const store = TestBed.inject(TicketListStore);
    TestBed.tick();
    return { store, router: TestBed.inject(Router) };
  }

  it('tai trang dau khi khoi tao', () => {
    const { store } = setup();
    expect(port.calls).toHaveLength(1);
    expect(store.items()).toHaveLength(2);
    expect(store.status()).toBe('done');
  });

  it('doi bo loc -> ghi len URL, ve trang dau, giu kich thuoc trang', async () => {
    const { store, router } = setup();
    await store.setPage({ page: 3, size: 50, sort: 'id,desc' });
    TestBed.tick();
    await store.setFilters({ status: 'RESOLVED', onlyMine: true });
    TestBed.tick();

    expect(router.url).toBe('/?status=RESOLVED&mine=1&size=50');
    expect(port.calls.at(-1)).toEqual({
      query: { status: 'RESOLVED', priority: null, assignee: 'agent1' },
      page: { page: 0, size: 50, sort: 'id,desc' },
    });
    expect(port.calls).toHaveLength(3);
  });

  it('setPage cung trang khong dieu huong, khong goi API lai', async () => {
    const { store } = setup();
    expect(await store.setPage({ ...store.page() })).toBe(false);
    TestBed.tick();
    expect(port.calls).toHaveLength(1);
  });

  it('API loi -> status error, reload dung query cu thi tai lai duoc', async () => {
    const { store } = setup();
    const search = vi.spyOn(port, 'search');
    search.mockReturnValueOnce(throwError(() => new Error('500')));
    await store.setFilters({ priority: 'HIGH' });
    TestBed.tick();
    expect(store.status()).toBe('error');

    store.reload();
    expect(store.status()).toBe('done');
    expect(search.mock.calls.at(-1)?.[0]).toEqual({
      status: null,
      priority: 'HIGH',
      assignee: null,
    });
  });
});
