import { Observable, of, throwError } from 'rxjs';
import {
  CreateTicketCommand,
  PageQuery,
  TicketPage,
  TicketQuery,
  TicketSummary,
} from './lib/ticket';
import { TicketConflictError } from './lib/ticket.errors';
import { TicketPort } from './lib/ticket.port';

/**
 * Fake adapter: lọc và phân trang trên mảng trong bộ nhớ, ghi lại các lần gọi để test kiểm tra.
 * Dùng bằng `{ provide: TicketPort, useValue: new InMemoryTicketAdapter().seed([...]) }`.
 * Mô phỏng các luật của backend: version cũ -> TicketConflictError, cùng idempotencyKey -> cùng phiếu.
 */
export class InMemoryTicketAdapter extends TicketPort {
  readonly calls: { query: TicketQuery; page: PageQuery }[] = [];
  readonly createCalls: { command: CreateTicketCommand; key: string }[] = [];
  readonly approveCalls: { id: number; version: number }[] = [];
  private tickets: TicketSummary[] = [];
  private readonly byKey = new Map<string, TicketSummary>();
  private nextError: Error | null = null;

  seed(tickets: TicketSummary[]): this {
    this.tickets = [...tickets];
    return this;
  }

  /** Lần gọi create/approve kế tiếp sẽ lỗi với error này (mô phỏng API lỗi). */
  failNext(error: Error): this {
    this.nextError = error;
    return this;
  }

  /** Đọc trạng thái hiện tại của một phiếu (để test kiểm tra sau khi ghi). */
  find(id: number): TicketSummary | undefined {
    return this.tickets.find((t) => t.id === id);
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

  create(
    command: CreateTicketCommand,
    idempotencyKey: string,
  ): Observable<TicketSummary> {
    this.createCalls.push({ command, key: idempotencyKey });
    const failure = this.takeError();
    if (failure) return throwError(() => failure);
    const existing = this.byKey.get(idempotencyKey);
    if (existing) return of(existing);
    const ticket = aTicket({
      subscriberId: command.subscriberId,
      category: command.category,
      priority: command.priority,
      title: command.title,
    });
    this.tickets = [ticket, ...this.tickets];
    this.byKey.set(idempotencyKey, ticket);
    return of(ticket);
  }

  approve(id: number, version: number): Observable<TicketSummary> {
    this.approveCalls.push({ id, version });
    const failure = this.takeError();
    if (failure) return throwError(() => failure);
    const ticket = this.find(id);
    if (!ticket || ticket.version !== version || ticket.status !== 'RESOLVED') {
      return throwError(
        () => new TicketConflictError('Du lieu da bi nguoi khac thay doi'),
      );
    }
    const updated: TicketSummary = {
      ...ticket,
      status: 'CLOSED',
      version: ticket.version + 1,
    };
    this.tickets = this.tickets.map((t) => (t.id === id ? updated : t));
    return of(updated);
  }

  private takeError(): Error | null {
    const error = this.nextError;
    this.nextError = null;
    return error;
  }
}

let nextId = 1;

/** Tạo phiếu giả với giá trị mặc định hợp lệ; truyền vào các trường cần quan tâm. */
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
    version: 0,
    ...overrides,
  };
}
