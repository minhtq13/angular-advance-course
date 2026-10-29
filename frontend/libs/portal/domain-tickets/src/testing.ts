import { Observable, of } from 'rxjs';
import {
  PageQuery,
  TicketPage,
  TicketQuery,
  TicketSummary,
} from './lib/ticket';
import { TicketPort } from './lib/ticket.port';

/**
 * Fake adapter: loc va phan trang tren mang trong bo nho, ghi lai cac lan goi de test kiem tra.
 * Dung bang `{ provide: TicketPort, useValue: new InMemoryTicketAdapter().seed([...]) }`.
 */
export class InMemoryTicketAdapter extends TicketPort {
  readonly calls: { query: TicketQuery; page: PageQuery }[] = [];
  private tickets: TicketSummary[] = [];

  seed(tickets: TicketSummary[]): this {
    this.tickets = [...tickets];
    return this;
  }

  search(query: TicketQuery, page: PageQuery): Observable<TicketPage> {
    this.calls.push({ query, page });
    const matched = this.tickets.filter(
      (t) =>
        (!query.status || t.status === query.status) &&
        (!query.priority || t.priority === query.priority) &&
        (!query.assignee || t.assignee === query.assignee),
    );
    const start = page.page * page.size;
    return of({
      items: matched.slice(start, start + page.size),
      total: matched.length,
    });
  }
}

let nextId = 1;

/** Tao phieu gia voi gia tri mac dinh hop le; truyen vao cac truong can quan tam. */
export function aTicket(overrides: Partial<TicketSummary> = {}): TicketSummary {
  const id = overrides.id ?? nextId++;
  return {
    id,
    code: `TK-${String(id).padStart(6, '0')}`,
    title: `Phieu ${id}`,
    category: 'SERVICE',
    priority: 'MEDIUM',
    status: 'NEW',
    subscriberId: 1,
    subscriberMsisdn: '0912000001',
    subscriberName: 'Nguyen Van A',
    assignee: null,
    createdAt: '2026-01-01T08:00:00Z',
    ...overrides,
  };
}
